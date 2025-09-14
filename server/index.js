import express from 'express';
import cors from 'cors';
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from '@xenova/transformers';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 8787;

// Lazy-load embedding pipeline
let embedder = null;
async function getEmbedder() {
  if (!embedder) {
    // All-MiniLM-L6-v2: small, fast sentence embeddings
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

// Utility: normalize vectors and cosine similarity
function normalize(vec) {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

// Simple k-means (cosine via normalized vectors + euclidean ~= cosine distance)
function kmeans(vectors, k = 10, maxIter = 50) {
  if (vectors.length === 0) return { labels: [], centroids: [] };
  const n = vectors.length;
  k = Math.max(1, Math.min(k, n));
  const dim = vectors[0].length;
  const data = vectors.map(normalize);

  // k-means++ init
  const centroids = [];
  const first = Math.floor(Math.random() * n);
  centroids.push([...data[first]]);
  while (centroids.length < k) {
    const d2 = data.map(x => {
      let best = Infinity;
      for (const c of centroids) {
        let dist = 0;
        for (let i = 0; i < dim; i++) {
          const diff = x[i] - c[i];
          dist += diff * diff;
        }
        if (dist < best) best = dist;
      }
      return best;
    });
    const sum = d2.reduce((a, b) => a + b, 0) || 1;
    let r = Math.random() * sum;
    let idx = 0;
    for (let i = 0; i < n; i++) {
      r -= d2[i];
      if (r <= 0) { idx = i; break; }
    }
    centroids.push([...data[idx]]);
  }

  let labels = new Array(n).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    // Assign
    let changed = false;
    for (let i = 0; i < n; i++) {
      let bestJ = 0;
      let bestDist = Infinity;
      for (let j = 0; j < k; j++) {
        let dist = 0;
        for (let d = 0; d < dim; d++) {
          const diff = data[i][d] - centroids[j][d];
          dist += diff * diff;
        }
        if (dist < bestDist) {
          bestDist = dist;
          bestJ = j;
        }
      }
      if (labels[i] !== bestJ) {
        labels[i] = bestJ;
        changed = true;
      }
    }
    // Recompute
    const sums = Array.from({ length: k }, () => new Array(dim).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      const j = labels[i];
      counts[j]++;
      const v = data[i];
      for (let d = 0; d < dim; d++) sums[j][d] += v[d];
    }
    for (let j = 0; j < k; j++) {
      if (counts[j] === 0) continue;
      for (let d = 0; d < dim; d++) centroids[j][d] = sums[j][d] / counts[j];
    }
    if (!changed) break;
  }
  return { labels, centroids };
}

// Very light Korean/English tokenizer and keyword extraction
const stop = new Set(['그리고','그러나','하지만','또한','이는','그는','그녀는','대한','에서','으로','에게','했다','합니다','한다','the','a','an','and','or','to','of','in','on','for','with','by','at','from','that','this','is','are','was','were']);
function keywords(text, topK = 5) {
  const tokens = (text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !stop.has(t));
  const freq = new Map();
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
  return [...freq.entries()].sort((a,b) => b[1]-a[1]).slice(0, topK).map(([w]) => w);
}

// RSS parsing and multi-feed merge (Google News KR + Yonhap + KBS + SBS)
const parser = new Parser({ timeout: 15000 });

const DEFAULT_FEEDS = [
  // Google News KR (broad coverage)
  'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko',
  // Yonhap News (연합뉴스)
  'https://www.yna.co.kr/rss/all.xml',
  // KBS News (주요 뉴스)
  'https://news.kbs.co.kr/rss/news/major.xml',
  // SBS News (종합)
  'https://news.sbs.co.kr/news/rss/news.xml',
];

function getDomain(u = '') {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; }
}

function faviconFor(url = '') {
  const host = getDomain(url);
  return host ? `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent('https://' + host)}` : '';
}

function extractThumbFromAny(it) {
  // enclosure.url case
  if (it?.enclosure?.url) return it.enclosure.url;
  // media:content / media:thumbnail (rss-parser keeps unknown keys)
  const mediaContent = it['media:content'] || it['media:thumbnail'];
  if (mediaContent) {
    if (Array.isArray(mediaContent)) {
      for (const m of mediaContent) {
        if (typeof m === 'string') return m;
        if (m?.url) return m.url;
        if (m?.$?.url) return m.$.url;
      }
    } else if (typeof mediaContent === 'object') {
      if (mediaContent.url) return mediaContent.url;
      if (mediaContent.$?.url) return mediaContent.$.url;
    } else if (typeof mediaContent === 'string') {
      return mediaContent;
    }
  }
  // content:encoded or content HTML first <img src>
  const html = it['content:encoded'] || it.content || '';
  const m = typeof html === 'string' ? html.match(/<img[^>]*src=["']([^"']+)["']/i) : null;
  if (m?.[1]) return m[1];
  return '';
}

function safeDate(d) {
  const t = Date.parse(d || '');
  return Number.isFinite(t) ? new Date(t) : new Date(0);
}

async function fetchFeed(url) {
  try {
    return await parser.parseURL(url);
  } catch (e) {
    console.warn('Feed fetch failed', url, e?.message || e);
    return { items: [] };
  }
}

async function fetchKoreanNews(limit = 120) {
  const FEEDS = (process.env.FEEDS ? process.env.FEEDS.split(',') : DEFAULT_FEEDS).map(s => s.trim()).filter(Boolean);
  const feeds = await Promise.all(FEEDS.map(fetchFeed));
  const rows = feeds.flatMap(f => f.items || []);

  // Map to unified schema with basic enrichment
  const mapped = rows.map((it, idx) => {
    const title = it.title || '';
    const url = it.link || '';
    const source = it.creator || it.author || getDomain(url) || '뉴스';
    const publishedAt = it.pubDate || it.isoDate || '';
    const thumbnail = extractThumbFromAny(it);
    return {
      id: idx + 1,
      title,
      summary: it.contentSnippet || '',
      content: (it['content:encoded'] || it.content || ''),
      source,
      sourceIcon: faviconFor(url),
      url,
      thumbnail,
      publishedAt,
      topicId: 0,
      clusterId: '',
      clusterTitle: ''
    };
  });

  // Deduplicate by link then by title
  const seen = new Set();
  const dedup = [];
  for (const a of mapped) {
    const key = (a.url || a.title).trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      dedup.push(a);
    }
  }

  // Sort by date desc
  dedup.sort((a, b) => safeDate(b.publishedAt).getTime() - safeDate(a.publishedAt).getTime());

  return dedup.slice(0, limit).map((a, i) => ({ ...a, id: i + 1 }));
}

app.get('/health', (_, res) => res.json({ ok: true }));

app.get('/api/news/kr', async (req, res) => {
  try {
    const items = await fetchKoreanNews();
    res.json({ articles: items });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/embed', async (req, res) => {
  try {
    const { texts } = req.body;
    if (!Array.isArray(texts)) return res.status(400).json({ error: 'texts must be an array' });
    const model = await getEmbedder();
    const embs = [];
    for (const t of texts) {
      const out = await model(t, { pooling: 'mean', normalize: true });
      embs.push(Array.from(out.data));
    }
    res.json({ embeddings: embs });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/topics', async (req, res) => {
  try {
    const articles = await fetchKoreanNews();
    const texts = articles.map(a => `${a.title} ${a.summary}`.trim());
    const model = await getEmbedder();
    const vectors = [];
    for (const t of texts) {
      const out = await model(t, { pooling: 'mean', normalize: true });
      vectors.push(Array.from(out.data));
    }
    const k = Math.min(10, Math.max(1, Math.floor(Math.sqrt(articles.length))));
    const { labels } = kmeans(vectors, k);

    // Build clusters
    const clusters = new Map();
    articles.forEach((a, i) => {
      const c = labels[i];
      if (!clusters.has(c)) clusters.set(c, []);
      clusters.get(c).push({ article: a, idx: i });
    });

    // Create topics with explanations
    const topics = [];
    let topicId = 1;
    for (const [cid, arr] of clusters.entries()) {
      const titles = arr.map(x => x.article.title).join(' ');
      const summary = arr.map(x => x.article.summary).join(' ');
      const keys = keywords(`${titles} ${summary}`, 6);
      const title = keys.slice(0, 3).join(' · ') || `토픽 ${topicId}`;
      const explanation = `공통 키워드: ${keys.join(', ')}`;
      topics.push({ id: topicId, rank: topicId, title, explanation });
      // tag articles
      for (const { article } of arr) {
        article.topicId = topicId;
        article.clusterId = `c-${cid}`;
        article.clusterTitle = title;
      }
      topicId++;
    }

    // Sort topics by size desc
    topics.sort((a, b) => b.rank - a.rank);
    topics.forEach((t, i) => (t.rank = i + 1));

    res.json({ topics, articles });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// Serve built frontend (optional) — set STATIC_DIR or default to ../dist
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = process.env.STATIC_DIR || path.resolve(__dirname, '../dist');
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    const indexPath = path.join(staticDir, 'index.html');
    if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
    return res.status(404).send('Not Found');
  });
  console.log(`Serving static files from: ${staticDir}`);
} else {
  console.log(`Static dir not found (skip): ${staticDir}`);
}

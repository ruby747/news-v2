// Build topics.json for static hosting (GitHub Pages)
// Fetches RSS feeds, computes embeddings and clusters, writes to public/topics.json

import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';
import { pipeline } from '@xenova/transformers';

const DEFAULT_FEEDS = [
  'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko',
  'https://www.yna.co.kr/rss/all.xml',
  'https://news.kbs.co.kr/rss/news/major.xml',
  'https://news.sbs.co.kr/news/rss/news.xml',
];

const FEEDS = (process.env.FEEDS ? process.env.FEEDS.split(',') : DEFAULT_FEEDS).map(s => s.trim()).filter(Boolean);
const LIMIT = Number(process.env.LIMIT || 120);

const parser = new Parser({
  timeout: 15000,
  requestOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117 Safari/537.36',
      'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.7,en;q=0.5',
    },
  },
});

function getDomain(u = '') {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; }
}

function faviconFor(url = '') {
  const host = getDomain(url);
  return host ? `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent('https://' + host)}` : '';
}

function extractThumbFromAny(it) {
  if (it?.enclosure?.url) return it.enclosure.url;
  const mc = it['media:content'] || it['media:thumbnail'];
  if (mc) {
    if (Array.isArray(mc)) {
      for (const m of mc) {
        if (typeof m === 'string') return m;
        if (m?.url) return m.url;
        if (m?.$?.url) return m.$.url;
      }
    } else if (typeof mc === 'object') {
      if (mc.url) return mc.url;
      if (mc.$?.url) return mc.$.url;
    } else if (typeof mc === 'string') {
      return mc;
    }
  }
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
  try { return await parser.parseURL(url); }
  catch (e) { console.warn('Feed fetch failed', url, e?.message || e); return { items: [] }; }
}

async function fetchKoreanNews(limit = LIMIT) {
  const feeds = await Promise.all(FEEDS.map(fetchFeed));
  const rows = feeds.flatMap(f => f.items || []);
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
  const seen = new Set();
  const dedup = [];
  for (const a of mapped) {
    const key = (a.url || a.title).trim().toLowerCase();
    if (key && !seen.has(key)) { seen.add(key); dedup.push(a); }
  }
  dedup.sort((a, b) => safeDate(b.publishedAt).getTime() - safeDate(a.publishedAt).getTime());
  return dedup.slice(0, limit).map((a, i) => ({ ...a, id: i + 1 }));
}

function normalize(vec) {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

function kmeans(vectors, k = 10, maxIter = 50) {
  if (vectors.length === 0) return { labels: [], centroids: [] };
  const n = vectors.length;
  k = Math.max(1, Math.min(k, n));
  const dim = vectors[0].length;
  const data = vectors.map(normalize);
  const centroids = [];
  const first = Math.floor(Math.random() * n);
  centroids.push([...data[first]]);
  while (centroids.length < k) {
    const d2 = data.map(x => {
      let best = Infinity; for (const c of centroids) { let dist = 0; for (let i = 0; i < dim; i++) { const diff = x[i] - c[i]; dist += diff * diff; } if (dist < best) best = dist; }
      return best;
    });
    const sum = d2.reduce((a, b) => a + b, 0) || 1;
    let r = Math.random() * sum; let idx = 0;
    for (let i = 0; i < n; i++) { r -= d2[i]; if (r <= 0) { idx = i; break; } }
    centroids.push([...data[idx]]);
  }
  const labels = new Array(n).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      let bestJ = 0, bestDist = Infinity;
      for (let j = 0; j < k; j++) {
        let dist = 0; for (let d = 0; d < dim; d++) { const diff = data[i][d] - centroids[j][d]; dist += diff * diff; }
        if (dist < bestDist) { bestDist = dist; bestJ = j; }
      }
      if (labels[i] !== bestJ) { labels[i] = bestJ; changed = true; }
    }
    const sums = Array.from({ length: k }, () => new Array(dim).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < n; i++) { const j = labels[i]; counts[j]++; const v = data[i]; for (let d = 0; d < dim; d++) sums[j][d] += v[d]; }
    for (let j = 0; j < k; j++) { if (counts[j] === 0) continue; for (let d = 0; d < dim; d++) centroids[j][d] = sums[j][d] / counts[j]; }
    if (!changed) break;
  }
  return { labels, centroids };
}

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

async function main() {
  console.log('Fetching feeds...');
  const articles = await fetchKoreanNews();
  console.log('Articles:', articles.length);
  const pubDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
  // Always write articles.json (cheap and reliable)
  const articlesPath = path.join(pubDir, 'articles.json');
  fs.writeFileSync(articlesPath, JSON.stringify({ builtAt: new Date().toISOString(), articles }, null, 2));
  console.log('Wrote', articlesPath);

  // Try to build topics.json (can fail if model download/time constraints)
  try {
    console.log('Loading embedding model...');
    const model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Embedding and clustering...');
    const texts = articles.map(a => `${a.title} ${a.summary}`.trim());
    const vectors = [];
    for (const t of texts) {
      const out = await model(t, { pooling: 'mean', normalize: true });
      vectors.push(Array.from(out.data));
    }
    const k = Math.min(10, Math.max(1, Math.floor(Math.sqrt(articles.length))));
    const { labels } = kmeans(vectors, k);
    const clusters = new Map();
    articles.forEach((a, i) => { const c = labels[i]; if (!clusters.has(c)) clusters.set(c, []); clusters.get(c).push({ article: a, idx: i }); });

    const topics = [];
    let topicId = 1;
    for (const [cid, arr] of clusters.entries()) {
      const titles = arr.map(x => x.article.title).join(' ');
      const summary = arr.map(x => x.article.summary).join(' ');
      const keys = keywords(`${titles} ${summary}`, 6);
      const title = keys.slice(0, 3).join(' · ') || `토픽 ${topicId}`;
      const explanation = `공통 키워드: ${keys.join(', ')}`;
      topics.push({ id: topicId, rank: topicId, title, explanation });
      for (const { article } of arr) { article.topicId = topicId; article.clusterId = `c-${cid}`; article.clusterTitle = title; }
      topicId++;
    }
    topics.sort((a, b) => b.rank - a.rank); topics.forEach((t, i) => (t.rank = i + 1));
    const topicsPath = path.join(pubDir, 'topics.json');
    fs.writeFileSync(topicsPath, JSON.stringify({ builtAt: new Date().toISOString(), topics, articles }, null, 2));
    console.log('Wrote', topicsPath);
  } catch (err) {
    console.warn('Skipping topics.json due to embedding error:', err?.message || err);
  }
}

main().catch(e => { console.error(e); process.exit(1); });

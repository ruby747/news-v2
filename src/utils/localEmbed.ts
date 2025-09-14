import { pipeline } from '@xenova/transformers';
import type { ArticleApi, TopicApi } from './api';

let embedder: any | null = null;
async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

function normalize(vec: number[]) {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

function kmeans(vectors: number[][], k = 10, maxIter = 50) {
  if (vectors.length === 0) return { labels: [] as number[], centroids: [] as number[][] };
  const n = vectors.length;
  k = Math.max(1, Math.min(k, n));
  const dim = vectors[0].length;
  const data = vectors.map(normalize);
  const centroids: number[][] = [];
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
    for (let i = 0; i < n; i++) { r -= d2[i]; if (r <= 0) { idx = i; break; } }
    centroids.push([...data[idx]]);
  }
  const labels = new Array(n).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      let bestJ = 0, bestDist = Infinity;
      for (let j = 0; j < k; j++) {
        let dist = 0;
        for (let d = 0; d < dim; d++) {
          const diff = data[i][d] - centroids[j][d];
          dist += diff * diff;
        }
        if (dist < bestDist) { bestDist = dist; bestJ = j; }
      }
      if (labels[i] !== bestJ) { labels[i] = bestJ; changed = true; }
    }
    const sums = Array.from({ length: k }, () => new Array(dim).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      const j = labels[i]; counts[j]++;
      const v = data[i]; for (let d = 0; d < dim; d++) sums[j][d] += v[d];
    }
    for (let j = 0; j < k; j++) {
      if (counts[j] === 0) continue;
      for (let d = 0; d < dim; d++) centroids[j][d] = sums[j][d] / counts[j];
    }
    if (!changed) break;
  }
  return { labels, centroids };
}

const stop = new Set(['그리고','그러나','하지만','또한','이는','그는','그녀는','대한','에서','으로','에게','했다','합니다','한다','the','a','an','and','or','to','of','in','on','for','with','by','at','from','that','this','is','are','was','were']);
function keywords(text: string, topK = 5) {
  const tokens = (text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 1 && !stop.has(t));
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
  return [...freq.entries()].sort((a,b) => b[1]-a[1]).slice(0, topK).map(([w]) => w);
}

export async function buildTopicsClientSide(input: { articles: ArticleApi[] }): Promise<{ topics: TopicApi[]; articles: ArticleApi[] } | null> {
  const articles = input.articles ?? [];
  if (articles.length === 0) return { topics: [], articles: [] };
  const model = await getEmbedder();
  const texts = articles.map(a => `${a.title} ${a.summary}`.trim());
  const vectors: number[][] = [];
  for (const t of texts) {
    const out: any = await model(t, { pooling: 'mean', normalize: true });
    vectors.push(Array.from(out.data));
  }
  const k = Math.min(10, Math.max(1, Math.floor(Math.sqrt(articles.length))));
  const { labels } = kmeans(vectors, k);

  const clusters = new Map<number, { article: ArticleApi; idx: number }[]>();
  articles.forEach((a, i) => {
    const c = labels[i];
    if (!clusters.has(c)) clusters.set(c, []);
    clusters.get(c)!.push({ article: a, idx: i });
  });

  const topics: TopicApi[] = [];
  let topicId = 1;
  for (const [cid, arr] of clusters.entries()) {
    const titles = arr.map(x => x.article.title).join(' ');
    const summary = arr.map(x => x.article.summary).join(' ');
    const keys = keywords(`${titles} ${summary}`, 6);
    const title = keys.slice(0, 3).join(' · ') || `토픽 ${topicId}`;
    const explanation = `공통 키워드: ${keys.join(', ')}`;
    topics.push({ id: topicId, rank: topicId, title, explanation });
    for (const { article } of arr) {
      article.topicId = topicId;
      article.clusterId = `c-${cid}`;
      article.clusterTitle = title;
    }
    topicId++;
  }
  topics.sort((a, b) => b.rank - a.rank); topics.forEach((t, i) => (t.rank = i + 1));
  return { topics, articles };
}


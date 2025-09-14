export interface TopicApi {
  id: number;
  rank: number;
  title: string;
  explanation: string;
}

export interface ArticleApi {
  id: number;
  title: string;
  summary: string;
  content: string;
  source: string;
  sourceIcon: string;
  url: string;
  thumbnail: string;
  publishedAt: string;
  topicId: number;
  clusterId: string;
  clusterTitle: string;
}

async function fetchJsonWithCandidates<T = any>(paths: string[]): Promise<T | null> {
  for (const url of paths) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      return (await res.json()) as T;
    } catch {
      // try next candidate
    }
  }
  return null;
}

function candidatesFor(file: string): string[] {
  const base = (import.meta as any)?.env?.BASE_URL || '/';
  const fromBase = base.endsWith('/') ? `${base}${file}` : `${base}/${file}`;
  const loc = typeof window !== 'undefined' ? window.location : undefined;
  const path = loc ? loc.pathname.replace(/\/[^/]*$/, '/') : '/';
  const fromPath = path.endsWith('/') ? `${path}${file}` : `${path}/${file}`;
  const guesses = new Set<string>([
    fromBase,
    fromPath,
    `/${file}`,
    file,
  ]);
  // Common subpath hint for this project
  guesses.add(`/news-v2/${file}`);
  return Array.from(guesses);
}

export async function fetchTopicsFromStatic(): Promise<{ topics: TopicApi[]; articles: ArticleApi[] } | null> {
  const data = await fetchJsonWithCandidates<{ topics: TopicApi[]; articles: ArticleApi[] }>(candidatesFor('topics.json'));
  if (!data?.topics || !data?.articles) return null;
  return data;
}

export async function fetchArticlesFromStatic(): Promise<{ articles: ArticleApi[] } | null> {
  const data = await fetchJsonWithCandidates<{ articles: ArticleApi[] }>(candidatesFor('articles.json'));
  if (!data?.articles) return null;
  return { articles: data.articles };
}

function getApiBase(): string {
  const base = (import.meta as any)?.env?.VITE_API_BASE || '';
  return typeof base === 'string' ? base : '';
}

export async function fetchTopicsFromServer(base = getApiBase()): Promise<{ topics: TopicApi[]; articles: ArticleApi[] } | null> {
  try {
    const res = await fetch(`${base}/api/topics`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.topics || !data?.articles) return null;
    return data;
  } catch {
    return null;
  }
}

export async function fetchArticlesFromServer(base = getApiBase()): Promise<{ articles: ArticleApi[] } | null> {
  try {
    const res = await fetch(`${base}/api/news/kr`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.articles) return null;
    return { articles: data.articles };
  } catch {
    return null;
  }
}

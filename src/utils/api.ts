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

export async function fetchTopicsFromStatic(): Promise<{ topics: TopicApi[]; articles: ArticleApi[] } | null> {
  try {
    const base = (import.meta as any)?.env?.BASE_URL || '/';
    const url = `${base}topics.json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.topics || !data?.articles) return null;
    return data;
  } catch {
    return null;
  }
}

export async function fetchArticlesFromStatic(): Promise<{ articles: ArticleApi[] } | null> {
  try {
    const base = (import.meta as any)?.env?.BASE_URL || '/';
    const url = `${base}articles.json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.articles) return null;
    return { articles: data.articles };
  } catch {
    return null;
  }
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

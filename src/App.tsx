import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { TopicRankings } from './components/TopicRankings';
import { NewsFeed } from './components/NewsFeed';
import { mockTopics, mockArticles } from './utils/mockData';
import { fetchTopicsFromStatic, fetchTopicsFromServer, fetchArticlesFromServer } from './utils/api';
import { buildTopicsClientSide } from './utils/localEmbed';
export function App() {
  const [topics, setTopics] = useState(mockTopics);
  const [articles, setArticles] = useState(mockArticles);
  const [selectedTopic, setSelectedTopic] = useState(mockTopics[0].id);

  // 1) 정적 topics.json 사용(GitHub Pages)
  // 2) API의 /api/topics 사용
  // 3) 실패 시 /api/news/kr 가져와 브라우저에서 토픽 계산(로컬 임베딩)
  // 4) 모두 실패 시 목데이터
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Step 1: static topics.json
      const s = await fetchTopicsFromStatic();
      if (!cancelled && s) {
        setTopics(s.topics);
        setArticles(s.articles);
        setSelectedTopic(s.topics[0]?.id ?? 0);
        return;
      }
      // Step 2: server topics
      const data1 = await fetchTopicsFromServer();
      if (!cancelled && data1) {
        setTopics(data1.topics);
        setArticles(data1.articles);
        setSelectedTopic(data1.topics[0]?.id ?? 0);
        return;
      }
      // Step 3: server articles + client-side topics
      const data2 = await fetchArticlesFromServer();
      if (!cancelled && data2) {
        try {
          const built = await buildTopicsClientSide({ articles: data2.articles });
          if (built) {
            setTopics(built.topics);
            setArticles(built.articles);
            setSelectedTopic(built.topics[0]?.id ?? 0);
            return;
          }
        } catch (e) {
          // ignore and fall back
        }
      }
      // Step 4: fallback
      if (!cancelled) {
        setTopics(mockTopics);
        setArticles(mockArticles);
        setSelectedTopic(mockTopics[0].id);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const handleTopicSelect = (topicId: number) => {
    setSelectedTopic(topicId);
  };
  const filteredArticles = selectedTopic ? articles.filter(article => article.topicId === selectedTopic) : articles;
  return <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3">
            <TopicRankings topics={topics} selectedTopic={selectedTopic} onSelectTopic={handleTopicSelect} />
          </div>
          <div className="lg:col-span-9">
            <NewsFeed articles={filteredArticles} />
          </div>
        </div>
      </main>
    </div>;
}

import React from 'react';
import { NewsCard } from './NewsCard';
import { RelatedArticles } from './RelatedArticles';
import { Article } from '../utils/mockData';
interface NewsFeedProps {
  articles: Article[];
}
export const NewsFeed = ({
  articles
}: NewsFeedProps) => {
  // Group articles by clusterIds
  const articlesByCluster: Record<string, Article[]> = {};
  articles.forEach(article => {
    if (!articlesByCluster[article.clusterId]) {
      articlesByCluster[article.clusterId] = [];
    }
    articlesByCluster[article.clusterId].push(article);
  });
  return <div className="space-y-8">
      {Object.entries(articlesByCluster).map(([clusterId, clusterArticles]) => <div key={clusterId} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {clusterArticles[0].clusterTitle}
          </h2>
          {/* Display the main article */}
          <NewsCard article={clusterArticles[0]} isMainArticle={true} />
          {/* Display related articles if there are more than one */}
          {clusterArticles.length > 1 && <RelatedArticles articles={clusterArticles.slice(1)} />}
        </div>)}
    </div>;
};
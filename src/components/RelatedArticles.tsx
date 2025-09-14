import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { NewsCard } from './NewsCard';
import { Article } from '../utils/mockData';
interface RelatedArticlesProps {
  articles: Article[];
}
export const RelatedArticles = ({
  articles
}: RelatedArticlesProps) => {
  const [expanded, setExpanded] = useState(false);
  const displayedArticles = expanded ? articles : articles.slice(0, 2);
  return <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-700">Related Articles</h3>
        {articles.length > 2 && <button onClick={() => setExpanded(!expanded)} className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
            <span>
              {expanded ? 'Show less' : `Show all ${articles.length} articles`}
            </span>
            {expanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
          </button>}
      </div>
      <div className="space-y-6">
        {displayedArticles.map(article => <NewsCard key={article.id} article={article} />)}
      </div>
    </div>;
};
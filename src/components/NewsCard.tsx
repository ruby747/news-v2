import React from 'react';
import { ExternalLinkIcon, ClockIcon } from 'lucide-react';
import { Article } from '../utils/mockData';
interface NewsCardProps {
  article: Article;
  isMainArticle?: boolean;
}
export const NewsCard = ({
  article,
  isMainArticle = false
}: NewsCardProps) => {
  return <div className={`${isMainArticle ? 'mb-6' : ''}`}>
      <div className={`grid grid-cols-1 ${isMainArticle ? 'md:grid-cols-2' : ''} gap-6`}>
        <div className={`${isMainArticle ? 'order-2 md:order-1' : ''}`}>
          <div className="flex items-center space-x-2 mb-2">
            <img src={article.sourceIcon} alt={article.source} className="h-5 w-5 object-contain" />
            <span className="text-sm font-medium text-gray-600">
              {article.source}
            </span>
          </div>
          <h3 className={`font-bold text-gray-900 mb-2 ${isMainArticle ? 'text-xl' : 'text-base'}`}>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              {article.title}
            </a>
          </h3>
          {isMainArticle && <p className="text-gray-600 mb-4">{article.summary}</p>}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <ClockIcon className="h-4 w-4" />
              <span>{article.publishedAt}</span>
            </div>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
              <span>Read more</span>
              <ExternalLinkIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
        {article.thumbnail && <div className={`${isMainArticle ? 'order-1 md:order-2' : ''}`}>
            <img src={article.thumbnail} alt={article.title} className={`rounded-lg object-cover w-full ${isMainArticle ? 'h-64 md:h-full' : 'h-48'}`} />
          </div>}
      </div>
    </div>;
};
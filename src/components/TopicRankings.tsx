import React from 'react';
import { TrendingUpIcon, InfoIcon } from 'lucide-react';
import { Topic } from '../utils/mockData';
interface TopicRankingsProps {
  topics: Topic[];
  selectedTopic: number;
  onSelectTopic: (topicId: number) => void;
}
export const TopicRankings = ({
  topics,
  selectedTopic,
  onSelectTopic
}: TopicRankingsProps) => {
  return <div className="bg-white rounded-lg shadow-md p-5">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUpIcon className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Trending Topics</h2>
      </div>
      <ul className="space-y-2">
        {topics.map(topic => <li key={topic.id}>
            <button onClick={() => onSelectTopic(topic.id)} className={`w-full text-left p-2 rounded-lg transition-colors ${selectedTopic === topic.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`font-bold mr-2 text-base ${selectedTopic === topic.id ? 'text-blue-600' : 'text-gray-700'}`}>
                    {topic.rank}
                  </span>
                  <span className={`font-medium text-sm ${selectedTopic === topic.id ? 'text-blue-800' : 'text-gray-800'}`}>
                    {topic.title}
                  </span>
                </div>
                {selectedTopic === topic.id && <InfoIcon className="h-4 w-4 text-blue-600" />}
              </div>
              {selectedTopic === topic.id && <div className="mt-2 text-xs text-gray-600 pl-6">
                  {topic.explanation}
                </div>}
            </button>
          </li>)}
      </ul>
    </div>;
};

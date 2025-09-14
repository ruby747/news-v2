import React from 'react';
import { NewspaperIcon } from 'lucide-react';
export const Header = () => {
  return <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <NewspaperIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">NewsAggregator</h1>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600 font-medium">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600 font-medium">
                  Categories
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600 font-medium">
                  About
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>;
};
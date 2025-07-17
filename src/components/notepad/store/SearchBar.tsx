import React, { useState } from 'react';
import { useNotepadStore } from '../store/notepadStore';
import { Search, X } from 'lucide-react';

export const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery } = useNotepadStore();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative transition-all duration-200 ${
      isFocused ? 'w-80' : 'w-64'
    }`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {isFocused && searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Search results
            </div>
            {/* Search results would go here */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Press Enter to search
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
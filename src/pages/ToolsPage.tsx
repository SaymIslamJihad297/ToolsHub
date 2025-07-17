import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { tools } from '../data/tools';
import { ArrowRight, Search } from 'lucide-react';

export const ToolsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'image', 'text', 'media', 'document'];
  
  const filteredTools = tools.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">All Tools</h1>
        <p className="text-xl text-gray-600">
          Discover our complete suite of productivity tools
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTools.map((tool) => (
          <Link key={tool.id} to={tool.route}>
            <Card hover className="p-6 h-full">
              <div className={`w-16 h-16 bg-gradient-to-r ${tool.gradient} rounded-lg flex items-center justify-center mb-4`}>
                <span className="text-2xl">{tool.icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h3>
              <p className="text-gray-600 text-sm mb-4 flex-1">{tool.description}</p>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  tool.category === 'image' ? 'bg-blue-100 text-blue-800' :
                  tool.category === 'text' ? 'bg-green-100 text-green-800' :
                  tool.category === 'media' ? 'bg-purple-100 text-purple-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {tool.category}
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tools found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};
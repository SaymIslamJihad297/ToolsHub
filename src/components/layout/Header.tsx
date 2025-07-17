import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Home, Grid3X3 } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg group-hover:shadow-lg transition-shadow">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ToolsHub
              </h1>
              <p className="text-xs text-gray-500">Productivity Platform</p>
            </div>
          </Link>

          <nav className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:block">Dashboard</span>
            </Link>
            <Link
              to="/tools"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:block">All Tools</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
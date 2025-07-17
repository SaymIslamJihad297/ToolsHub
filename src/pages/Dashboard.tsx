import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { tools } from '../data/tools';
import { ArrowRight, Star, Zap, Shield } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const featuredTools = tools.slice(0, 4);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ToolsHub
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Your all-in-one productivity platform with powerful tools for image processing, 
          text manipulation, media conversion, and document editing.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/tools">
            <Button size="lg" className="group">
              Explore All Tools
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Button variant="outline" size="lg">
            Watch Demo
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
          <p className="text-gray-600">
            Optimized for speed with client-side processing for instant results
          </p>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
          <p className="text-gray-600">
            Your files stay in your browser - no uploads to external servers
          </p>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Professional Grade</h3>
          <p className="text-gray-600">
            Enterprise-quality tools with advanced features and capabilities
          </p>
        </Card>
      </section>

      {/* Featured Tools */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Tools</h2>
          <p className="text-gray-600">Most popular tools to boost your productivity</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredTools.map((tool) => (
            <Link key={tool.id} to={tool.route}>
              <Card hover className="p-6 h-full">
                <div className={`w-16 h-16 bg-gradient-to-r ${tool.gradient} rounded-lg flex items-center justify-center mb-4`}>
                  <span className="text-2xl">{tool.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
                <div className="flex items-center text-blue-600 text-sm font-medium">
                  Try it now
                  <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* All Tools Preview */}
      <section className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">8 Powerful Tools</h2>
        <p className="text-gray-600 mb-8">Everything you need for modern productivity</p>
        <Link to="/tools">
          <Button size="lg" variant="outline">
            View All Tools
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>
    </div>
  );
};
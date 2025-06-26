import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Settings as SettingsIcon } from 'lucide-react';

const TestCreatePost = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Interactive Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Left Section - Logo and Title */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Social Media Scheduler</h1>
                  <p className="text-xs text-gray-500">Create & Schedule Posts</p>
                </div>
              </div>
            </div>
            
            {/* Right Section - Actions */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <SettingsIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Layout */}
      <div className="pt-16">
        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto p-6">
          {/* Content Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Create Amazing Social Media Content</h1>
            <p className="text-lg text-gray-600 mb-4">Generate engaging posts with AI and schedule them across all your platforms</p>
            <div className="flex justify-center">
              <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                ✨ AI-Powered Content Generation
              </span>
            </div>
          </div>

          {/* Test Content */}
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Component Working!</h2>
            <p className="text-gray-600">
              This is a simplified version of the CreatePost component to test if the basic structure works.
              If you can see this, the component is rendering correctly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCreatePost;

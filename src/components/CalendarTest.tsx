import React from 'react';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';

const CalendarTest = () => {
  const {
    scheduledPosts,
    loading,
    error,
    refreshPosts
  } = useScheduledPosts();

  console.log('📅 Calendar Test - Hook data:', {
    scheduledPosts: scheduledPosts?.length || 0,
    loading,
    error,
    posts: scheduledPosts
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar Error</h3>
          <p className="text-gray-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => refreshPosts()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl shadow-lg">
              <CalendarIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Calendar Test</h1>
              <p className="text-gray-600">Testing calendar functionality</p>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>Error:</strong> {error || 'None'}</p>
              <p><strong>Posts Count:</strong> {scheduledPosts?.length || 0}</p>
              <p><strong>Posts Data:</strong></p>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-64">
                {JSON.stringify(scheduledPosts, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        {scheduledPosts && scheduledPosts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Posts ({scheduledPosts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledPosts.map((post, index) => (
                  <div key={post.id || index} className="p-4 border border-gray-200 rounded-lg">
                    <p><strong>Content:</strong> {post.content?.substring(0, 100)}...</p>
                    <p><strong>Platform:</strong> {post.platform}</p>
                    <p><strong>Scheduled:</strong> {post.scheduled_for || post.scheduled_at}</p>
                    <p><strong>Status:</strong> {post.status || 'Unknown'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {scheduledPosts && scheduledPosts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No scheduled posts</h3>
              <p className="text-gray-600">No posts found in the database.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CalendarTest;

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleSchedulingService } from '@/services/simpleSchedulingService';
import { useToast } from '@/hooks/use-toast';
import { formatScheduledDateForDisplay } from '@/utils/timezone';

/**
 * Test component to verify simple scheduling works
 */
export function SimpleSchedulingTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [status, setStatus] = useState<any>({ total: 0, pending: 0, posted: 0, failed: 0 });
  const { toast } = useToast();

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [posts, statusData] = await Promise.all([
        SimpleSchedulingService.getScheduledPosts(),
        SimpleSchedulingService.getSchedulingStatus()
      ]);
      
      setScheduledPosts(posts);
      setStatus(statusData);
      
      console.log('📊 [Test] Loaded data:', { posts: posts.length, status: statusData });
    } catch (error) {
      console.error('❌ [Test] Error loading data:', error);
    }
  };

  const testScheduling = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 [Test] Starting scheduling test...');

      // Schedule a test post for 2 minutes from now
      const testPost = await SimpleSchedulingService.schedulePost({
        content: `🧪 Test post created at ${new Date().toLocaleString()}. This is a test of the simple scheduling system.`,
        platform: 'twitter',
        scheduled_time: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes from now
        image_url: undefined,
        title: 'Test Post'
      });

      if (testPost) {
        toast({
          title: "✅ Test Post Scheduled!",
          description: `Test post scheduled for ${new Date(Date.now() + 2 * 60 * 1000).toLocaleString()}`,
        });
        
        // Reload data to show the new post
        await loadData();
      } else {
        throw new Error('Failed to schedule test post');
      }

    } catch (error: any) {
      console.error('❌ [Test] Scheduling test failed:', error);
      toast({
        title: "❌ Test Failed",
        description: error.message || "Failed to schedule test post",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const success = await SimpleSchedulingService.deleteScheduledPost(postId);
      if (success) {
        toast({
          title: "🗑️ Post Deleted",
          description: "Test post has been deleted",
        });
        await loadData();
      }
    } catch (error) {
      console.error('❌ [Test] Error deleting post:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🧪 Simple Scheduling Test
        </h1>
        <p className="text-gray-600">
          Test the simplified scheduling system using the posts table
        </p>
      </div>

      {/* Status Overview */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">📊 Scheduling Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{status.total}</div>
            <div className="text-sm text-gray-600">Total Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{status.pending}</div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{status.posted}</div>
            <div className="text-sm text-gray-600">Published</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{status.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>
      </Card>

      {/* Test Actions */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">🧪 Test Actions</h3>
        <div className="space-y-4">
          <Button 
            onClick={testScheduling} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? '⏳ Scheduling Test Post...' : '🧪 Schedule Test Post (2 min from now)'}
          </Button>
          
          <Button 
            onClick={loadData} 
            variant="outline"
            className="w-full"
          >
            🔄 Refresh Data
          </Button>
        </div>
      </Card>

      {/* Scheduled Posts */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          📅 Scheduled Posts ({scheduledPosts.length})
        </h3>
        
        {scheduledPosts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No scheduled posts found. Click "Schedule Test Post" to create one.
          </div>
        ) : (
          <div className="space-y-4">
            {scheduledPosts.map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-blue-600">
                        {post.platform}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        post.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        post.status === 'published' ? 'bg-green-100 text-green-800' :
                        post.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-900 mb-2">
                      {post.content.substring(0, 100)}
                      {post.content.length > 100 && '...'}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      <div>Scheduled: {formatScheduledDateForDisplay(post.scheduled_at)}</div>
                      <div>Created: {formatScheduledDateForDisplay(post.created_at)}</div>
                      {post.published_at && (
                        <div>Published: {formatScheduledDateForDisplay(post.published_at)}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {post.status === 'scheduled' && (
                      <Button
                        onClick={() => deletePost(post.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        🗑️ Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">
          📋 How to Test
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Click "Schedule Test Post" to create a test post</li>
          <li>• The post will be scheduled for 2 minutes from now</li>
          <li>• Check the status to see scheduled vs published posts</li>
          <li>• Use "Refresh Data" to see updated status</li>
          <li>• Delete test posts when done testing</li>
        </ul>
      </Card>

      {/* Debug Info */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2">
          🔍 Debug Info
        </h3>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Service: SimpleSchedulingService</div>
          <div>Table: posts (status = 'scheduled')</div>
          <div>Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
          <div>Current Time: {new Date().toISOString()}</div>
        </div>
      </Card>
    </div>
  );
}

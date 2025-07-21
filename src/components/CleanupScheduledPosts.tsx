import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatScheduledDateForDisplay } from '@/utils/timezone';

/**
 * Component to clean up existing scheduled posts
 */
export function CleanupScheduledPosts() {
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      // Get all posts for current user
      const { data: allPosts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error loading posts:', postsError);
        return;
      }

      setPosts(allPosts || []);

      // Calculate stats
      const statusCounts = (allPosts || []).reduce((acc: any, post: any) => {
        acc[post.status] = (acc[post.status] || 0) + 1;
        return acc;
      }, {});

      setStats(statusCounts);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cleanupScheduledPosts = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('status', 'scheduled');

      if (error) {
        throw error;
      }

      toast({
        title: "✅ Cleanup Complete",
        description: "All scheduled posts have been removed",
      });

      await loadPosts();
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast({
        title: "❌ Cleanup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupTestPosts = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .or('content.ilike.%🧪%,content.ilike.%test%');

      if (error) {
        throw error;
      }

      toast({
        title: "✅ Test Posts Cleaned",
        description: "All test posts have been removed",
      });

      await loadPosts();
    } catch (error: any) {
      toast({
        title: "❌ Cleanup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupAllPosts = async () => {
    if (!confirm('⚠️ This will delete ALL your posts. Are you sure?')) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        throw error;
      }

      toast({
        title: "✅ All Posts Deleted",
        description: "All posts have been removed",
      });

      await loadPosts();
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast({
        title: "❌ Cleanup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        throw error;
      }

      toast({
        title: "🗑️ Post Deleted",
        description: "Post has been removed",
      });

      await loadPosts();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "❌ Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🧹 Cleanup Scheduled Posts
        </h1>
        <p className="text-gray-600">
          Remove existing scheduled posts to fix database issues
        </p>
      </div>

      {/* Stats */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">📊 Current Posts</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{posts.length}</div>
            <div className="text-sm text-gray-600">Total Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.scheduled || 0}</div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.published || 0}</div>
            <div className="text-sm text-gray-600">Published</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.draft || 0}</div>
            <div className="text-sm text-gray-600">Draft</div>
          </div>
        </div>
      </Card>

      {/* Cleanup Actions */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">🧹 Cleanup Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={cleanupScheduledPosts} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? '⏳ Cleaning...' : '🗑️ Remove Scheduled Posts'}
          </Button>
          
          <Button 
            onClick={cleanupTestPosts} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? '⏳ Cleaning...' : '🧪 Remove Test Posts'}
          </Button>
          
          <Button 
            onClick={cleanupAllPosts} 
            disabled={isLoading}
            variant="destructive"
            className="w-full"
          >
            {isLoading ? '⏳ Cleaning...' : '💥 Remove ALL Posts'}
          </Button>
        </div>
        
        <Button 
          onClick={loadPosts} 
          variant="outline"
          className="w-full mt-4"
        >
          🔄 Refresh Data
        </Button>
      </Card>

      {/* Posts List */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          📋 All Posts ({posts.length})
        </h3>
        
        {posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No posts found. Database is clean!
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {posts.map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
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
                    
                    <div className="text-sm text-gray-900 mb-1">
                      {post.content.substring(0, 80)}
                      {post.content.length > 80 && '...'}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {post.scheduled_at && (
                        <div>Scheduled: {formatScheduledDateForDisplay(post.scheduled_at)}</div>
                      )}
                      <div>Created: {formatScheduledDateForDisplay(post.created_at)}</div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => deletePost(post.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 ml-2"
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

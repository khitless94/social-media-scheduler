import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const DatabaseChecker: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const checkScheduledPosts = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 [DatabaseChecker] Checking scheduled posts...');

      const { data: scheduledPosts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'scheduled')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ [DatabaseChecker] Error:', error);
        toast({
          title: "❌ Database Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('📊 [DatabaseChecker] Scheduled posts:', scheduledPosts);
      setResults({ type: 'scheduled', data: scheduledPosts });

      toast({
        title: "✅ Query Complete",
        description: `Found ${scheduledPosts?.length || 0} scheduled posts`,
      });

    } catch (error: any) {
      console.error('❌ [DatabaseChecker] Exception:', error);
      toast({
        title: "❌ Query Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkTwitterPosts = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 [DatabaseChecker] Checking Twitter posts...');

      const { data: twitterPosts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('platform', 'twitter')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ [DatabaseChecker] Error:', error);
        toast({
          title: "❌ Database Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('📊 [DatabaseChecker] Twitter posts:', twitterPosts);
      setResults({ type: 'twitter', data: twitterPosts });

      toast({
        title: "✅ Query Complete",
        description: `Found ${twitterPosts?.length || 0} Twitter posts`,
      });

    } catch (error: any) {
      console.error('❌ [DatabaseChecker] Exception:', error);
      toast({
        title: "❌ Query Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkRecentPosts = async () => {
    setIsLoading(true);
    try {
      const { data: recentPosts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        toast({
          title: "❌ Database Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setResults({ type: 'recent', data: recentPosts });

      toast({
        title: "✅ Query Complete",
        description: `Found ${recentPosts?.length || 0} recent posts`,
      });

    } catch (error: any) {
      console.error('❌ [DatabaseChecker] Exception:', error);
      toast({
        title: "❌ Query Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'published': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Database Checker</CardTitle>
          <CardDescription>
            Check the posts table to verify scheduling is working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={checkScheduledPosts}
              disabled={isLoading}
              className="w-full"
            >
              📅 Check Scheduled Posts
            </Button>

            <Button
              onClick={checkTwitterPosts}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              🐦 Check Twitter Posts
            </Button>

            <Button
              onClick={checkRecentPosts}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              🕒 Check Recent Posts
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>
              📊 Results: {results.type.charAt(0).toUpperCase() + results.type.slice(1)} Posts
            </CardTitle>
            <CardDescription>
              Found {results.data?.length || 0} posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.data && results.data.length > 0 ? (
              <div className="space-y-4">
                {results.data.map((post: any) => (
                  <div key={post.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold">Content:</p>
                        <p className="text-sm text-gray-600 mb-2">
                          {post.content.substring(0, 100)}
                          {post.content.length > 100 ? '...' : ''}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Platform:</span>
                          <span className="text-sm">{post.platform}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                            {post.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><strong>ID:</strong> {post.id}</p>
                        <p><strong>Created:</strong> {formatDate(post.created_at)}</p>
                        {post.scheduled_at && (
                          <p><strong>Scheduled:</strong> {formatDate(post.scheduled_at)}</p>
                        )}
                        {post.published_at && (
                          <p><strong>Published:</strong> {formatDate(post.published_at)}</p>
                        )}
                        {post.error_message && (
                          <p className="text-red-600"><strong>Error:</strong> {post.error_message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No posts found</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

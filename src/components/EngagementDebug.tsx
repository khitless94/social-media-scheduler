import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { realEngagementService } from '@/services/engagementService';
import { RefreshCw, Database, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface PostDebugInfo {
  id: string;
  content: string;
  platform: string;
  status: string;
  created_at: string;
  platform_post_ids: Record<string, string> | null;
  engagement_stats: Record<string, any> | null;
  hasEngagement: boolean;
  hasPlatformIds: boolean;
}

const EngagementDebug = () => {
  const [posts, setPosts] = useState<PostDebugInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { user } = useAuth();

  const fetchPosts = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const debugPosts: PostDebugInfo[] = (data || []).map(post => ({
        id: post.id,
        content: post.content?.substring(0, 50) + '...',
        platform: post.platform,
        status: post.status,
        created_at: post.created_at,
        platform_post_ids: post.platform_post_ids,
        engagement_stats: post.engagement_stats,
        hasEngagement: !!(post.engagement_stats && Object.keys(post.engagement_stats).length > 0),
        hasPlatformIds: !!(post.platform_post_ids && Object.keys(post.platform_post_ids).length > 0)
      }));

      setPosts(debugPosts);
      console.log('📊 Debug posts:', debugPosts);
    } catch (error) {
      console.error('Error fetching debug posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!user?.id) return;

    setSyncing(true);
    try {
      await realEngagementService.syncRealData(user.id);
      await fetchPosts(); // Refresh after sync
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearData = async () => {
    if (!user?.id) return;

    const confirmed = confirm('This will clear all engagement data to ensure only real data from social media platforms is shown. Continue?');
    if (!confirmed) return;

    setClearing(true);
    try {
      await realEngagementService.clearAllEngagementData(user.id);
      await fetchPosts(); // Refresh after clearing
      alert('All engagement data cleared. Only real data from connected social media platforms will be shown.');
    } catch (error) {
      console.error('Clear failed:', error);
      alert('Failed to clear data: ' + error.message);
    } finally {
      setClearing(false);
    }
  };



  useEffect(() => {
    fetchPosts();
  }, [user?.id]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading debug info...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Engagement Debug Info</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleSync}
              size="sm"
              disabled={syncing || clearing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {syncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Syncing Real Data...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Real Engagement Data
                </>
              )}
            </Button>

            <Button
              onClick={handleClearData}
              size="sm"
              disabled={syncing || clearing}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              {clearing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No posts found</p>
            <p className="text-sm text-gray-400">Create some posts to see debug info</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{posts.length}</div>
                <div className="text-sm text-blue-700">Total Posts</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {posts.filter(p => p.hasEngagement).length}
                </div>
                <div className="text-sm text-green-700">With Engagement</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {posts.filter(p => p.hasPlatformIds).length}
                </div>
                <div className="text-sm text-orange-700">With Platform IDs</div>
              </div>
            </div>

            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {post.platform}
                        </Badge>
                        <Badge 
                          variant={post.status === 'published' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {post.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-900 mb-1">{post.content}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex items-center space-x-1">
                        {post.hasPlatformIds ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-xs text-gray-600">Platform IDs</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {post.hasEngagement ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-xs text-gray-600">Engagement</span>
                      </div>
                    </div>
                  </div>
                  
                  {post.engagement_stats && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <strong>Engagement:</strong> {JSON.stringify(post.engagement_stats, null, 2)}
                    </div>
                  )}
                  
                  {post.platform_post_ids && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                      <strong>Platform IDs:</strong> {JSON.stringify(post.platform_post_ids, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EngagementDebug;

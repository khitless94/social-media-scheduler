import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Play, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export function ManualPostProcessor() {
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [readyPosts, setReadyPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      // Get scheduled posts that should be ready
      const { data: scheduled, error: scheduledError } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      // Get posts already ready for posting
      const { data: ready, error: readyError } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'ready_for_posting')
        .order('scheduled_at', { ascending: true });

      if (!scheduledError && scheduled) {
        setScheduledPosts(scheduled);
      }

      if (!readyError && ready) {
        setReadyPosts(ready);
      }

    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markPostsAsReady = async () => {
    setIsProcessing(true);
    try {
      let processedCount = 0;

      for (const post of scheduledPosts) {
        const { error } = await supabase
          .from('posts')
          .update({ 
            status: 'ready_for_posting',
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id);

        if (!error) {
          processedCount++;
        }
      }

      toast({
        title: "✅ Posts Marked as Ready",
        description: `${processedCount} posts marked as ready for posting`,
      });

      await loadPosts();
    } catch (error: any) {
      toast({
        title: "❌ Processing Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const postToSocialMedia = async (post: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch('https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: post.content,
          platforms: [post.platform]
        })
      });

      const responseData = await response.json();
      
      if (response.ok && responseData.success) {
        // Mark as posted
        await supabase
          .from('posts')
          .update({ 
            status: 'published',
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id);
        
        toast({
          title: `✅ Posted to ${post.platform}`,
          description: "Post was successfully published!",
        });
      } else {
        // Mark as failed
        await supabase
          .from('posts')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id);

        toast({
          title: `❌ Failed to post to ${post.platform}`,
          description: responseData.error || 'Unknown error',
          variant: "destructive"
        });
      }
      
      await loadPosts();
    } catch (error: any) {
      toast({
        title: "Posting Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🚀 Manual Post Processor
        </h1>
        <p className="text-gray-600">
          Process scheduled posts and post them to social media
        </p>
      </div>

      {/* Summary */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{scheduledPosts.length}</div>
            <div className="text-sm text-gray-600">Overdue Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{readyPosts.length}</div>
            <div className="text-sm text-gray-600">Ready for Posting</div>
          </div>
          <div className="text-center">
            <Button 
              onClick={loadPosts} 
              disabled={isLoading}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Overdue Scheduled Posts */}
      {scheduledPosts.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">
              Overdue Scheduled Posts ({scheduledPosts.length})
            </h3>
            <Button 
              onClick={markPostsAsReady}
              disabled={isProcessing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Clock className="h-4 w-4 mr-2" />
              Mark All as Ready
            </Button>
          </div>
          
          <div className="space-y-3">
            {scheduledPosts.map((post) => (
              <div key={post.id} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-orange-100 text-orange-800">
                        {post.platform}
                      </Badge>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Overdue
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-900 mb-2">
                      {post.content.substring(0, 100)}
                      {post.content.length > 100 && '...'}
                    </div>
                    
                    <div className="text-xs text-gray-600">
                      Scheduled: {new Date(post.scheduled_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Ready Posts */}
      {readyPosts.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Ready for Posting ({readyPosts.length})
          </h3>
          
          <div className="space-y-3">
            {readyPosts.map((post) => (
              <div key={post.id} className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        {post.platform}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ready
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-900 mb-2">
                      {post.content.substring(0, 100)}
                      {post.content.length > 100 && '...'}
                    </div>
                    
                    <div className="text-xs text-gray-600">
                      Scheduled: {new Date(post.scheduled_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Button 
                      onClick={() => postToSocialMedia(post)} 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Post Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h3 className="font-semibold text-green-800 mb-2">
          🔧 How to Process Your Scheduled Posts
        </h3>
        <div className="text-sm text-green-700 space-y-2">
          <div><strong>1. Mark as Ready:</strong> Click "Mark All as Ready" to convert overdue scheduled posts</div>
          <div><strong>2. Post Manually:</strong> Click "Post Now" on any ready post to publish immediately</div>
          <div><strong>3. Check Connections:</strong> Make sure your social media accounts are connected</div>
          <div><strong>4. Set Up Automation:</strong> Run the SQL setup for automatic processing</div>
        </div>
      </Card>
    </div>
  );
}

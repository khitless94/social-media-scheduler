import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { SocialPostingProcessor } from '@/services/socialPostingProcessor';
import { CheckCircle, XCircle, Clock, RefreshCw, Play, Square, AlertTriangle } from 'lucide-react';

export function SocialPostingFix() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processorStatus, setProcessorStatus] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadData();
      updateProcessorStatus();
      
      // Refresh data every 5 seconds
      const interval = setInterval(() => {
        loadData();
        updateProcessorStatus();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Get posts that should be processed - with fallback
      let readyPosts, readyError;

      try {
        const result = await supabase.rpc('get_posts_ready_for_posting');
        readyPosts = result.data;
        readyError = result.error;
      } catch (funcError) {
        // Fallback to direct query if function doesn't exist
        console.log('📋 Function not found, using direct query');
        const result = await supabase
          .from('posts')
          .select('id, user_id, content, platform, image_url, scheduled_at, updated_at')
          .eq('status', 'ready_for_posting')
          .order('scheduled_at', { ascending: true });
        readyPosts = result.data;
        readyError = result.error;
      }

      if (!readyError && readyPosts) {
        setPosts(readyPosts);
      }

      // Get processor stats
      const stats = await SocialPostingProcessor.getStats();
      if (stats) {
        setStats(stats);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const updateProcessorStatus = () => {
    const status = SocialPostingProcessor.getStatus();
    setProcessorStatus(status);
  };

  const startProcessor = () => {
    SocialPostingProcessor.start();
    updateProcessorStatus();
    toast({
      title: "🚀 Processor Started",
      description: "Social posting processor is now running (checks every 10 seconds)",
    });
  };

  const stopProcessor = () => {
    SocialPostingProcessor.stop();
    updateProcessorStatus();
    toast({
      title: "⏹️ Processor Stopped",
      description: "Social posting processor has been stopped",
    });
  };

  const triggerProcessing = async () => {
    setIsLoading(true);
    try {
      await SocialPostingProcessor.triggerProcessing();
      toast({
        title: "🧪 Processing Triggered",
        description: "Manual processing has been triggered",
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "❌ Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectPost = async (post: any) => {
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
          content: post.content + ` (Manual test at ${new Date().toLocaleTimeString()})`,
          platforms: [post.platform]
        })
      });

      const responseData = await response.json();
      
      if (response.ok && responseData.success) {
        // Mark as posted in database
        try {
          await supabase.rpc('mark_post_as_posted', {
            p_post_id: post.id,
            p_success: true,
            p_platform_response: 'Manual test post successful',
            p_post_url: null
          });
        } catch (funcError) {
          // Fallback to direct update if function doesn't exist
          await supabase
            .from('posts')
            .update({
              status: 'published',
              published_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id);
        }

        toast({
          title: `✅ ${post.platform} Success`,
          description: "Post was successfully published!",
        });
      } else {
        toast({
          title: `❌ ${post.platform} Failed`,
          description: responseData.error || 'Unknown error',
          variant: "destructive"
        });
      }
      
      await loadData();
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const runCronManually = async () => {
    try {
      // Try to run the cron function
      const { error } = await supabase.rpc('process_scheduled_posts');
      if (error) {
        throw error;
      }

      toast({
        title: "✅ Cron Triggered",
        description: "Manual cron execution completed",
      });

      await loadData();
    } catch (error: any) {
      // If function doesn't exist, do manual processing
      if (error.message.includes('Could not find the function')) {
        try {
          // Manual cron simulation
          const { data: scheduledPosts, error: queryError } = await supabase
            .from('posts')
            .select('*')
            .eq('status', 'scheduled')
            .lte('scheduled_at', new Date().toISOString())
            .limit(10);

          if (queryError) throw queryError;

          let processedCount = 0;
          for (const post of scheduledPosts || []) {
            const { error: updateError } = await supabase
              .from('posts')
              .update({
                status: 'ready_for_posting',
                updated_at: new Date().toISOString()
              })
              .eq('id', post.id);

            if (!updateError) processedCount++;
          }

          toast({
            title: "✅ Manual Cron Completed",
            description: `Marked ${processedCount} posts as ready for posting`,
          });

          await loadData();
        } catch (manualError: any) {
          toast({
            title: "❌ Manual Cron Failed",
            description: manualError.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "❌ Cron Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🔧 Social Posting Fix & Monitor
        </h1>
        <p className="text-gray-600">
          Complete solution for social media posting issues
        </p>
      </div>

      {/* Processor Status */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Processor Status</h3>
          <div className="flex gap-2">
            <Button onClick={startProcessor} size="sm" disabled={processorStatus?.isRunning}>
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
            <Button onClick={stopProcessor} size="sm" variant="outline" disabled={!processorStatus?.isRunning}>
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
            <Button onClick={triggerProcessing} size="sm" variant="outline" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Process Now
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <Badge className={processorStatus?.isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {processorStatus?.isRunning ? (
                <><CheckCircle className="h-3 w-3 mr-1" />Running</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" />Stopped</>
              )}
            </Badge>
            <div className="text-xs text-gray-600 mt-1">Processor</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {stats?.readyForProcessing || 0}
            </div>
            <div className="text-xs text-gray-600">Ready Posts</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {stats?.statusCounts?.published || 0}
            </div>
            <div className="text-xs text-gray-600">Published</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {stats?.statusCounts?.failed || 0}
            </div>
            <div className="text-xs text-gray-600">Failed</div>
          </div>
        </div>
      </Card>

      {/* Manual Actions */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Manual Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={runCronManually} variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Run Cron Manually
          </Button>
          <Button onClick={() => window.open('/quick-social-test', '_blank')} variant="outline">
            Test Social APIs
          </Button>
          <Button onClick={() => window.open('/social-diagnostic', '_blank')} variant="outline">
            Check Connections
          </Button>
        </div>
      </Card>

      {/* Posts Ready for Processing */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Posts Ready for Processing ({posts.length})
        </h3>
        
        {posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No posts ready for processing. 
            <br />
            <Button onClick={() => window.open('/test-scheduling', '_blank')} variant="link">
              Create a test post
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        {post.platform}
                      </Badge>
                      <Badge className="bg-orange-100 text-orange-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Ready for Posting
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-900 mb-2">
                      {post.content.substring(0, 150)}
                      {post.content.length > 150 && '...'}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      <div>Scheduled: {new Date(post.scheduled_at).toLocaleString()}</div>
                      <div>Updated: {new Date(post.updated_at).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Button 
                      onClick={() => testDirectPost(post)} 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Post Now
                    </Button>
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
          🔧 How to Fix Social Media Posting
        </h3>
        <div className="text-sm text-blue-700 space-y-2">
          <div><strong>1. Start Processor:</strong> Click "Start" to begin automatic processing</div>
          <div><strong>2. Check Connections:</strong> Use "Check Connections" to verify social media accounts</div>
          <div><strong>3. Test APIs:</strong> Use "Test Social APIs" to verify posting works</div>
          <div><strong>4. Manual Post:</strong> Click "Post Now" on any ready post to test immediately</div>
          <div><strong>5. Run Cron:</strong> Use "Run Cron Manually" to trigger the database cron job</div>
        </div>
      </Card>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const TwitterPostProcessor: React.FC = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoProcess, setAutoProcess] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const processScheduledPosts = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      console.log('🔄 [TwitterProcessor] Processing scheduled posts...');

      // Get posts ready for processing
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'scheduled')
        .eq('platform', 'twitter')
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5);

      if (postsError) {
        throw new Error(`Failed to get posts: ${postsError.message}`);
      }

      if (!posts || posts.length === 0) {
        console.log('📭 [TwitterProcessor] No posts ready for processing');
        setResults({
          type: 'no_posts',
          message: 'No Twitter posts ready for processing',
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log(`📬 [TwitterProcessor] Found ${posts.length} posts to process`);

      // Get session for API calls
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No active session for API calls');
      }

      const processedPosts = [];
      const failedPosts = [];

      // Process each post
      for (const post of posts) {
        try {
          console.log(`📤 [TwitterProcessor] Processing post ${post.id}: ${post.content.substring(0, 50)}...`);

          // Mark as processing
          await supabase
            .from('posts')
            .update({
              status: 'processing',
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id);

          // Call the post-to-social API
          const response = await fetch('https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-social', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              content: post.content,
              platforms: ['twitter'],
              image: post.image_url || undefined
            })
          });

          const responseData = await response.json();

          if (response.ok && responseData.success) {
            // Mark as published
            await supabase
              .from('posts')
              .update({
                status: 'published',
                published_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                platform_post_ids: responseData.platform_post_ids || {}
              })
              .eq('id', post.id);

            processedPosts.push({
              id: post.id,
              content: post.content.substring(0, 50) + '...',
              status: 'published'
            });

            console.log(`✅ [TwitterProcessor] Successfully posted ${post.id}`);

          } else {
            // Mark as failed
            await supabase
              .from('posts')
              .update({
                status: 'failed',
                error_message: responseData.error || 'Unknown error',
                updated_at: new Date().toISOString()
              })
              .eq('id', post.id);

            failedPosts.push({
              id: post.id,
              content: post.content.substring(0, 50) + '...',
              error: responseData.error || 'Unknown error'
            });

            console.error(`❌ [TwitterProcessor] Failed to post ${post.id}:`, responseData.error);
          }

          // Small delay between posts
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: any) {
          console.error(`❌ [TwitterProcessor] Exception processing ${post.id}:`, error);

          // Mark as failed
          await supabase
            .from('posts')
            .update({
              status: 'failed',
              error_message: error.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', post.id);

          failedPosts.push({
            id: post.id,
            content: post.content.substring(0, 50) + '...',
            error: error.message
          });
        }
      }

      setResults({
        type: 'processing_complete',
        processed: processedPosts,
        failed: failedPosts,
        total: posts.length,
        timestamp: new Date().toISOString()
      });

      if (processedPosts.length > 0) {
        toast({
          title: "✅ Posts Processed!",
          description: `Successfully posted ${processedPosts.length} Twitter posts`,
        });
      }

      if (failedPosts.length > 0) {
        toast({
          title: "⚠️ Some Posts Failed",
          description: `${failedPosts.length} posts failed to post`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('❌ [TwitterProcessor] Processing error:', error);
      setResults({
        type: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "❌ Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startAutoProcessing = () => {
    if (intervalId) return;

    setAutoProcess(true);
    
    // Process immediately
    processScheduledPosts();
    
    // Then process every 30 seconds
    const id = setInterval(() => {
      processScheduledPosts();
    }, 30000);
    
    setIntervalId(id);

    toast({
      title: "🔄 Auto-Processing Started",
      description: "Will check for scheduled posts every 30 seconds",
    });
  };

  const stopAutoProcessing = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setAutoProcess(false);

    toast({
      title: "⏹️ Auto-Processing Stopped",
      description: "Stopped checking for scheduled posts",
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🐦 Twitter Post Processor</CardTitle>
          <CardDescription>
            Manually process scheduled Twitter posts (temporary solution until cron job is fixed)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={processScheduledPosts}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? 'Processing...' : '🔄 Process Now'}
            </Button>

            {!autoProcess ? (
              <Button
                onClick={startAutoProcessing}
                disabled={isProcessing}
                variant="outline"
                className="w-full"
              >
                ▶️ Start Auto-Processing
              </Button>
            ) : (
              <Button
                onClick={stopAutoProcessing}
                variant="outline"
                className="w-full"
              >
                ⏹️ Stop Auto-Processing
              </Button>
            )}

            <Button
              onClick={() => window.location.href = '/database-checker'}
              variant="outline"
              className="w-full"
            >
              📊 Check Database
            </Button>
          </div>

          <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800">⚠️ Temporary Solution</h4>
            <p className="mt-2">
              This is a temporary frontend-based processor while we fix the cron job. 
              It will process scheduled Twitter posts and actually post them to Twitter.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Manual:</strong> Click "Process Now" to check for ready posts</li>
              <li><strong>Auto:</strong> Click "Start Auto-Processing" to check every 30 seconds</li>
              <li><strong>Status:</strong> Posts will be marked as 'published' or 'failed'</li>
            </ul>
          </div>

          {autoProcess && (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-800 font-semibold">🔄 Auto-Processing Active</div>
              <div className="text-green-600 text-sm">Checking for scheduled posts every 30 seconds</div>
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Processing Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm overflow-auto whitespace-pre-wrap">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

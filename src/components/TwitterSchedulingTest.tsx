import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const TwitterSchedulingTest: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastScheduledPost, setLastScheduledPost] = useState<any>(null);

  // Function to save post to database (same as CreatePostMinimal)
  const savePostToDatabase = async (
    content: string,
    platforms: string[],
    status: 'draft' | 'scheduled' | 'published' | 'failed',
    image?: string,
    scheduledFor?: string,
    platformPostIds?: Record<string, string>,
    errorMessage?: string,
    generatedByAI?: boolean,
    aiPrompt?: string
  ) => {
    console.log('💾 [savePostToDatabase] Starting save with params:', {
      content: content?.substring(0, 50) + '...',
      platforms,
      status,
      image,
      userId: user?.id,
      generatedByAI,
      aiPrompt
    });

    if (!user?.id) {
      console.error('❌ [savePostToDatabase] No user ID found');
      return null;
    }

    try {
      const postData = {
        user_id: user.id,
        content,
        platform: platforms[0] || 'instagram',
        status,
        image_url: image,
        scheduled_at: scheduledFor,
        published_at: status === 'published' ? new Date().toISOString() : null,
        platform_post_ids: platformPostIds || {},
        engagement_stats: {},
        generated_by_ai: generatedByAI || false,
        ai_prompt: aiPrompt,
        error_message: errorMessage,
        retry_count: 0
      };

      console.log('💾 [savePostToDatabase] Inserting data:', postData);

      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();

      if (error) {
        console.error('❌ [savePostToDatabase] Database error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          postData
        });
        return null;
      }

      console.log('✅ [savePostToDatabase] Successfully saved post:', data);
      return data;
    } catch (error) {
      console.error('❌ [savePostToDatabase] Exception:', error);
      return null;
    }
  };

  const testTwitterScheduling = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 [TwitterTest] Starting Twitter scheduling test...');

      // Schedule a test post for 2 minutes from now
      const scheduledDateTime = new Date(Date.now() + 2 * 60 * 1000);
      const testContent = `🧪 Twitter scheduling test created at ${new Date().toLocaleString()}. This should be processed by the cron job!`;

      console.log('📅 [TwitterTest] Scheduling for:', scheduledDateTime.toISOString());

      // FIXED: Save directly to posts table with 'scheduled' status
      const savedPost = await savePostToDatabase(
        testContent,
        ['twitter'],
        'scheduled', // ✅ This will be picked up by the cron job
        undefined, // no image
        scheduledDateTime.toISOString(), // scheduledFor
        {}, // platformPostIds
        undefined, // errorMessage
        false, // generatedByAI
        'Twitter scheduling test' // aiPrompt
      );

      if (!savedPost) {
        throw new Error('Failed to schedule Twitter test post');
      }

      setLastScheduledPost(savedPost);

      console.log('✅ [TwitterTest] Post scheduled successfully:', savedPost.id);

      toast({
        title: "✅ Twitter Test Post Scheduled!",
        description: `Test post scheduled for ${scheduledDateTime.toLocaleString()}. Check the database!`,
      });

    } catch (error: any) {
      console.error('❌ [TwitterTest] Error:', error);
      toast({
        title: "❌ Test Failed",
        description: error.message || "Failed to schedule Twitter test post",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkDatabase = async () => {
    try {
      console.log('🔍 [TwitterTest] Checking database for scheduled Twitter posts...');

      const { data: scheduledPosts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('platform', 'twitter')
        .eq('status', 'scheduled')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ [TwitterTest] Database error:', error);
        toast({
          title: "❌ Database Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      console.log('📊 [TwitterTest] Scheduled Twitter posts:', scheduledPosts);

      toast({
        title: "📊 Database Check Complete",
        description: `Found ${scheduledPosts?.length || 0} scheduled Twitter posts. Check console for details.`,
      });

    } catch (error: any) {
      console.error('❌ [TwitterTest] Error checking database:', error);
      toast({
        title: "❌ Check Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Twitter Scheduling Test</CardTitle>
        <CardDescription>
          Test the fixed Twitter scheduling functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={testTwitterScheduling}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Scheduling...' : '🐦 Schedule Twitter Test Post'}
          </Button>

          <Button
            onClick={checkDatabase}
            variant="outline"
            className="w-full"
          >
            🔍 Check Database
          </Button>
        </div>

        {lastScheduledPost && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800">✅ Last Scheduled Post:</h4>
            <div className="text-sm text-green-700 mt-2">
              <p><strong>ID:</strong> {lastScheduledPost.id}</p>
              <p><strong>Content:</strong> {lastScheduledPost.content.substring(0, 100)}...</p>
              <p><strong>Platform:</strong> {lastScheduledPost.platform}</p>
              <p><strong>Status:</strong> {lastScheduledPost.status}</p>
              <p><strong>Scheduled for:</strong> {new Date(lastScheduledPost.scheduled_at).toLocaleString()}</p>
              <p><strong>Created:</strong> {new Date(lastScheduledPost.created_at).toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800">🔧 How This Test Works:</h4>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Creates a Twitter post scheduled for 2 minutes from now</li>
            <li>Saves it to the <code>posts</code> table with status <code>'scheduled'</code></li>
            <li>The cron job should pick it up and post it to Twitter</li>
            <li>Use "Check Database" to verify the post was saved correctly</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

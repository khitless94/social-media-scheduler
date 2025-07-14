// Fixed frontend integration that bypasses RLS issues
// Replace your existing scheduling logic with this

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// n8n webhook URL
const N8N_WEBHOOK_URL = 'https://k94.app.n8n.cloud/webhook/schedule-post';

// Platform type definition
export type Platform = 'twitter' | 'reddit' | 'linkedin' | 'facebook' | 'instagram';

interface SchedulePostData {
  content: string;
  platforms: Platform[];
  scheduled_for: string; // ISO timestamp
  media_urls?: string[];
}

interface WebhookScheduleResponse {
  success: boolean;
  message: string;
  post_id: string;
  error?: string;
}

export const useFixedWebhookScheduler = () => {
  const [isScheduling, setIsScheduling] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const schedulePost = async (postData: SchedulePostData): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to schedule posts",
        variant: "destructive"
      });
      return false;
    }

    setIsScheduling(true);

    try {
      console.log('🚀 Starting post scheduling for user:', user.id);
      console.log('📝 Post data:', postData);

      // Step 1: Use the RLS bypass function to create the post
      const { data: functionResult, error: functionError } = await supabase
        .rpc('create_scheduled_post_bypass_rls', {
          p_user_id: user.id,
          p_content: postData.content,
          p_platforms: postData.platforms,
          p_scheduled_for: postData.scheduled_for,
          p_media_urls: postData.media_urls || []
        });

      if (functionError) {
        console.error('❌ RLS bypass function error:', functionError);
        toast({
          title: "Database error",
          description: "Failed to save post to database",
          variant: "destructive"
        });
        return false;
      }

      if (!functionResult.success) {
        console.error('❌ Function returned error:', functionResult.error);
        toast({
          title: "Database error", 
          description: functionResult.error,
          variant: "destructive"
        });
        return false;
      }

      console.log('✅ Post saved to database:', functionResult);

      // Step 2: Trigger n8n webhook immediately
      const webhookPayload = {
        post_id: functionResult.post_id,
        user_id: user.id,
        content: postData.content,
        platforms: postData.platforms,
        scheduled_for: postData.scheduled_for,
        media_urls: postData.media_urls || [],
        action: 'schedule_post'
      };

      console.log('🚀 Triggering n8n webhook:', webhookPayload);

      const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
        },
        body: JSON.stringify(webhookPayload)
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('❌ Webhook error:', errorText);
        
        // Update post status to failed using RPC function
        await supabase.rpc('update_post_status', {
          target_post_id: functionResult.post_id,
          new_status: 'failed',
          new_scheduling_status: 'failed'
        });

        toast({
          title: "Scheduling failed",
          description: `Failed to trigger scheduling: ${errorText}`,
          variant: "destructive"
        });
        return false;
      }

      const webhookResult: WebhookScheduleResponse = await webhookResponse.json();
      console.log('📡 Webhook response:', webhookResult);
      
      if (webhookResult.success) {
        toast({
          title: "Post scheduled successfully! 🎉",
          description: `Your post will be published to ${postData.platforms.join(', ')} at the scheduled time.`,
        });
        return true;
      } else {
        console.error('❌ Webhook returned error:', webhookResult.error);
        toast({
          title: "Scheduling failed",
          description: webhookResult.error || "Unknown error occurred",
          variant: "destructive"
        });
        return false;
      }

    } catch (error) {
      console.error('💥 Scheduling error:', error);
      toast({
        title: "Scheduling failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsScheduling(false);
    }
  };

  return {
    schedulePost,
    isScheduling
  };
};

// Test component to verify the fix
export const FixedSchedulingTest = () => {
  const { schedulePost, isScheduling } = useFixedWebhookScheduler();
  const [content, setContent] = useState('Test post with RLS fix');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['twitter']);
  const [scheduledTime, setScheduledTime] = useState('');

  // Set default time to 5 minutes from now
  React.useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    setScheduledTime(now.toISOString().slice(0, 16));
  }, []);

  const handleSchedulePost = async () => {
    if (!content.trim() || !scheduledTime) {
      return;
    }

    const success = await schedulePost({
      content,
      platforms: selectedPlatforms,
      scheduled_for: new Date(scheduledTime).toISOString(),
      media_urls: []
    });

    if (success) {
      // Reset form
      setContent('Test post with RLS fix');
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      setScheduledTime(now.toISOString().slice(0, 16));
    }
  };

  const handlePlatformChange = (platform: Platform, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    } else {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">🔧 RLS Fix Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Content:</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Platforms:</label>
          <div className="flex flex-wrap gap-2">
            {(['twitter', 'reddit', 'linkedin', 'facebook', 'instagram'] as Platform[]).map((platform) => (
              <label key={platform} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(platform)}
                  onChange={(e) => handlePlatformChange(platform, e.target.checked)}
                />
                {platform}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Scheduled Time:</label>
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full p-2 border rounded"
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <button
          onClick={handleSchedulePost}
          disabled={isScheduling || !content.trim() || !scheduledTime}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isScheduling ? '⏳ Scheduling...' : '🚀 Test Schedule Post'}
        </button>
      </div>
    </div>
  );
};

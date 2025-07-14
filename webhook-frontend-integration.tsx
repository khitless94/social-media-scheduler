// Frontend integration for webhook-based n8n scheduling
// Add this to your existing scheduling component

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

export const useWebhookScheduler = () => {
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
      // Step 1: Save post to database first
      const { data: savedPost, error: dbError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: postData.content,
          platform: postData.platforms[0] || 'twitter', // Primary platform
          platforms: postData.platforms,
          media_urls: postData.media_urls || [],
          status: 'scheduled',
          scheduling_status: 'scheduled',
          scheduled_for: postData.scheduled_for
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        toast({
          title: "Database error",
          description: "Failed to save post to database",
          variant: "destructive"
        });
        return false;
      }

      // Step 2: Trigger n8n webhook immediately
      const webhookPayload = {
        post_id: savedPost.id,
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
          'X-User-ID': user.id, // Additional security header
        },
        body: JSON.stringify(webhookPayload)
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('Webhook error:', errorText);
        
        // Update post status to failed
        await supabase
          .from('posts')
          .update({ 
            status: 'failed', 
            scheduling_status: 'failed' 
          })
          .eq('id', savedPost.id);

        toast({
          title: "Scheduling failed",
          description: `Failed to trigger scheduling: ${errorText}`,
          variant: "destructive"
        });
        return false;
      }

      const webhookResult: WebhookScheduleResponse = await webhookResponse.json();
      
      if (webhookResult.success) {
        toast({
          title: "Post scheduled successfully!",
          description: `Your post will be published to ${postData.platforms.join(', ')} at the scheduled time.`,
        });
        return true;
      } else {
        console.error('Webhook returned error:', webhookResult.error);
        toast({
          title: "Scheduling failed",
          description: webhookResult.error || "Unknown error occurred",
          variant: "destructive"
        });
        return false;
      }

    } catch (error) {
      console.error('Scheduling error:', error);
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

// Example usage in your scheduling component
export const SchedulingComponent = () => {
  const { schedulePost, isScheduling } = useWebhookScheduler();
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['twitter']);
  const [scheduledTime, setScheduledTime] = useState('');

  const handleSchedulePost = async () => {
    if (!content.trim()) {
      return;
    }

    if (!scheduledTime) {
      return;
    }

    const success = await schedulePost({
      content,
      platforms: selectedPlatforms,
      scheduled_for: new Date(scheduledTime).toISOString(),
      media_urls: [] // Add media URLs if needed
    });

    if (success) {
      // Reset form
      setContent('');
      setScheduledTime('');
      setSelectedPlatforms(['twitter']);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full p-3 border rounded-lg"
        rows={4}
      />
      
      <div className="flex gap-2">
        {(['twitter', 'reddit', 'linkedin', 'facebook', 'instagram'] as Platform[]).map((platform) => (
          <label key={platform} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedPlatforms.includes(platform)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedPlatforms([...selectedPlatforms, platform]);
                } else {
                  setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                }
              }}
            />
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </label>
        ))}
      </div>

      <input
        type="datetime-local"
        value={scheduledTime}
        onChange={(e) => setScheduledTime(e.target.value)}
        className="w-full p-2 border rounded"
        min={new Date().toISOString().slice(0, 16)}
      />

      <button
        onClick={handleSchedulePost}
        disabled={isScheduling || !content.trim() || !scheduledTime}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isScheduling ? 'Scheduling...' : 'Schedule Post'}
      </button>
    </div>
  );
};

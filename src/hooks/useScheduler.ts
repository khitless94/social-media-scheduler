import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CronPollingService } from '@/services/cronPollingService';

// Platform type definition
export type Platform = 'twitter' | 'reddit' | 'linkedin' | 'facebook' | 'instagram';

interface SchedulePostData {
  content: string;
  platforms: Platform[];
  scheduled_for: string; // ISO timestamp
  media_urls?: string[];
  title?: string; // For Reddit
}

/**
 * This hook is a drop-in replacement for the webhook-based scheduler
 * It maintains the same API but uses the cron polling approach under the hood
 */
export const useScheduler = () => {
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

      // For each platform, create a separate scheduled post
      const scheduledTime = new Date(postData.scheduled_for);
      
      // Track success for each platform
      const results = await Promise.all(
        postData.platforms.map(async (platform) => {
          try {
            // Determine if this is a Reddit post that needs a title
            const title = platform === 'reddit' 
              ? (postData.title || postData.content.substring(0, 100)) 
              : undefined;
            
            // Create the scheduled post in the database
            const result = await CronPollingService.createScheduledPost({
              content: postData.content,
              platform,
              scheduled_time: scheduledTime,
              title,
              image_url: postData.media_urls && postData.media_urls.length > 0 
                ? postData.media_urls[0] 
                : undefined,
              user_id: user.id
            });

            return { platform, success: !!result, post_id: result?.id };
          } catch (error) {
            console.error(`❌ Error scheduling for ${platform}:`, error);
            return { platform, success: false, error };
          }
        })
      );

      // Check if all platforms were scheduled successfully
      const allSuccessful = results.every(r => r.success);
      const successCount = results.filter(r => r.success).length;
      
      if (allSuccessful) {
        toast({
          title: "Posts scheduled successfully!",
          description: `Your posts will be published at ${new Date(postData.scheduled_for).toLocaleString()}`,
        });
        return true;
      } else if (successCount > 0) {
        // Some platforms succeeded
        toast({
          title: "Some posts scheduled",
          description: `${successCount} out of ${postData.platforms.length} platforms were scheduled successfully.`,
          variant: "default"
        });
        return true;
      } else {
        // All platforms failed
        toast({
          title: "Scheduling failed",
          description: "Failed to schedule posts for any platform.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Error in schedulePost:', error);
      toast({
        title: "Scheduling failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
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

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CronPollingService, SchedulePostData, ScheduledPost, Platform } from '@/services/cronPollingService';

interface SchedulePostRequest {
  content: string;
  platform: Platform;
  scheduled_time: Date;
  title?: string; // For Reddit posts
  image_url?: string;
}

export const useCronPollingScheduler = () => {
  const [isScheduling, setIsScheduling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  /**
   * Schedule a new post
   */
  const schedulePost = useCallback(async (postData: SchedulePostRequest): Promise<ScheduledPost | null> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to schedule posts",
        variant: "destructive"
      });
      return null;
    }

    setIsScheduling(true);

    try {
      console.log('🚀 Scheduling post:', {
        content: postData.content.substring(0, 50) + '...',
        platform: postData.platform,
        scheduled_time: postData.scheduled_time,
        user_id: user.id
      });

      const scheduledPost = await CronPollingService.createScheduledPost({
        ...postData,
        user_id: user.id
      });

      if (scheduledPost) {
        toast({
          title: "Post scheduled successfully!",
          description: `Your ${postData.platform} post will be published at ${postData.scheduled_time.toLocaleString()}`,
        });

        // Update local state
        setScheduledPosts(prev => [...prev, scheduledPost]);
      }

      return scheduledPost;
    } catch (error) {
      console.error('❌ Error scheduling post:', error);
      toast({
        title: "Failed to schedule post",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsScheduling(false);
    }
  }, [user, toast]);

  /**
   * Load all scheduled posts for the current user
   */
  const loadScheduledPosts = useCallback(async (): Promise<void> => {
    if (!user) return;

    setIsLoading(true);
    try {
      const posts = await CronPollingService.getScheduledPosts();
      setScheduledPosts(posts);
    } catch (error) {
      console.error('❌ Error loading scheduled posts:', error);
      toast({
        title: "Failed to load scheduled posts",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  /**
   * Load only pending (not yet posted) scheduled posts
   */
  const loadPendingPosts = useCallback(async (): Promise<void> => {
    if (!user) return;

    setIsLoading(true);
    try {
      const posts = await CronPollingService.getPendingPosts();
      setScheduledPosts(posts);
    } catch (error) {
      console.error('❌ Error loading pending posts:', error);
      toast({
        title: "Failed to load pending posts",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  /**
   * Cancel a scheduled post
   */
  const cancelPost = useCallback(async (postId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = await CronPollingService.cancelScheduledPost(postId);
      
      if (success) {
        toast({
          title: "Post cancelled",
          description: "The scheduled post has been cancelled successfully",
        });

        // Remove from local state
        setScheduledPosts(prev => prev.filter(post => post.id !== postId));
      }

      return success;
    } catch (error) {
      console.error('❌ Error cancelling post:', error);
      toast({
        title: "Failed to cancel post",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  }, [user, toast]);

  /**
   * Update a scheduled post
   */
  const updatePost = useCallback(async (postId: string, updates: Partial<SchedulePostRequest>): Promise<ScheduledPost | null> => {
    if (!user) return null;

    try {
      const updatedPost = await CronPollingService.updateScheduledPost(postId, updates);
      
      if (updatedPost) {
        toast({
          title: "Post updated",
          description: "The scheduled post has been updated successfully",
        });

        // Update local state
        setScheduledPosts(prev => 
          prev.map(post => post.id === postId ? updatedPost : post)
        );
      }

      return updatedPost;
    } catch (error) {
      console.error('❌ Error updating post:', error);
      toast({
        title: "Failed to update post",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast]);

  return {
    // State
    isScheduling,
    isLoading,
    scheduledPosts,
    
    // Actions
    schedulePost,
    loadScheduledPosts,
    loadPendingPosts,
    cancelPost,
    updatePost,
  };
};

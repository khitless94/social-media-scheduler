import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { ScheduledPostService, ScheduledPost, SchedulePostData } from '@/services/scheduledPostService';
import { useToast } from './use-toast';

export interface UseScheduledPostsReturn {
  scheduledPosts: ScheduledPost[];
  upcomingPosts: ScheduledPost[];
  queueStatus: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  loading: boolean;
  error: string | null;
  createScheduledPost: (data: Omit<SchedulePostData, 'user_id'>) => Promise<ScheduledPost | null>;
  updateScheduledPost: (postId: string, updates: Partial<SchedulePostData>) => Promise<ScheduledPost | null>;
  cancelScheduledPost: (postId: string) => Promise<void>;
  deleteScheduledPost: (postId: string) => Promise<void>;
  retryFailedPost: (postId: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
}

export const useScheduledPosts = (): UseScheduledPostsReturn => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [upcomingPosts, setUpcomingPosts] = useState<ScheduledPost[]>([]);
  const [queueStatus, setQueueStatus] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScheduledPosts = useCallback(async () => {
    // Don't fetch if auth is still loading or user is not available
    if (authLoading || !user?.id) {
      console.log('📅 [useScheduledPosts] Skipping fetch - auth loading or no user:', { authLoading, userId: user?.id });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📅 [useScheduledPosts] Fetching posts for user:', user.id);
      const [posts, upcoming, status] = await Promise.all([
        ScheduledPostService.getUserScheduledPosts(user.id),
        ScheduledPostService.getUpcomingPosts(user.id),
        ScheduledPostService.getQueueStatus(user.id)
      ]);

      setScheduledPosts(posts);
      setUpcomingPosts(upcoming);
      setQueueStatus(status);
      console.log('✅ [useScheduledPosts] Fetched posts successfully:', { postsCount: posts.length, upcomingCount: upcoming.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch scheduled posts';
      setError(errorMessage);
      console.error('❌ [useScheduledPosts] Error fetching scheduled posts:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, authLoading]);

  const createScheduledPost = useCallback(async (
    data: Omit<SchedulePostData, 'user_id'>
  ): Promise<ScheduledPost | null> => {
    if (!user?.id) {
      console.error('❌ [useScheduledPosts] No user ID available for scheduling');
      toast({
        title: "Authentication Error",
        description: "You must be logged in to schedule posts",
        variant: "destructive",
      });
      return null;
    }

    // Validate scheduled time
    const validation = ScheduledPostService.validateScheduledTime(data.scheduled_for);
    if (!validation.valid) {
      toast({
        title: "Invalid Schedule Time",
        description: validation.error,
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);
      console.log('📅 [useScheduledPosts] Creating scheduled post for user:', user.id);

      const post = await ScheduledPostService.createScheduledPost({
        ...data,
        user_id: user.id
      });

      if (post) {
        // Don't show toast here - let the component handle success/error messages
        console.log('✅ [useScheduledPosts] Post scheduled successfully:', post.id);

        // Refresh the posts list
        await fetchScheduledPosts();

        return post;
      } else {
        console.error('❌ [useScheduledPosts] No post returned from service');
        throw new Error('Failed to create scheduled post - no data returned');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule post';
      setError(errorMessage);
      console.error('❌ [useScheduledPosts] Scheduling failed:', errorMessage);

      // Throw the error so the component can handle it
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast, fetchScheduledPosts]);

  const updateScheduledPost = useCallback(async (
    postId: string,
    updates: Partial<SchedulePostData>
  ): Promise<ScheduledPost | null> => {
    try {
      setLoading(true);
      
      // Validate scheduled time if it's being updated
      if (updates.scheduled_for) {
        const validation = ScheduledPostService.validateScheduledTime(updates.scheduled_for);
        if (!validation.valid) {
          toast({
            title: "Invalid Schedule Time",
            description: validation.error,
            variant: "destructive",
          });
          return null;
        }
      }

      const post = await ScheduledPostService.updateScheduledPost(postId, updates);

      toast({
        title: "Post Updated!",
        description: "Your scheduled post has been updated successfully",
      });

      // Refresh the posts list
      await fetchScheduledPosts();
      
      return post;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update post';
      setError(errorMessage);
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchScheduledPosts]);

  const cancelScheduledPost = useCallback(async (postId: string): Promise<void> => {
    try {
      setLoading(true);
      await ScheduledPostService.cancelScheduledPost(postId);

      toast({
        title: "Post Cancelled",
        description: "Your scheduled post has been cancelled",
      });

      // Refresh the posts list
      await fetchScheduledPosts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel post';
      setError(errorMessage);
      toast({
        title: "Cancellation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchScheduledPosts]);

  const deleteScheduledPost = useCallback(async (postId: string): Promise<void> => {
    try {
      setLoading(true);
      await ScheduledPostService.deleteScheduledPost(postId);

      toast({
        title: "Post Deleted",
        description: "Your scheduled post has been deleted",
      });

      // Refresh the posts list
      await fetchScheduledPosts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete post';
      setError(errorMessage);
      toast({
        title: "Deletion Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchScheduledPosts]);

  const retryFailedPost = useCallback(async (postId: string): Promise<void> => {
    try {
      setLoading(true);
      await ScheduledPostService.retryFailedPost(postId);

      toast({
        title: "Post Queued for Retry",
        description: "Your failed post has been queued for retry",
      });

      // Refresh the posts list
      await fetchScheduledPosts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry post';
      setError(errorMessage);
      toast({
        title: "Retry Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchScheduledPosts]);

  const refreshPosts = useCallback(async (): Promise<void> => {
    await fetchScheduledPosts();
  }, [fetchScheduledPosts]);

  // Fetch posts on mount and when user changes (but wait for auth to be ready)
  useEffect(() => {
    if (!authLoading) {
      fetchScheduledPosts();
    }
  }, [fetchScheduledPosts, authLoading]);

  // Auto-refresh every 30 seconds to keep status updated
  useEffect(() => {
    if (authLoading) return;

    const interval = setInterval(() => {
      if (user?.id) {
        fetchScheduledPosts();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id, fetchScheduledPosts, authLoading]);

  return {
    scheduledPosts,
    upcomingPosts,
    queueStatus,
    loading,
    error,
    createScheduledPost,
    updateScheduledPost,
    cancelScheduledPost,
    deleteScheduledPost,
    retryFailedPost,
    refreshPosts
  };
};

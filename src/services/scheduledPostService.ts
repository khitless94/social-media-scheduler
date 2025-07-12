import { supabase } from '@/integrations/supabase/client';

export interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  media_urls?: string[];
  scheduled_for: string;
  scheduling_status: 'draft' | 'scheduled' | 'processing' | 'published' | 'failed' | 'cancelled';
  user_id: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  error_message?: string;
  n8n_execution_id?: string;
  platform_post_ids?: Record<string, string>;
}

export interface SchedulePostData {
  content: string;
  platforms: string[];
  media_urls?: string[];
  scheduled_for: Date;
  user_id: string;
}

export class ScheduledPostService {
  /**
   * Create a new scheduled post
   */
  static async createScheduledPost(data: SchedulePostData): Promise<ScheduledPost> {
    try {
      console.log('📅 Creating scheduled post...', data);

      const postData = {
        content: data.content,
        platforms: data.platforms,
        media_urls: data.media_urls || [],
        scheduled_for: data.scheduled_for.toISOString(),
        scheduling_status: 'scheduled' as const,
        status: 'scheduled',
        user_id: data.user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: post, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating scheduled post:', error);
        throw error;
      }

      console.log('✅ Scheduled post created successfully:', post);
      return post;
    } catch (error) {
      console.error('❌ Failed to create scheduled post:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled posts for a user
   */
  static async getUserScheduledPosts(userId: string): Promise<ScheduledPost[]> {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .in('scheduling_status', ['scheduled', 'processing', 'failed'])
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('❌ Error fetching scheduled posts:', error);
        throw error;
      }

      return posts || [];
    } catch (error) {
      console.error('❌ Failed to fetch scheduled posts:', error);
      throw error;
    }
  }

  /**
   * Update a scheduled post
   */
  static async updateScheduledPost(
    postId: string, 
    updates: Partial<SchedulePostData>
  ): Promise<ScheduledPost> {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (updates.scheduled_for) {
        updateData.scheduled_for = updates.scheduled_for.toISOString();
      }

      const { data: post, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating scheduled post:', error);
        throw error;
      }

      console.log('✅ Scheduled post updated successfully:', post);
      return post;
    } catch (error) {
      console.error('❌ Failed to update scheduled post:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled post
   */
  static async cancelScheduledPost(postId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          scheduling_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) {
        console.error('❌ Error cancelling scheduled post:', error);
        throw error;
      }

      console.log('✅ Scheduled post cancelled successfully');
    } catch (error) {
      console.error('❌ Failed to cancel scheduled post:', error);
      throw error;
    }
  }

  /**
   * Delete a scheduled post
   */
  static async deleteScheduledPost(postId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('❌ Error deleting scheduled post:', error);
        throw error;
      }

      console.log('✅ Scheduled post deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete scheduled post:', error);
      throw error;
    }
  }

  /**
   * Get scheduled posts queue status
   */
  static async getQueueStatus(userId: string): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('scheduling_status')
        .eq('user_id', userId)
        .in('scheduling_status', ['scheduled', 'processing', 'published', 'failed']);

      if (error) {
        console.error('❌ Error fetching queue status:', error);
        throw error;
      }

      const status = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };

      posts?.forEach(post => {
        switch (post.scheduling_status) {
          case 'scheduled':
            status.pending++;
            break;
          case 'processing':
            status.processing++;
            break;
          case 'published':
            status.completed++;
            break;
          case 'failed':
            status.failed++;
            break;
        }
      });

      return status;
    } catch (error) {
      console.error('❌ Failed to fetch queue status:', error);
      throw error;
    }
  }

  /**
   * Retry a failed scheduled post
   */
  static async retryFailedPost(postId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          scheduling_status: 'scheduled',
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) {
        console.error('❌ Error retrying failed post:', error);
        throw error;
      }

      console.log('✅ Failed post queued for retry');
    } catch (error) {
      console.error('❌ Failed to retry post:', error);
      throw error;
    }
  }

  /**
   * Get upcoming scheduled posts (next 24 hours)
   */
  static async getUpcomingPosts(userId: string): Promise<ScheduledPost[]> {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .eq('scheduling_status', 'scheduled')
        .gte('scheduled_for', now.toISOString())
        .lte('scheduled_for', tomorrow.toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('❌ Error fetching upcoming posts:', error);
        throw error;
      }

      return posts || [];
    } catch (error) {
      console.error('❌ Failed to fetch upcoming posts:', error);
      throw error;
    }
  }

  /**
   * Validate scheduled time (must be in the future)
   */
  static validateScheduledTime(scheduledFor: Date): { valid: boolean; error?: string } {
    const now = new Date();
    const minScheduleTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

    if (scheduledFor <= minScheduleTime) {
      return {
        valid: false,
        error: 'Scheduled time must be at least 5 minutes in the future'
      };
    }

    const maxScheduleTime = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    if (scheduledFor > maxScheduleTime) {
      return {
        valid: false,
        error: 'Scheduled time cannot be more than 1 year in the future'
      };
    }

    return { valid: true };
  }
}

export default ScheduledPostService;

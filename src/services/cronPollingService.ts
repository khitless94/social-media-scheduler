import { supabase } from '@/integrations/supabase/client';

// Platform type definition
export type Platform = 'twitter' | 'reddit' | 'linkedin' | 'facebook' | 'instagram';

export interface SchedulePostData {
  content: string;
  platform: Platform;
  scheduled_time: Date;
  title?: string; // For Reddit posts
  image_url?: string;
  user_id?: string; // Will be populated from the session if not provided
}

export interface ScheduledPost {
  id: string;
  user_id: string;
  platform: Platform;
  content: string;
  image_url?: string;
  title?: string;
  scheduled_time: string;
  posted: boolean;
  posted_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Service for working with the cron polling-based scheduled posts
 */
export class CronPollingService {
  /**
   * Create a new scheduled post
   */
  static async createScheduledPost(data: SchedulePostData): Promise<ScheduledPost | null> {
    try {
      console.log('📅 Creating scheduled post...', {
        content: data.content?.substring(0, 100) + '...',
        platform: data.platform,
        scheduled_time: data.scheduled_time,
        image_url: data.image_url ? '✓' : '✗',
        title: data.title
      });

      // Ensure we have a valid session for RLS
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ No valid session for database operation:', sessionError);
        throw new Error('Authentication required for scheduling posts');
      }

      // Use the user ID from the session if not provided
      const user_id = data.user_id || session.user.id;

      // Prepare the post data
      const postData = {
        user_id,
        platform: data.platform,
        content: data.content,
        image_url: data.image_url,
        title: data.title,
        scheduled_time: data.scheduled_time.toISOString(),
        posted: false
      };

      console.log('📤 Sending to database:', postData);

      // Insert the post into the scheduled_posts table
      const { data: post, error } = await supabase
        .from('scheduled_posts')
        .insert(postData)
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw new Error(`Failed to create scheduled post: ${error.message}`);
      }

      console.log('✅ Post scheduled successfully:', post);
      return post;
    } catch (error) {
      console.error('❌ Error in createScheduledPost:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled posts for the current user
   */
  static async getScheduledPosts(): Promise<ScheduledPost[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('scheduled_time', { ascending: true });

      if (error) {
        console.error('❌ Database error:', error);
        throw new Error(`Failed to fetch scheduled posts: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getScheduledPosts:', error);
      throw error;
    }
  }

  /**
   * Get pending (not yet posted) scheduled posts for the current user
   */
  static async getPendingPosts(): Promise<ScheduledPost[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('posted', false)
        .order('scheduled_time', { ascending: true });

      if (error) {
        console.error('❌ Database error:', error);
        throw new Error(`Failed to fetch pending posts: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in getPendingPosts:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled post
   */
  static async cancelScheduledPost(postId: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Delete the post (RLS will ensure users can only delete their own posts)
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', session.user.id)
        .eq('posted', false); // Only allow canceling posts that haven't been posted yet

      if (error) {
        console.error('❌ Database error:', error);
        throw new Error(`Failed to cancel scheduled post: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('❌ Error in cancelScheduledPost:', error);
      throw error;
    }
  }

  /**
   * Update a scheduled post
   */
  static async updateScheduledPost(postId: string, updates: Partial<SchedulePostData>): Promise<ScheduledPost | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Prepare the update data
      const updateData: any = {};
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.platform !== undefined) updateData.platform = updates.platform;
      if (updates.scheduled_time !== undefined) updateData.scheduled_time = updates.scheduled_time.toISOString();
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.image_url !== undefined) updateData.image_url = updates.image_url;

      // Update the post
      const { data, error } = await supabase
        .from('scheduled_posts')
        .update(updateData)
        .eq('id', postId)
        .eq('user_id', session.user.id)
        .eq('posted', false) // Only allow updating posts that haven't been posted yet
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw new Error(`Failed to update scheduled post: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error in updateScheduledPost:', error);
      throw error;
    }
  }
}

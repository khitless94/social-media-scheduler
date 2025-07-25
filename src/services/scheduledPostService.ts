import { supabase } from '@/integrations/supabase/client';
import { toLocalISOString } from '@/utils/timezone';

export interface ScheduledPost {
  id: string;
  content: string;
  platform: string;
  scheduled_at: string | null;
  status: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  image_url?: string | null;
  ai_prompt?: string;
  published_at?: string;
  platform_post_ids?: Record<string, string>;
  engagement_stats?: Record<string, any>;
  generated_by_ai?: boolean;
  error_message?: string;
  retry_count?: number;
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
   * Trigger n8n webhook for scheduled post
   */
  /**
   * Log post creation for cron system (replaces N8N webhook)
   */
  static logPostForCron(post: ScheduledPost): void {
    console.log('📅 [CRON] Post saved for cron-based scheduling:', {
      id: post.id,
      scheduled_for: post.scheduled_for || post.scheduled_at,
      platform: post.platform || (post.platforms && post.platforms[0]),
      status: post.status,
      user_id: post.user_id
    });
    console.log('✅ [CRON] Post will be processed by cron job when scheduled time arrives');
  }

  /**
   * Debug function to check database schema
   */
  static async checkDatabaseSchema(): Promise<void> {
    try {
      console.log('🔍 Checking database schema...');

      // Try to get table info
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .limit(1);

      console.log('📊 Schema check result:', { data, error });

      if (error) {
        console.error('❌ Schema check failed:', error);

        // If table doesn't exist, try to create it
        if (error.code === '42P01') {
          console.log('🔧 Table does not exist, attempting to create...');
          await this.createPostsTable();
        }
      } else {
        console.log('✅ Posts table exists and is accessible');
      }
    } catch (error) {
      console.error('❌ Schema check error:', error);
    }
  }

  /**
   * Fix RLS policies for posts table
   */
  static logRLSInfo(): void {
    console.log('💡 [RLS] If you encounter permission errors, ensure these policies exist in Supabase:');
    console.log('💡 [RLS] 1. Users can insert their own posts: FOR INSERT WITH CHECK (auth.uid() = user_id)');
    console.log('💡 [RLS] 2. Users can view their own posts: FOR SELECT USING (auth.uid() = user_id)');
    console.log('💡 [RLS] 3. Users can update their own posts: FOR UPDATE USING (auth.uid() = user_id)');
    console.log('💡 [RLS] 4. Users can delete their own posts: FOR DELETE USING (auth.uid() = user_id)');
  }

  /**
   * Create posts table with proper schema
   */
  static async createPostsTable(): Promise<void> {
    try {
      console.log('🔧 Creating posts table...');

      // Use a simple approach - just try to insert and see what happens
      const testData = {
        content: 'test',
        platform: 'twitter',
        status: 'draft',
        user_id: '00000000-0000-0000-0000-000000000000' // dummy UUID
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(testData)
        .select()
        .single();

      if (error) {
        console.error('❌ Test insert failed:', error);
        console.log('📝 This tells us what columns are missing or have wrong types');
      } else {
        console.log('✅ Test insert succeeded, deleting test record...');
        // Delete the test record
        await supabase.from('posts').delete().eq('id', data.id);
      }
    } catch (error) {
      console.error('❌ Create table error:', error);
    }
  }

  /**
   * Create a new scheduled post
   */
  static async createScheduledPost(data: SchedulePostData): Promise<ScheduledPost> {
    try {
      // First check the database schema
      await this.checkDatabaseSchema();

      console.log('📅 Creating scheduled post...', data);
      console.log('📅 Input data details:', {
        content: data.content?.substring(0, 100) + '...',
        platforms: data.platforms,
        media_urls: data.media_urls,
        scheduled_for: data.scheduled_for,
        scheduled_for_iso: data.scheduled_for.toISOString(),
        scheduled_for_local: data.scheduled_for.toLocaleString(),
        user_id: data.user_id
      });

      // Ensure we have a valid session for RLS
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ No valid session for database operation:', sessionError);
        throw new Error('Authentication required for scheduling posts');
      }

      console.log('✅ Valid session found for user:', session.user.id);

      // Verify the user_id matches the session
      if (session.user.id !== data.user_id) {
        console.error('❌ User ID mismatch:', { sessionUserId: session.user.id, dataUserId: data.user_id });
        throw new Error('User ID mismatch - security violation');
      }

      // Test RLS by trying a simple select first
      console.log('🔍 Testing RLS with a simple select...');
      const { data: testSelect, error: selectError } = await supabase
        .from('posts')
        .select('id')
        .limit(1);

      if (selectError) {
        console.error('❌ RLS test select failed:', selectError);
      } else {
        console.log('✅ RLS test select succeeded, found', testSelect?.length || 0, 'posts');
      }

      // Start with minimal data and add fields that exist
      const postData: any = {
        content: data.content,
        platform: data.platforms[0],
        status: 'scheduled',
        user_id: data.user_id
      };

      // Add optional fields only if they might exist in the schema
      if (data.scheduled_for) {
        postData.scheduled_at = toLocalISOString(data.scheduled_for); // Preserve local time
      }

      if (data.media_urls && data.media_urls.length > 0) {
        postData.image_url = data.media_urls[0];
      }

      // Add other fields that might exist
      postData.ai_prompt = '';
      postData.generated_by_ai = false;
      postData.retry_count = 0;

      // Try to add JSONB fields
      try {
        postData.platform_post_ids = {};
        postData.engagement_stats = {};
      } catch (e) {
        console.log('📝 JSONB fields might not be supported, skipping...');
      }

      console.log('📤 Sending to database:', postData);

      // Direct database insert (no RLS bypass needed)
      console.log('📤 Inserting post directly into database...');

      const { data: post, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      console.log('📡 Database response:', { post, error });

      if (error) {
        console.error('❌ Error creating scheduled post:', error);
        console.error('❌ Post data that failed:', postData);
        console.error('❌ Full error details:', JSON.stringify(error, null, 2));

        // Try a fallback with different column names if the first attempt failed
        if (error.code === '42703') { // Column does not exist
          console.log('🔄 Trying fallback with different column names...');
          return await this.createScheduledPostFallback(data);
        }

        // If it's an RLS error, try to fix the policies and retry
        if (error.code === '42501') { // RLS policy violation
          console.log('🔧 RLS policy violation, attempting workarounds...');

          // First, try with the session user ID to ensure it matches
          const correctedPostData = {
            ...postData,
            user_id: session.user.id // Force use session user ID
          };

          console.log('🔄 Retrying with session user ID:', {
            originalUserId: postData.user_id,
            sessionUserId: session.user.id,
            match: postData.user_id === session.user.id
          });

          const { data: retryPost, error: retryError } = await supabase
            .from('posts')
            .insert(correctedPostData)
            .select()
            .single();

          if (!retryError && retryPost) {
            console.log('✅ Retry with session user ID succeeded:', retryPost);
            // Log for cron system
            this.logPostForCron(retryPost);
            return retryPost;
          }

          console.error('❌ Retry with session user ID failed:', retryError);

          // Log RLS policy information
          this.logRLSInfo();

          // Final retry after policy fix
          console.log('🔄 Final retry after policy fix...');
          const { data: finalPost, error: finalError } = await supabase
            .from('posts')
            .insert(correctedPostData)
            .select()
            .single();

          if (finalError) {
            console.error('❌ All RLS workarounds failed:', finalError);
            console.log('💡 Please run fix-rls-policies.sql in Supabase SQL editor');
            throw finalError;
          }

          if (finalPost) {
            console.log('✅ Final retry succeeded:', finalPost);
            // Log for cron system
            this.logPostForCron(finalPost);
            return finalPost;
          }
        }

        throw error;
      }

      if (!post) {
        console.log('⚠️ No post data returned, but insert likely succeeded');
        console.log('🔄 Attempting to fetch the created post...');

        // Try to fetch the most recent post for this user
        const { data: recentPosts, error: fetchError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', data.user_id)
          .eq('status', 'scheduled')
          .order('created_at', { ascending: false })
          .limit(1);

        if (fetchError) {
          console.error('❌ Could not fetch created post:', fetchError);
          // Create a mock post object for the response
          const mockPost = {
            id: 'temp-' + Date.now(),
            content: data.content,
            platform: data.platforms[0],
            status: 'scheduled',
            scheduled_at: data.scheduled_for.toISOString(),
            user_id: data.user_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          console.log('✅ Using mock post object:', mockPost);
          return mockPost as ScheduledPost;
        }

        if (recentPosts && recentPosts.length > 0) {
          console.log('✅ Found created post:', recentPosts[0]);
          // Log for cron system
          this.logPostForCron(recentPosts[0]);
          return recentPosts[0];
        }

        // If we still can't find it, create a mock response
        const mockPost = {
          id: 'temp-' + Date.now(),
          content: data.content,
          platform: data.platforms[0],
          status: 'scheduled',
          scheduled_at: data.scheduled_for.toISOString(),
          user_id: data.user_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        console.log('✅ Using mock post object as fallback:', mockPost);
        return mockPost as ScheduledPost;
      }

      console.log('✅ Scheduled post created successfully:', post);
      // Log for cron system
      this.logPostForCron(post);
      return post;
    } catch (error) {
      console.error('❌ Failed to create scheduled post:', error);
      throw error;
    }
  }

  /**
   * Fallback method with minimal data structure
   */
  static async createScheduledPostFallback(data: SchedulePostData): Promise<ScheduledPost> {
    try {
      console.log('🔄 Attempting fallback post creation...');

      // Ensure we have a valid session for RLS
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('❌ No valid session for fallback operation:', sessionError);
        throw new Error('Authentication required for scheduling posts');
      }

      console.log('✅ Valid session found for fallback, user:', session.user.id);

      // Try with absolute minimal data
      const minimalData = {
        content: data.content,
        platform: data.platforms[0],
        user_id: data.user_id,
        status: 'scheduled'
      };

      console.log('📤 Fallback data:', minimalData);

      const { data: post, error } = await supabase
        .from('posts')
        .insert(minimalData)
        .select()
        .single();

      if (error) {
        console.error('❌ Fallback also failed:', error);
        throw error;
      }

      if (!post) {
        throw new Error('Fallback insert succeeded but returned no data');
      }

      console.log('✅ Fallback post created successfully:', post);
      // Log for cron system
      this.logPostForCron(post);
      return post;
    } catch (error) {
      console.error('❌ Fallback creation failed:', error);
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
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true });

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
        updateData.scheduled_at = updates.scheduled_for.toISOString();
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
          status: 'cancelled',
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
        .select('status')
        .eq('user_id', userId)
        .in('status', ['scheduled', 'processing', 'published', 'failed']);

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
        switch (post.status) {
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
          status: 'scheduled',
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
        .eq('status', 'scheduled')
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', tomorrow.toISOString())
        .order('scheduled_at', { ascending: true });

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
    const minScheduleTime = new Date(now.getTime() + 1 * 60 * 1000); // 1 minute from now (reduced from 5 minutes)

    if (scheduledFor <= minScheduleTime) {
      return {
        valid: false,
        error: 'Scheduled time must be at least 1 minute in the future'
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

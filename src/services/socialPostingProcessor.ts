import { supabase } from '@/integrations/supabase/client';

/**
 * Service to process posts marked as "ready" by the cron job
 * and actually post them to social media platforms
 */
export class SocialPostingProcessor {
  private static isProcessing = false;
  private static intervalId: NodeJS.Timeout | null = null;
  private static notificationChannel: any = null;

  /**
   * Start the processor - checks for ready posts every 10 seconds
   */
  static start() {
    if (this.intervalId) {
      console.log('🔄 [SocialProcessor] Already running');
      return;
    }

    console.log('🚀 [SocialProcessor] Starting social posting processor...');

    // Process immediately
    this.processReadyPosts();

    // Then process every 10 seconds for faster response
    this.intervalId = setInterval(() => {
      this.processReadyPosts();
    }, 10000); // Check every 10 seconds instead of 30

    console.log('✅ [SocialProcessor] Processor started (checks every 10 seconds)');
  }

  /**
   * Stop the processor
   */
  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ [SocialProcessor] Processor stopped');
    }
  }

  /**
   * Process all posts marked as "ready" by the cron job
   */
  static async processReadyPosts() {
    if (this.isProcessing) {
      console.log('⏳ [SocialProcessor] Already processing, skipping...');
      return;
    }

    try {
      this.isProcessing = true;

      // Get posts ready for processing - fallback to direct query if function doesn't exist
      let readyPosts, error;

      try {
        // Try the new function first
        const result = await supabase.rpc('get_posts_ready_for_posting');
        readyPosts = result.data;
        error = result.error;
      } catch (funcError) {
        // Fallback to direct query if function doesn't exist
        console.log('📋 [SocialProcessor] Function not found, using direct query fallback');
        const result = await supabase
          .from('posts')
          .select('id, user_id, content, platform, image_url, scheduled_at, updated_at')
          .eq('status', 'ready_for_posting')
          .order('scheduled_at', { ascending: true });
        readyPosts = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ [SocialProcessor] Error fetching ready posts:', error);
        return;
      }

      if (!readyPosts || readyPosts.length === 0) {
        console.log('📭 [SocialProcessor] No posts ready for processing');
        return;
      }

      console.log(`📬 [SocialProcessor] Found ${readyPosts.length} posts ready for processing`);

      // Process each post
      for (const post of readyPosts) {
        await this.processPost(post);
        
        // Add small delay between posts to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error('❌ [SocialProcessor] Error in processReadyPosts:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single post - actually post to social media
   */
  private static async processPost(post: any) {
    try {
      console.log(`🚀 [SocialProcessor] Processing post ${post.id} for ${post.platform}`);

      // Get current session for API calls
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ [SocialProcessor] No active session');
        await this.markPostAsFailed(post.id, 'No active session');
        return;
      }

      // Prepare request body for social media API
      const requestBody = {
        content: post.content,
        platform: post.platform,
        ...(post.image_url && { image: post.image_url })
      };

      console.log(`📤 [SocialProcessor] Calling social media API for ${post.platform}`);

      // Call your existing social media API
      const response = await fetch('https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        // Success - mark as posted
        console.log(`✅ [SocialProcessor] Successfully posted to ${post.platform}: ${post.id}`);

        // Extract post URL from response if available
        let postUrl = null;
        if (responseData.results && responseData.results.length > 0) {
          const platformResult = responseData.results.find((r: any) => r.platform === post.platform);
          postUrl = platformResult?.url || platformResult?.post_url;
        }

        await this.markPostAsPosted(
          post.id,
          true,
          `Posted to ${post.platform} successfully`,
          postUrl
        );
      } else {
        // Failed - mark as failed
        const errorMessage = responseData.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error(`❌ [SocialProcessor] Failed to post to ${post.platform}: ${errorMessage}`);
        await this.markPostAsFailed(post.id, errorMessage);
      }

    } catch (error: any) {
      console.error(`❌ [SocialProcessor] Exception processing post ${post.id}:`, error);
      await this.markPostAsFailed(post.id, error.message || 'Unknown error');
    }
  }

  /**
   * Mark post as successfully posted
   */
  private static async markPostAsPosted(postId: string, success: boolean, responseData: string, postUrl?: string) {
    try {
      const { error } = await supabase.rpc('mark_post_as_posted', {
        p_post_id: postId,
        p_success: success,
        p_platform_response: responseData,
        p_post_url: postUrl || null
      });

      if (error) {
        console.error('❌ [SocialProcessor] Error marking post as posted:', error);
      } else {
        console.log(`✅ [SocialProcessor] Marked post ${postId} as ${success ? 'posted' : 'failed'}`);
      }
    } catch (error) {
      console.error('❌ [SocialProcessor] Exception marking post as posted:', error);
    }
  }

  /**
   * Mark post as failed
   */
  private static async markPostAsFailed(postId: string, errorMessage: string) {
    await this.markPostAsPosted(postId, false, errorMessage);
  }



  /**
   * Get current status of the processor
   */
  static getStatus() {
    return {
      isRunning: this.intervalId !== null,
      isProcessing: this.isProcessing,
      intervalId: this.intervalId
    };
  }

  /**
   * Manual trigger for processing (for testing)
   */
  static async triggerProcessing() {
    console.log('🧪 [SocialProcessor] Manual trigger requested');
    await this.processReadyPosts();
  }

  /**
   * Get statistics about ready posts
   */
  static async getStats() {
    try {
      // Get ready posts with fallback
      let readyPosts, readyError;

      try {
        const result = await supabase.rpc('get_posts_ready_for_posting');
        readyPosts = result.data;
        readyError = result.error;
      } catch (funcError) {
        // Fallback to direct query with explicit column selection
        const result = await supabase
          .from('posts')
          .select('platform::text')
          .eq('status', 'ready_for_posting');
        readyPosts = result.data;
        readyError = result.error;
      }

      // Get all posts with fallback
      let allPosts, allError;

      try {
        const result = await supabase
          .from('social_posting_status')
          .select('status, processing_status');
        allPosts = result.data;
        allError = result.error;
      } catch (viewError) {
        // Fallback to posts table
        const result = await supabase
          .from('posts')
          .select('status')
          .in('status', ['scheduled', 'ready_for_posting', 'published', 'failed']);
        allPosts = result.data;
        allError = result.error;
      }

      if (readyError || allError) {
        console.error('Error fetching stats:', readyError || allError);
        return null;
      }

      const readyCount = readyPosts?.length || 0;
      const statusCounts = (allPosts || []).reduce((acc: any, post: any) => {
        acc[post.status] = (acc[post.status] || 0) + 1;
        return acc;
      }, {});

      return {
        readyForProcessing: readyCount,
        statusCounts,
        readyByPlatform: (readyPosts || []).reduce((acc: any, post: any) => {
          acc[post.platform] = (acc[post.platform] || 0) + 1;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }
}

// Auto-start the processor when the module loads (in production)
if (typeof window !== 'undefined') {
  // Only start in browser environment
  console.log('🔧 [SocialProcessor] Module loaded, starting processor...');
  SocialPostingProcessor.start();
  
  // Stop processor when page unloads
  window.addEventListener('beforeunload', () => {
    SocialPostingProcessor.stop();
  });
}

export default SocialPostingProcessor;

import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SocialMediaAPIs } from './socialMediaAPIs';

export interface EngagementData {
  likes: number;
  shares: number;
  comments: number;
  reach: number;
  impressions: number;
  clicks: number;
}

export interface PlatformEngagement {
  [platform: string]: EngagementData;
}

/**
 * Service to fetch and update engagement data from social media platforms
 */
export class EngagementService {
  
  /**
   * Fetch engagement data for a specific post from all connected platforms
   */
  static async fetchPostEngagement(userId: string, postId: string, platformPostIds: Record<string, string>): Promise<PlatformEngagement> {
    try {
      console.log(`🔍 Fetching real engagement for post ${postId}...`);

      // Use real API to fetch engagement data
      const realEngagement = await SocialMediaAPIs.getPostEngagement(userId, postId, platformPostIds);

      // Convert to our format
      const engagement: PlatformEngagement = {};
      Object.entries(realEngagement).forEach(([platform, metrics]) => {
        engagement[platform] = {
          likes: metrics.likes,
          shares: metrics.shares,
          comments: metrics.comments,
          reach: metrics.reach,
          impressions: metrics.impressions,
          clicks: metrics.clicks
        };
      });

      console.log(`✅ Successfully fetched real engagement:`, engagement);
      return engagement;

    } catch (error) {
      console.error('Error fetching real engagement:', error);

      // Return empty engagement data if real API fails - no demo fallback
      const engagement: PlatformEngagement = {};
      Object.keys(platformPostIds).forEach(platform => {
        engagement[platform] = this.getDefaultEngagement();
      });

      return engagement;
    }
  }

  /**
   * Update engagement data for a post in the database
   */
  static async updatePostEngagement(postId: string, engagement: PlatformEngagement): Promise<void> {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          engagement_stats: engagement,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;
      
      console.log(`✅ Updated engagement for post ${postId}`);
    } catch (error) {
      console.error('Error updating post engagement:', error);
      throw error;
    }
  }

  /**
   * Fetch engagement data for all user posts and update database
   */
  static async syncAllPostsEngagement(userId: string): Promise<void> {
    try {
      // Get all published posts for the user with platform post IDs
      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, platform, platform_post_ids, status, created_at')
        .eq('user_id', userId)
        .eq('status', 'published')
        .not('platform_post_ids', 'is', null);

      if (error) throw error;

      if (!posts || posts.length === 0) {
        console.log('No published posts with platform IDs found for engagement sync');
        return;
      }

      console.log(`🔄 Syncing real engagement for ${posts.length} posts...`);

      // Process posts in batches to avoid rate limits
      const batchSize = 3; // Smaller batches for real API calls
      for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (post) => {
            try {
              // Only sync if we have platform post IDs
              if (!post.platform_post_ids || Object.keys(post.platform_post_ids).length === 0) {
                console.log(`Skipping post ${post.id} - no platform post IDs`);
                return;
              }

              console.log(`📊 Fetching real engagement for post ${post.id}...`);
              const engagement = await this.fetchPostEngagement(userId, post.id, post.platform_post_ids);
              await this.updatePostEngagement(post.id, engagement);

              // Add delay to respect rate limits
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
              // Only log non-connection errors to reduce noise
              if (!error.message.includes('not connected')) {
                console.error(`Error syncing engagement for post ${post.id}:`, error);
              } else {
                console.log(`ℹ️ Skipping post ${post.id} - platforms not connected`);
              }
            }
          })
        );

        // Longer delay between batches for real APIs
        if (i + batchSize < posts.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log('✅ Engagement sync completed');
    } catch (error) {
      console.error('Error syncing engagement data:', error);
      throw error;
    }
  }

  /**
   * Force sync real engagement data for all published posts
   */
  static async forceRealEngagementSync(userId: string): Promise<void> {
    console.log('🚀 Force syncing real engagement data...');
    await this.syncAllPostsEngagement(userId);
  }

  // Helper method to get default empty engagement
  private static getDefaultEngagement(): EngagementData {
    return {
      likes: 0,
      shares: 0,
      comments: 0,
      reach: 0,
      impressions: 0,
      clicks: 0
    };
  }

}

/**
 * Hook to automatically sync engagement data at regular intervals
 */
export const useEngagementSync = (userId: string | null, intervalMinutes: number = 30) => {
  const syncEngagement = async () => {
    if (!userId) return;
    
    try {
      await EngagementService.syncAllPostsEngagement(userId);
    } catch (error) {
      console.error('Engagement sync failed:', error);
    }
  };

  // Set up interval for automatic syncing
  React.useEffect(() => {
    if (!userId) return;

    // Initial sync
    syncEngagement();

    // Set up interval
    const interval = setInterval(syncEngagement, intervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId, intervalMinutes]);

  return { syncEngagement };
};

// Export for real engagement data sync only - NO DUMMY DATA
export const realEngagementService = {
  async syncRealData(userId: string) {
    console.log('🚀 Starting REAL engagement data sync from social media platforms...');
    console.log('📋 Only fetching authentic engagement data from connected platforms');
    console.log('ℹ️ Platforms not connected will show zero engagement (no dummy data)');
    await EngagementService.syncAllPostsEngagement(userId);
    console.log('✅ Real engagement sync completed - only authentic data displayed');
  },

  async forceSync(userId: string) {
    console.log('🔄 Force syncing REAL engagement data from social media platforms...');
    await EngagementService.forceRealEngagementSync(userId);
  },

  async clearAllEngagementData(userId: string) {
    console.log('🧹 Clearing all engagement data to ensure only real data is shown...');

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          engagement_stats: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      console.log('✅ All engagement data cleared. Only real data from social media platforms will be shown.');
    } catch (error) {
      console.error('❌ Error clearing engagement data:', error);
      throw error;
    }
  }
};

/**
 * Real-time engagement sync service
 */
export class RealTimeEngagementSync {
  private static intervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start real-time sync for a user
   */
  static startSync(userId: string, intervalMinutes: number = 15) {
    // Clear existing interval if any
    this.stopSync(userId);

    console.log(`🔄 Starting real-time engagement sync for user ${userId} (every ${intervalMinutes} minutes)`);

    // Initial sync
    EngagementService.syncAllPostsEngagement(userId).catch(console.error);

    // Set up interval
    const interval = setInterval(async () => {
      try {
        console.log(`⏰ Running scheduled engagement sync for user ${userId}`);
        await EngagementService.syncAllPostsEngagement(userId);
      } catch (error) {
        console.error('Scheduled engagement sync failed:', error);
      }
    }, intervalMinutes * 60 * 1000);

    this.intervals.set(userId, interval);
  }

  /**
   * Stop real-time sync for a user
   */
  static stopSync(userId: string) {
    const interval = this.intervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(userId);
      console.log(`⏹️ Stopped real-time engagement sync for user ${userId}`);
    }
  }

  /**
   * Check if sync is running for a user
   */
  static isRunning(userId: string): boolean {
    return this.intervals.has(userId);
  }
}

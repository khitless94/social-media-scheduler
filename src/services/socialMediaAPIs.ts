import { supabase } from '@/integrations/supabase/client';

export interface PlatformCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scope?: string;
}

export interface EngagementMetrics {
  likes: number;
  shares: number;
  comments: number;
  reach: number;
  impressions: number;
  clicks: number;
  views?: number;
  saves?: number;
}

/**
 * Real social media API implementations for fetching engagement data
 */
export class SocialMediaAPIs {
  
  /**
   * Get stored credentials for a platform
   */
  private static async getCredentials(userId: string, platform: string): Promise<PlatformCredentials | null> {
    try {
      const { data, error } = await supabase
        .from('oauth_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', platform)
        .single();

      if (error || !data) {
        console.log(`No credentials found for ${platform}`);
        return null;
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || undefined,
        expiresAt: data.expires_at || undefined,
        scope: data.scope || undefined
      };
    } catch (error) {
      console.error(`Error getting credentials for ${platform}:`, error);
      return null;
    }
  }

  /**
   * Refresh access token if needed
   */
  private static async refreshTokenIfNeeded(userId: string, platform: string, credentials: PlatformCredentials): Promise<string> {
    // Check if token is expired
    if (credentials.expiresAt) {
      const expiryTime = new Date(credentials.expiresAt);
      const now = new Date();
      const timeUntilExpiry = expiryTime.getTime() - now.getTime();
      
      // Refresh if expires within 5 minutes
      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.log(`Token for ${platform} expires soon, refreshing...`);
        return await this.refreshAccessToken(userId, platform, credentials);
      }
    }
    
    return credentials.accessToken;
  }

  /**
   * Refresh access token using refresh token
   */
  private static async refreshAccessToken(userId: string, platform: string, credentials: PlatformCredentials): Promise<string> {
    try {
      const response = await supabase.functions.invoke('refresh-oauth-token', {
        body: {
          platform,
          refreshToken: credentials.refreshToken,
          userId
        }
      });

      if (response.error) {
        throw new Error(`Failed to refresh ${platform} token: ${response.error.message}`);
      }

      return response.data.accessToken;
    } catch (error) {
      console.error(`Error refreshing ${platform} token:`, error);
      throw error;
    }
  }

  /**
   * Twitter API v2 - Get tweet metrics
   */
  static async getTwitterEngagement(userId: string, tweetId: string): Promise<EngagementMetrics> {
    try {
      const credentials = await this.getCredentials(userId, 'twitter');
      if (!credentials) {
        // Silently return zero engagement for disconnected platforms
        return { likes: 0, shares: 0, comments: 0, reach: 0, impressions: 0, clicks: 0 };
      }

      const accessToken = await this.refreshTokenIfNeeded(userId, 'twitter', credentials);

      // Twitter API v2 endpoint for tweet metrics
      const response = await fetch(`https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics,non_public_metrics`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const metrics = data.data?.public_metrics || {};
      const nonPublicMetrics = data.data?.non_public_metrics || {};

      return {
        likes: metrics.like_count || 0,
        shares: metrics.retweet_count || 0,
        comments: metrics.reply_count || 0,
        reach: nonPublicMetrics.user_profile_clicks || 0,
        impressions: nonPublicMetrics.impression_count || 0,
        clicks: nonPublicMetrics.url_link_clicks || 0
      };
    } catch (error) {
      console.error('Error fetching Twitter engagement:', error);
      throw error;
    }
  }

  /**
   * LinkedIn API - Get post analytics
   */
  static async getLinkedInEngagement(userId: string, postId: string): Promise<EngagementMetrics> {
    try {
      const credentials = await this.getCredentials(userId, 'linkedin');
      if (!credentials) {
        // Silently return zero engagement for disconnected platforms
        return { likes: 0, shares: 0, comments: 0, reach: 0, impressions: 0, clicks: 0 };
      }

      const accessToken = await this.refreshTokenIfNeeded(userId, 'linkedin', credentials);

      // LinkedIn API endpoint for post statistics
      const response = await fetch(`https://api.linkedin.com/v2/socialActions/${postId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Get detailed analytics
      const analyticsResponse = await fetch(`https://api.linkedin.com/v2/shares/${postId}/statistics`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      let analytics = {};
      if (analyticsResponse.ok) {
        analytics = await analyticsResponse.json();
      }

      return {
        likes: data.numLikes || 0,
        shares: data.numShares || 0,
        comments: data.numComments || 0,
        reach: analytics.reach || 0,
        impressions: analytics.impressions || 0,
        clicks: analytics.clicks || 0
      };
    } catch (error) {
      console.error('Error fetching LinkedIn engagement:', error);
      throw error;
    }
  }

  /**
   * Instagram Basic Display API - Get media insights
   */
  static async getInstagramEngagement(userId: string, mediaId: string): Promise<EngagementMetrics> {
    try {
      const credentials = await this.getCredentials(userId, 'instagram');
      if (!credentials) {
        // Silently return zero engagement for disconnected platforms
        return { likes: 0, shares: 0, comments: 0, reach: 0, impressions: 0, clicks: 0 };
      }

      const accessToken = await this.refreshTokenIfNeeded(userId, 'instagram', credentials);

      // Instagram Basic Display API endpoint for media insights
      const response = await fetch(`https://graph.instagram.com/${mediaId}/insights?metric=engagement,impressions,reach,saved&access_token=${accessToken}`);

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const insights = data.data || [];

      const metrics = insights.reduce((acc: any, insight: any) => {
        acc[insight.name] = insight.values[0]?.value || 0;
        return acc;
      }, {});

      // Get basic media info for likes and comments
      const mediaResponse = await fetch(`https://graph.instagram.com/${mediaId}?fields=like_count,comments_count&access_token=${accessToken}`);
      const mediaData = mediaResponse.ok ? await mediaResponse.json() : {};

      return {
        likes: mediaData.like_count || 0,
        shares: 0, // Instagram doesn't provide share count via API
        comments: mediaData.comments_count || 0,
        reach: metrics.reach || 0,
        impressions: metrics.impressions || 0,
        clicks: 0, // Not available in Basic Display API
        saves: metrics.saved || 0
      };
    } catch (error) {
      console.error('Error fetching Instagram engagement:', error);
      throw error;
    }
  }

  /**
   * Facebook Graph API - Get post insights
   */
  static async getFacebookEngagement(userId: string, postId: string): Promise<EngagementMetrics> {
    try {
      const credentials = await this.getCredentials(userId, 'facebook');
      if (!credentials) {
        // Silently return zero engagement for disconnected platforms
        return { likes: 0, shares: 0, comments: 0, reach: 0, impressions: 0, clicks: 0 };
      }

      const accessToken = await this.refreshTokenIfNeeded(userId, 'facebook', credentials);

      // Facebook Graph API endpoint for post insights
      const response = await fetch(`https://graph.facebook.com/${postId}/insights?metric=post_impressions,post_engaged_users,post_clicks&access_token=${accessToken}`);

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const insights = data.data || [];

      const metrics = insights.reduce((acc: any, insight: any) => {
        acc[insight.name] = insight.values[0]?.value || 0;
        return acc;
      }, {});

      // Get basic post engagement
      const postResponse = await fetch(`https://graph.facebook.com/${postId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${accessToken}`);
      const postData = postResponse.ok ? await postResponse.json() : {};

      return {
        likes: postData.likes?.summary?.total_count || 0,
        shares: postData.shares?.count || 0,
        comments: postData.comments?.summary?.total_count || 0,
        reach: metrics.post_engaged_users || 0,
        impressions: metrics.post_impressions || 0,
        clicks: metrics.post_clicks || 0
      };
    } catch (error) {
      console.error('Error fetching Facebook engagement:', error);
      throw error;
    }
  }

  /**
   * Reddit API - Get submission data
   */
  static async getRedditEngagement(userId: string, submissionId: string): Promise<EngagementMetrics> {
    try {
      const credentials = await this.getCredentials(userId, 'reddit');
      if (!credentials) {
        // Silently return zero engagement for disconnected platforms
        return { likes: 0, shares: 0, comments: 0, reach: 0, impressions: 0, clicks: 0 };
      }

      const accessToken = await this.refreshTokenIfNeeded(userId, 'reddit', credentials);

      // Reddit API endpoint for submission info
      const response = await fetch(`https://oauth.reddit.com/api/info?id=t3_${submissionId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'SocialMediaScheduler/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const post = data.data?.children?.[0]?.data || {};

      return {
        likes: post.ups || 0,
        shares: 0, // Reddit doesn't track shares
        comments: post.num_comments || 0,
        reach: post.view_count || 0,
        impressions: post.view_count || 0,
        clicks: post.clicked || 0
      };
    } catch (error) {
      console.error('Error fetching Reddit engagement:', error);
      throw error;
    }
  }

  /**
   * Get engagement data for a post across all platforms
   */
  static async getPostEngagement(userId: string, postId: string, platformPostIds: Record<string, string>): Promise<Record<string, EngagementMetrics>> {
    const engagement: Record<string, EngagementMetrics> = {};
    
    const promises = Object.entries(platformPostIds).map(async ([platform, platformPostId]) => {
      try {
        let metrics: EngagementMetrics;
        
        switch (platform.toLowerCase()) {
          case 'twitter':
            metrics = await this.getTwitterEngagement(userId, platformPostId);
            break;
          case 'linkedin':
            metrics = await this.getLinkedInEngagement(userId, platformPostId);
            break;
          case 'instagram':
            metrics = await this.getInstagramEngagement(userId, platformPostId);
            break;
          case 'facebook':
            metrics = await this.getFacebookEngagement(userId, platformPostId);
            break;
          case 'reddit':
            metrics = await this.getRedditEngagement(userId, platformPostId);
            break;
          default:
            console.warn(`Unknown platform: ${platform}`);
            return;
        }
        
        engagement[platform] = metrics;
        console.log(`✅ Fetched ${platform} engagement:`, metrics);
        
      } catch (error) {
        // Only log errors that aren't connection-related
        if (!error.message.includes('not connected')) {
          console.error(`❌ Failed to fetch ${platform} engagement:`, error);
        } else {
          console.log(`ℹ️ ${platform} not connected - showing zero engagement`);
        }
        // Don't throw, just skip this platform
        engagement[platform] = {
          likes: 0,
          shares: 0,
          comments: 0,
          reach: 0,
          impressions: 0,
          clicks: 0
        };
      }
    });

    await Promise.all(promises);
    return engagement;
  }
}

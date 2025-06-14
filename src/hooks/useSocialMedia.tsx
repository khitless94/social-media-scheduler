import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PostToSocialParams {
  content: string;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'reddit';
  subreddit?: string;
  image?: string;
}

export interface PostResponse {
  success: boolean;
  message?: string;
  error?: string;
  needsReconnection?: boolean;
  postId?: string;
  platform?: string;
}

export interface ConnectionStatus {
  platform: string;
  isConnected: boolean;
  expiresAt?: string;
  needsReconnection?: boolean;
}

export interface PostHistory {
  id: string;
  platform: string;
  content: string;
  post_id?: string;
  status: 'success' | 'failed' | 'pending';
  error_message?: string;
  created_at: string;
}

export const useSocialMedia = () => {
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [postHistory, setPostHistory] = useState<PostHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const platforms = [
    { id: 'facebook', name: 'Facebook' },
    { id: 'instagram', name: 'Instagram' },
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'twitter', name: 'Twitter' },
    { id: 'reddit', name: 'Reddit' }
  ];

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      checkConnectionStatus();
      getPostHistory();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  // Check connection status for all platforms
  const checkConnectionStatus = async (): Promise<ConnectionStatus[]> => {
    try {
      if (!user) return [];

      // Check both tables for backward compatibility
      const [oauthResult, socialTokensResult] = await Promise.all([
        supabase.from('oauth_credentials').select('platform, expires_at, created_at').eq('user_id', user.id),
        supabase.from('social_tokens').select('platform, expires_at, created_at').eq('user_id', user.id)
      ]);

      // Combine tokens from both tables
      const allTokens = [
        ...(oauthResult.data || []),
        ...(socialTokensResult.data || [])
      ];

      const connectionStatus = platforms.map(platform => {
        const token = allTokens.find(t => t.platform === platform.id);
        const isExpired = token?.expires_at && new Date(token.expires_at) < new Date();

        return {
          platform: platform.id,
          isConnected: !!token && !isExpired,
          expiresAt: token?.expires_at,
          needsReconnection: isExpired
        };
      });

      setConnections(connectionStatus);
      return connectionStatus;
    } catch (error) {
      console.error('Error checking connection status:', error);
      return [];
    }
  };

  // Post to a single social media platform
  const postToSocial = async ({ content, platform, subreddit, image }: PostToSocialParams): Promise<PostResponse> => {
    try {
      setLoading(true);

      // Check if user is authenticated
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get platform tokens from database
      const { data: tokens, error: tokenError } = await supabase
        .from('oauth_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .single();

      if (tokenError || !tokens) {
        return { 
          success: false, 
          error: `No ${platform} connection found`,
          needsReconnection: true,
          platform
        };
      }

      // Check if token is expired
      if (tokens.expires_at && new Date(tokens.expires_at) < new Date()) {
        return {
          success: false,
          error: `${platform} connection expired`,
          needsReconnection: true,
          platform
        };
      }

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('post-to-social', {
        body: {
          platform,
          content,
          subreddit: platform === 'reddit' ? subreddit : undefined,
          image
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to post',
          platform
        };
      }

      console.log(`[useSocialMedia] Edge function response for ${platform}:`, data);

      // The edge function returns { success: true, results: [...] }
      if (data.success && data.results && data.results.length > 0) {
        const result = data.results.find((r: any) => r.platform === platform) || data.results[0];

        console.log(`[useSocialMedia] Found result for ${platform}:`, result);

        if (result.success) {
          // Log successful post
          await supabase.from('post_history').insert({
            user_id: user.id,
            platform,
            content: content.substring(0, 1000), // Truncate for storage
            post_id: result.postId,
            status: 'success'
          });

          // Refresh post history
          await getPostHistory();

          return {
            success: true,
            message: result.message || `Successfully posted to ${platform}`,
            postId: result.postId,
            platform
          };
        } else {
          // Log failed post
          await supabase.from('post_history').insert({
            user_id: user.id,
            platform,
            content: content.substring(0, 1000),
            status: 'failed',
            error_message: result.error
          });

          // Refresh post history
          await getPostHistory();

          return {
            success: false,
            error: result.error || 'Failed to post',
            platform
          };
        }
      } else {
        // Handle old format or error
        console.error(`[useSocialMedia] Unexpected response format for ${platform}:`, data);
        return {
          success: false,
          error: data.error || 'Unexpected response format',
          platform
        };
      }
    } catch (error) {
      console.error('Post to social error:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred',
        platform
      };
    } finally {
      setLoading(false);
    }
  };

  // Post to multiple platforms at once
  const postToMultiplePlatforms = async (
    content: string,
    platforms: Array<{ platform: string, subreddit?: string }>,
    image?: string
  ): Promise<PostResponse[]> => {
    setLoading(true);
    try {
      const results = await Promise.all(
        platforms.map(({ platform, subreddit }) =>
          postToSocial({
            content,
            platform: platform as any,
            subreddit,
            image
          })
        )
      );
      return results;
    } finally {
      setLoading(false);
    }
  };

  // Disconnect a platform
  const disconnectPlatform = async (platform: string): Promise<boolean> => {
    try {
      if (!user) return false;

      const { error } = await supabase
        .from('oauth_credentials')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', platform);

      if (!error) {
        // Refresh connections
        await checkConnectionStatus();
      }

      return !error;
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      return false;
    }
  };

  // Get posting history
  const getPostHistory = async (limit: number = 50) => {
    try {
      if (!user) return [];

      const { data, error } = await supabase
        .from('post_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      const history = (data || []).map(item => ({
        ...item,
        status: item.status as 'success' | 'failed' | 'pending'
      }));
      setPostHistory(history);
      return history;
    } catch (error) {
      console.error('Error getting post history:', error);
      return [];
    }
  };

  // Get connected platforms
  const getConnectedPlatforms = (): string[] => {
    return connections.filter(c => c.isConnected).map(c => c.platform);
  };

  // Check if a specific platform is connected
  const isPlatformConnected = (platform: string): boolean => {
    const connection = connections.find(c => c.platform === platform);
    return connection?.isConnected || false;
  };

  // Get platforms that need reconnection
  const getPlatformsNeedingReconnection = (): string[] => {
    return connections.filter(c => c.needsReconnection).map(c => c.platform);
  };

  return {
    // State
    connections,
    postHistory,
    loading,
    user,
    platforms,
    
    // Functions
    postToSocial,
    postToMultiplePlatforms,
    checkConnectionStatus,
    disconnectPlatform,
    getPostHistory,
    getConnectedPlatforms,
    isPlatformConnected,
    getPlatformsNeedingReconnection,
    checkUser
  };
};
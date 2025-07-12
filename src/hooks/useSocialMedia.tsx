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

      console.log('🔍 [useSocialMedia] Checking connection status for user:', user.id);

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

      console.log('📊 [useSocialMedia] Database tokens found:', allTokens);

      // Check localStorage for immediate OAuth success flags
      const localStorageConnections: Record<string, boolean> = {};
      platforms.forEach(platform => {
        const key = `connected_${platform.id}_${user.id}`;
        const isConnectedInStorage = localStorage.getItem(key) === 'true';
        if (isConnectedInStorage) {
          localStorageConnections[platform.id] = true;
          console.log(`✅ [useSocialMedia] localStorage: ${platform.id} is connected`);
        }
      });

      const connectionStatus = platforms.map(platform => {
        const token = allTokens.find(t => t.platform === platform.id);
        const isExpired = token?.expires_at && new Date(token.expires_at) < new Date();

        // Use database connection if available, otherwise fall back to localStorage
        const isConnectedInDB = !!token && !isExpired;
        const isConnectedInStorage = localStorageConnections[platform.id] || false;
        const isConnected = isConnectedInDB || isConnectedInStorage;

        console.log(`🔗 [useSocialMedia] ${platform.id}: DB=${isConnectedInDB}, Storage=${isConnectedInStorage}, Final=${isConnected}`);

        return {
          platform: platform.id,
          isConnected,
          expiresAt: token?.expires_at,
          needsReconnection: isExpired
        };
      });

      console.log('📋 [useSocialMedia] Final connection status:', connectionStatus);
      setConnections(connectionStatus);
      return connectionStatus;
    } catch (error) {
      console.error('Error checking connection status:', error);

      // Fallback to localStorage only if database fails
      if (user) {
        console.log('🔄 [useSocialMedia] Database failed, using localStorage fallback');
        const fallbackStatus = platforms.map(platform => {
          const key = `connected_${platform.id}_${user.id}`;
          const isConnected = localStorage.getItem(key) === 'true';
          return {
            platform: platform.id,
            isConnected,
            expiresAt: undefined,
            needsReconnection: false
          };
        });
        setConnections(fallbackStatus);
        return fallbackStatus;
      }

      return [];
    }
  };

  // Function to save post to database
  const savePostToDatabase = async (
    content: string,
    platforms: string[],
    status: 'draft' | 'scheduled' | 'published' | 'failed',
    image?: string,
    scheduledFor?: string,
    platformPostIds?: Record<string, string>,
    errorMessage?: string,
    generatedByAI?: boolean,
    aiPrompt?: string
  ) => {
    console.log('💾 [savePostToDatabase] Starting save with params:', {
      content: content?.substring(0, 50) + '...',
      platforms,
      status,
      image,
      userId: user?.id,
      generatedByAI,
      aiPrompt
    });

    if (!user?.id) {
      console.error('❌ [savePostToDatabase] No user ID found');
      return null;
    }

    try {
      const postData = {
        user_id: user.id,
        content,
        platform: platforms[0] || 'instagram', // Use single platform field as per actual database schema
        status,
        image_url: image,
        scheduled_at: scheduledFor, // Use scheduled_at as per actual database schema
        published_at: status === 'published' ? new Date().toISOString() : null,
        platform_post_ids: platformPostIds || {},
        engagement_stats: {},
        generated_by_ai: generatedByAI || false,
        ai_prompt: aiPrompt,
        error_message: errorMessage,
        retry_count: 0
      };

      console.log('💾 [savePostToDatabase] Inserting data:', postData);

      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();

      if (error) {
        console.error('❌ [savePostToDatabase] Database error:', error);
        console.error('❌ [savePostToDatabase] Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Check if it's a non-critical error but the save might have succeeded
        if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
          console.log('🔍 [savePostToDatabase] No rows returned but insert might have succeeded');
          // Try to fetch the most recent post for this user to verify
          try {
            const { data: recentPost } = await supabase
              .from('posts')
              .select('*')
              .eq('user_id', user.id)
              .eq('status', status)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (recentPost && recentPost.content === content) {
              console.log('✅ [savePostToDatabase] Found matching recent post, save was successful');
              return recentPost;
            }
          } catch (fetchError) {
            console.error('❌ [savePostToDatabase] Failed to verify save:', fetchError);
          }
        }

        return null;
      }

      console.log('✅ [savePostToDatabase] Successfully saved post:', data);
      return data;
    } catch (error) {
      console.error('❌ [savePostToDatabase] Exception:', error);
      return null;
    }
  };

  // Post to a single social media platform
  const postToSocial = async ({ content, platform, subreddit, image }: PostToSocialParams): Promise<PostResponse> => {
    try {
      setLoading(true);

      console.log(`🚀 [useSocialMedia] Posting to ${platform} with OAuth authentication`);
      console.log(`📝 [useSocialMedia] Content: "${content.substring(0, 100)}..."`);
      console.log(`🖼️ [useSocialMedia] Image: ${image ? 'Yes' : 'No'}`);

      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session. Please sign in.');
      }

      console.log(`🔑 [useSocialMedia] Session token exists: ${!!session.access_token}`);

      // Clean request body format - only include relevant fields for each platform
      const requestBody: any = {
        platform,
        content
      };

      // Only include image if provided
      if (image) {
        requestBody.image = image;
      }

      // Only include subreddit for Reddit posts
      if (platform === 'reddit' && subreddit) {
        requestBody.subreddit = subreddit;
      }

      console.log(`📤 [useSocialMedia] Request body:`, requestBody);

      // Call the edge function with authentication
      const response = await fetch('https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`📡 [useSocialMedia] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [useSocialMedia] Edge function error (${response.status}):`, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          platform
        };
      }

      const data = await response.json();

      console.log(`✅ [useSocialMedia] Edge function response for ${platform}:`, data);

      // The edge function returns { success: true, results: [...] }
      if (data.success && data.results && data.results.length > 0) {
        const result = data.results.find((r: any) => r.platform === platform) || data.results[0];

        console.log(`[useSocialMedia] Found result for ${platform}:`, result);

        if (result.success) {
          console.log(`[useSocialMedia] Success: ${platform} post completed`);

          // Save successful post to database
          console.log(`💾 [useSocialMedia] Saving successful ${platform} post to database...`);
          const platformPostIds = result.postId ? { [platform]: result.postId } : {};
          const savedPost = await savePostToDatabase(
            content,
            [platform],
            'published',
            image,
            undefined, // scheduledFor
            platformPostIds,
            undefined, // errorMessage
            false, // generatedByAI
            undefined // aiPrompt
          );

          if (savedPost) {
            console.log(`✅ [useSocialMedia] Post saved to database with ID:`, savedPost.id);
          } else {
            console.error(`❌ [useSocialMedia] Failed to save post to database`);
          }

          return {
            success: true,
            message: result.message || `Successfully posted to ${platform}`,
            postId: result.postId,
            platform
          };
        } else {
          console.log(`[useSocialMedia] Failed: ${platform} post failed - ${result.error}`);

          // Save failed post to database
          console.log(`💾 [useSocialMedia] Saving failed ${platform} post to database...`);
          const savedFailedPost = await savePostToDatabase(
            content,
            [platform],
            'failed',
            image,
            undefined, // scheduledFor
            {}, // platformPostIds
            result.error || 'Failed to post', // errorMessage
            false, // generatedByAI
            undefined // aiPrompt
          );

          if (savedFailedPost) {
            console.log(`✅ [useSocialMedia] Failed post saved to database with ID:`, savedFailedPost.id);
          } else {
            console.error(`❌ [useSocialMedia] Failed to save failed post to database`);
          }

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
      console.log(`[useSocialMedia] Posting to multiple platforms with OAuth authentication`);

      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session. Please sign in.');
      }

      // Call the edge function with authentication
      const response = await fetch('https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content,
          platforms: platforms.map(p => p.platform),
          ...(image && { image })
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error:', errorText);
        // Return error for all platforms
        return platforms.map(p => ({
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          platform: p.platform
        }));
      }

      const data = await response.json();
      console.log(`[useSocialMedia] Edge function response:`, data);

      // The edge function returns { success: true, results: [...] }
      if (data.success && data.results && Array.isArray(data.results)) {
        // Save posts to database for each platform
        const platformPostIds: Record<string, string> = {};
        const successfulPlatforms: string[] = [];
        const failedPlatforms: string[] = [];
        let hasErrors = false;
        let errorMessages: string[] = [];

        data.results.forEach((result: any) => {
          if (result.success) {
            successfulPlatforms.push(result.platform);
            if (result.postId) {
              platformPostIds[result.platform] = result.postId;
            }
          } else {
            failedPlatforms.push(result.platform);
            hasErrors = true;
            if (result.error) {
              errorMessages.push(`${result.platform}: ${result.error}`);
            }
          }
        });

        // Save successful posts
        if (successfulPlatforms.length > 0) {
          await savePostToDatabase(
            content,
            successfulPlatforms,
            'published',
            image,
            undefined, // scheduledFor
            platformPostIds,
            undefined, // errorMessage
            false, // generatedByAI
            undefined // aiPrompt
          );
        }

        // Save failed posts
        if (failedPlatforms.length > 0) {
          await savePostToDatabase(
            content,
            failedPlatforms,
            'failed',
            image,
            undefined, // scheduledFor
            {}, // platformPostIds
            errorMessages.join('; '), // errorMessage
            false, // generatedByAI
            undefined // aiPrompt
          );
        }

        return data.results.map((result: any) => ({
          success: result.success,
          message: result.message || (result.success ? `Successfully posted to ${result.platform}` : 'Failed to post'),
          error: result.error,
          postId: result.postId,
          platform: result.platform
        }));
      } else {
        console.error(`[useSocialMedia] Unexpected response format:`, data);
        return platforms.map(p => ({
          success: false,
          error: data.error || 'Unexpected response format',
          platform: p.platform
        }));
      }
    } catch (error) {
      console.error('Post to multiple platforms error:', error);
      return platforms.map(p => ({
        success: false,
        error: 'An unexpected error occurred',
        platform: p.platform
      }));
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
    checkUser,
    savePostToDatabase
  };
};
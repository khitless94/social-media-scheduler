import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PostToSocialParams {
  content: string;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'reddit';
  subreddit?: string;
  image?: string;
  title?: string;
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

      // Skip database queries due to RLS issues causing 406 errors
      // TODO: Fix RLS policies for oauth_credentials and social_tokens tables
      console.log('⚠️ [useSocialMedia] Skipping database queries due to RLS issues');

      // Use empty results to avoid errors
      const oauthResult = { data: [] };
      const socialTokensResult = { data: [] };

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

      setConnections(connectionStatus);
      return connectionStatus;
    } catch (error) {
      // Error checking connection status - handled silently

      // Fallback to localStorage only if database fails
      if (user) {
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

  // Test database connection and table structure
  const testDatabaseConnection = async () => {
    try {
      console.log('🔍 [testDatabaseConnection] Testing database connection...');

      // Test if posts table exists and is accessible
      const { data, error } = await supabase
        .from('posts')
        .select('id')
        .limit(1);

      if (error) {
        console.error('❌ [testDatabaseConnection] Database test failed:', error);
        return false;
      }

      console.log('✅ [testDatabaseConnection] Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ [testDatabaseConnection] Database test exception:', error);
      return false;
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
    aiPrompt?: string,
    title?: string
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
      // Simplified post data to match the most common schema
      const postData = {
        user_id: user.id,
        content,
        platform: platforms[0] || 'twitter',
        status,
        ...(image && { image_url: image }),
        ...(scheduledFor && { scheduled_at: scheduledFor }),
        ...(status === 'published' && { published_at: new Date().toISOString() }),
        ...(platformPostIds && Object.keys(platformPostIds).length > 0 && { platform_post_ids: platformPostIds }),
        ...(generatedByAI && { generated_by_ai: generatedByAI }),
        ...(aiPrompt && { ai_prompt: aiPrompt }),
        ...(errorMessage && { error_message: errorMessage }),
        ...(title && { title })
      };

      console.log('💾 [savePostToDatabase] Inserting data:', postData);

      // Try to insert the post
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
          hint: error.hint,
          postData
        });

        // Try a simpler insert without .select().single() which might be causing issues
        console.log('🔄 [savePostToDatabase] Trying simpler insert...');
        const { error: simpleError } = await supabase
          .from('posts')
          .insert([postData]);

        if (simpleError) {
          console.error('❌ [savePostToDatabase] Simple insert also failed:', simpleError);
          return null;
        } else {
          console.log('✅ [savePostToDatabase] Simple insert succeeded');
          // Return a mock object since we can't get the actual data back
          return {
            id: 'unknown',
            ...postData,
            created_at: new Date().toISOString()
          };
        }
      }

      if (data) {
        console.log('✅ [savePostToDatabase] Post saved successfully:', data.id);
        return data;
      }

      // Fallback: try to fetch the most recent post
      console.log('🔍 [savePostToDatabase] No data returned, trying to fetch recent post...');
      try {
        const { data: recentPost } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .eq('content', content)
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

      return null;

    } catch (error) {
      console.error('❌ [savePostToDatabase] Exception:', error);
      return null;
    }
  };

  // Post to a single social media platform
  const postToSocial = async ({ content, platform, subreddit, image, title }: PostToSocialParams): Promise<PostResponse> => {
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

      // Only include title for Reddit posts
      if (platform === 'reddit' && title) {
        requestBody.title = title;
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

  // Test database connection on hook initialization
  useEffect(() => {
    if (user) {
      testDatabaseConnection();
    }
  }, [user]);

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
    savePostToDatabase,
    testDatabaseConnection
  };
};
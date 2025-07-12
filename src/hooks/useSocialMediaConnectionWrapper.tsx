import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppConfig } from "@/lib/appConfig";

export type Platform = 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'reddit';
export type ConnectionStatus = Record<Platform, boolean>;

// Wrapper hook that safely handles the connection logic
export const useSocialMediaConnectionWrapper = (
  onConnectionStatusChange: (newStatus: ConnectionStatus) => void
) => {
  // All hooks must be called at the top level
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isConnecting, setIsConnecting] = useState<Record<Platform, boolean>>({
    twitter: false,
    linkedin: false,
    instagram: false,
    facebook: false,
    reddit: false,
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    twitter: false,
    linkedin: false,
    instagram: false,
    facebook: false,
    reddit: false,
  });

  // Load connection status from database with robust error handling
  const loadConnectionStatus = useCallback(async () => {
    if (!user) {
      console.log('No user, skipping connection status load');
      return;
    }

    try {
      console.log('Loading connection status for user:', user.id);

      // Initialize default status
      const defaultStatus: ConnectionStatus = {
        twitter: false,
        linkedin: false,
        instagram: false,
        facebook: false,
        reddit: false,
      };

      // First check localStorage for immediate UI update
      const statusKey = `connection_status_${user.id}`;
      const cachedStatus = localStorage.getItem(statusKey);

      if (cachedStatus) {
        try {
          const parsed = JSON.parse(cachedStatus);
          console.log('Found cached connection status:', parsed);
          setConnectionStatus(parsed);
          onConnectionStatusChange(parsed);
        } catch (e) {
          console.warn('Failed to parse cached status:', e);
          // Use default status if cache is corrupted
          setConnectionStatus(defaultStatus);
          onConnectionStatusChange(defaultStatus);
        }
      } else {
        // Set default status immediately if no cache
        setConnectionStatus(defaultStatus);
        onConnectionStatusChange(defaultStatus);
      }

      // Try to load from database with graceful error handling
      try {
        const [oauthResult, socialTokensResult] = await Promise.allSettled([
          supabase.from('oauth_credentials').select('platform, expires_at, created_at').eq('user_id', user.id),
          supabase.from('social_tokens').select('platform, expires_at, created_at').eq('user_id', user.id)
        ]);

        // Extract data from settled promises
        const oauthData = oauthResult.status === 'fulfilled' && !oauthResult.value.error ? oauthResult.value.data : [];
        const socialTokensData = socialTokensResult.status === 'fulfilled' && !socialTokensResult.value.error ? socialTokensResult.value.data : [];

        // Combine tokens from both tables
        const allTokens = [
          ...(oauthData || []),
          ...(socialTokensData || [])
        ];

        console.log('Found tokens:', allTokens);

        const newStatus: ConnectionStatus = { ...defaultStatus };

        // Process tokens to determine connection status
        if (allTokens.length > 0) {
          allTokens.forEach((token) => {
            if (token.platform in newStatus) {
              // Check if token is still valid (not expired)
              const isValid = !token.expires_at || new Date(token.expires_at) > new Date();
              newStatus[token.platform as Platform] = isValid;
            }
          });
        }

        console.log('Final connection status:', newStatus);
        setConnectionStatus(newStatus);
        onConnectionStatusChange(newStatus);

        // Update localStorage
        localStorage.setItem(statusKey, JSON.stringify(newStatus));

      } catch (dbError) {
        console.warn('Database query failed, using cached/default status:', dbError);
        // Don't throw error, just use the cached or default status
      }

    } catch (error) {
      console.error('Failed to load connection status:', error);
      // Fallback to default status
      const defaultStatus: ConnectionStatus = {
        twitter: false,
        linkedin: false,
        instagram: false,
        facebook: false,
        reddit: false,
      };
      setConnectionStatus(defaultStatus);
      onConnectionStatusChange(defaultStatus);
    }
  }, [user, onConnectionStatusChange]);

  // Connect to a platform with robust error handling
  const connectPlatform = useCallback(async (platform: Platform) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to connect social media accounts.",
        variant: "destructive",
      });
      return;
    }

    if (isConnecting[platform]) {
      console.log(`Already connecting to ${platform}`);
      return;
    }

    setIsConnecting(prev => ({ ...prev, [platform]: true }));

    try {
      console.log(`Connecting to ${platform}...`);

      const redirectUrl = `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`;

      // Get auth URL with error handling
      let authUrl;
      try {
        authUrl = getAuthUrl(platform, redirectUrl);
      } catch (urlError) {
        throw new Error(`Configuration error for ${platform}. Please check your app settings.`);
      }

      toast({
        title: "Connection initiated",
        description: `Opening ${platform} authentication...`,
      });

      // Open OAuth in new window
      const popup = window.open(
        authUrl,
        `${platform}-oauth`,
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Monitor popup for completion with timeout
      let checkCount = 0;
      const maxChecks = 300; // 5 minutes timeout

      const checkClosed = setInterval(() => {
        checkCount++;

        if (popup.closed) {
          clearInterval(checkClosed);
          setIsConnecting(prev => ({ ...prev, [platform]: false }));
          // Reload connection status after OAuth
          setTimeout(() => loadConnectionStatus(), 1000);
        } else if (checkCount >= maxChecks) {
          // Timeout after 5 minutes
          clearInterval(checkClosed);
          setIsConnecting(prev => ({ ...prev, [platform]: false }));
          popup.close();
          toast({
            title: "Connection timeout",
            description: `${platform} authentication timed out. Please try again.`,
            variant: "destructive",
          });
        }
      }, 1000);

    } catch (error: any) {
      console.error(`Failed to connect to ${platform}:`, error);
      toast({
        title: "Connection failed",
        description: error.message || `Failed to connect to ${platform}. Please try again.`,
        variant: "destructive",
      });
      setIsConnecting(prev => ({ ...prev, [platform]: false }));
    }
  }, [user, isConnecting, toast, loadConnectionStatus]);

  // Get OAuth URL for platform
  const getAuthUrl = (platform: Platform, redirectUrl: string): string => {
    const baseUrls = {
      twitter: 'https://twitter.com/i/oauth2/authorize',
      linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
      instagram: 'https://api.instagram.com/oauth/authorize',
      facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
      reddit: 'https://www.reddit.com/api/v1/authorize'
    };

    const clientId = AppConfig[platform]?.clientId;
    if (!clientId) {
      throw new Error(`Client ID for ${platform} is not configured`);
    }

    const baseUrl = baseUrls[platform];
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUrl,
      response_type: 'code',
      scope: getScope(platform),
      state: `${platform}-${Date.now()}`
    });

    return `${baseUrl}?${params.toString()}`;
  };

  // Get required scopes for each platform
  const getScope = (platform: Platform): string => {
    const scopes = {
      twitter: 'tweet.read tweet.write users.read',
      linkedin: 'r_liteprofile w_member_social',
      instagram: 'user_profile,user_media',
      facebook: 'pages_manage_posts,pages_read_engagement',
      reddit: 'submit,read'
    };
    return scopes[platform] || '';
  };

  // Load connection status on mount and when user changes
  useEffect(() => {
    if (user) {
      loadConnectionStatus();
    }
  }, [user, loadConnectionStatus]);

  // Listen for OAuth success messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'OAUTH_SUCCESS') {
        const { platform } = event.data;
        console.log(`OAuth success for ${platform}`);
        
        toast({
          title: "Connected successfully!",
          description: `Your ${platform} account has been connected.`,
        });

        // Update connection status
        const newStatus = { ...connectionStatus, [platform]: true };
        setConnectionStatus(newStatus);
        onConnectionStatusChange(newStatus);
        
        // Update localStorage
        if (user) {
          const statusKey = `connection_status_${user.id}`;
          localStorage.setItem(statusKey, JSON.stringify(newStatus));
        }
        
        // Reload from database to confirm
        setTimeout(() => loadConnectionStatus(), 500);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast, onConnectionStatusChange, connectionStatus, loadConnectionStatus, user]);

  // Disconnect from a platform
  const disconnectPlatform = useCallback(async (platform: Platform) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to disconnect social media accounts.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Disconnecting from ${platform}...`);

      // Remove tokens from both tables
      const [oauthResult, socialTokensResult] = await Promise.allSettled([
        supabase.from('oauth_credentials').delete().eq('user_id', user.id).eq('platform', platform),
        supabase.from('social_tokens').delete().eq('user_id', user.id).eq('platform', platform)
      ]);

      // Update connection status
      const newStatus = { ...connectionStatus, [platform]: false };
      setConnectionStatus(newStatus);
      onConnectionStatusChange(newStatus);

      // Update localStorage
      if (user) {
        const statusKey = `connection_status_${user.id}`;
        localStorage.setItem(statusKey, JSON.stringify(newStatus));
      }

      toast({
        title: "Disconnected successfully!",
        description: `Your ${platform} account has been disconnected.`,
      });

    } catch (error: any) {
      console.error(`Failed to disconnect from ${platform}:`, error);
      toast({
        title: "Disconnection failed",
        description: error.message || `Failed to disconnect from ${platform}. Please try again.`,
        variant: "destructive",
      });
    }
  }, [user, connectionStatus, toast, onConnectionStatusChange]);

  return {
    connectPlatform,
    disconnectPlatform,
    isConnecting,
    connectionStatus,
    loadConnectionStatus
  };
};

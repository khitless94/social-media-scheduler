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

      // First try localStorage (faster and more reliable)
      const platforms: Platform[] = ['twitter', 'linkedin', 'instagram', 'facebook', 'reddit'];
      let hasLocalData = false;

      platforms.forEach(platform => {
        const key = `connected_${platform}_${user.id}`;
        const isConnected = localStorage.getItem(key) === 'true';
        if (isConnected) {
          defaultStatus[platform] = true;
          hasLocalData = true;
        }
      });

      // If we have local data, use it immediately
      if (hasLocalData) {
        console.log('Using localStorage connection status:', defaultStatus);
        setConnectionStatus(defaultStatus);
        onConnectionStatusChange(defaultStatus);
        return;
      }

      // First check localStorage for immediate UI update
      // Check both the consolidated status and individual platform keys
      const statusKey = `connection_status_${user.id}`;
      const cachedStatus = localStorage.getItem(statusKey);

      let initialStatus = { ...defaultStatus };

      // First try the consolidated status
      if (cachedStatus) {
        try {
          const parsed = JSON.parse(cachedStatus);
          console.log('Found cached connection status:', parsed);
          initialStatus = { ...defaultStatus, ...parsed };
        } catch (e) {
          console.warn('Failed to parse cached status:', e);
        }
      }

      // Then check individual platform keys (used by useSocialMedia hook)
      const platforms: Platform[] = ['twitter', 'linkedin', 'instagram', 'facebook', 'reddit'];
      platforms.forEach(platform => {
        const key = `connected_${platform}_${user.id}`;
        const isConnected = localStorage.getItem(key) === 'true';
        if (isConnected) {
          initialStatus[platform] = true;
          console.log(`✅ [ConnectionWrapper] Found individual key: ${platform} is connected`);
        }
      });

      console.log('Final initial status:', initialStatus);
      console.log('🔄 [ConnectionWrapper] Setting connection status:', initialStatus);
      setConnectionStatus(initialStatus);
      onConnectionStatusChange(initialStatus);
      console.log('✅ [ConnectionWrapper] Connection status updated successfully');

      // Update localStorage for consistency
      localStorage.setItem(statusKey, JSON.stringify(initialStatus));
      platforms.forEach(platform => {
        const key = `connected_${platform}_${user.id}`;
        localStorage.setItem(key, initialStatus[platform].toString());
      });

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

      const redirectUrl = `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback?platform=${platform}&user_id=${user.id}`;

      // Get auth URL with error handling
      let authUrl;
      try {
        console.log(`🔗 [ConnectionWrapper] Getting auth URL for ${platform}...`);
        authUrl = getAuthUrl(platform, redirectUrl);
        console.log(`✅ [ConnectionWrapper] Auth URL generated: ${authUrl}`);
      } catch (urlError) {
        console.error(`❌ [ConnectionWrapper] Failed to generate auth URL for ${platform}:`, urlError);
        throw new Error(`Configuration error for ${platform}: ${urlError.message}`);
      }

      toast({
        title: "Connection initiated",
        description: `Opening ${platform} authentication...`,
      });

      // Store platform info in localStorage as backup
      localStorage.setItem('oauth_platform_in_progress', platform);
      localStorage.setItem('oauth_user_id', user.id);
      console.log(`💾 [ConnectionWrapper] Stored OAuth info: platform=${platform}, user=${user.id}`);

      // Open OAuth in new window
      const popup = window.open(
        authUrl,
        `${platform}-oauth`,
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        // Clean up localStorage if popup fails
        localStorage.removeItem('oauth_platform_in_progress');
        localStorage.removeItem('oauth_user_id');
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Monitor popup for completion with timeout
      let checkCount = 0;
      const maxChecks = 300; // 5 minutes timeout

      const checkClosed = setInterval(() => {
        checkCount++;

        if (popup.closed) {
          clearInterval(checkClosed);

          // Clean up localStorage
          localStorage.removeItem('oauth_platform_in_progress');
          localStorage.removeItem('oauth_user_id');
          console.log(`🧹 [ConnectionWrapper] Cleaned up OAuth localStorage for ${platform}`);

          setIsConnecting(prev => ({ ...prev, [platform]: false }));
          // Reload connection status after OAuth
          setTimeout(() => loadConnectionStatus(), 1000);
        } else if (checkCount >= maxChecks) {
          // Timeout after 5 minutes
          clearInterval(checkClosed);

          // Clean up localStorage on timeout
          localStorage.removeItem('oauth_platform_in_progress');
          localStorage.removeItem('oauth_user_id');

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
      console.error(`❌ [ConnectionWrapper] Failed to connect to ${platform}:`, error);
      console.error(`❌ [ConnectionWrapper] Error details:`, {
        message: error.message,
        stack: error.stack,
        platform,
        user: user?.id
      });

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
    console.log(`🔗 [getAuthUrl] Generating URL for ${platform}...`);

    const baseUrls = {
      twitter: 'https://twitter.com/i/oauth2/authorize',
      linkedin: 'https://www.linkedin.com/oauth/v2/authorization',
      instagram: 'https://api.instagram.com/oauth/authorize',
      facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
      reddit: 'https://www.reddit.com/api/v1/authorize'
    };

    console.log(`🔗 [getAuthUrl] AppConfig for ${platform}:`, AppConfig[platform]);

    const clientId = AppConfig[platform]?.clientId;
    if (!clientId) {
      console.error(`❌ [getAuthUrl] No client ID found for ${platform}`);
      console.error(`❌ [getAuthUrl] Available platforms in AppConfig:`, Object.keys(AppConfig));
      throw new Error(`Client ID for ${platform} is not configured in AppConfig`);
    }

    console.log(`✅ [getAuthUrl] Client ID found for ${platform}: ${clientId}`);

    const baseUrl = baseUrls[platform];
    if (!baseUrl) {
      throw new Error(`Base URL for ${platform} is not configured`);
    }

    const scope = getScope(platform);
    console.log(`🔗 [getAuthUrl] Scope for ${platform}: ${scope}`);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUrl,
      response_type: 'code',
      scope: scope,
      state: `${platform}-${Date.now()}`
    });

    const finalUrl = `${baseUrl}?${params.toString()}`;
    console.log(`✅ [getAuthUrl] Final URL generated: ${finalUrl}`);

    return finalUrl;
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

  // Auto-load connection status when user changes
  useEffect(() => {
    if (user) {
      console.log('🔄 [ConnectionWrapper] User changed, auto-loading connection status...');
      loadConnectionStatus();
    }
  }, [user, loadConnectionStatus]);

  return {
    connectPlatform,
    disconnectPlatform,
    isConnecting,
    connectionStatus,
    loadConnectionStatus
  };
};

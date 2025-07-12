import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Platform = 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'reddit';
export type ConnectionStatus = Record<Platform, boolean>;

// Simple configuration
const AppConfig = {
  twitter: { clientId: 'your-twitter-client-id' },
  linkedin: { clientId: 'your-linkedin-client-id' },
  instagram: { clientId: 'your-instagram-client-id' },
  facebook: { clientId: 'your-facebook-client-id' },
  reddit: { clientId: 'your-reddit-client-id' }
};

export const useSocialMediaConnectionSimple = (
  onConnectionStatusChange: (newStatus: ConnectionStatus) => void
) => {
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

  // Load connection status from database
  const loadConnectionStatus = useCallback(async () => {
    if (!user) return;

    try {
      console.log('Loading connection status for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_social_accounts')
        .select('platform, is_connected')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading connection status:', error);
        return;
      }

      const newStatus: ConnectionStatus = {
        twitter: false,
        linkedin: false,
        instagram: false,
        facebook: false,
        reddit: false,
      };

      if (data) {
        data.forEach((account) => {
          if (account.platform in newStatus) {
            newStatus[account.platform as Platform] = account.is_connected || false;
          }
        });
      }

      console.log('Loaded connection status:', newStatus);
      setConnectionStatus(newStatus);
      onConnectionStatusChange(newStatus);

    } catch (error) {
      console.error('Failed to load connection status:', error);
    }
  }, [user, onConnectionStatusChange]);

  // Connect to a platform
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

      // For now, simulate the connection process
      // In a real implementation, this would redirect to OAuth
      toast({
        title: "Connection initiated",
        description: `Redirecting to ${platform} for authentication...`,
      });

      // Simulate OAuth redirect
      const redirectUrl = `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`;
      const authUrl = getAuthUrl(platform, redirectUrl);
      
      // Open OAuth in new window
      const popup = window.open(
        authUrl,
        `${platform}-oauth`,
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Monitor popup for completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsConnecting(prev => ({ ...prev, [platform]: false }));
          // Reload connection status after OAuth
          setTimeout(() => loadConnectionStatus(), 1000);
        }
      }, 1000);

    } catch (error: any) {
      console.error(`Failed to connect to ${platform}:`, error);
      toast({
        title: "Connection failed",
        description: error.message || `Failed to connect to ${platform}. Please try again.`,
        variant: "destructive",
      });
    } finally {
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

    const clientId = AppConfig[platform]?.clientId || 'demo-client-id';
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
        setConnectionStatus(prev => ({ ...prev, [platform]: true }));
        onConnectionStatusChange({ ...connectionStatus, [platform]: true });
        
        // Reload from database to confirm
        setTimeout(() => loadConnectionStatus(), 500);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast, onConnectionStatusChange, connectionStatus, loadConnectionStatus]);

  return {
    connectPlatform,
    isConnecting,
    connectionStatus,
    loadConnectionStatus
  };
};

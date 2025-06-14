import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppConfig } from "@/lib/appConfig";
import { generateRandomString, createPkceChallenge } from "@/lib/authHelpers";

type Platform = "twitter" | "reddit" | "linkedin" | "facebook" | "instagram";
type ConnectionStatus = Record<Platform, boolean>;

// This helper function is defined outside the hook so it isn't recreated on every render.
const getClientIdForPlatform = (platform: Platform): string => {
  const clientId = AppConfig[platform]?.clientId;
  if (!clientId || clientId.includes('PASTE_YOUR_REAL')) {
    throw new Error(`Client ID for ${platform} is not configured in src/lib/appConfig.ts`);
  }
  return clientId;
};

export const useSocialMediaConnection = (
  onConnectionStatusChange: (newStatus: ConnectionStatus) => void
) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [isConnecting, setIsConnecting] = useState<Record<Platform, boolean>>({
    twitter: false, linkedin: false, instagram: false, facebook: false, reddit: false,
  });

  // Rate limiting: track last connection attempt per platform
  const lastConnectionAttempt = useRef<Record<Platform, number>>({
    twitter: 0, linkedin: 0, instagram: 0, facebook: 0, reddit: 0,
  });

  const CONNECTION_COOLDOWN = 5000; // 5 seconds between attempts

  // useCallback ensures this function reference is stable, making dependent useEffects more efficient.
  const loadConnectionStatusFromDB = useCallback(async () => {
    if (!user) return;
    try {
      // Check both tables for backward compatibility
      const [oauthResult, socialTokensResult] = await Promise.all([
        supabase.from('oauth_credentials').select('platform').eq('user_id', user.id),
        supabase.from('social_tokens').select('platform').eq('user_id', user.id)
      ]);

      const newStatus: ConnectionStatus = { twitter: false, linkedin: false, instagram: false, facebook: false, reddit: false };

      // Combine results from both tables
      const allCredentials = [
        ...(oauthResult.data || []),
        ...(socialTokensResult.data || [])
      ];

      allCredentials.forEach(credential => {
        newStatus[credential.platform as Platform] = true;
      });

      onConnectionStatusChange(newStatus);
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  }, [user, onConnectionStatusChange]);

  // Load initial status when the component mounts or the user changes.
  useEffect(() => {
    loadConnectionStatusFromDB();
  }, [loadConnectionStatusFromDB]);

  // This useEffect handles both the popup message and refreshing on window focus.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: only accept messages from your own app's origin
      if (event.origin !== window.location.origin) {
        console.warn('Rejected message from unauthorized origin:', event.origin);
        return;
      }

      const { type, platform, error } = event.data;

      // Validate message structure
      if (!type || !platform) {
        console.warn('Invalid message structure:', event.data);
        return;
      }

      if (type === "oauth_success") {
        toast({
          title: "Connected successfully!",
          description: `Your ${platform} account is linked.`
        });
        loadConnectionStatusFromDB();
      } else if (type === "oauth_error") {
        toast({
          title: "Connection Failed",
          description: error || 'Unknown error occurred',
          variant: "destructive"
        });
      }

      // Always reset loading state for the platform
      if (platform) {
        setIsConnecting(prev => ({ ...prev, [platform]: false }));
      }
    };

    // A failsafe to refresh status when the user returns to the tab
    const handleFocus = () => { loadConnectionStatusFromDB(); };

    window.addEventListener("message", handleMessage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadConnectionStatusFromDB, toast]);

  const connectPlatform = async (platform: Platform) => {
    if (!user) {
      toast({ title: "Authentication required", variant: "destructive" });
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (isConnecting[platform]) {
      console.log(`Connection already in progress for ${platform}`);
      return;
    }

    // Rate limiting: prevent rapid repeated attempts
    const now = Date.now();
    const lastAttempt = lastConnectionAttempt.current[platform];
    if (now - lastAttempt < CONNECTION_COOLDOWN) {
      const remainingTime = Math.ceil((CONNECTION_COOLDOWN - (now - lastAttempt)) / 1000);
      toast({
        title: "Please wait",
        description: `Please wait ${remainingTime} seconds before trying again.`,
        variant: "destructive"
      });
      return;
    }

    lastConnectionAttempt.current[platform] = now;

    try {
      setIsConnecting(prev => ({ ...prev, [platform]: true }));

      const state = generateRandomString();
      let codeVerifier: string | null = null;
      let codeChallenge: string | null = null;
      if (platform === 'twitter') {
        codeVerifier = generateRandomString();
        codeChallenge = await createPkceChallenge(codeVerifier);
      }

      // Set expires_at to 10 minutes from now to match backend expectations
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: sessionError } = await supabase.from('oauth_sessions').insert({
        state,
        user_id: user.id,
        platform,
        code_verifier: codeVerifier,
        expires_at: expiresAt,
      });
      if (sessionError) throw new Error(`Failed to initialize OAuth session: ${sessionError.message}`);

      // Use the exact redirect URI that matches your LinkedIn app configuration
      // This should match what you have registered in LinkedIn Developer Console
      const redirectUri = `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`;
      const clientId = getClientIdForPlatform(platform);
      let authorizationUrl = '';

      if (platform === 'twitter') {
        const params = new URLSearchParams({
          response_type: 'code', client_id: clientId, redirect_uri: redirectUri,
          scope: 'tweet.read users.read tweet.write offline.access', state: state,
          code_challenge: codeChallenge!, code_challenge_method: 'S256',
        });
        authorizationUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
      } else if (platform === 'reddit') {
        const params = new URLSearchParams({
          response_type: 'code', client_id: clientId, redirect_uri: redirectUri,
          scope: 'identity edit flair history modconfig modflair modlog modposts modwiki mysubreddits privatemessages read report save submit subscribe vote wikiedit wikiread',
          state: state, duration: 'permanent',
        });
        authorizationUrl = `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
      } else if (platform === 'linkedin') {
        // LinkedIn OAuth with proper scopes for posting
        console.log('LinkedIn OAuth Debug Info:', {
          clientId,
          redirectUri,
          state
        });

        const params = new URLSearchParams({
          response_type: 'code',
          client_id: clientId,
          redirect_uri: redirectUri,
          state: state,
          // LinkedIn 2024+ requires OpenID Connect scopes
          // openid, profile, email for account details + w_member_social for posting
          scope: 'openid profile email w_member_social',
        });
        authorizationUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;

        console.log('LinkedIn Authorization URL:', authorizationUrl);
      } else if (platform === 'facebook') {
        const params = new URLSearchParams({
          response_type: 'code', client_id: clientId, redirect_uri: redirectUri, state: state,
          scope: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts',
        });
        authorizationUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
      } else if (platform === 'instagram') {
        const params = new URLSearchParams({
          response_type: 'code', client_id: clientId, redirect_uri: redirectUri, state: state,
          scope: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_manage_insights',
        });
        authorizationUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
      }
      
      if (!authorizationUrl) {
        throw new Error(`Platform "${platform}" is not configured for OAuth connection.`);
      }

      console.log(`Opening OAuth popup for ${platform}:`, authorizationUrl);
      
      const popup = window.open(authorizationUrl, 'oauth-popup', 'width=600,height=750,scrollbars=yes,resizable=yes');
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        throw new Error("Popup blocked. Please enable popups for this site.");
      }

      // Enhanced popup monitoring with timeout and cleanup
      let checkClosedInterval: NodeJS.Timeout;
      const timeoutId = setTimeout(() => {
        if (checkClosedInterval) clearInterval(checkClosedInterval);
        if (!popup.closed) {
          popup.close();
        }
        setIsConnecting(prev => ({ ...prev, [platform]: false }));
        toast({
          title: "Connection Timeout",
          description: `${platform} connection timed out. Please try again.`,
          variant: "destructive"
        });
      }, 300000); // 5 minute timeout

      checkClosedInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosedInterval);
          clearTimeout(timeoutId);
          setIsConnecting(prev => ({ ...prev, [platform]: false }));
        }
      }, 1000);

    } catch (error: any) {
      console.error(`OAuth error for ${platform}:`, error);
      setIsConnecting(prev => ({ ...prev, [platform]: false }));

      // More specific error messages
      let errorMessage = error.message;
      if (error.message.includes('Client ID')) {
        errorMessage = `${platform} is not properly configured. Please check the app settings.`;
      } else if (error.message.includes('Popup blocked')) {
        errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
      }

      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const disconnectPlatform = async (platform: Platform) => {
    if (!user) return;
    try {
      setIsConnecting(prev => ({ ...prev, [platform]: true }));

      // Delete from both tables for complete cleanup
      const [oauthResult, socialTokensResult] = await Promise.all([
        supabase.from('oauth_credentials').delete().match({ user_id: user.id, platform }),
        supabase.from('social_tokens').delete().match({ user_id: user.id, platform })
      ]);

      // Check if either deletion had an error
      if (oauthResult.error && socialTokensResult.error) {
        throw new Error('Failed to disconnect from both credential stores');
      }

      toast({ title: "Disconnected successfully", description: `${platform} account has been disconnected.` });
      loadConnectionStatusFromDB(); // Refresh the UI after disconnecting
    } catch (error: any) {
      console.error(`Error disconnecting ${platform}:`, error);
      toast({ title: "Error", description: "Failed to disconnect account.", variant: "destructive" });
    } finally {
      setIsConnecting(prev => ({ ...prev, [platform]: false }));
    }
  };

  return { isConnecting, connectPlatform, disconnectPlatform };
};
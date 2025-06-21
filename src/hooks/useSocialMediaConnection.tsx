import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppConfig } from "@/lib/appConfig";
import { generateRandomString, createPkceChallenge } from "@/lib/authHelpers";

// Force re-render helper for immediate UI updates
const forceUpdate = () => Math.random();

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

  // Force re-render state for immediate UI updates
  const [, setForceRender] = useState(0);
  const forceRender = () => setForceRender(prev => prev + 1);

  // Track current connection status for immediate updates
  const currentConnectionStatus = useRef<ConnectionStatus>({
    twitter: false, linkedin: false, instagram: false, facebook: false, reddit: false,
  });

  // Rate limiting: track last connection attempt per platform
  const lastConnectionAttempt = useRef<Record<Platform, number>>({
    twitter: 0, linkedin: 0, instagram: 0, facebook: 0, reddit: 0,
  });

  const CONNECTION_COOLDOWN = 5000; // 5 seconds between attempts

  // Retry mechanism for network issues
  const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        console.warn(`Attempt ${i + 1} failed:`, error.message);
        if (i === retries - 1) throw error;

        // Exponential backoff: wait 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
    throw new Error('All retry attempts failed');
  };

  // Alternative query method using direct fetch to bypass HTTP2 issues
  const loadConnectionStatusAlternative = useCallback(async () => {
    if (!user) return;

    try {
      console.log('Using alternative connection status loading method...');

      // Use direct fetch with HTTP/1.1 to bypass HTTP2 protocol errors
      const headers = {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTA5MzcsImV4cCI6MjA2NDc2NjkzN30.sgwl7oP2fJD7rh64w59XWdfMCS0XQcNjD4Qr_WGILGs',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTA5MzcsImV4cCI6MjA2NDc2NjkzN30.sgwl7oP2fJD7rh64w59XWdfMCS0XQcNjD4Qr_WGILGs',
        'Content-Type': 'application/json',
        'Connection': 'close'
      };

      const [oauthResponse, socialResponse] = await Promise.allSettled([
        fetch(`https://eqiuukwwpdiyncahrdny.supabase.co/rest/v1/oauth_credentials?select=platform&user_id=eq.${user.id}`, { headers }),
        fetch(`https://eqiuukwwpdiyncahrdny.supabase.co/rest/v1/social_tokens?select=platform&user_id=eq.${user.id}`, { headers })
      ]);

      const newStatus: ConnectionStatus = { twitter: false, linkedin: false, instagram: false, facebook: false, reddit: false };
      const allCredentials: any[] = [];

      // Process oauth_credentials response
      if (oauthResponse.status === 'fulfilled' && oauthResponse.value.ok) {
        const data = await oauthResponse.value.json();
        if (Array.isArray(data)) {
          allCredentials.push(...data);
          console.log('OAuth credentials found:', data);
        }
      }

      // Process social_tokens response
      if (socialResponse.status === 'fulfilled' && socialResponse.value.ok) {
        const data = await socialResponse.value.json();
        if (Array.isArray(data)) {
          allCredentials.push(...data);
          console.log('Social tokens found:', data);
        }
      }

      // Update status based on found credentials
      allCredentials.forEach(credential => {
        if (credential.platform) {
          newStatus[credential.platform as Platform] = true;
        }
      });

      // Update both the ref and the callback
      currentConnectionStatus.current = newStatus;
      onConnectionStatusChange(newStatus);
      console.log('Alternative method - Successfully loaded connection status:', newStatus);

    } catch (error) {
      console.error('Alternative connection status loading failed:', error);
      // Keep current status on failure
    }
  }, [user, onConnectionStatusChange]);

  const loadConnectionStatusFromDB = async () => {
    if (!user) return;

    try {
      // Try database first (authoritative source)
      const { data: tokens, error } = await supabase
        .from('oauth_credentials')
        .select('platform')
        .eq('user_id', user.id);

      if (!error && tokens) {
        const newStatus: ConnectionStatus = {
          twitter: false, linkedin: false, instagram: false, facebook: false, reddit: false,
        };

        tokens.forEach(token => {
          newStatus[token.platform as Platform] = true;
        });

        console.log('Loaded from DB:', newStatus);

        // Update both state and localStorage
        currentConnectionStatus.current = newStatus;
        onConnectionStatusChange(newStatus);
        saveToLocalStorage(newStatus);

        return; // Success
      } else {
        console.warn('DB query failed, trying localStorage:', error);

        // Fallback to localStorage only if DB fails
        const localStatus = loadFromLocalStorage();
        if (localStatus) {
          console.log('Using localStorage fallback:', localStatus);
          currentConnectionStatus.current = localStatus;
          onConnectionStatusChange(localStatus);
        }
      }
    } catch (error) {
      console.error('Failed to load connection status:', error);

      // Final fallback to localStorage
      const localStatus = loadFromLocalStorage();
      if (localStatus) {
        console.log('Using localStorage final fallback:', localStatus);
        currentConnectionStatus.current = localStatus;
        onConnectionStatusChange(localStatus);
      }
    }
  };

  // Load from localStorage
  const loadFromLocalStorage = (): ConnectionStatus | null => {
    if (!user) return null;

    try {
      const platforms: Platform[] = ['twitter', 'linkedin', 'reddit', 'facebook', 'instagram'];
      const status: ConnectionStatus = {
        twitter: false, linkedin: false, instagram: false, facebook: false, reddit: false,
      };

      let hasAnyConnection = false;
      platforms.forEach(platform => {
        const key = `connected_${platform}_${user.id}`;
        const isConnected = localStorage.getItem(key) === 'true';
        if (isConnected) {
          status[platform] = true;
          hasAnyConnection = true;
        }
      });

      return hasAnyConnection ? status : null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  };

  // Save to localStorage
  const saveToLocalStorage = (status: ConnectionStatus) => {
    if (!user) return;

    try {
      Object.entries(status).forEach(([platform, connected]) => {
        const key = `connected_${platform}_${user.id}`;
        localStorage.setItem(key, connected.toString());
      });
      console.log('Saved to localStorage:', status);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };



  // Debounce mechanism to prevent excessive calls
  const lastLoadTime = useRef<number>(0);
  const LOAD_DEBOUNCE_MS = 2000; // 2 seconds

  const debouncedLoadConnectionStatus = useCallback(async () => {
    const now = Date.now();
    if (now - lastLoadTime.current < LOAD_DEBOUNCE_MS) {
      console.log('Skipping connection status load due to debounce');
      return;
    }
    lastLoadTime.current = now;
    await loadConnectionStatusFromDB();
  }, [user, onConnectionStatusChange]);

  // LOAD CONNECTION STATUS ON MOUNT + POLLING FOR OAUTH SUCCESS
  useEffect(() => {
    const initializeConnectionStatus = () => {
      if (!user) return;

      // Load connection status without aggressive session checking
      setTimeout(() => {
        debouncedLoadConnectionStatus();
      }, 300);
    };

    // BULLETPROOF OAUTH SUCCESS DETECTION - POLLING METHOD
    const pollForOAuthSuccess = () => {
      const interval = setInterval(() => {
        // Check for OAuth success flag in localStorage
        const oauthFlag = localStorage.getItem('oauth_success_flag');
        if (oauthFlag) {
          try {
            const { platform, timestamp, userId } = JSON.parse(oauthFlag);

            // Only process if it's recent (within last 30 seconds) and for current user
            if (Date.now() - timestamp < 30000 && userId === user?.id) {
              console.log(`🎯 POLLING DETECTED: ${platform} OAuth success!`);

              // Trigger immediate UI update
              currentConnectionStatus.current = {
                ...currentConnectionStatus.current,
                [platform]: true
              };

              onConnectionStatusChange(prev => ({
                ...prev,
                [platform]: true
              }));

              forceRender();
              setIsConnecting(prev => ({ ...prev, [platform]: false }));

              // Clean up flag
              localStorage.removeItem('oauth_success_flag');

              toast({
                title: "Connected successfully!",
                description: `Your ${platform} account is linked.`
              });

              console.log(`✅ POLLING SUCCESS: ${platform} UI updated`);
            }
          } catch (e) {
            console.warn('Failed to parse OAuth success flag:', e);
            localStorage.removeItem('oauth_success_flag');
          }
        }

        // Also check individual platform flags
        const platforms: Platform[] = ['twitter', 'linkedin', 'reddit', 'facebook', 'instagram'];
        platforms.forEach(platform => {
          const successKey = `oauth_success_${platform}`;
          const successValue = localStorage.getItem(successKey);
          if (successValue) {
            const timestamp = parseInt(successValue);
            if (Date.now() - timestamp < 30000) { // Within last 30 seconds
              console.log(`🎯 INDIVIDUAL POLLING: ${platform} success detected!`);

              // Update UI immediately + PERSIST
              const newStatus = {
                ...currentConnectionStatus.current,
                [platform]: true
              };

              currentConnectionStatus.current = newStatus;
              onConnectionStatusChange(newStatus);

              // SAVE TO LOCALSTORAGE FOR PERSISTENCE
              if (user) {
                const key = `connected_${platform}_${user.id}`;
                localStorage.setItem(key, 'true');
                console.log(`✅ POLLING PERSISTED: ${platform} saved to localStorage`);
              }

              forceRender();
              setIsConnecting(prev => ({ ...prev, [platform]: false }));

              // Clean up
              localStorage.removeItem(successKey);

              console.log(`✅ INDIVIDUAL POLLING SUCCESS: ${platform} UI updated`);
            }
          }
        });
      }, 1000); // Poll every second

      return interval;
    };

    initializeConnectionStatus();

    // Start polling for OAuth success
    const pollingInterval = pollForOAuthSuccess();

    return () => {
      clearInterval(pollingInterval);
    };
  }, [user, onConnectionStatusChange, forceRender, toast]);

  // BULLETPROOF MESSAGE HANDLER + GLOBAL FUNCTION FOR OAUTH SUCCESS
  useEffect(() => {
    // GLOBAL FUNCTION - Can be called directly from OAuth callback
    const handleOAuthSuccess = (platform: string) => {
      console.log(`🎯 GLOBAL FUNCTION: OAuth success for ${platform} - IMMEDIATE UI UPDATE`);

      // GUARANTEED UI UPDATE STRATEGY + PERSISTENCE

      // 1. Update ref immediately
      currentConnectionStatus.current = {
        ...currentConnectionStatus.current,
        [platform]: true
      };

      // 2. Update parent state immediately
      const newStatus = {
        ...currentConnectionStatus.current,
        [platform]: true
      };
      onConnectionStatusChange(newStatus);

      // 3. SAVE TO LOCALSTORAGE IMMEDIATELY FOR PERSISTENCE
      if (user) {
        const key = `connected_${platform}_${user.id}`;
        localStorage.setItem(key, 'true');
        console.log(`✅ PERSISTED: ${platform} saved to localStorage`);
      }

      // 4. Force component re-render
      forceRender();

      // 5. Stop loading state
      setIsConnecting(prev => ({ ...prev, [platform]: false }));

      // 6. Show success toast
      toast({
        title: "Connected successfully!",
        description: `Your ${platform} account is linked.`
      });

      // 7. Additional updates with delays to ensure UI catches up
      setTimeout(() => {
        onConnectionStatusChange(newStatus);
        forceRender();
      }, 100);

      setTimeout(() => {
        onConnectionStatusChange(newStatus);
        forceRender();
      }, 500);

      console.log(`✅ GLOBAL FUNCTION: ${platform} UI update complete`);
    };

    // Make function globally accessible
    (window as any).handleOAuthSuccess = handleOAuthSuccess;
    (window as any).forceUpdateConnection = handleOAuthSuccess; // Alias for compatibility

    const handleMessage = (event: MessageEvent) => {
      const { type, platform } = event.data || {};
      if (type === "oauth_success" && platform) {
        handleOAuthSuccess(platform);
      }
    };

    // Listen for messages from OAuth popup
    window.addEventListener("message", handleMessage);

    // Also listen for storage events (cross-tab communication)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.startsWith('oauth_success_')) {
        const platform = event.key.replace('oauth_success_', '');
        if (event.newValue) {
          console.log(`🎯 Storage event: ${platform} connected`);
          handleOAuthSuccess(platform);
          // Clean up storage
          localStorage.removeItem(event.key);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorageChange);
      delete (window as any).handleOAuthSuccess;
      delete (window as any).forceUpdateConnection;
    };
  }, [onConnectionStatusChange, toast, forceRender]);

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

      // Verify user is authenticated with retry
      const { data: { session } } = await retryWithBackoff(() => supabase.auth.getSession());
      if (!session) {
        throw new Error('User not authenticated. Please log in first.');
      }

      console.log(`[OAuth] User authenticated, proceeding with ${platform} connection`);

      const state = generateRandomString();
      let codeVerifier: string | null = null;
      let codeChallenge: string | null = null;
      if (platform === 'twitter') {
        codeVerifier = generateRandomString();
        codeChallenge = await createPkceChallenge(codeVerifier);
      }

      // Set expires_at to 10 minutes from now to match backend expectations
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      console.log(`[OAuth] Creating session for ${platform} with state: ${state}`);
      console.log(`[OAuth] Session data:`, {
        state,
        user_id: user.id,
        platform,
        code_verifier: codeVerifier ? 'present' : 'null',
        expires_at: expiresAt,
      });

      // Proceed directly to OAuth without database session storage
      console.log(`[OAuth] Starting OAuth flow for ${platform} (state: ${state})`);

      // Use a simple approach - store session data in URL state parameter
      const sessionData = {
        user_id: user.id,
        platform,
        code_verifier: codeVerifier,
        timestamp: Date.now()
      };

      // Encode session data in the state parameter
      const encodedState = `${state}|${btoa(JSON.stringify(sessionData))}`;

      // Use different redirect URIs for different platforms
      let redirectUri;
      if (platform === 'twitter') {
        // Use local development URL for OAuth callback
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
        const possibleUris = [
          `${supabaseUrl}/functions/v1/oauth-callback`,
          `${window.location.origin}/oauth-callback/twitter`,
          `${window.location.origin}/oauth-callback`,
          `http://localhost:8081/oauth-callback/twitter`
        ];

        // Use the first one by default, but log all possibilities
        redirectUri = possibleUris[0];
        console.log(`[OAuth] Twitter redirect URI options:`, possibleUris);
        console.log(`[OAuth] Using Twitter redirect URI:`, redirectUri);
      } else {
        // Use local development URL for OAuth callback for other platforms
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
        redirectUri = `${supabaseUrl}/functions/v1/oauth-callback`;
      }

      const clientId = getClientIdForPlatform(platform);
      let authorizationUrl = '';

      console.log(`[OAuth] Using redirect URI for ${platform}: ${redirectUri}`);
      console.log(`[OAuth] Client ID for ${platform}: ${clientId}`);

      if (platform === 'twitter') {
        // Twitter OAuth 2.0 with PKCE - be very explicit about parameters
        const params = new URLSearchParams();
        params.append('response_type', 'code');
        params.append('client_id', clientId);
        params.append('redirect_uri', redirectUri);
        params.append('scope', 'tweet.read users.read tweet.write offline.access');
        params.append('state', encodedState);
        params.append('code_challenge', codeChallenge!);
        params.append('code_challenge_method', 'S256');

        authorizationUrl = `https://x.com/i/oauth2/authorize?${params.toString()}`;

        console.log(`[OAuth] Twitter authorization URL: ${authorizationUrl}`);
        console.log(`[OAuth] Twitter PKCE challenge: ${codeChallenge}`);
        console.log(`[OAuth] Twitter state: ${encodedState}`);
      } else if (platform === 'reddit') {
        const params = new URLSearchParams({
          response_type: 'code',
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: 'identity submit read',
          state: encodedState,
          duration: 'permanent',
        });
        authorizationUrl = `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
      } else if (platform === 'linkedin') {
        // LinkedIn OAuth with proper scopes for posting
        console.log('LinkedIn OAuth Debug Info:', {
          clientId,
          redirectUri,
          state: encodedState
        });

        const params = new URLSearchParams({
          response_type: 'code',
          client_id: clientId,
          redirect_uri: redirectUri,
          state: encodedState,
          // LinkedIn 2024+ requires OpenID Connect scopes
          // openid, profile, email for account details + w_member_social for posting
          scope: 'openid profile email w_member_social',
        });
        authorizationUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;

        console.log('LinkedIn Authorization URL:', authorizationUrl);
      } else if (platform === 'facebook') {
        const params = new URLSearchParams({
          response_type: 'code', client_id: clientId, redirect_uri: redirectUri, state: encodedState,
          scope: 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts',
        });
        authorizationUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
      } else if (platform === 'instagram') {
        const params = new URLSearchParams({
          response_type: 'code', client_id: clientId, redirect_uri: redirectUri, state: encodedState,
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
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Database connection issue. OAuth flow will continue, but session may not be saved.';
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

      // Delete from oauth_credentials table (the primary table for connections)
      const { error: deleteError } = await supabase
        .from('oauth_credentials')
        .delete()
        .match({ user_id: user.id, platform });

      if (deleteError) {
        console.error(`Error deleting ${platform} tokens:`, deleteError);
        // Don't throw error if the record doesn't exist (user might not have been connected)
        if (!deleteError.message.includes('No rows found')) {
          throw deleteError;
        }
      }

      // Also try to delete from social_tokens table (backup/legacy table)
      await supabase
        .from('social_tokens')
        .delete()
        .match({ user_id: user.id, platform });

      // Also clean up any oauth sessions for this platform
      await supabase
        .from('oauth_sessions')
        .delete()
        .match({ user_id: user.id, platform });

      // CLEAR FROM LOCALSTORAGE FOR IMMEDIATE UI UPDATE
      const key = `connected_${platform}_${user.id}`;
      localStorage.removeItem(key);
      console.log(`✅ DISCONNECTED: ${platform} removed from localStorage`);

      // Update UI immediately
      const newStatus = {
        ...currentConnectionStatus.current,
        [platform]: false
      };
      currentConnectionStatus.current = newStatus;
      onConnectionStatusChange(newStatus);

      toast({
        title: "Disconnected successfully",
        description: `${platform} account has been disconnected.`
      });

      debouncedLoadConnectionStatus(); // Refresh the UI after disconnecting
    } catch (error: any) {
      console.error(`Error disconnecting ${platform}:`, error);
      toast({
        title: "Error",
        description: `Failed to disconnect ${platform} account: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(prev => ({ ...prev, [platform]: false }));
    }
  };

  const refreshConnectionStatus = async () => {
    console.log('Manual refresh triggered');
    // Force refresh by resetting debounce timer
    lastLoadTime.current = 0;
    await debouncedLoadConnectionStatus();
  };



  return { isConnecting, connectPlatform, disconnectPlatform, refreshConnectionStatus };
};
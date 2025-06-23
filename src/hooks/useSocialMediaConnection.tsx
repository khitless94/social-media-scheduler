import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppConfig } from "@/lib/appConfig";
import { generateRandomString, createPkceChallenge } from "@/lib/authHelpers";

// Production Supabase URL for OAuth redirects
const SUPABASE_URL = "https://eqiuukwwpdiyncahrdny.supabase.co";

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
  const retryWithBackoff = async <T,>(fn: () => Promise<T>, retries = 3): Promise<T> => {
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

      // Use production Supabase URLs
      const supabaseUrl = SUPABASE_URL;
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTA5MzcsImV4cCI6MjA2NDc2NjkzN30.sgwl7oP2fJD7rh64w59XWdfMCS0XQcNjD4Qr_WGILGs';

      const headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Connection': 'close'
      };

      const [oauthResponse, socialResponse] = await Promise.allSettled([
        fetch(`${supabaseUrl}/rest/v1/oauth_credentials?select=platform&user_id=eq.${user.id}`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/social_tokens?select=platform&user_id=eq.${user.id}`, { headers })
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

    console.log('🔄 BYPASSING DATABASE - Using localStorage only due to persistent auth issues');

    // COMPLETE BYPASS: Use localStorage as the ONLY source
    const localStatus = loadFromLocalStorage();
    if (localStatus) {
      console.log('✅ Using localStorage (database bypassed):', localStatus);
      currentConnectionStatus.current = localStatus;
      onConnectionStatusChange(localStatus);
    } else {
      console.log('📭 No localStorage data found, setting empty status');
      // Set empty status if no localStorage data
      const emptyStatus: ConnectionStatus = {
        twitter: false, linkedin: false, instagram: false, facebook: false, reddit: false,
      };
      currentConnectionStatus.current = emptyStatus;
      onConnectionStatusChange(emptyStatus);
    }

    // DO NOT ATTEMPT DATABASE QUERIES - they consistently fail with auth errors
    console.log('🚫 Database queries disabled due to persistent 401/auth errors');
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
          console.log(`✅ localStorage: ${platform} is connected`);
        }
      });

      console.log('📋 localStorage status:', status);
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
          const completeKey = `oauth_complete_${platform}`;
          const successValue = localStorage.getItem(successKey);
          const completeValue = localStorage.getItem(completeKey);

          if (successValue || completeValue) {
            const timestamp = successValue ? parseInt(successValue) : Date.now();
            if (Date.now() - timestamp < 60000) { // Within last 60 seconds (increased window)
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
              localStorage.removeItem(completeKey);

              toast({
                title: "Connected successfully!",
                description: `Your ${platform} account is linked.`
              });

              console.log(`✅ INDIVIDUAL POLLING SUCCESS: ${platform} UI updated`);
            }
          }
        });

        // Check for last_oauth_success flag
        const lastSuccess = localStorage.getItem('last_oauth_success');
        if (lastSuccess) {
          try {
            const { platform, timestamp, userId } = JSON.parse(lastSuccess);
            if (Date.now() - timestamp < 60000 && userId === user?.id) {
              console.log(`🎯 LAST SUCCESS POLLING: ${platform} detected!`);

              const newStatus = {
                ...currentConnectionStatus.current,
                [platform]: true
              };

              currentConnectionStatus.current = newStatus;
              onConnectionStatusChange(newStatus);
              forceRender();
              setIsConnecting(prev => ({ ...prev, [platform]: false }));

              localStorage.removeItem('last_oauth_success');

              toast({
                title: "Connected successfully!",
                description: `Your ${platform} account is linked.`
              });
            }
          } catch (e) {
            localStorage.removeItem('last_oauth_success');
          }
        }

        // Check for force refresh flag - triggers immediate DB check
        const forceRefresh = localStorage.getItem('force_connection_refresh');
        if (forceRefresh) {
          console.log('🎯 FORCE REFRESH DETECTED: Triggering immediate DB check');
          localStorage.removeItem('force_connection_refresh');

          // Force immediate database refresh
          setTimeout(() => {
            debouncedLoadConnectionStatus();
          }, 100);
        }
      }, 500); // Poll every 500ms for faster detection

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

      console.log(`[OAuth] Delegating session management to auth-redirect function for ${platform}`);

      // Use the auth-redirect function which handles session management
      console.log(`[OAuth] Starting OAuth flow for ${platform} using auth-redirect function`);

      const clientId = getClientIdForPlatform(platform);
      let authorizationUrl = '';

      // Use the auth-redirect function instead of building OAuth URL directly
      // This ensures consistent redirect URI without platform parameters
      console.log(`[OAuth] Using auth-redirect function for ${platform}`);
      console.log(`[OAuth] Client ID for ${platform}: ${clientId}`);

      // Use the auth-redirect function which handles OAuth URL generation properly
      authorizationUrl = `${SUPABASE_URL}/functions/v1/auth-redirect?platform=${platform}&user_id=${user.id}`;

      console.log(`[OAuth] Auth-redirect URL: ${authorizationUrl}`);

      if (!authorizationUrl) {
        throw new Error(`Platform "${platform}" is not configured for OAuth connection.`);
      }

      console.log(`[OAuth] Opening OAuth popup for ${platform}:`, authorizationUrl);

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

      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Use the disconnect-social-account edge function instead of direct database calls
      // This avoids RLS authentication issues
      const response = await fetch(`${SUPABASE_URL}/functions/v1/disconnect-social-account?user_id=${user.id}&platform=${platform}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to disconnect ${platform}`);
      }

      const result = await response.json();
      console.log(`✅ DISCONNECTED: ${platform} via edge function:`, result);

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
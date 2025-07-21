import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSocialMediaConnection } from "./useSocialMediaConnection";

export type Platform = "twitter" | "reddit" | "linkedin" | "facebook" | "instagram";
export type ConnectionStatus = Record<Platform, boolean>;

interface SocialAccount {
  id: string;
  platform: string;
  platform_username: string;
  platform_user_id: string;
  is_active: boolean;
  created_at: string;
  token_expires_at?: string;
  account_name?: string;
  account_type?: string;
}

interface EnhancedConnectionHook {
  connectionStatus: ConnectionStatus;
  isConnecting: Record<Platform, boolean>;
  accounts: Record<Platform, SocialAccount[]>;
  connectPlatform: (platform: Platform, showRequirements?: boolean) => Promise<void>;
  disconnectPlatform: (platform: Platform, accountId?: string) => Promise<void>;
  loadConnectionStatus: () => Promise<void>;
  loadAccountsForPlatform: (platform: Platform) => Promise<SocialAccount[]>;
  showRequirementModal: (platform: Platform) => void;
  showMultipleAccountsModal: (platform: Platform) => void;
  showSubredditModal: () => void;
  closeRequirementModal: () => void;
  closeMultipleAccountsModal: () => void;
  closeSubredditModal: () => void;
  requirementModalState: {
    isOpen: boolean;
    platform: Platform | null;
  };
  multipleAccountsModalState: {
    isOpen: boolean;
    platform: Platform | null;
  };
  subredditModalState: {
    isOpen: boolean;
  };
}

// Global cache for connection status to prevent loading delays
const globalConnectionCache = new Map<string, ConnectionStatus>();

export const useSocialMediaConnectionEnhanced = (
  onConnectionStatusChange: (newStatus: ConnectionStatus) => void
): EnhancedConnectionHook => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Stabilize the callback to prevent infinite re-renders
  const stableOnConnectionStatusChange = useCallback(onConnectionStatusChange, []);

  // Use the existing hook for core functionality
  const {
    isConnecting,
    connectPlatform: originalConnectPlatform,
    disconnectPlatform: originalDisconnectPlatform,
    refreshConnectionStatus: originalRefreshConnectionStatus
  } = useSocialMediaConnection(stableOnConnectionStatusChange);

  // Initialize with cached status or localStorage immediately
  const getInitialConnectionStatus = useCallback((): ConnectionStatus => {
    if (!user) return {
      twitter: false,
      linkedin: false,
      instagram: false,
      facebook: false,
      reddit: false
    };

    // Check global cache first
    const cacheKey = `connection_status_${user.id}`;
    const cachedStatus = globalConnectionCache.get(cacheKey);
    if (cachedStatus) {
      // Using cached connection status
      return cachedStatus;
    }

    // Fall back to localStorage for immediate loading
    const platforms: Platform[] = ['twitter', 'linkedin', 'instagram', 'facebook', 'reddit'];
    const status: ConnectionStatus = {
      twitter: false,
      linkedin: false,
      instagram: false,
      facebook: false,
      reddit: false
    };

    platforms.forEach(platform => {
      const key = `connected_${platform}_${user.id}`;
      const isConnected = localStorage.getItem(key) === 'true';
      if (isConnected) {
        status[platform] = true;
      }
    });

    // Using localStorage connection status
    return status;
  }, [user]);

  // Enhanced state with immediate initialization
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(getInitialConnectionStatus);

  const [accounts, setAccounts] = useState<Record<Platform, SocialAccount[]>>({
    twitter: [],
    linkedin: [],
    instagram: [],
    facebook: [],
    reddit: []
  });

  // Modal states
  const [requirementModalState, setRequirementModalState] = useState<{
    isOpen: boolean;
    platform: Platform | null;
  }>({
    isOpen: false,
    platform: null
  });

  const [multipleAccountsModalState, setMultipleAccountsModalState] = useState<{
    isOpen: boolean;
    platform: Platform | null;
  }>({
    isOpen: false,
    platform: null
  });

  const [subredditModalState, setSubredditModalState] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false
  });

  // Load connection status and accounts with debouncing
  const loadConnectionStatus = useCallback(async () => {
    if (!user) return;

    try {
      // Update cache and state immediately from localStorage for instant UI updates
      const loadCacheKey = `connection_status_${user.id}`;
      const currentStatus = getInitialConnectionStatus();
      globalConnectionCache.set(loadCacheKey, currentStatus);
      setConnectionStatus(currentStatus);
      stableOnConnectionStatusChange(currentStatus);

      // Load basic connection status
      await originalRefreshConnectionStatus();

      // Load detailed account information for each platform
      const platforms: Platform[] = ['twitter', 'linkedin', 'instagram', 'facebook', 'reddit'];

      // Mock data for testing - replace with actual database calls
      const accountsData: Record<Platform, SocialAccount[]> = {
        twitter: connectionStatus.twitter ? [
          {
            id: '1',
            platform: 'twitter',
            platform_username: '@johndoe',
            platform_user_id: 'twitter_123',
            is_active: true,
            created_at: '2024-01-15T00:00:00Z',
            account_name: 'Personal Twitter',
            account_type: 'Personal'
          }
        ] : [],
        linkedin: connectionStatus.linkedin ? [
          {
            id: '2',
            platform: 'linkedin',
            platform_username: 'john-doe-professional',
            platform_user_id: 'linkedin_456',
            is_active: true,
            created_at: '2024-01-12T00:00:00Z',
            account_name: 'John Doe',
            account_type: 'Personal'
          }
        ] : [],
        instagram: connectionStatus.instagram ? [
          {
            id: '3',
            platform: 'instagram',
            platform_username: '@john_doe',
            platform_user_id: 'instagram_789',
            is_active: true,
            created_at: '2024-01-15T00:00:00Z',
            account_name: 'Personal Instagram',
            account_type: 'Personal'
          },
          {
            id: '4',
            platform: 'instagram',
            platform_username: '@mybusiness',
            platform_user_id: 'instagram_101',
            is_active: true,
            created_at: '2024-01-20T00:00:00Z',
            account_name: 'Business Account',
            account_type: 'Business'
          }
        ] : [],
        facebook: connectionStatus.facebook ? [
          {
            id: '5',
            platform: 'facebook',
            platform_username: 'My Business Page',
            platform_user_id: 'facebook_202',
            is_active: true,
            created_at: '2024-01-10T00:00:00Z',
            account_name: 'My Business Page',
            account_type: 'Business'
          }
        ] : [],
        reddit: connectionStatus.reddit ? [
          {
            id: '6',
            platform: 'reddit',
            platform_username: 'u/johndoe123',
            platform_user_id: 'reddit_303',
            is_active: true,
            created_at: '2024-01-22T00:00:00Z',
            account_name: 'Reddit Account',
            account_type: 'Personal'
          }
        ] : []
      };

      for (const platform of platforms) {
        const platformAccounts = await loadAccountsForPlatform(platform);
        accountsData[platform] = platformAccounts;
      }

      setAccounts(accountsData);

      // Update connection status based on active accounts
      const newStatus: ConnectionStatus = {
        twitter: accountsData.twitter.some(acc => acc.is_active),
        linkedin: accountsData.linkedin.some(acc => acc.is_active),
        instagram: accountsData.instagram.some(acc => acc.is_active),
        facebook: accountsData.facebook.some(acc => acc.is_active),
        reddit: accountsData.reddit.some(acc => acc.is_active)
      };

      // Update cache with the latest status
      const updateCacheKey = `connection_status_${user.id}`;
      globalConnectionCache.set(updateCacheKey, newStatus);

      setConnectionStatus(newStatus);
      stableOnConnectionStatusChange(newStatus);

    } catch (error) {
      console.error('Error loading enhanced connection status:', error);
    }
  }, [user, originalRefreshConnectionStatus, stableOnConnectionStatusChange, getInitialConnectionStatus]);

  // Initialize connection status immediately when user changes
  useEffect(() => {
    if (user) {
      const initialStatus = getInitialConnectionStatus();
      setConnectionStatus(initialStatus);
      stableOnConnectionStatusChange(initialStatus);
      // Initialized with immediate status
    }
  }, [user, getInitialConnectionStatus, stableOnConnectionStatusChange]);

  // Load accounts for a specific platform
  const loadAccountsForPlatform = useCallback(async (platform: Platform): Promise<SocialAccount[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error(`Error loading accounts for ${platform}:`, error);
      return [];
    }
  }, [user]);

  // Enhanced connect platform with requirement modal
  const connectPlatform = useCallback(async (platform: Platform, showRequirements: boolean = true) => {
    // Connecting to platform

    if (!user) {
      toast({ title: "Authentication required", variant: "destructive" });
      return;
    }

    // Check if we should show requirements modal first
    if (showRequirements && ['instagram', 'facebook', 'linkedin', 'twitter'].includes(platform)) {
      // Showing requirements modal
      setRequirementModalState({
        isOpen: true,
        platform
      });
      return;
    }

    // Proceed with actual connection for all platforms (including Reddit)
    await originalConnectPlatform(platform);

    // Refresh connection status after connection
    await loadConnectionStatus();
  }, [user, toast, originalConnectPlatform, loadConnectionStatus]);

  // Enhanced disconnect with account-specific support
  const disconnectPlatform = useCallback(async (platform: Platform, accountId?: string) => {
    if (!user) return;

    try {
      if (accountId) {
        // Disconnect specific account
        const { error } = await supabase
          .from('social_accounts')
          .delete()
          .eq('id', accountId);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Account disconnected from ${platform}`
        });
      } else {
        // Disconnect all accounts for platform (original behavior)
        await originalDisconnectPlatform(platform);
      }

      // Refresh connection status after disconnection
      await loadConnectionStatus();

    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to disconnect from ${platform}`,
        variant: "destructive"
      });
    }
  }, [user, toast, originalDisconnectPlatform, loadConnectionStatus, connectionStatus, stableOnConnectionStatusChange]);

  // Modal control functions
  const showRequirementModal = useCallback((platform: Platform) => {
    // Showing requirement modal
    setRequirementModalState({
      isOpen: true,
      platform
    });
  }, []);

  const showMultipleAccountsModal = useCallback((platform: Platform) => {
    // Showing multiple accounts modal
    setMultipleAccountsModalState({
      isOpen: true,
      platform
    });
  }, []);

  const showSubredditModal = useCallback(() => {
    setSubredditModalState({ isOpen: true });
  }, []);

  const closeRequirementModal = useCallback(() => {
    setRequirementModalState({ isOpen: false, platform: null });
  }, []);

  const closeMultipleAccountsModal = useCallback(() => {
    setMultipleAccountsModalState({ isOpen: false, platform: null });
  }, []);

  const closeSubredditModal = useCallback(() => {
    setSubredditModalState({ isOpen: false });
  }, []);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadConnectionStatus();
    }
  }, [user, loadConnectionStatus]);

  return {
    connectionStatus,
    isConnecting,
    accounts,
    connectPlatform,
    disconnectPlatform,
    loadConnectionStatus,
    loadAccountsForPlatform,
    showRequirementModal,
    showMultipleAccountsModal,
    showSubredditModal,
    closeRequirementModal,
    closeMultipleAccountsModal,
    closeSubredditModal,
    requirementModalState,
    multipleAccountsModalState,
    subredditModalState
  };
};

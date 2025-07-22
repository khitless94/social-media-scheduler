import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ExternalLink, Loader2, Users, Plus, ChevronDown, Share2, RefreshCw, Settings, X } from "lucide-react";
import { useSocialMediaConnection } from "@/hooks/useSocialMediaConnection";
import { platforms } from "@/constants/platforms";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PlatformRequirementModal from "@/components/modals/PlatformRequirementModal";
import MultipleAccountsModal from "@/components/modals/MultipleAccountsModal";
import SubredditManagementModal from "@/components/modals/SubredditManagementModal";


interface SocialMediaConfigProps {
  connectionStatus: {
    twitter: boolean;
    linkedin: boolean;
    instagram: boolean;
    facebook: boolean;
    reddit: boolean;
  };
  onConnectionStatusChange: (newStatus: any) => void;
}

const SocialMediaConfig = ({ connectionStatus, onConnectionStatusChange }: SocialMediaConfigProps) => {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Modal states for multi-account functionality
  const [requirementModalState, setRequirementModalState] = useState<{
    isOpen: boolean;
    platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'reddit' | null;
  }>({
    isOpen: false,
    platform: null
  });

  const [multipleAccountsModalState, setMultipleAccountsModalState] = useState<{
    isOpen: boolean;
    platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'reddit' | null;
  }>({
    isOpen: false,
    platform: null
  });

  const [subredditModalState, setSubredditModalState] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false
  });

  // State to track connected accounts for each platform
  const [accountCounts, setAccountCounts] = useState<Record<string, number>>({
    twitter: 0,
    linkedin: 0,
    instagram: 0,
    facebook: 0,
    reddit: 0
  });

  // Create a wrapper for onConnectionStatusChange that forces re-render
  const handleConnectionStatusChange = React.useCallback((newStatus: any) => {
    onConnectionStatusChange(newStatus);
    setForceUpdate(prev => prev + 1); // Force component re-render
  }, [onConnectionStatusChange]);

  const {
    isConnecting,
    connectPlatform,
    disconnectPlatform,
    refreshConnectionStatus
  } = useSocialMediaConnection(handleConnectionStatusChange);

  // Modal control functions
  const showRequirementModal = (platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'reddit') => {
    setRequirementModalState({
      isOpen: true,
      platform
    });
  };

  const closeRequirementModal = () => {
    setRequirementModalState({
      isOpen: false,
      platform: null
    });
  };

  const showMultipleAccountsModal = (platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'reddit') => {
    setMultipleAccountsModalState({
      isOpen: true,
      platform
    });
  };

  const closeMultipleAccountsModal = () => {
    setMultipleAccountsModalState({
      isOpen: false,
      platform: null
    });
  };

  const showSubredditModal = () => {
    setSubredditModalState({
      isOpen: true
    });
  };

  const closeSubredditModal = () => {
    setSubredditModalState({
      isOpen: false
    });
  };

  const handleDisconnect = async (platformKey: string) => {
    try {
      if (user) {
        const key = `connected_${platformKey}_${user.id}`;
        localStorage.removeItem(key);
        const newStatus = {
          ...connectionStatus,
          [platformKey]: false
        };
        handleConnectionStatusChange(newStatus);
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  // Function to load accounts for a platform (for future enhancement)
  const loadAccountsForPlatform = async (platform: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .eq('is_active', true);

      if (error) {
        console.error('Error loading accounts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error loading accounts:', error);
      return [];
    }
  };

  // Function to load account counts for all platforms
  const loadAccountCounts = async () => {
    if (!user) return;

    const platforms = ['twitter', 'linkedin', 'instagram', 'facebook', 'reddit'];
    const counts: Record<string, number> = {};

    for (const platform of platforms) {
      const accounts = await loadAccountsForPlatform(platform);
      counts[platform] = accounts.length;
    }

    setAccountCounts(counts);
  };

  // Load account counts when component mounts or user changes
  React.useEffect(() => {
    if (user) {
      loadAccountCounts();
    }
  }, [user]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {platforms.map((platform) => {
              const isConnected = connectionStatus[platform.key as keyof typeof connectionStatus];
              const isLoading = isConnecting[platform.key as keyof typeof isConnecting];

              return (
                <div key={platform.key} className={`group flex flex-col h-full p-6 rounded-xl transition-all duration-300 relative min-h-[240px] ${
                  isConnected
                    ? 'bg-gradient-to-br from-white to-green-50/30 border-2 border-green-200 hover:border-green-300 hover:shadow-lg hover:shadow-green-100/50'
                    : 'bg-gradient-to-br from-white to-gray-50/50 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50'
                }`}>
                  {/* Background decoration */}
                  <div className={`absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 transform translate-x-6 -translate-y-6 ${
                    isConnected ? 'bg-green-400' : 'bg-blue-400'
                  }`}></div>

                  {/* Header Section - Centered Logo */}
                  <div className="flex flex-col items-center text-center mb-6 relative z-10">
                    {/* Centered logo with enhanced styling */}
                    <div className={`p-4 rounded-2xl transition-all duration-300 mb-4 ${
                      isConnected
                        ? 'bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300 group-hover:scale-110 shadow-lg shadow-green-200/50'
                        : 'bg-gradient-to-br from-gray-100 to-blue-100 border-2 border-gray-300 group-hover:scale-110 group-hover:border-blue-400 shadow-lg shadow-gray-200/50'
                    }`}>
                      <platform.icon className={`h-10 w-10 ${isConnected ? 'text-green-600' : platform.color}`} />
                    </div>

                    {/* Platform name for disconnected state */}
                    {!isConnected && (
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{platform.name}</h3>
                    )}

                    {/* Connection Status */}
                    <div className="flex items-center justify-center space-x-2 min-h-[40px]">
                      {isConnected ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-300/50"></div>
                          <div className="flex flex-col items-center">
                            <span className="text-sm text-green-700 font-semibold">Connected</span>
                            {accountCounts[platform.key] > 0 && (
                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                {accountCounts[platform.key]} account{accountCounts[platform.key] !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-gray-400 rounded-full mb-2"></div>
                          <span className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">Not Connected</span>
                          <p className="text-xs text-gray-400 mt-2 text-center">Connect to start scheduling posts</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - Fixed at bottom */}
                  <div className="mt-auto pt-4">
                    {!isConnected ? (
                      <div className="space-y-3">
                        <Button
                          onClick={() => {
                            // Show requirement modal first for all platforms
                            showRequirementModal(platform.key as any);
                          }}
                          disabled={isLoading}
                          className={`w-full font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg ${
                            platform.key === 'twitter' ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-blue-200' :
                            platform.key === 'linkedin' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-300' :
                            platform.key === 'instagram' ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-pink-200' :
                            platform.key === 'facebook' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-300' :
                            platform.key === 'reddit' ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-orange-200' :
                            'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-blue-200'
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              <span>Connecting...</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              <span>Connect {platform.name}</span>
                            </>
                          )}
                        </Button>

                        {/* Feature highlights for disconnected state */}
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
                              <span>Auto-post</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                              <span>Schedule</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-purple-400 rounded-full mr-1"></div>
                              <span>Analytics</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Primary action button */}
                        <Button
                          variant="outline"
                          onClick={() => showMultipleAccountsModal(platform.key as any)}
                          className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 py-2.5 font-medium transition-all duration-200"
                        >
                          <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span>Manage Accounts</span>
                        </Button>

                        {/* Secondary actions row */}
                        <div className="flex items-center gap-2">
                          {/* Special button for Reddit subreddit management */}
                          {platform.key === 'reddit' && (
                            <Button
                              variant="outline"
                              onClick={showSubredditModal}
                              className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 font-medium py-2"
                              title="Manage Subreddits"
                            >
                              <Settings className="mr-1 h-4 w-4" />
                              <span className="hidden lg:inline">Subreddits</span>
                              <span className="lg:hidden">Sub</span>
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            onClick={() => showRequirementModal(platform.key as any)}
                            className={`${platform.key === 'reddit' ? 'flex-1' : 'flex-1'} border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 py-2 font-medium transition-all duration-200`}
                            title="Add Account"
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            <span className="hidden lg:inline">Add Account</span>
                            <span className="lg:hidden">Add</span>
                          </Button>
                        </div>

                        {/* Disconnect button */}
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (accountCounts[platform.key] > 1) {
                              // If multiple accounts, show account selection modal
                              showMultipleAccountsModal(platform.key as any);
                            } else {
                              // If single account, disconnect directly
                              handleDisconnect(platform.key);
                            }
                          }}
                          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 py-2 font-medium transition-all duration-200"
                          title={accountCounts[platform.key] > 1 ? "Choose account to disconnect" : "Disconnect account"}
                        >
                          <X className="mr-1 h-4 w-4" />
                          <span>
                            {accountCounts[platform.key] > 1 ? "Disconnect Account" : "Disconnect"}
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
      </div>

      {/* Multi-Account Modals */}
      <PlatformRequirementModal
        isOpen={requirementModalState.isOpen}
        onClose={closeRequirementModal}
        platform={requirementModalState.platform}
        onContinue={async () => {
          if (requirementModalState.platform && user) {
            try {
              // Close modal first
              closeRequirementModal();

              // Perform OAuth connection
              localStorage.setItem('oauth_platform_in_progress', requirementModalState.platform);
              localStorage.setItem('oauth_user_id', user.id);
              const authUrl = `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/auth-redirect?platform=${requirementModalState.platform}&user_id=${user.id}`;
              const popup = window.open(
                authUrl,
                `${requirementModalState.platform}-oauth`,
                'width=600,height=600,scrollbars=yes,resizable=yes'
              );
              if (!popup) {
                localStorage.removeItem('oauth_platform_in_progress');
                localStorage.removeItem('oauth_user_id');
                return;
              }

              // Refresh account counts after connection attempt
              setTimeout(() => loadAccountCounts(), 2000);
            } catch (error) {
              // Connection error handled silently
            }
          }
        }}
      />

      <MultipleAccountsModal
        isOpen={multipleAccountsModalState.isOpen}
        onClose={() => {
          closeMultipleAccountsModal();
          // Refresh account counts when modal closes
          loadAccountCounts();
        }}
        platform={multipleAccountsModalState.platform}
        onConnectNew={() => {
          if (multipleAccountsModalState.platform) {
            showRequirementModal(multipleAccountsModalState.platform);
          }
        }}
      />

      <SubredditManagementModal
        isOpen={subredditModalState.isOpen}
        onClose={closeSubredditModal}
      />
    </>
  );
};

export default SocialMediaConfig;

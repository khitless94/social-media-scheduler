import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ExternalLink, Loader2, Users, Plus, ChevronDown, Share2, RefreshCw } from "lucide-react";
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
    <div className="w-full">
      <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full transform translate-x-8 -translate-y-8"></div>
          <div className="relative z-10">
            <CardTitle className="flex items-center justify-between text-2xl">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                  <Share2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Social Media Connections</h2>
                  <p className="text-sm text-gray-600 font-normal mt-1">Connect your social media accounts to start scheduling posts</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsRefreshing(true);
                  try {
                    // Refresh connection status
                    await refreshConnectionStatus();

                    // Also refresh account counts
                    await loadAccountCounts();

                    // Manually check localStorage and update connection status
                    if (user) {
                      const platforms = ['twitter', 'linkedin', 'instagram', 'facebook', 'reddit'];
                      const newStatus = { ...connectionStatus };
                      let hasChanges = false;

                      platforms.forEach(platform => {
                        const key = `connected_${platform}_${user.id}`;
                        const isConnected = localStorage.getItem(key) === 'true';
                        if (newStatus[platform as keyof typeof newStatus] !== isConnected) {
                          newStatus[platform as keyof typeof newStatus] = isConnected;
                          hasChanges = true;
                        }
                      });

                      if (hasChanges) {
                        handleConnectionStatusChange(newStatus);
                      }
                    }

                    // Force component re-render
                    setForceUpdate(prev => prev + 1);
                  } catch (error) {
                    // Refresh error handled silently
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
                disabled={isRefreshing}
                className="border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {platforms.map((platform) => {
              const isConnected = connectionStatus[platform.key as keyof typeof connectionStatus];
              const isLoading = isConnecting[platform.key as keyof typeof isConnecting];

              return (
                <div key={platform.key} className="group flex flex-col p-6 rounded-xl border-2 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:border-purple-200 hover:shadow-lg relative">
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white border-2 group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                        <platform.icon className={`h-8 w-8 ${platform.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900">{platform.name}</h3>
                      </div>
                    </div>

                    {/* Connection Status */}
                    {isConnected && (
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-green-600 font-medium">Connected</span>
                          {accountCounts[platform.key] > 0 && (
                            <span className="text-xs text-gray-500">
                              {accountCounts[platform.key]} account{accountCounts[platform.key] !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 min-w-0">
                    {!isConnected ? (
                      <Button
                        onClick={() => {
                          // Show requirement modal first for all platforms
                          showRequirementModal(platform.key as any);
                        }}
                        disabled={isLoading}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            <span>Connect</span>
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 w-full min-w-0">
                        <Button
                          variant="outline"
                          onClick={() => showMultipleAccountsModal(platform.key as any)}
                          className="flex-1 border-gray-200 hover:bg-gray-50"
                        >
                          <Users className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">Manage Accounts</span>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => showRequirementModal(platform.key as any)}
                          className="flex-shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-shrink-0 border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  if (user) {
                                    const key = `connected_${platform.key}_${user.id}`;
                                    localStorage.removeItem(key);
                                    const newStatus = {
                                      ...connectionStatus,
                                      [platform.key]: false
                                    };
                                    handleConnectionStatusChange(newStatus);
                                  }
                                } catch (error) {
                                  // Disconnect error handled silently
                                }
                              }}
                              className="text-red-600"
                            >
                              Disconnect All Accounts
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
};

export default SocialMediaConfig;

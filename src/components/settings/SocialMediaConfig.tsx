import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSocialMediaConnectionEnhanced } from "@/hooks/useSocialMediaConnectionEnhanced";
import { platforms } from "@/constants/platforms";
import { EnhancedPlatformCard } from "./EnhancedPlatformCard";
import { Share2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
  const {
    connectionStatus: enhancedConnectionStatus,
    isConnecting,
    accounts,
    connectPlatform,
    disconnectPlatform,
    loadConnectionStatus: refreshConnectionStatus,
    showRequirementModal,
    showMultipleAccountsModal,
    showSubredditModal,
    closeRequirementModal,
    closeMultipleAccountsModal,
    closeSubredditModal,
    requirementModalState,
    multipleAccountsModalState,
    subredditModalState
  } = useSocialMediaConnectionEnhanced(onConnectionStatusChange);



  // Direct localStorage check function
  const checkLocalStorageDirectly = React.useCallback(() => {
    if (!user) return;

    console.log('🔍 [SocialMediaConfig] Direct localStorage check:');
    const platforms = ['twitter', 'linkedin', 'instagram', 'facebook', 'reddit'];
    const userId = user.id;

    platforms.forEach(platform => {
      const key = `connected_${platform}_${userId}`;
      const value = localStorage.getItem(key);
      console.log(`  ${key}: ${value}`);
    });

    const statusKey = `connection_status_${userId}`;
    const statusValue = localStorage.getItem(statusKey);
    console.log(`  ${statusKey}: ${statusValue}`);

    // Try to update connection status directly from localStorage
    const directStatus = {
      twitter: localStorage.getItem(`connected_twitter_${userId}`) === 'true',
      linkedin: localStorage.getItem(`connected_linkedin_${userId}`) === 'true',
      instagram: localStorage.getItem(`connected_instagram_${userId}`) === 'true',
      facebook: localStorage.getItem(`connected_facebook_${userId}`) === 'true',
      reddit: localStorage.getItem(`connected_reddit_${userId}`) === 'true',
    };

    console.log('🔄 [SocialMediaConfig] Direct status from localStorage:', directStatus);
    onConnectionStatusChange(directStatus);
  }, [user]); // FIXED: Removed onConnectionStatusChange dependency to prevent infinite loop

  // Initialize connection status immediately when component mounts
  React.useEffect(() => {
    if (user) {
      console.log('🚀 [SocialMediaConfig] Component mounted, checking immediate status...');
      // First check localStorage immediately for instant UI update
      checkLocalStorageDirectly();
      // Then refresh in background for accuracy
      setTimeout(() => refreshConnectionStatus(), 100);
    }
  }, [user, checkLocalStorageDirectly, refreshConnectionStatus]);

  return (
    <>
      <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full transform translate-x-8 -translate-y-8"></div>
          <div className="relative z-10">
            <CardTitle className="flex items-center justify-between text-2xl">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                  <Share2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                    Social Media Connections
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-600 font-medium">
                      {Object.values(connectionStatus).filter(Boolean).length} Connected
                    </span>
                  </div>
                </div>
              </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                onClick={async () => {
                  console.log('🔄 [SocialMediaConfig] Refresh button clicked');
                  setIsRefreshing(true);
                  try {
                    // Force refresh connection status
                    await refreshConnectionStatus();
                    // Also check localStorage directly for immediate update
                    checkLocalStorageDirectly();
                    console.log('✅ [SocialMediaConfig] Refresh completed');
                  } catch (error) {
                    console.error('❌ [SocialMediaConfig] Refresh failed:', error);
                  } finally {
                    setIsRefreshing(false);
                  }
                }}
                className="text-xs bg-white/80 hover:bg-white"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>

            </div>
          </CardTitle>
          <CardDescription className="text-base text-gray-600 mt-3">
            Connect your social media accounts to post content directly from the app and manage all platforms in one place
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {platforms.map((platform) => {
            const isConnected = enhancedConnectionStatus[platform.key as keyof typeof enhancedConnectionStatus] || connectionStatus[platform.key as keyof typeof connectionStatus];
            const isLoading = isConnecting[platform.key as keyof typeof isConnecting];
            const platformAccounts = accounts[platform.key as keyof typeof accounts] || [];

            return (
              <EnhancedPlatformCard
                key={platform.key}
                platform={platform}
                isConnected={isConnected}
                isLoading={isLoading}
                accounts={platformAccounts}
                onConnect={(key: string) => {
                  console.log('🚀 [SocialMediaConfig] onConnect called for:', key);
                  connectPlatform(key as any, false).catch(console.error);
                }}
                onDisconnect={(key: string) => {
                  disconnectPlatform(key as any).catch(console.error);
                }}
                onShowRequirements={(platform) => {
                  showRequirementModal(platform);
                }}
                onShowMultipleAccounts={(platform) => {
                  showMultipleAccountsModal(platform);
                }}
                onShowSubreddits={() => {
                  showSubredditModal();
                }}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>

    {/* Enhanced Modals */}
    <PlatformRequirementModal
      isOpen={requirementModalState.isOpen}
      onClose={closeRequirementModal}
      platform={requirementModalState.platform}
      onContinue={() => {
        if (requirementModalState.platform) {
          connectPlatform(requirementModalState.platform, false).catch(console.error);
          closeRequirementModal();
        }
      }}
    />

    <MultipleAccountsModal
      isOpen={multipleAccountsModalState.isOpen}
      onClose={closeMultipleAccountsModal}
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

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSocialMediaConnection } from "@/hooks/useSocialMediaConnection";
import { platforms } from "@/constants/platforms";
import { PlatformCard } from "./PlatformCard";
import { Share2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
  const { isConnecting, connectPlatform, disconnectPlatform, loadConnectionStatus } = useSocialMediaConnection(onConnectionStatusChange);

  const refreshConnectionStatus = () => {
    console.log('🔄 [SocialMediaConfig] Refresh button clicked');
    loadConnectionStatus();
  };

  // Direct localStorage check function
  const checkLocalStorageDirectly = () => {
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
  };

  // Force load connection status when component mounts
  React.useEffect(() => {
    if (user) {
      console.log('🚀 [SocialMediaConfig] Component mounted, loading connection status...');
      loadConnectionStatus();
      // Also check localStorage directly
      setTimeout(() => checkLocalStorageDirectly(), 1000);
    }
  }, [user, loadConnectionStatus]);

  return (
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
                onClick={refreshConnectionStatus}
                className="text-xs bg-white/80 hover:bg-white"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              {process.env.NODE_ENV === 'development' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Test OAuth success simulation
                      if ((window as any).handleOAuthSuccess) {
                        (window as any).handleOAuthSuccess('twitter');
                      }
                    }}
                    className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                  >
                    Test OAuth
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Clear all test localStorage entries
                      const platforms = ['twitter', 'linkedin', 'instagram', 'facebook', 'reddit'];
                      const userId = user?.id || 'test-user';

                      console.log('🧹 Clearing localStorage for user:', userId);

                      platforms.forEach(platform => {
                        const key = `connected_${platform}_${userId}`;
                        const value = localStorage.getItem(key);
                        console.log(`Removing ${key}: ${value}`);
                        localStorage.removeItem(key);
                        localStorage.removeItem(`oauth_success_${platform}`);
                        localStorage.removeItem(`oauth_complete_${platform}`);
                      });
                      localStorage.removeItem(`connection_status_${userId}`);
                      localStorage.removeItem('last_oauth_success');

                      // Refresh connection status
                      refreshConnectionStatus();

                      console.log('🧹 Cleared all test localStorage entries for user:', userId);
                    }}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-800"
                  >
                    Clear Test Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Debug localStorage entries
                      const platforms = ['twitter', 'linkedin', 'instagram', 'facebook', 'reddit'];
                      const userId = user?.id || 'test-user';

                      console.log('🔍 Debug localStorage for user:', userId);
                      platforms.forEach(platform => {
                        const key = `connected_${platform}_${userId}`;
                        const value = localStorage.getItem(key);
                        console.log(`${key}: ${value}`);
                      });

                      const statusKey = `connection_status_${userId}`;
                      const statusValue = localStorage.getItem(statusKey);
                      console.log(`${statusKey}: ${statusValue}`);
                    }}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800"
                  >
                    Debug Storage
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Simulate connections for testing
                      const platforms = ['twitter', 'linkedin'];
                      const userId = user?.id || 'test-user';

                      console.log('🧪 Simulating connections for user:', userId);
                      platforms.forEach(platform => {
                        const key = `connected_${platform}_${userId}`;
                        localStorage.setItem(key, 'true');
                        console.log(`Set ${key} = true`);
                      });

                      // Also set the consolidated status
                      const statusKey = `connection_status_${userId}`;
                      const status = { twitter: true, linkedin: true, instagram: false, facebook: false, reddit: false };
                      localStorage.setItem(statusKey, JSON.stringify(status));
                      console.log(`Set ${statusKey} =`, status);

                      // Refresh connection status
                      refreshConnectionStatus();

                      console.log('🧪 Test connections simulated');
                    }}
                    className="text-xs bg-green-100 hover:bg-green-200 text-green-800"
                  >
                    Test Connections
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkLocalStorageDirectly}
                    className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800"
                  >
                    Direct Check
                  </Button>
                </>
              )}
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
            const isConnected = connectionStatus[platform.key as keyof typeof connectionStatus];
            const isLoading = isConnecting[platform.key as keyof typeof isConnecting];

            return (
              <PlatformCard
                key={platform.key}
                platform={platform}
                isConnected={isConnected}
                isLoading={isLoading}
                onConnect={(key: string) => {
                  connectPlatform(key as keyof typeof connectionStatus).catch(console.error);
                }}
                onDisconnect={(key: string) => {
                  disconnectPlatform(key as keyof typeof connectionStatus).catch(console.error);
                }}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialMediaConfig;

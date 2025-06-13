import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSocialMediaConnection } from "@/hooks/useSocialMediaConnection";
import { platforms } from "@/constants/platforms";
import { PlatformCard } from "./PlatformCard";
import { Share2 } from "lucide-react";

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
  const { isConnecting, connectPlatform, disconnectPlatform } = useSocialMediaConnection(onConnectionStatusChange);

  return (
    <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
      <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full transform translate-x-8 -translate-y-8"></div>
        <div className="relative z-10">
          <CardTitle className="flex items-center space-x-4 text-2xl">
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
          </CardTitle>
          <CardDescription className="text-base text-gray-600 mt-3">
            Connect your social media accounts to post content directly from the app and manage all platforms in one place
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSocialMediaConnection } from "@/hooks/useSocialMediaConnection";
import { platforms } from "@/constants/platforms";
import { PlatformCard } from "./PlatformCard";

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
    <Card className="bg-white/70 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle>Social Media Connections</CardTitle>
        <CardDescription>
          Connect your social media accounts to post content directly from the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
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
      </CardContent>
    </Card>
  );
};

export default SocialMediaConfig;

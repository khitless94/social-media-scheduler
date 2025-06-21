import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2 } from "lucide-react";

interface PlatformCardProps {
  platform: {
    key: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  };
  isConnected: boolean;
  isLoading: boolean;
  onConnect: (platform: string) => void;
  onDisconnect: (platform: string) => void;
}

export const PlatformCard = ({
  platform,
  isConnected,
  isLoading,
  onConnect,
  onDisconnect,
}: PlatformCardProps) => {
  const Icon = platform.icon;

  return (
    <div className="group flex items-center justify-between p-6 rounded-xl border-2 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:border-purple-200 hover:shadow-lg cursor-default">
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className={`p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white border-2 group-hover:scale-105 transition-transform duration-200 flex-shrink-0`}>
          <Icon className={`h-7 w-7 ${platform.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{platform.name}</h3>
          <p className="text-sm text-gray-600 font-medium">
            {isConnected ? "✅ Connected & Ready" : "⏸️ Not connected"}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 flex-shrink-0">
        {isConnected && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold px-3 py-1 text-xs">
            Connected
          </Badge>
        )}

        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDisconnect(platform.key)}
            disabled={isLoading}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium px-4 py-2 text-sm cursor-pointer"
          >
            Disconnect
          </Button>
        ) : (
          <Button
            onClick={() => onConnect(platform.key)}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-2 min-w-[120px] shadow-lg hover:shadow-xl transition-all duration-200 text-sm cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Connect
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
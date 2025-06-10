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
    <div className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 rounded-xl border-2 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:border-purple-200 hover:shadow-lg space-y-4 sm:space-y-0">
      <div className="flex items-center space-x-4 w-full sm:w-auto">
        <div className={`p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white border-2 group-hover:scale-105 transition-transform duration-200 flex-shrink-0`}>
          <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${platform.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">{platform.name}</h3>
          <p className="text-xs sm:text-sm text-gray-600 font-medium">
            {isConnected ? "✅ Connected & Ready" : "⏸️ Not connected"}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-end">
        {isConnected && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold px-2 sm:px-3 py-1 text-xs">
            Connected
          </Badge>
        )}
        
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDisconnect(platform.key)}
            disabled={isLoading}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium px-3 sm:px-4 py-2 text-xs sm:text-sm"
          >
            Disconnect
          </Button>
        ) : (
          <Button
            onClick={() => onConnect(platform.key)}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-4 sm:px-6 py-2 min-w-[100px] sm:min-w-[120px] shadow-lg hover:shadow-xl transition-all duration-200 text-xs sm:text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                <span className="hidden sm:inline">Connecting...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <ExternalLink className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Connect
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
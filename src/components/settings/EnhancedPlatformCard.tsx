import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2, Users, Settings, Plus, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Platform = "twitter" | "reddit" | "linkedin" | "facebook" | "instagram";

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

interface EnhancedPlatformCardProps {
  platform: {
    key: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  };
  isConnected: boolean;
  isLoading: boolean;
  accounts: SocialAccount[];
  onConnect: (platform: string) => void;
  onDisconnect: (platform: string) => void;
  onShowRequirements: (platform: Platform) => void;
  onShowMultipleAccounts: (platform: Platform) => void;
  onShowSubreddits?: () => void;
}

export const EnhancedPlatformCard: React.FC<EnhancedPlatformCardProps> = ({
  platform,
  isConnected,
  isLoading,
  accounts,
  onConnect,
  onDisconnect,
  onShowRequirements,
  onShowMultipleAccounts,
  onShowSubreddits,
}) => {
  const Icon = platform.icon;
  const activeAccounts = accounts.filter(acc => acc.is_active);
  const hasMultipleAccounts = accounts.length > 1;
  const isReddit = platform.key === 'reddit';

  const handleConnect = () => {
    console.log('🔥 [EnhancedPlatformCard] handleConnect called for:', platform.key, { isConnected, hasMultipleAccounts, isReddit });
    if (isConnected && hasMultipleAccounts) {
      // Show multiple accounts modal if already connected and has multiple accounts
      console.log('🔥 [EnhancedPlatformCard] Showing multiple accounts modal');
      onShowMultipleAccounts(platform.key as Platform);
    } else if (!isConnected) {
      // For new connections, directly connect without showing requirements modal
      console.log('🔥 [EnhancedPlatformCard] Directly connecting to:', platform.key);
      onConnect(platform.key);
    }
    // Note: If connected but no multiple accounts, the button won't be shown (handled in render logic)
  };

  const handleConnectAnother = () => {
    console.log('🔥 [EnhancedPlatformCard] handleConnectAnother called for:', platform.key);
    onShowRequirements(platform.key as Platform);
  };

  const getStatusText = () => {
    if (!isConnected) return "⏸️ Not connected";
    if (activeAccounts.length === 0) return "✅ Connected & Ready"; // Show as connected even if no account details loaded
    if (activeAccounts.length === 1) return "✅ Connected & Ready";
    return `✅ ${activeAccounts.length} accounts connected`;
  };

  const getAccountDisplayName = (account: SocialAccount) => {
    return account.account_name || account.platform_username || account.platform_user_id;
  };

  return (
    <div className="group flex flex-col p-6 rounded-xl border-2 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 hover:border-purple-200 hover:shadow-lg relative">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className={`p-3 rounded-xl bg-gradient-to-br from-gray-50 to-white border-2 group-hover:scale-105 transition-transform duration-200 flex-shrink-0`}>
            <Icon className={`h-7 w-7 ${platform.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">{platform.name}</h3>
            <p className="text-sm text-gray-600 font-medium leading-tight mt-1">
              {getStatusText()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {isConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold px-3 py-1 text-xs">
              {activeAccounts.length > 1 ? `${activeAccounts.length} Active` : 'Connected'}
            </Badge>
          )}
        </div>
      </div>

      {/* Connected Accounts List */}
      {isConnected && activeAccounts.length > 0 && (
        <div className="mb-4 space-y-2">
          {activeAccounts.slice(0, 2).map((account) => (
            <div key={account.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon className={`h-4 w-4 ${platform.color}`} />
                <span className="text-sm font-medium text-gray-700">
                  @{getAccountDisplayName(account)}
                </span>
                {account.account_type === 'business' && (
                  <Badge variant="secondary" className="text-xs">Business</Badge>
                )}
              </div>
            </div>
          ))}
          
          {activeAccounts.length > 2 && (
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShowMultipleAccounts(platform.key as Platform)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                +{activeAccounts.length - 2} more accounts
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {!isConnected ? (
          <Button
            onClick={handleConnect}
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
          <div className="flex items-center gap-2 w-full">
            {/* Manage Accounts Button */}
            <Button
              variant="outline"
              onClick={() => {
                console.log('🔥 [EnhancedPlatformCard] Manage Accounts clicked for:', platform.key);
                onShowMultipleAccounts(platform.key as Platform);
              }}
              className="flex-1 border-gray-200 hover:bg-gray-50 min-w-0"
            >
              <Users className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">Manage Accounts</span>
            </Button>

            {/* Reddit Subreddits Button */}
            {isReddit && (
              <Button
                variant="outline"
                onClick={onShowSubreddits}
                className="flex-shrink-0 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 font-medium px-3"
              >
                <Settings className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Subreddits</span>
                <span className="sm:hidden">Sub</span>
              </Button>
            )}

            {/* Connect Another Button */}
            <Button
              variant="outline"
              onClick={handleConnectAnother}
              className="flex-shrink-0 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 font-medium px-3"
            >
              <Plus className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Add Another</span>
              <span className="sm:hidden">Add</span>
            </Button>

            {/* Disconnect Dropdown */}
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
                  onClick={() => onDisconnect(platform.key)}
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
};

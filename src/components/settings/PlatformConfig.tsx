import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, UserX, Eye, EyeOff, Settings } from "lucide-react";

interface PlatformConfigProps {
  platform: string;
  displayName: string;
  icon: React.ReactNode;
  backgroundColor: string;
  clientId: string;
  setClientId: (id: string) => void;
  clientSecret: string;
  setClientSecret: (secret: string) => void;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  showCredentials?: boolean;
  onToggleShowCredentials?: () => void;
}

const PlatformConfig = ({
  platform,
  displayName,
  icon,
  backgroundColor,
  clientId,
  setClientId,
  clientSecret,
  setClientSecret,
  isConnected,
  onConnect,
  onDisconnect,
  showCredentials = false,
  onToggleShowCredentials
}: PlatformConfigProps) => {
  const redirectUrl = `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback`;

  return (
    <div className="p-6 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 ${backgroundColor} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h3 className="font-medium">{displayName}</h3>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Not connected</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isConnected && onToggleShowCredentials && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onToggleShowCredentials}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Settings className="h-4 w-4 mr-1" />
              {showCredentials ? 'Hide' : 'Update'} Credentials
            </Button>
          )}
          {isConnected && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDisconnect}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Disconnect
            </Button>
          )}
        </div>
      </div>
      {(!isConnected || showCredentials) && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${platform}-client-id`}>Client ID</Label>
              <Input
                id={`${platform}-client-id`}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder={`Enter your ${displayName} Client ID`}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${platform}-client-secret`}>Client Secret</Label>
              <Input
                id={`${platform}-client-secret`}
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder={`Enter your ${displayName} Client Secret`}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${platform}-redirect-url`}>OAuth Redirect URL</Label>
            <Input
              id={`${platform}-redirect-url`}
              value={redirectUrl}
              className="font-mono text-xs bg-gray-50"
              readOnly
            />
            <p className="text-xs text-gray-500">Use this URL when setting up OAuth in your {displayName} app</p>
          </div>
          {!isConnected && (
            <Button 
              onClick={onConnect}
              className={backgroundColor.replace('bg-', 'bg-') + ' hover:opacity-90'}
              disabled={!clientId || !clientSecret}
            >
              Connect {displayName}
            </Button>
          )}
          {isConnected && showCredentials && (
            <Button 
              onClick={onConnect}
              className={backgroundColor.replace('bg-', 'bg-') + ' hover:opacity-90'}
              disabled={!clientId || !clientSecret}
            >
              Update Connection
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default PlatformConfig;
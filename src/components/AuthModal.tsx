import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter, 
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
  X
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
}

interface ConnectionStatus {
  platform: string;
  isConnected: boolean;
  expiresAt?: string;
  needsReconnection?: boolean;
}

const AuthModal = ({ isOpen, onClose, currentMode, onModeChange }: AuthModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState<any>(null);
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-black' },
    { id: 'reddit', name: 'Reddit', icon: MessageSquare, color: 'bg-orange-600' }
  ];

  useEffect(() => {
    checkUser();
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      checkConnections();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const checkConnections = async () => {
    if (!user) return;
    
    try {
      const { data: tokens } = await supabase
        .from('oauth_credentials')
        .select('platform, expires_at, created_at')
        .eq('user_id', user.id);

      const connectionStatus = platforms.map(platform => {
        const token = tokens?.find(t => t.platform === platform.id);
        const isExpired = token?.expires_at && new Date(token.expires_at) < new Date();
        
        return {
          platform: platform.id,
          isConnected: !!token && !isExpired,
          expiresAt: token?.expires_at,
          needsReconnection: isExpired
        };
      });

      setConnections(connectionStatus);
    } catch (error) {
      console.error('Error checking connections:', error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (currentMode === 'signup') {
        if (password !== confirmPassword) {
          setError("Passwords don't match");
          return;
        }
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        setSuccess("Check your email for the confirmation link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        setSuccess("Successfully signed in!");
        await checkUser();
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialConnect = async (platform: string) => {
    setConnectingPlatform(platform);
    setError("");
    
    try {
      // This will use the existing OAuth flow from useSocialMediaConnection hook
      if (!user) {
        setError("Please sign in first to connect social accounts");
        return;
      }
      
      // For now, we'll show a placeholder message
      setSuccess(`OAuth connection for ${platform} would be handled here`);
    } catch (error: any) {
      setError(error.message);
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (platform: string) => {
    try {
      const { error } = await supabase
        .from('oauth_credentials')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', platform);

      if (error) throw error;
      
      setSuccess(`Disconnected from ${platform}`);
      checkConnections();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setConnections([]);
    onClose();
  };

  const getConnectionStatus = (platformId: string) => {
    return connections.find(c => c.platform === platformId);
  };

  const renderPlatformButton = (platform: any) => {
    const connection = getConnectionStatus(platform.id);
    const isConnecting = connectingPlatform === platform.id;
    const Icon = platform.icon;

    return (
      <div key={platform.id} className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${platform.color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium">{platform.name}</p>
            {connection?.isConnected && (
              <p className="text-sm text-gray-500">
                Connected {connection.expiresAt && `• Expires ${new Date(connection.expiresAt).toLocaleDateString()}`}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {connection?.isConnected ? (
            <>
              <Badge variant="secondary" className="text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect(platform.id)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSocialConnect(platform.id)}
              disabled={isConnecting}
              className="min-w-[80px]"
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Connect'
              )}
            </Button>
          )}
          
          {connection?.needsReconnection && (
            <AlertCircle className="w-4 h-4 text-amber-500" />
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Social Media Connections' : currentMode === 'signin' ? 'Sign In' : 'Sign Up'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {!user ? (
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {currentMode === 'signup' && (
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {currentMode === 'signin' ? 'Sign In' : 'Sign Up'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => onModeChange(currentMode === 'signin' ? 'signup' : 'signin')}
                disabled={loading}
              >
                {currentMode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Welcome back!</p>
                <p className="text-sm text-gray-500">{user?.email || 'No email available'}</p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-4">Connect Your Social Media Accounts</h3>
              <div className="space-y-3">
                {platforms.map(renderPlatformButton)}
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p>Connect your social media accounts to start posting content across all platforms simultaneously.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

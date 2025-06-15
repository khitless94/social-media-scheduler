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
  X,
  Eye,
  EyeOff
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
}

interface ConnectionStatus {
  platform: string;
  isConnected: boolean;
  expiresAt?: string;
  needsReconnection?: boolean;
}

const AuthModal = ({ isOpen, onClose, mode }: AuthModalProps) => {
  const [currentMode, setCurrentMode] = useState<'signin' | 'signup'>(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

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
        // Close modal after successful login
        setTimeout(() => {
          onClose();
        }, 1000);
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
      <div key={platform.id} className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/80 transition-all duration-200">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl ${platform.color} shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{platform.name}</p>
            {connection?.isConnected && (
              <p className="text-sm text-gray-600">
                Connected {connection.expiresAt && `• Expires ${new Date(connection.expiresAt).toLocaleDateString()}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {connection?.isConnected ? (
            <>
              <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1 rounded-full">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect(platform.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl"
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
              className="min-w-[90px] bg-white/80 border-gray-200 hover:bg-gray-50 rounded-xl font-medium"
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
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-0 shadow-2xl">
        {/* Header with gradient background */}
        <div className="relative px-8 pt-8 pb-6 text-white rounded-t-lg" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
          <div className="absolute inset-0 rounded-t-lg" style={{background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)'}}></div>
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white text-center">
                {user ? '🚀 Social Media Connections' : currentMode === 'signin' ? '👋 Welcome Back' : '✨ Join ScribeSchedule'}
              </DialogTitle>
              {!user && (
                <p className="text-blue-100 text-center mt-2">
                  {currentMode === 'signin'
                    ? 'Sign in to continue your creative journey'
                    : 'Start creating amazing content today'}
                </p>
              )}
            </DialogHeader>
          </div>
        </div>

        <div className="px-8 pb-8">{/* Content will go here */}

          {error && (
            <Alert variant="destructive" className="mt-6 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-6 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {!user ? (
            <form onSubmit={handleAuth} className="space-y-6 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="mt-2 h-12 bg-white/80 border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl transition-all duration-200"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                  <div className="relative mt-2">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 bg-white/80 border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl transition-all duration-200 pr-12"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {currentMode === 'signup' && (
                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">Confirm Password</Label>
                    <div className="relative mt-2">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="h-12 bg-white/80 border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl transition-all duration-200 pr-12"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  ':hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                  }
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {currentMode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                  </>
                ) : (
                  <>
                    {currentMode === 'signin' ? '🚀 Sign In' : '✨ Create Account'}
                  </>
                )}
              </Button>

              <div className="text-center pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline transition-colors duration-200"
                  onClick={() => setCurrentMode(currentMode === 'signin' ? 'signup' : 'signin')}
                  disabled={loading}
                >
                  {currentMode === 'signin'
                    ? "Don't have an account? Sign up for free"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 mt-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Welcome back! 🎉</p>
                    <p className="text-sm text-gray-600">{user?.email || 'No email available'}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="bg-white/80 border-gray-200 hover:bg-gray-50 rounded-xl"
                  >
                    Sign Out
                  </Button>
                </div>

                <Separator className="my-4" />

                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    🔗 Connect Your Social Media Accounts
                  </h3>
                  <div className="space-y-3">
                    {platforms.map(renderPlatformButton)}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium">
                    💡 Connect your social media accounts to start posting content across all platforms simultaneously.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

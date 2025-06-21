import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Plus,
  FileText,
  Settings,
  Sparkles,
  LogOut,
  BarChart3,
  Calendar,
  Users,
  Zap,
  Star,
  TrendingUp,
  Menu,
  X,
  Crown,
  Gift,
  Lightbulb
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home, description: "Overview & stats" },
    { path: "/create", label: "Create Post", icon: Plus, description: "AI-powered content" },
    { path: "/posts", label: "My Posts", icon: FileText, description: "Manage content" },
    { path: "/analytics", label: "Analytics", icon: BarChart3, description: "Performance insights" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You've been logged out of your account.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "There was a problem signing you out.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Enhanced Sidebar */}
      <div className={`${isSidebarCollapsed ? 'w-20' : 'w-80'} transition-all duration-300 ease-in-out flex-shrink-0`}>
        <div className="h-full bg-gradient-to-b from-white via-white to-blue-50/50 border-r border-white/60 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-2xl"></div>
            <div className="absolute top-1/3 -left-10 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 right-5 w-20 h-20 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-xl"></div>
          </div>

          <div className="relative z-10 h-full flex flex-col">
            {/* Header Section */}
            <div className="p-6 border-b border-gray-100/50">
              <div className="flex items-center justify-between mb-6">
                <Link to="/dashboard" className={`flex items-center space-x-3 group ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 relative">
                    <Sparkles className="w-7 h-7 text-white" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                      <Crown className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex flex-col">
                      <span className="text-xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 bg-clip-text text-transparent">
                        ContentPilot AI
                      </span>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-2 py-0.5 text-xs">
                          Pro Plan
                        </Badge>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  )}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                >
                  {isSidebarCollapsed ? <Menu size={18} /> : <X size={18} />}
                </Button>
              </div>

              {/* User Profile Section */}
              {!isSidebarCollapsed && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email || 'user@example.com'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Section */}
            <div className="flex-1 px-4 py-6 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path}>
                    <div className={`group relative flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                      active
                        ? "bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 text-white shadow-lg transform scale-105"
                        : "text-gray-600 hover:text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:shadow-md hover:scale-102"
                    }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600 group-hover:bg-white group-hover:text-purple-600 group-hover:shadow-sm"
                      }`}>
                        <Icon size={20} />
                      </div>
                      {!isSidebarCollapsed && (
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${active ? 'text-white' : 'text-gray-900'}`}>
                            {item.label}
                          </p>
                          <p className={`text-xs ${active ? 'text-white/80' : 'text-gray-500'}`}>
                            {item.description}
                          </p>
                        </div>
                      )}
                      {active && !isSidebarCollapsed && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Bottom Section */}
            <div className="p-4 space-y-4 border-t border-gray-100/50">
              {/* Quick Stats */}
              {!isSidebarCollapsed && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">This Month</h4>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">115</div>
                      <div className="text-xs text-gray-600">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">4.2k</div>
                      <div className="text-xs text-gray-600">Reach</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upgrade Banner */}
              {!isSidebarCollapsed && (
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-4 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full transform translate-x-4 -translate-y-4"></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-2 mb-2">
                      <Gift className="w-4 h-4" />
                      <span className="text-sm font-semibold">Pro Features</span>
                    </div>
                    <p className="text-xs text-white/90 mb-3">
                      Unlock advanced analytics & unlimited posts
                    </p>
                    <Button
                      size="sm"
                      className="bg-white text-purple-600 hover:bg-gray-100 text-xs font-semibold px-3 py-1.5 h-auto rounded-lg"
                    >
                      <Lightbulb className="w-3 h-3 mr-1" />
                      Learn More
                    </Button>
                  </div>
                </div>
              )}

              {/* Sign Out Button */}
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className={`w-full flex items-center space-x-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-2xl px-4 py-3 font-medium transition-all duration-300 hover:shadow-md ${
                  isSidebarCollapsed ? 'justify-center' : 'justify-start'
                }`}
              >
                <LogOut size={18} />
                {!isSidebarCollapsed && <span>Sign Out</span>}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <main className="h-full overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
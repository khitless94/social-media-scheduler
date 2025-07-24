
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Plus, FileText, Settings, Menu, X, Sparkles, LogOut, Image } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/create", label: "Create Post", icon: Plus },
    { path: "/posts", label: "My Posts", icon: FileText },
    { path: "/media", label: "Media Library", icon: Image },
    { path: "/settings", label: "Settings", icon: Settings },
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
    <nav className="sticky-nav bg-white/95 border-b border-gray-200/50 shadow-sm">
      <div className="container mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          {/* Enhanced Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 bg-clip-text text-transparent">
                ContentPilot AI
              </span>
              <div className="px-2 py-1 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full">
                <span className="text-xs font-semibold text-purple-700">Pro</span>
              </div>
            </div>
          </Link>

          {/* Enhanced Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    className={`flex items-center space-x-2 transition-all duration-300 rounded-xl px-4 py-2.5 font-medium ${
                      isActive(item.path)
                        ? "bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                        : "text-gray-600 hover:text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:shadow-md"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}

            {/* Enhanced Sign Out Button */}
            <div className="ml-4 pl-4 border-l border-gray-200">
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl px-4 py-2.5 font-medium transition-all duration-300 hover:shadow-md"
              >
                <LogOut size={18} />
                <span className="hidden lg:inline">Sign Out</span>
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      className={`w-full justify-start space-x-2 ${
                        isActive(item.path)
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          : ""
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
              
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start space-x-2 text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;

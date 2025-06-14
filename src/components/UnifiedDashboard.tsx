import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle, 
  BarChart3, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Zap, 
  ArrowUpRight, 
  Star, 
  Target,
  Home,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Bell,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AuthGuard from "./AuthGuard";
import Analytics from "./Analytics";
import CreatePostModal from "./CreatePostModal";
import MyPosts from "./MyPosts";
import Settings from "./Settings";

const UnifiedDashboardContent = () => {
  const [activeView, setActiveView] = useState("overview");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [postHistory, setPostHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: Home, description: "Dashboard home" },
    { id: "create", label: "Create", icon: Plus, description: "Create new content" },
    { id: "posts", label: "My Posts", icon: FileText, description: "Manage your posts" },
    { id: "analytics", label: "Analytics", icon: BarChart3, description: "View performance" },
    { id: "settings", label: "Settings", icon: SettingsIcon, description: "Account settings" },
  ];

  const quickActions = [
    {
      title: "Create Post",
      description: "Generate AI-powered content",
      icon: Plus,
      action: () => setShowCreateModal(true),
      color: "from-purple-500 to-blue-500",
      bgColor: "bg-purple-50"
    },
    {
      title: "Schedule Content",
      description: "Plan your posting calendar",
      icon: Calendar,
      action: () => setActiveView("posts"),
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50"
    },
    {
      title: "View Analytics",
      description: "Track your performance",
      icon: TrendingUp,
      action: () => setActiveView("analytics"),
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50"
    }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch scheduled/draft posts
      const { data: scheduledPosts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch posted content history
      const { data: postedPosts } = await supabase
        .from('post_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setPosts(scheduledPosts || []);
      setPostHistory(postedPosts || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSidebarItemClick = (itemId: string) => {
    if (itemId === "create") {
      setShowCreateModal(true);
    } else {
      setActiveView(itemId);
    }
  };

  const renderMainContent = () => {
    switch (activeView) {
      case "overview":
        return <OverviewContent posts={posts} postHistory={postHistory} quickActions={quickActions} />;
      case "posts":
        return <MyPosts />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return <Settings />;
      default:
        return <OverviewContent posts={posts} postHistory={postHistory} quickActions={quickActions} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Top Header */}
      <header className="sticky-nav bg-white/95 border-b border-gray-200/50 shadow-sm">
        <div className="flex items-center justify-between h-16 px-6">
          {/* Logo and Menu Toggle */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 bg-clip-text text-transparent">
                ContentPilot AI
              </span>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search posts, analytics..."
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                3
              </Badge>
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white/95 backdrop-blur-xl border-r border-gray-200/50 min-h-screen transition-all duration-300 shadow-sm`}>
          <div className="p-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => handleSidebarItemClick(item.id)}
                  className={`w-full justify-start transition-all duration-300 rounded-xl ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 text-white shadow-lg"
                      : "text-gray-600 hover:text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50"
                  } ${sidebarCollapsed ? 'px-2' : 'px-4'}`}
                >
                  <Icon className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                  {!sidebarCollapsed && (
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs opacity-75">{item.description}</span>
                    </div>
                  )}
                </Button>
              );
            })}
          </div>

          {/* User Profile Section */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className={`${sidebarCollapsed ? 'hidden' : 'block'} bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200`}>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500">Free Plan</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderMainContent()}
        </main>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onOpenSettings={() => setActiveView("settings")}
        onPostSuccess={() => {
          // Refresh dashboard data after successful post
          fetchDashboardData();
        }}
      />
    </div>
  );
};

// Overview Content Component
const OverviewContent = ({ posts, postHistory, quickActions }: any) => {
  const upcomingPosts = posts.filter((post: any) => post.status === 'scheduled').slice(0, 5);
  const totalPosts = posts.length;
  const publishedPosts = postHistory.length;
  const scheduledPosts = posts.filter((post: any) => post.status === 'scheduled').length;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full transform translate-x-32 -translate-y-32"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
          <p className="text-purple-100 text-lg">Ready to create amazing content today?</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        {quickActions.map((action: any, index: number) => (
          <Card
            key={index}
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl border-0 overflow-hidden"
            onClick={action.action}
          >
            <CardContent className="p-6">
              <div className={`w-12 h-12 ${action.bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-gray-600">{action.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-3xl border-0 overflow-hidden relative">
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
              📊 Total
            </div>
          </div>
          <CardHeader className="pb-3 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-full transform translate-x-8 -translate-y-8 opacity-50"></div>
            <div className="relative z-10">
              <CardTitle className="text-4xl font-bold text-purple-600 mb-2">{totalPosts}</CardTitle>
              <CardDescription className="text-gray-600 font-medium">Total Posts Created</CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-3xl border-0 overflow-hidden relative">
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
              ✅ Live
            </div>
          </div>
          <CardHeader className="pb-3 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-full transform translate-x-8 -translate-y-8 opacity-50"></div>
            <div className="relative z-10">
              <CardTitle className="text-4xl font-bold text-green-600 mb-2">{publishedPosts}</CardTitle>
              <CardDescription className="text-gray-600 font-medium">Published Posts</CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-3xl border-0 overflow-hidden relative">
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
              ⏰ Queue
            </div>
          </div>
          <CardHeader className="pb-3 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-full transform translate-x-8 -translate-y-8 opacity-50"></div>
            <div className="relative z-10">
              <CardTitle className="text-4xl font-bold text-blue-600 mb-2">{scheduledPosts}</CardTitle>
              <CardDescription className="text-gray-600 font-medium">Scheduled Posts</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl border-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Clock className="w-6 h-6 text-purple-600" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No scheduled posts yet</h3>
              <p className="text-gray-600 mb-6">Create your first post to get started with your content strategy.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingPosts.map((post: any, index: number) => (
                <div key={post.id} className="group p-6 bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                          {post.platform}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {post.scheduled_for ? new Date(post.scheduled_for).toLocaleDateString() : 'Draft'}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 mb-1 line-clamp-2">{post.content}</p>
                      <p className="text-sm text-gray-600">Status: {post.status}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {post.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Wrapper component with AuthGuard
const UnifiedDashboard = () => {
  return (
    <AuthGuard>
      <UnifiedDashboardContent />
    </AuthGuard>
  );
};

export default UnifiedDashboard;

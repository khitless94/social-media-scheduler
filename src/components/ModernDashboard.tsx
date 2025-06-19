import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Calendar,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Home,
  FileText,
  Users,
  TrendingUp,
  Sparkles,
  Zap,
  Target,
  Clock,
  CheckCircle,
  Eye,
  Heart,
  Share2,
  ArrowUpRight,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import CreatePostModal from "./CreatePostModal";
import MyPostsPage from "./pages/MyPostsPage";
import CalendarPage from "./pages/CalendarPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import { supabase } from "@/integrations/supabase/client";

const ModernDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [postHistory, setPostHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      console.log('Skipping database calls for testing mode');
      setPosts([]);
      setPostHistory([]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const stats = [
    {
      title: "Total Posts",
      value: posts.length.toString(),
      change: "+12%",
      icon: FileText,
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50"
    },
    {
      title: "Published",
      value: postHistory.length.toString(),
      change: "+8%",
      icon: CheckCircle,
      color: "from-green-500 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50"
    },
    {
      title: "Scheduled",
      value: posts.filter(p => p.status === 'scheduled').length.toString(),
      change: "+23%",
      icon: Clock,
      color: "from-orange-500 to-amber-500",
      bgColor: "from-orange-50 to-amber-50"
    },
    {
      title: "Engagement",
      value: "12.5K",
      change: "+15%",
      icon: Heart,
      color: "from-pink-500 to-rose-500",
      bgColor: "from-pink-50 to-rose-50"
    }
  ];

  const quickActions = [
    {
      title: "Create Post",
      description: "Generate AI-powered content",
      icon: Sparkles,
      color: "from-purple-500 to-indigo-500",
      action: () => setShowCreateModal(true)
    },
    {
      title: "Schedule Content",
      description: "Plan your posting calendar",
      icon: Calendar,
      color: "from-blue-500 to-cyan-500",
      action: () => setActiveTab("calendar")
    },
    {
      title: "View Analytics",
      description: "Track your performance",
      icon: BarChart3,
      color: "from-green-500 to-emerald-500",
      action: () => setActiveTab("analytics")
    },
    {
      title: "Manage Settings",
      description: "Configure your account",
      icon: Settings,
      color: "from-gray-500 to-slate-500",
      action: () => setActiveTab("settings")
    }
  ];

  const recentPosts = [
    {
      id: 1,
      content: "🚀 Excited to share our latest product update! New features that will revolutionize your workflow.",
      platform: "Twitter",
      status: "published",
      engagement: "1.2K",
      time: "2 hours ago",
      platformColor: "text-sky-500"
    },
    {
      id: 2,
      content: "Behind the scenes of our amazing team working on innovative solutions for the future.",
      platform: "LinkedIn",
      status: "scheduled",
      engagement: "856",
      time: "Tomorrow 9:00 AM",
      platformColor: "text-blue-600"
    },
    {
      id: 3,
      content: "Check out this stunning visual representation of our growth journey! 📈",
      platform: "Instagram",
      status: "published",
      engagement: "2.1K",
      time: "1 day ago",
      platformColor: "text-pink-500"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
            <div className="h-3 bg-gray-100 rounded w-24 mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Background Elements - Landing Page Style */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400/10 to-blue-400/10 rounded-full blur-2xl animate-pulse delay-500 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Top Navigation - Landing Page Style */}
      <nav className="bg-white/95 backdrop-blur-xl border-b border-gray-100/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand - Landing Page Style */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100/80 transition-all duration-200"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    ScribeSchedule
                  </h1>
                </div>
              </div>
            </div>

            {/* Search Bar - Landing Page Style */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts, analytics, settings..."
                  className="w-full pl-10 pr-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            {/* Right Actions - Landing Page Style */}
            <div className="flex items-center space-x-3">
              <button className="relative p-2 rounded-xl hover:bg-gray-100/80 transition-all duration-200">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse"></span>
              </button>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-medium">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-200"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar - Landing Page Style */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-xl border-r border-gray-100/50 transition-transform duration-300 ease-in-out shadow-lg`}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header - Landing Page Style */}
            <div className="p-6 border-b border-gray-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">Dashboard</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1 rounded-lg hover:bg-gray-100/80 transition-all duration-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Create Button - Landing Page Style */}
            <div className="p-4 border-b border-gray-100/50">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-xl group font-medium"
              >
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Create Post
                <Sparkles className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform duration-300" />
              </Button>
            </div>

            {/* Navigation - Landing Page Style */}
            <nav className="flex-1 p-4 space-y-2">
              {[
                { id: "overview", label: "Overview", icon: Home },
                { id: "posts", label: "My Posts", icon: FileText },
                { id: "calendar", label: "Calendar", icon: Calendar },
                { id: "analytics", label: "Analytics", icon: BarChart3 },
                { id: "settings", label: "Settings", icon: Settings }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 hover:transform hover:scale-105'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? '' : 'group-hover:scale-110'} transition-transform duration-200`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer - Landing Page Style */}
            <div className="p-4 border-t border-gray-100/50">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50/80 rounded-xl transition-all duration-200 group"
              >
                <ArrowUpRight className="h-5 w-5 rotate-45 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="max-w-7xl mx-auto p-6 space-y-8">

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">👋</span>
                          <h2 className="text-2xl lg:text-3xl font-bold">
                            Welcome back, {user?.email?.split('@')[0] || 'User'}!
                          </h2>
                        </div>
                        <p className="text-white/90 text-lg max-w-2xl">
                          Ready to create amazing content? Your social media empire awaits.
                          Let's make today productive and engaging!
                        </p>
                        <div className="flex flex-wrap gap-3 pt-2">
                          <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Create Post
                          </Button>
                          <Button
                            onClick={() => setActiveTab("analytics")}
                            variant="outline"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Analytics
                          </Button>
                        </div>
                      </div>
                      <div className="hidden lg:block">
                        <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                          <TrendingUp className="h-16 w-16 text-white/80" />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Decorative Elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                </div>

                {/* Stats Grid - Landing Page Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={index}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group relative overflow-hidden"
                      >
                        {/* Floating Badge */}
                        <div className="absolute top-4 right-4 z-10">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                            {stat.change}
                          </div>
                        </div>
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-full transform translate-x-6 -translate-y-6 opacity-50"></div>

                        <div className="relative z-10">
                          <div className="flex items-center mb-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                              {stat.value}
                            </h3>
                            <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Actions - Landing Page Style */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 relative overflow-hidden">
                  {/* Background Decoration */}
                  <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full transform -translate-x-8 -translate-y-8"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100/30 to-pink-100/30 rounded-full transform translate-x-6 translate-y-6"></div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">Quick Actions</h3>
                      <div className="text-sm text-gray-500 font-medium">Choose your next move</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={index}
                            onClick={action.action}
                            className="p-6 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white/80 hover:shadow-xl transition-all duration-300 text-left group transform hover:-translate-y-1"
                          >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">{action.title}</h4>
                            <p className="text-sm text-gray-600">{action.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Recent Activity - Landing Page Style */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Posts */}
                  <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 relative overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full transform translate-x-6 -translate-y-6"></div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">Recent Posts</h3>
                        <Button
                          onClick={() => setActiveTab("posts")}
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-200/50 hover:bg-blue-50/80 backdrop-blur-sm"
                        >
                          View All
                          <ArrowUpRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-8 w-8 text-gray-400" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h4>
                          <p className="text-gray-600 mb-4">Create your first post to get started</p>
                          <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Post
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Summary - Landing Page Style */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30 relative overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-purple-100/30 to-pink-100/30 rounded-full transform -translate-x-4 -translate-y-4"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 rounded-full transform translate-x-4 translate-y-4"></div>

                    <div className="relative z-10">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent mb-6">Performance</h3>
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <TrendingUp className="h-10 w-10 text-white" />
                          </div>
                          <div className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">85%</div>
                          <div className="text-sm text-gray-600 font-medium">Engagement Rate</div>
                        </div>

                        <div className="space-y-4">
                          {[
                            { label: "Reach", value: "12.5K", color: "bg-blue-500" },
                            { label: "Impressions", value: "28.3K", color: "bg-purple-500" },
                            { label: "Clicks", value: "1.8K", color: "bg-pink-500" }
                          ].map((metric, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${metric.color}`}></div>
                                <span className="text-sm text-gray-600">{metric.label}</span>
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{metric.value}</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          onClick={() => setActiveTab("analytics")}
                          variant="outline"
                          className="w-full mt-4"
                        >
                          View Full Analytics
                          <ArrowUpRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Render Different Pages */}
            {activeTab === "posts" && <MyPostsPage />}
            {activeTab === "calendar" && <CalendarPage />}
            {activeTab === "analytics" && <AnalyticsPage />}
            {activeTab === "settings" && <SettingsPage />}
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onOpenSettings={() => setActiveTab("settings")}
        onPostSuccess={() => {
          fetchDashboardData();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
};

export default ModernDashboard;

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Home,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Bell,
  Search,
  Menu,
  X,
  ArrowUpRight,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  CheckCircle,
  Wand2,
  Image,
  Send,
  Eye,
  Target,
  Zap,
  LogOut,
  ChevronRight,
  Activity,
  Globe,
  Filter,
  MoreVertical
} from "lucide-react";
import CreatePostModal from "./CreatePostModal";

const MobileFriendlyDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  // Close sidebar when tab changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [activeTab]);

  // Sample data
  const stats = [
    {
      title: "Total Posts",
      value: "24",
      change: "+12%",
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100"
    },
    {
      title: "Engagement",
      value: "2.4K",
      change: "+18%",
      icon: Heart,
      color: "from-pink-500 to-pink-600",
      bgColor: "from-pink-50 to-pink-100"
    },
    {
      title: "Reach",
      value: "12.5K",
      change: "+25%",
      icon: Users,
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100"
    },
    {
      title: "Scheduled",
      value: "8",
      change: "+3",
      icon: Clock,
      color: "from-green-500 to-green-600",
      bgColor: "from-green-50 to-green-100"
    }
  ];

  const quickActions = [
    {
      title: "Create Post",
      description: "AI-powered content",
      icon: Wand2,
      color: "from-purple-500 to-pink-500",
      action: () => setShowCreateModal(true)
    },
    {
      title: "Schedule",
      description: "Plan your calendar",
      icon: Calendar,
      color: "from-blue-500 to-indigo-500",
      action: () => setActiveTab("calendar")
    },
    {
      title: "Analytics",
      description: "Track performance",
      icon: BarChart3,
      color: "from-green-500 to-emerald-500",
      action: () => setActiveTab("analytics")
    },
    {
      title: "Upload Media",
      description: "Add images & videos",
      icon: Image,
      color: "from-orange-500 to-red-500",
      action: () => setShowCreateModal(true)
    }
  ];

  const navigationItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "posts", label: "My Posts", icon: FileText },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Background Elements - Landing Page Style */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-gradient-to-r from-indigo-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Mobile-First Navigation Header */}
      <nav className="sticky-nav bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm relative z-50">
        <div className="container-responsive h-16 flex items-center justify-between">
          {/* Logo & Menu */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gradient-primary">
                  ScribeSchedule
                </h1>
              </div>
            </div>
          </div>

          {/* Search Bar - Hidden on small screens */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts, analytics..."
                className="w-full pl-10 pr-4 py-2 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            {/* Mobile Search */}
            <button className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Search className="h-5 w-5 text-gray-600" />
            </button>
            
            {/* Notifications */}
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="hidden sm:flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex relative z-10">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-xl border-r border-gray-100 transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none`}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header - Mobile Only */}
            <div className="lg:hidden p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">Dashboard</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Create Button */}
            <div className="p-4 border-b border-gray-100">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="w-full btn-primary group"
              >
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Create Post
                <Sparkles className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform duration-300" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'gradient-primary text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:transform hover:scale-105'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? '' : 'group-hover:scale-110'} transition-transform duration-200`} />
                    <span className="font-medium">{item.label}</span>
                    <ChevronRight className={`h-4 w-4 ml-auto ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200`} />
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container-responsive py-6 space-y-6">
            {activeTab === "overview" && (
              <>
                {/* Welcome Header */}
                <div className="animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-responsive-lg font-bold text-gradient-primary">
                        Welcome back! 👋
                      </h2>
                      <p className="text-gray-600 mt-2">Here's what's happening with your social media today</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-green-100 text-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        All systems operational
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Stats Grid - Mobile Optimized */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <Card
                        key={index}
                        className="card-modern group hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 relative overflow-hidden"
                      >
                        {/* Background Decoration */}
                        <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.bgColor} rounded-full transform translate-x-4 -translate-y-4 opacity-50`}></div>

                        <CardContent className="p-4 relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <div className={`p-2 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                              {stat.change}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xl font-bold text-gradient-primary group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                              {stat.value}
                            </h3>
                            <p className="text-xs text-gray-600 font-medium">{stat.title}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Quick Actions - Mobile Optimized */}
                <Card className="card-modern relative overflow-hidden animate-scale-in">
                  {/* Background Decoration */}
                  <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full transform -translate-x-8 -translate-y-8"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100/30 to-pink-100/30 rounded-full transform translate-x-6 translate-y-6"></div>

                  <CardHeader className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <CardTitle className="text-xl font-bold text-gradient-primary">Quick Actions</CardTitle>
                      <div className="text-sm text-gray-500 font-medium">Choose your next move</div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={index}
                            onClick={action.action}
                            className="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white/80 hover:shadow-xl transition-all duration-300 text-left group transform hover:-translate-y-1"
                          >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1 text-sm">{action.title}</h4>
                            <p className="text-xs text-gray-600">{action.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity - Mobile Optimized */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Posts */}
                  <Card className="lg:col-span-2 card-modern relative overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full transform translate-x-6 -translate-y-6"></div>

                    <CardHeader className="relative z-10">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="text-xl font-bold text-gradient-primary">Recent Posts</CardTitle>
                        <Button
                          onClick={() => setActiveTab("posts")}
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-200/50 hover:bg-blue-50/80 backdrop-blur-sm w-fit"
                        >
                          View All
                          <ArrowUpRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="space-y-4">
                        {[
                          { content: "🚀 Just launched our new AI feature! The response has been incredible...", platform: "Instagram", likes: "2.4K", time: "2h ago", color: "text-pink-600" },
                          { content: "Tips for better social media engagement: 1. Post consistently 2. Use relevant hashtags...", platform: "LinkedIn", likes: "1.8K", time: "1d ago", color: "text-blue-700" },
                          { content: "Behind the scenes: How we built our content scheduling tool 🛠️", platform: "Twitter", likes: "1.2K", time: "2d ago", color: "text-blue-600" }
                        ].map((post, index) => (
                          <div key={index} className="p-4 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/80 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="text-sm text-gray-700 mb-2 line-clamp-2">{post.content}</p>
                                <div className="flex items-center space-x-3 text-xs">
                                  <span className={`font-medium ${post.color}`}>{post.platform}</span>
                                  <span className="text-gray-500">{post.time}</span>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="flex items-center space-x-1 text-sm font-semibold text-gray-900">
                                  <Heart className="h-4 w-4 text-red-500" />
                                  <span>{post.likes}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Summary */}
                  <Card className="card-modern relative overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-purple-100/30 to-pink-100/30 rounded-full transform -translate-x-4 -translate-y-4"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 rounded-full transform translate-x-4 translate-y-4"></div>

                    <CardHeader className="relative z-10">
                      <CardTitle className="text-xl font-bold text-gradient-primary">Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-6">
                      <div className="text-center">
                        <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <TrendingUp className="h-8 w-8 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-gradient-primary">85%</div>
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
                        className="w-full"
                      >
                        View Full Analytics
                        <ArrowUpRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Other Tab Content - Simplified for Mobile */}
            {activeTab === "posts" && (
              <div className="animate-fade-in">
                <div className="text-center py-12">
                  <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Posts Management</h3>
                  <p className="text-gray-600 mb-4">Manage all your social media posts here</p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Post
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="animate-fade-in">
                <div className="text-center py-12">
                  <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Calendar</h3>
                  <p className="text-gray-600 mb-4">Schedule and manage your content calendar</p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Post
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="animate-fade-in">
                <div className="text-center py-12">
                  <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-600 mb-4">Track your social media performance</p>
                  <Button
                    onClick={() => setActiveTab("overview")}
                    className="btn-primary"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Overview
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="animate-fade-in">
                <div className="text-center py-12">
                  <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Settings className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
                  <p className="text-gray-600 mb-4">Configure your account and preferences</p>
                  <Button
                    onClick={() => setActiveTab("overview")}
                    className="btn-primary"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Back to Overview
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

export default MobileFriendlyDashboard;

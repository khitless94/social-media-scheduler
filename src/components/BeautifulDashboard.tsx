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
  Zap
} from "lucide-react";
import CreatePostModal from "./CreatePostModal";

const BeautifulDashboard = () => {
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

  // Sample data for the beautiful dashboard
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
      description: "Generate AI-powered content",
      icon: Wand2,
      color: "from-purple-500 to-pink-500",
      action: () => setShowCreateModal(true)
    },
    {
      title: "Schedule Content",
      description: "Plan your posting calendar",
      icon: Calendar,
      color: "from-blue-500 to-indigo-500",
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
      title: "Upload Media",
      description: "Add images and videos",
      icon: Image,
      color: "from-orange-500 to-red-500",
      action: () => setShowCreateModal(true)
    }
  ];

  const recentPosts = [
    {
      id: 1,
      platform: "Instagram",
      content: "🌟 Excited to share our latest product update! The new AI-powered content suggestions are game-changing...",
      status: "published",
      engagement: "156",
      time: "2 hours ago",
      platformColor: "text-pink-600"
    },
    {
      id: 2,
      platform: "Twitter",
      content: "Just launched our new feature! 🚀 AI content generation is now live. Try it out and let us know what you think!",
      status: "scheduled",
      engagement: "89",
      time: "Tomorrow at 9:00 AM",
      platformColor: "text-blue-600"
    },
    {
      id: 3,
      platform: "LinkedIn",
      content: "Thrilled to announce our partnership with leading AI companies. This collaboration will revolutionize...",
      status: "published",
      engagement: "234",
      time: "1 day ago",
      platformColor: "text-blue-700"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/5 to-purple-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/5 to-pink-400/5 rounded-full blur-3xl"></div>
      </div>

      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
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

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts, analytics, settings..."
                  className="w-full pl-10 pr-4 py-2 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"></span>
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
                  className="hidden sm:flex text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex relative z-10">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white/90 backdrop-blur-xl border-r border-gray-100 transition-transform duration-300 ease-in-out shadow-lg`}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">Dashboard</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Create Button */}
            <div className="p-4 border-b border-gray-100">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl group"
              >
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Create Post
                <Sparkles className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform duration-300" />
              </Button>
            </div>

            {/* Navigation */}
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
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:transform hover:scale-105'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? '' : 'group-hover:scale-110'} transition-transform duration-200`} />
                    <span className="font-medium">{item.label}</span>
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
                <ArrowUpRight className="h-5 w-5 rotate-45" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-8">
            {activeTab === "overview" && (
              <>
                {/* Welcome Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                        Welcome back! 👋
                      </h2>
                      <p className="text-gray-600 mt-2">Here's what's happening with your social media today</p>
                    </div>
                    <div className="hidden md:flex items-center space-x-3">
                      <Badge className="bg-green-100 text-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        All systems operational
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <Card
                        key={index}
                        className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 group relative overflow-hidden"
                      >
                        {/* Background Decoration */}
                        <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.bgColor} rounded-full transform translate-x-6 -translate-y-6 opacity-50`}></div>

                        <CardContent className="p-6 relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                              {stat.change}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                              {stat.value}
                            </h3>
                            <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg relative overflow-hidden">
                  {/* Background Decoration */}
                  <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full transform -translate-x-8 -translate-y-8"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100/30 to-pink-100/30 rounded-full transform translate-x-6 translate-y-6"></div>

                  <CardHeader className="relative z-10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">Quick Actions</CardTitle>
                      <div className="text-sm text-gray-500 font-medium">Choose your next move</div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
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
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Posts */}
                  <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-white/50 shadow-lg relative overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full transform translate-x-6 -translate-y-6"></div>

                    <CardHeader className="relative z-10">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">Recent Posts</CardTitle>
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
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="space-y-4">
                        {recentPosts.map((post) => (
                          <div key={post.id} className="p-4 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/80 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  post.status === 'published' ? 'bg-green-100' : 'bg-orange-100'
                                }`}>
                                  {post.status === 'published' ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-orange-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-sm font-medium ${post.platformColor}`}>
                                      {post.platform}
                                    </span>
                                    <Badge className={`text-xs ${
                                      post.status === 'published'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-orange-100 text-orange-700'
                                    }`}>
                                      {post.status}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-gray-500">{post.time}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-gray-900">{post.engagement}</div>
                                <div className="text-xs text-gray-500">interactions</div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Summary */}
                  <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg relative overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-purple-100/30 to-pink-100/30 rounded-full transform -translate-x-4 -translate-y-4"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100/30 to-indigo-100/30 rounded-full transform translate-x-4 translate-y-4"></div>

                    <CardHeader className="relative z-10">
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-6">
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

            {/* Other Tab Content */}
            {activeTab === "posts" && (
              <>
                {/* Posts Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                        My Posts 📝
                      </h2>
                      <p className="text-gray-600 mt-2">Manage all your social media content</p>
                    </div>
                    <div className="flex items-center space-x-3">
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

                {/* Filter Tabs */}
                <div className="flex items-center space-x-1 mb-8 p-1 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 w-fit">
                  {['All Posts', 'Published', 'Scheduled', 'Drafts'].map((filter) => (
                    <button
                      key={filter}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filter === 'All Posts'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* Posts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[
                    {
                      id: 1,
                      content: "🚀 Excited to announce our latest AI-powered feature! This game-changing update will revolutionize how you create content. What do you think? #AI #Innovation #SocialMedia",
                      platform: "Instagram",
                      status: "published",
                      date: "Dec 15, 2024",
                      time: "2:30 PM",
                      engagement: { likes: "2.4K", comments: "156", shares: "89" },
                      platformColor: "text-pink-600",
                      statusColor: "bg-green-100 text-green-700"
                    },
                    {
                      id: 2,
                      content: "Tips for better social media engagement:\n\n1. Post consistently\n2. Use relevant hashtags\n3. Engage with your audience\n4. Share valuable content\n\nWhat's your best tip? 💡",
                      platform: "LinkedIn",
                      status: "scheduled",
                      date: "Dec 20, 2024",
                      time: "9:00 AM",
                      engagement: { likes: "0", comments: "0", shares: "0" },
                      platformColor: "text-blue-700",
                      statusColor: "bg-orange-100 text-orange-700"
                    },
                    {
                      id: 3,
                      content: "Behind the scenes: How we built our content scheduling tool 🛠️\n\nThread 🧵\n\n1/ It all started with a simple problem...",
                      platform: "Twitter",
                      status: "published",
                      date: "Dec 12, 2024",
                      time: "11:15 AM",
                      engagement: { likes: "1.2K", comments: "89", shares: "145" },
                      platformColor: "text-blue-600",
                      statusColor: "bg-green-100 text-green-700"
                    },
                    {
                      id: 4,
                      content: "Year-end reflection: What we've learned about social media in 2024 and our goals for 2025. Thank you to our amazing community! 🙏",
                      platform: "Facebook",
                      status: "draft",
                      date: "Draft",
                      time: "",
                      engagement: { likes: "0", comments: "0", shares: "0" },
                      platformColor: "text-blue-600",
                      statusColor: "bg-gray-100 text-gray-700"
                    },
                    {
                      id: 5,
                      content: "Quick tutorial: How to use our AI content generator in 3 simple steps 📹\n\n✨ Step 1: Enter your topic\n✨ Step 2: Choose your style\n✨ Step 3: Generate & customize",
                      platform: "Instagram",
                      status: "scheduled",
                      date: "Dec 22, 2024",
                      time: "3:00 PM",
                      engagement: { likes: "0", comments: "0", shares: "0" },
                      platformColor: "text-pink-600",
                      statusColor: "bg-orange-100 text-orange-700"
                    },
                    {
                      id: 6,
                      content: "The future of social media automation is here! 🤖 Our new AI features are designed to help creators focus on what matters most - connecting with their audience.",
                      platform: "LinkedIn",
                      status: "published",
                      date: "Dec 8, 2024",
                      time: "10:45 AM",
                      engagement: { likes: "1.8K", comments: "234", shares: "67" },
                      platformColor: "text-blue-700",
                      statusColor: "bg-green-100 text-green-700"
                    }
                  ].map((post) => (
                    <Card key={post.id} className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                      <CardContent className="p-6">
                        {/* Post Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              post.status === 'published' ? 'bg-green-100' :
                              post.status === 'scheduled' ? 'bg-orange-100' : 'bg-gray-100'
                            }`}>
                              {post.status === 'published' ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : post.status === 'scheduled' ? (
                                <Clock className="h-4 w-4 text-orange-600" />
                              ) : (
                                <FileText className="h-4 w-4 text-gray-600" />
                              )}
                            </div>
                            <div>
                              <div className={`text-sm font-medium ${post.platformColor}`}>
                                {post.platform}
                              </div>
                              <div className="text-xs text-gray-500">
                                {post.date} {post.time && `at ${post.time}`}
                              </div>
                            </div>
                          </div>
                          <Badge className={`text-xs ${post.statusColor}`}>
                            {post.status}
                          </Badge>
                        </div>

                        {/* Post Content */}
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 line-clamp-4 whitespace-pre-line">
                            {post.content}
                          </p>
                        </div>

                        {/* Engagement Stats */}
                        {post.status === 'published' && (
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center space-x-1">
                              <Heart className="h-4 w-4" />
                              <span>{post.engagement.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="h-4 w-4" />
                              <span>{post.engagement.comments}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Share2 className="h-4 w-4" />
                              <span>{post.engagement.shares}</span>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Settings className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {post.status === 'draft' && (
                            <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600">
                              <Send className="h-4 w-4 mr-1" />
                              Publish
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Load More */}
                <div className="text-center mt-8">
                  <Button variant="outline" className="px-8">
                    Load More Posts
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {activeTab === "calendar" && (
              <>
                {/* Calendar Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                        Content Calendar 📅
                      </h2>
                      <p className="text-gray-600 mt-2">Schedule and manage your social media posts</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule Post
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Calendar View */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Calendar */}
                  <Card className="lg:col-span-3 bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                          December 2024
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">Previous</Button>
                          <Button variant="outline" size="sm">Next</Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-2 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded-lg">
                            {day}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 35 }, (_, i) => {
                          const dayNumber = i + 1 <= 31 ? i + 1 : '';
                          const isToday = i === 18;
                          const hasScheduled = [5, 12, 19, 26].includes(i + 1);
                          const hasPublished = [3, 10, 17, 24].includes(i + 1);

                          return (
                            <div
                              key={i}
                              className={`aspect-square p-2 rounded-lg border transition-all cursor-pointer relative ${
                                isToday
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-500 shadow-lg'
                                  : hasScheduled
                                  ? 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                                  : hasPublished
                                  ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="text-sm font-medium">{dayNumber}</div>
                              {hasScheduled && (
                                <div className="absolute bottom-1 left-1 w-2 h-2 bg-orange-400 rounded-full"></div>
                              )}
                              {hasPublished && (
                                <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-400 rounded-full"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex items-center justify-center space-x-6 mt-6 p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Today</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                          <span className="text-sm text-gray-600">Scheduled</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-gray-600">Published</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Upcoming Posts Sidebar */}
                  <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
                        Upcoming Posts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { date: "Dec 20", time: "9:00 AM", platform: "Instagram", content: "New product launch announcement 🚀", color: "text-pink-600" },
                          { date: "Dec 22", time: "2:00 PM", platform: "Twitter", content: "Weekly tips thread about social media...", color: "text-blue-600" },
                          { date: "Dec 24", time: "10:00 AM", platform: "LinkedIn", content: "Year-end reflection and goals for 2025", color: "text-blue-700" },
                          { date: "Dec 26", time: "4:00 PM", platform: "Facebook", content: "Holiday greetings and special offers", color: "text-blue-600" }
                        ].map((post, index) => (
                          <div key={index} className="p-3 bg-white/60 rounded-xl border border-white/40 hover:bg-white/80 transition-all">
                            <div className="flex items-start justify-between mb-2">
                              <div className="text-xs text-gray-500 font-medium">{post.date} at {post.time}</div>
                              <Clock className="h-4 w-4 text-orange-500" />
                            </div>
                            <div className={`text-sm font-medium mb-1 ${post.color}`}>{post.platform}</div>
                            <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={() => setShowCreateModal(true)}
                        variant="outline"
                        className="w-full mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Post
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeTab === "analytics" && (
              <>
                {/* Analytics Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                        Analytics Dashboard 📊
                      </h2>
                      <p className="text-gray-600 mt-2">Track your social media performance and insights</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-blue-100 text-blue-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                        Last 30 days
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {[
                    { title: "Total Reach", value: "45.2K", change: "+23%", icon: Users, color: "from-blue-500 to-blue-600" },
                    { title: "Engagement Rate", value: "8.4%", change: "+12%", icon: Heart, color: "from-pink-500 to-pink-600" },
                    { title: "Click-through Rate", value: "3.2%", change: "+18%", icon: Target, color: "from-purple-500 to-purple-600" },
                    { title: "Follower Growth", value: "+1.2K", change: "+45%", icon: TrendingUp, color: "from-green-500 to-green-600" }
                  ].map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                      <Card key={index} className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color} shadow-lg`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                              {metric.change}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                              {metric.value}
                            </h3>
                            <p className="text-sm text-gray-600 font-medium">{metric.title}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Charts and Detailed Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Engagement Chart */}
                  <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                        Engagement Over Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                          <p className="text-gray-600">Interactive chart coming soon</p>
                          <p className="text-sm text-gray-500">Showing engagement trends</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Platform Performance */}
                  <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
                        Platform Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { platform: "Instagram", engagement: "12.4K", rate: "9.2%", color: "bg-pink-500" },
                          { platform: "Twitter", engagement: "8.7K", rate: "7.8%", color: "bg-blue-500" },
                          { platform: "LinkedIn", engagement: "5.3K", rate: "6.4%", color: "bg-blue-700" },
                          { platform: "Facebook", engagement: "18.8K", rate: "8.9%", color: "bg-blue-600" }
                        ].map((platform, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-white/60 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full ${platform.color}`}></div>
                              <span className="font-medium text-gray-900">{platform.platform}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">{platform.engagement}</div>
                              <div className="text-xs text-gray-500">{platform.rate} engagement</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performing Posts */}
                <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                      Top Performing Posts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { content: "🚀 Just launched our new AI feature! The response has been incredible...", platform: "Instagram", likes: "2.4K", comments: "156", shares: "89" },
                        { content: "Tips for better social media engagement: 1. Post consistently 2. Use relevant hashtags...", platform: "LinkedIn", likes: "1.8K", comments: "234", shares: "67" },
                        { content: "Behind the scenes: How we built our content scheduling tool 🛠️", platform: "Twitter", likes: "1.2K", comments: "89", shares: "145" }
                      ].map((post, index) => (
                        <div key={index} className="p-4 bg-white/60 rounded-xl hover:bg-white/80 transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="text-sm text-gray-700 mb-2 line-clamp-2">{post.content}</p>
                              <span className="text-xs text-blue-600 font-medium">{post.platform}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Heart className="h-4 w-4" />
                              <span>{post.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="h-4 w-4" />
                              <span>{post.comments}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Share2 className="h-4 w-4" />
                              <span>{post.shares}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === "settings" && (
              <>
                {/* Settings Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                        Settings ⚙️
                      </h2>
                      <p className="text-gray-600 mt-2">Configure your account and preferences</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Settings Navigation */}
                  <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                        Settings Menu
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <nav className="space-y-2">
                        {[
                          { id: "account", label: "Account", icon: Users, active: true },
                          { id: "social", label: "Social Accounts", icon: Share2, active: false },
                          { id: "notifications", label: "Notifications", icon: Bell, active: false },
                          { id: "billing", label: "Billing", icon: Target, active: false },
                          { id: "security", label: "Security", icon: Settings, active: false }
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                                item.active
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                              <span className="font-medium">{item.label}</span>
                            </button>
                          );
                        })}
                      </nav>
                    </CardContent>
                  </Card>

                  {/* Settings Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Account Settings */}
                    <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                          Account Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                              type="text"
                              defaultValue={user?.user_metadata?.full_name || "John Doe"}
                              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                              type="email"
                              defaultValue={user?.email || "john@example.com"}
                              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                          <textarea
                            rows={3}
                            defaultValue="Social media enthusiast and content creator passionate about AI-powered tools."
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all"
                          />
                        </div>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                          Save Changes
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Connected Accounts */}
                    <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent">
                          Connected Social Accounts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            { platform: "Instagram", connected: true, username: "@johndoe", color: "text-pink-600" },
                            { platform: "Twitter", connected: true, username: "@john_doe", color: "text-blue-600" },
                            { platform: "LinkedIn", connected: false, username: "", color: "text-blue-700" },
                            { platform: "Facebook", connected: true, username: "John Doe", color: "text-blue-600" },
                            { platform: "TikTok", connected: false, username: "", color: "text-gray-600" }
                          ].map((account, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-white/40">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  account.connected ? 'bg-green-100' : 'bg-gray-100'
                                }`}>
                                  <Share2 className={`h-5 w-5 ${account.connected ? 'text-green-600' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                  <div className={`font-medium ${account.color}`}>{account.platform}</div>
                                  <div className="text-sm text-gray-500">
                                    {account.connected ? account.username : 'Not connected'}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant={account.connected ? "outline" : "default"}
                                size="sm"
                                className={account.connected ? "" : "bg-gradient-to-r from-blue-500 to-purple-600"}
                              >
                                {account.connected ? 'Disconnect' : 'Connect'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Preferences */}
                    <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                          Preferences
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">Email Notifications</div>
                            <div className="text-sm text-gray-500">Receive email updates about your posts</div>
                          </div>
                          <div className="w-12 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full relative cursor-pointer">
                            <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-lg"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">Auto-Schedule</div>
                            <div className="text-sm text-gray-500">Automatically schedule posts at optimal times</div>
                          </div>
                          <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                            <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-lg"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">AI Suggestions</div>
                            <div className="text-sm text-gray-500">Get AI-powered content suggestions</div>
                          </div>
                          <div className="w-12 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full relative cursor-pointer">
                            <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-lg"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
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

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default BeautifulDashboard;

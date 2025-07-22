import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { usePosts } from "@/hooks/usePosts";
import RealTimeAnalytics from "./RealTimeAnalytics";
import { useEngagementSync, realEngagementService, RealTimeEngagementSync } from "@/services/engagementService";
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
  MoreVertical,
  Command,
  Layers,
  PieChart,
  BarChart,
  LineChart,
  Bookmark,
  Star,
  Folder,
  Hash,
  AtSign,
  Link,
  Download,
  Upload,
  RefreshCw,
  Maximize2,
  Minimize2,
  Grid3X3,
  List,
  Calendar as CalendarIcon,
  ChevronDown,
  Dot,
  Edit3,
  Save,
  MapPin,
  User,
  Crown,
  Mail,
  Camera,
  Database,
  Trash2
} from "lucide-react";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import CreatePostModal from "./CreatePostModal";
import SettingsPage from "./pages/SettingsPage";
import MyPostsPage from "./pages/MyPostsPage";
import { useSocialMediaConnection } from "@/hooks/useSocialMediaConnection";
import { supabase } from "@/integrations/supabase/client";

const ProfessionalDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [connectionStatus, setConnectionStatus] = useState({
    twitter: false,
    linkedin: false,
    instagram: false,
    facebook: false,
    reddit: false
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    country: "",
    profilePicture: ""
  });
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isConnecting, connectPlatform, disconnectPlatform } = useSocialMediaConnection(setConnectionStatus);
  const { posts, loading: postsLoading, stats } = usePosts();

  // Set up automatic engagement syncing every 30 minutes
  const { syncEngagement } = useEngagementSync(user?.id, 30);

  // Start real-time engagement sync when user is available
  useEffect(() => {
    if (user?.id) {
      RealTimeEngagementSync.startSync(user.id, 15); // Sync every 15 minutes

      return () => {
        RealTimeEngagementSync.stopSync(user.id);
      };
    }
  }, [user?.id]);

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

  // Load user profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        country: user.user_metadata?.country || "",
        profilePicture: user.user_metadata?.profile_picture || ""
      });
    }
  }, [user]);

  const handleProfileEdit = () => {
    setIsEditingProfile(true);
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert to base64 for storage in user metadata
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setProfileData(prev => ({ ...prev, profilePicture: base64String }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProfileCancel = () => {
    setIsEditingProfile(false);
    // Reset form data to original values
    if (user) {
      setProfileData({
        name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        country: user.user_metadata?.country || "",
        profilePicture: user.user_metadata?.profile_picture || ""
      });
    }
  };



  const handleProfileSave = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.name,
          country: profileData.country,
          profile_picture: profileData.profilePicture
        }
      });

      if (error) throw error;

      setIsEditingProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  };



  // Professional navigation structure
  const navigationSections = [
    {
      title: "Workspace",
      items: [
        { id: "overview", label: "Overview", icon: Home, shortcut: "⌘1" },
        { id: "create", label: "Create", icon: Wand2, shortcut: "⌘N", action: () => navigate('/create') },
        { id: "posts", label: "Posts", icon: FileText, shortcut: "⌘2", badge: "24", action: () => navigate('/posts') },
        { id: "calendar", label: "Calendar", icon: Calendar, shortcut: "⌘3" },
        { id: "analytics", label: "Analytics", icon: BarChart3, shortcut: "⌘4" }
      ]
    },
    {
      title: "Content Tools",
      items: [
        { id: "ai-copywriting", label: "AI Copywriting", icon: Wand2, shortcut: "⌘W" },
        { id: "caption-generator", label: "Caption Generator", icon: MessageCircle, shortcut: "⌘G" },
        { id: "media", label: "Media Library", icon: Image, shortcut: "⌘M" },
        { id: "templates", label: "Templates", icon: Layers, shortcut: "⌘T" }
      ]
    },
    {
      title: "Publishing",
      items: [
        { id: "multi-platform", label: "Multi-Platform", icon: Globe, shortcut: "⌘P" },
        { id: "auto-publishing", label: "Auto Publishing", icon: Zap, shortcut: "⌘A" },
        { id: "smart-scheduling", label: "Smart Scheduling", icon: Clock, shortcut: "⌘S" }
      ]
    },
    {
      title: "Team & Settings",
      items: [
        { id: "collaboration", label: "Team Collaboration", icon: Users, shortcut: "⌘U" },
        { id: "settings", label: "Settings", icon: Settings, shortcut: "⌘," }
      ]
    }
  ];

  // Professional metrics with real data
  const metrics = [
    {
      title: "Total Posts",
      value: stats.total.toString(),
      change: stats.total > 0 ? "+100%" : "0%",
      trend: stats.total > 0 ? "up" : "neutral",
      icon: FileText,
      color: "blue",
      description: "All posts in your library"
    },
    {
      title: "Published",
      value: stats.published.toString(),
      change: stats.published > 0 ? "+100%" : "0%",
      trend: stats.published > 0 ? "up" : "neutral",
      icon: Send,
      color: "green",
      description: "Successfully published posts"
    },
    {
      title: "Drafts",
      value: stats.drafts.toString(),
      change: stats.drafts > 0 ? "+100%" : "0%",
      trend: stats.drafts > 0 ? "up" : "neutral",
      icon: Edit3,
      color: "orange",
      description: "Posts saved as drafts"
    },
    {
      title: "Scheduled",
      value: stats.scheduled.toString(),
      change: stats.scheduled > 0 ? "+100%" : "0%",
      trend: stats.scheduled > 0 ? "up" : "neutral",
      icon: Clock,
      color: "purple",
      description: "Posts ready to publish"
    }
  ];

  // Quick actions with better organization
  const quickActions = [
    {
      title: "Create Post",
      description: "AI-powered content generation",
      icon: Wand2,
      color: "from-violet-500 to-purple-600",
      action: () => navigate('/create'),
      shortcut: "⌘N"
    },
    {
      title: "Schedule Content",
      description: "Plan your publishing calendar",
      icon: Calendar,
      color: "from-blue-500 to-cyan-600",
      action: () => setActiveTab("calendar"),
      shortcut: "⌘S"
    },
    {
      title: "View Analytics",
      description: "Track performance metrics",
      icon: BarChart3,
      color: "from-emerald-500 to-teal-600",
      action: () => setActiveTab("analytics"),
      shortcut: "⌘A"
    },
    {
      title: "Upload Media",
      description: "Add images and videos",
      icon: Upload,
      color: "from-orange-500 to-red-600",
      action: () => navigate('/create'),
      shortcut: "⌘U"
    }
  ];

  return (
    <div className="h-screen bg-gray-50/50 flex overflow-hidden">
      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      {/* Professional Sidebar */}
      <aside className={`${
        sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-72'
      } fixed lg:relative inset-y-0 left-0 bg-white border-r border-gray-200/60 flex flex-col transition-all duration-300 ease-in-out z-30 lg:z-10`}>
        
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200/60">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="hidden lg:block">
                <h1 className="text-sm font-semibold text-gray-900">ScribeSchedule</h1>
                <p className="text-xs text-gray-500">Professional</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors lg:p-1.5"
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5 text-gray-600 lg:w-4 lg:h-4" /> : <X className="w-5 h-5 text-gray-600 lg:w-4 lg:h-4" />}
          </button>
        </div>



        {/* Navigation */}
        <nav className="flex-1 px-4 pb-4 space-y-6 overflow-y-auto">
          {navigationSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {!sidebarCollapsed && (
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.action) {
                          item.action();
                        } else {
                          setActiveTab(item.id);
                        }
                        // Close sidebar on mobile after navigation
                        if (window.innerWidth < 1024) {
                          setSidebarCollapsed(true);
                        }
                      }}
                      className={`${
                        sidebarCollapsed ? 'w-8 h-8 p-0 justify-center lg:w-8 lg:h-8' : 'w-full px-3 py-3 justify-start lg:py-2'
                      } flex items-center rounded-lg transition-all duration-200 group relative touch-manipulation ${
                        isActive
                          ? 'bg-violet-50 text-violet-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="ml-3 text-sm font-medium">{item.label}</span>
                          <div className="ml-auto flex items-center space-x-2">
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600">
                                {item.badge}
                              </Badge>
                            )}
                            {item.shortcut && (
                              <kbd className="text-xs text-gray-400 font-mono">{item.shortcut}</kbd>
                            )}
                          </div>
                        </>
                      )}
                      {sidebarCollapsed && isActive && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {item.label}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200/60">
          <div className={`${
            sidebarCollapsed ? 'justify-center' : 'justify-between'
          } flex items-center`}>
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200/60 flex items-center justify-between px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-4 flex-1 lg:flex-initial">
            <div className="min-w-0 flex-1 lg:flex-initial">
              <h1 className="text-lg font-semibold text-gray-900 capitalize truncate">{activeTab}</h1>
              <p className="text-sm text-gray-500 hidden sm:block">
                {activeTab === 'overview' && 'Your social media command center'}
                {activeTab === 'posts' && 'Manage your content library'}
                {activeTab === 'calendar' && 'Schedule and plan your posts'}
                {activeTab === 'analytics' && 'Track your performance metrics'}
                {activeTab === 'settings' && 'Configure your account and preferences'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-32 sm:w-48 lg:w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-mono hidden lg:block">⌘K</kbd>
            </div>
            
            {/* Mobile Search Button */}
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors sm:hidden">
              <Search className="w-5 h-5 text-gray-600" />
            </button>

            {/* View Toggle */}
            {activeTab === 'posts' && (
              <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded touch-manipulation ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded touch-manipulation ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile */}
            <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
            {activeTab === "overview" && (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  {metrics.map((metric, index) => {
                    const Icon = metric.icon;
                    const colorClasses = {
                      blue: 'from-blue-500 to-blue-600 bg-blue-50 text-blue-700',
                      pink: 'from-pink-500 to-pink-600 bg-pink-50 text-pink-700',
                      green: 'from-emerald-500 to-emerald-600 bg-emerald-50 text-emerald-700',
                      orange: 'from-orange-500 to-orange-600 bg-orange-50 text-orange-700',
                      purple: 'from-purple-500 to-purple-600 bg-purple-50 text-purple-700'
                    };

                    return (
                      <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-4">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${colorClasses[metric.color]?.split(' ')[0] || 'from-gray-500'} ${colorClasses[metric.color]?.split(' ')[1] || 'to-gray-600'} flex items-center justify-center shadow-sm`}>
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                                    <Badge className={`text-xs ${colorClasses[metric.color]?.split(' ').slice(2).join(' ') || 'bg-gray-50 text-gray-700'}`}>
                                      {metric.change}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500">{metric.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Get started with these common tasks</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-gray-600">
                        View All
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={index}
                            onClick={action.action}
                            className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-left group bg-white"
                          >
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200 shadow-sm`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
                            <p className="text-sm text-gray-500 mb-2">{action.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">Click to start</span>
                              <kbd className="text-xs text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                                {action.shortcut}
                              </kbd>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity & Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Posts */}
                  <Card className="lg:col-span-2 border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
                          <p className="text-sm text-gray-500 mt-1">Your latest posts and interactions</p>
                        </div>
                        <Button
                          onClick={() => navigate('/posts')}
                          variant="outline"
                          size="sm"
                          className="text-gray-600"
                        >
                          View All
                          <ArrowUpRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {postsLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-2">Loading recent posts...</p>
                          </div>
                        ) : posts.length === 0 ? (
                          <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-2">No posts yet</p>
                            <p className="text-sm text-gray-400">Create your first post to see it here</p>
                            <Button
                              onClick={() => navigate('/create')}
                              className="mt-4"
                              size="sm"
                            >
                              Create Post
                            </Button>
                          </div>
                        ) : (
                          posts.slice(0, 3).map((post) => {
                            const getPlatformColor = (platform: string) => {
                              switch (platform.toLowerCase()) {
                                case 'twitter': return { color: 'text-sky-600', bg: 'bg-sky-50' };
                                case 'linkedin': return { color: 'text-blue-600', bg: 'bg-blue-50' };
                                case 'instagram': return { color: 'text-pink-600', bg: 'bg-pink-50' };
                                case 'facebook': return { color: 'text-blue-700', bg: 'bg-blue-50' };
                                case 'reddit': return { color: 'text-orange-600', bg: 'bg-orange-50' };
                                default: return { color: 'text-gray-600', bg: 'bg-gray-50' };
                              }
                            };

                            const formatTime = (dateString: string) => {
                              const date = new Date(dateString);
                              const now = new Date();
                              const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

                              if (diffInHours < 1) return 'Just now';
                              if (diffInHours < 24) return `${diffInHours} hours ago`;
                              const diffInDays = Math.floor(diffInHours / 24);
                              if (diffInDays === 1) return '1 day ago';
                              return `${diffInDays} days ago`;
                            };

                            const platformStyle = getPlatformColor(post.platform);

                            return (
                            <div key={post.id} className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200 bg-white">
                              <div className="flex items-start space-x-3">
                                <div className={`w-8 h-8 rounded-lg ${platformStyle.bg} flex items-center justify-center flex-shrink-0`}>
                                  {post.status === 'published' ? (
                                    <CheckCircle className={`w-4 h-4 ${platformStyle.color}`} />
                                  ) : post.status === 'scheduled' ? (
                                    <Clock className={`w-4 h-4 ${platformStyle.color}`} />
                                  ) : (
                                    <FileText className={`w-4 h-4 ${platformStyle.color}`} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className={`text-sm font-medium ${platformStyle.color}`}>
                                      {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                                    </span>
                                    <Badge
                                      variant={post.status === 'published' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {post.status}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {post.status === 'scheduled' && post.scheduled_at
                                        ? `Scheduled for ${new Date(post.scheduled_at).toLocaleDateString()}`
                                        : formatTime(post.created_at)
                                      }
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">{post.content}</p>
                                  {post.status === 'published' && post.engagement_stats && Object.keys(post.engagement_stats).length > 0 && (
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      {Object.entries(post.engagement_stats).map(([platform, stats]: [string, any]) => (
                                        <div key={platform} className="flex items-center space-x-2">
                                          {stats.likes && (
                                            <div className="flex items-center space-x-1">
                                              <Heart className="w-3 h-3" />
                                              <span>{stats.likes}</span>
                                            </div>
                                          )}
                                          {stats.comments && (
                                            <div className="flex items-center space-x-1">
                                              <MessageCircle className="w-3 h-3" />
                                              <span>{stats.comments}</span>
                                            </div>
                                          )}
                                          {stats.shares && (
                                            <div className="flex items-center space-x-1">
                                              <Share2 className="w-3 h-3" />
                                              <span>{stats.shares}</span>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <button className="p-1 rounded hover:bg-gray-100 transition-colors">
                                  <MoreVertical className="w-4 h-4 text-gray-400" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Summary */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-900">Performance</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">This month's overview</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Engagement Score */}
                      <div className="text-center">
                        <div className="relative w-20 h-20 mx-auto mb-4">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <div className="text-center">
                              <div className="text-lg font-bold text-white">8.7</div>
                              <div className="text-xs text-white/80">Score</div>
                            </div>
                          </div>
                        </div>
                        <h4 className="font-medium text-gray-900">Engagement Score</h4>
                        <p className="text-sm text-gray-500">Above average performance</p>
                      </div>

                      {/* Platform Breakdown */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-gray-900">Platform Performance</h5>
                        {[
                          { platform: "Instagram", percentage: 85, color: "bg-pink-500" },
                          { platform: "LinkedIn", percentage: 72, color: "bg-blue-500" },
                          { platform: "Twitter", percentage: 68, color: "bg-sky-500" },
                          { platform: "Facebook", percentage: 45, color: "bg-blue-600" }
                        ].map((item, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">{item.platform}</span>
                              <span className="font-medium text-gray-900">{item.percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${item.color} transition-all duration-500`}
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{stats.total}</div>
                          <div className="text-xs text-gray-500">Total Posts</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{stats.scheduled}</div>
                          <div className="text-xs text-gray-500">Scheduled</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Button
                          onClick={() => setActiveTab("analytics")}
                          variant="outline"
                          className="w-full"
                        >
                          View Detailed Analytics
                          <BarChart3 className="w-4 h-4 ml-2" />
                        </Button>

                        {/* Real Engagement Sync */}
                        <Button
                          onClick={async () => {
                            if (user?.id) {
                              toast({
                                title: "Syncing Real Engagement Data",
                                description: "Fetching live data from your connected social media platforms...",
                              });
                              try {
                                await realEngagementService.syncRealData(user.id);
                                toast({
                                  title: "Real Data Synced!",
                                  description: "Your analytics now show live engagement data from all connected platforms.",
                                });
                              } catch (error) {
                                toast({
                                  title: "Sync Error",
                                  description: "Failed to sync real engagement data. Check your platform connections.",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Sync Real Engagement Data
                        </Button>

                        {/* Clear All Data */}
                        <Button
                          onClick={async () => {
                            if (user?.id) {
                              const confirmed = confirm('This will clear all engagement data to ensure only real data from social media platforms is shown. Continue?');
                              if (!confirmed) return;

                              toast({
                                title: "Clearing All Engagement Data",
                                description: "Removing all data to ensure only real engagement is shown...",
                              });
                              try {
                                await realEngagementService.clearAllEngagementData(user.id);
                                toast({
                                  title: "Data Cleared!",
                                  description: "All engagement data cleared. Only real data from social media platforms will be shown.",
                                });
                              } catch (error) {
                                toast({
                                  title: "Clear Error",
                                  description: "Failed to clear engagement data.",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full text-xs border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Clear All Engagement Data
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Other Tabs - Professional Empty States */}
            {activeTab === "posts" && (
              <div className="-m-6">
                <MyPostsPage />
              </div>
            )}

            {activeTab === "calendar" && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Content Calendar</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Plan and schedule your content across all platforms with our intelligent calendar system.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <Button
                    onClick={() => navigate('/create')}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Schedule Post
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Calendar
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="-m-6">
                <RealTimeAnalytics />
              </div>
            )}




            {activeTab === "media" && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Image className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Media Library</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Store and organize all your images, videos, and other media assets.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <Button
                    onClick={() => navigate('/create')}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Media
                  </Button>
                  <Button variant="outline">
                    <Folder className="w-4 h-4 mr-2" />
                    Create Folder
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "templates" && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Layers className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Content Templates</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Save time with pre-designed templates for different types of social media content.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <Button
                    onClick={() => navigate('/create')}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Browse Library
                  </Button>
                </div>
              </div>
            )}

            {/* AI Copywriting */}
            {activeTab === "ai-copywriting" && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Wand2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Copywriting</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Generate engaging captions and copy with advanced AI technology for all your social media platforms.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <Button
                    onClick={() => navigate('/create')}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Copy
                  </Button>
                  <Button variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    View Examples
                  </Button>
                </div>
              </div>
            )}

            {/* Caption Generator */}
            {activeTab === "caption-generator" && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Caption Generator</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Create compelling captions with hashtags and emojis optimized for each social media platform.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <Button
                    onClick={() => navigate('/create')}
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Generate Caption
                  </Button>
                  <Button variant="outline">
                    <Hash className="w-4 h-4 mr-2" />
                    Hashtag Suggestions
                  </Button>
                </div>
              </div>
            )}

            {/* Multi-Platform */}
            {activeTab === "multi-platform" && (
              <div className="space-y-6">
                {/* Multi-Platform Header */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Platform Publishing</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Publish your content across Facebook, Instagram, Twitter, LinkedIn, and Reddit with platform-specific optimization.
                  </p>
                </div>

                {/* Platform Status Overview */}
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Platform Status
                    </CardTitle>
                    <p className="text-sm text-gray-500">Overview of your connected social media platforms</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          id: 'facebook',
                          name: 'Facebook',
                          icon: Facebook,
                          color: 'from-blue-500 to-blue-600',
                          reach: '2.3K',
                          posts: '12'
                        },
                        {
                          id: 'instagram',
                          name: 'Instagram',
                          icon: Instagram,
                          color: 'from-pink-500 to-purple-600',
                          reach: '1.8K',
                          posts: '8'
                        },
                        {
                          id: 'twitter',
                          name: 'Twitter',
                          icon: Twitter,
                          color: 'from-sky-500 to-blue-600',
                          reach: '956',
                          posts: '15'
                        },
                        {
                          id: 'linkedin',
                          name: 'LinkedIn',
                          icon: Linkedin,
                          color: 'from-blue-600 to-blue-700',
                          reach: '1.2K',
                          posts: '6'
                        },
                        {
                          id: 'reddit',
                          name: 'Reddit',
                          icon: MessageCircle,
                          color: 'from-orange-500 to-red-600',
                          reach: '543',
                          posts: '4'
                        }
                      ].map((platform) => {
                        const isConnected = connectionStatus[platform.id as keyof typeof connectionStatus];
                        const isLoading = isConnecting[platform.id as keyof typeof isConnecting];

                        return (
                          <div key={platform.id} className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 bg-white">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${platform.color} flex items-center justify-center shadow-sm`}>
                                  <platform.icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{platform.name}</h4>
                                  <div className="flex items-center">
                                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-300'} mr-2`}></div>
                                    <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                                      {isConnected ? 'Connected' : 'Disconnected'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {isConnected ? (
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">Reach</span>
                                  <span className="font-medium text-gray-900">{platform.reach}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">Posts</span>
                                  <span className="font-medium text-gray-900">{platform.posts}</span>
                                </div>
                                <Button
                                  onClick={() => navigate('/create')}
                                  size="sm"
                                  className={`w-full bg-gradient-to-r ${platform.color} hover:opacity-90 text-white`}
                                >
                                  <Send className="w-3 h-3 mr-1" />
                                  Post Now
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500 mb-3">Connect to start publishing</p>
                                <Button
                                  onClick={() => connectPlatform(platform.id as any)}
                                  disabled={isLoading}
                                  size="sm"
                                  className={`w-full bg-gradient-to-r ${platform.color} hover:opacity-90 text-white`}
                                >
                                  {isLoading ? (
                                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <Link className="w-3 h-3 mr-1" />
                                  )}
                                  Connect
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Publishing Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                        <Wand2 className="w-5 h-5 mr-2" />
                        Quick Publish
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 mb-4">
                        Create and publish content to all connected platforms simultaneously.
                      </p>
                      <Button
                        onClick={() => navigate('/create')}
                        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Create & Publish
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Schedule Posts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 mb-4">
                        Plan your content calendar and schedule posts for optimal engagement.
                      </p>
                      <Button
                        onClick={() => setActiveTab("calendar")}
                        variant="outline"
                        className="w-full"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Open Calendar
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Auto Publishing */}
            {activeTab === "auto-publishing" && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Auto Publishing</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Automate your posting schedule with intelligent timing and automated distribution across all platforms.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <Button
                    onClick={() => setActiveTab("calendar")}
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Setup Automation
                  </Button>
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Rules
                  </Button>
                </div>
              </div>
            )}

            {/* Smart Scheduling */}
            {activeTab === "smart-scheduling" && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Scheduling</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  AI-powered optimal timing recommendations based on your audience engagement patterns and time zones.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <Button
                    onClick={() => setActiveTab("calendar")}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    View Schedule
                  </Button>
                  <Button variant="outline">
                    <Target className="w-4 h-4 mr-2" />
                    Optimize Timing
                  </Button>
                </div>
              </div>
            )}

            {/* Team Collaboration */}
            {activeTab === "collaboration" && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Team Collaboration</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Collaborate with your team members, assign roles, and manage content approval workflows.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <Button
                    onClick={() => toast({ title: "Coming Soon", description: "Team collaboration features will be available soon!" })}
                    className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Invite Team
                  </Button>
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Roles
                  </Button>
                </div>
              </div>
            )}











            {/* Settings */}
            {activeTab === "settings" && (
              <div className="-m-6">
                <SettingsPage />
              </div>
            )}
          </div>
        </div>
      </main>

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

export default ProfessionalDashboard;

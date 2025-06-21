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
  Camera
} from "lucide-react";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import CreatePostModal from "./CreatePostModal";
import SettingsPage from "./pages/SettingsPage";
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
        { id: "create", label: "Create", icon: Wand2, shortcut: "⌘N", action: () => setShowCreateModal(true) },
        { id: "posts", label: "Posts", icon: FileText, shortcut: "⌘2", badge: "24" },
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
        { id: "integrations", label: "Integrations", icon: Link, shortcut: "⌘I" },
        { id: "settings", label: "Settings", icon: Settings, shortcut: "⌘," }
      ]
    }
  ];

  // Professional metrics with better data visualization
  const metrics = [
    {
      title: "Total Reach",
      value: "127.5K",
      change: "+23.4%",
      trend: "up",
      icon: Users,
      color: "blue",
      description: "Unique users reached this month"
    },
    {
      title: "Engagement Rate",
      value: "8.7%",
      change: "+2.1%",
      trend: "up",
      icon: Heart,
      color: "pink",
      description: "Average engagement across platforms"
    },
    {
      title: "Content Published",
      value: "47",
      change: "+12",
      trend: "up",
      icon: Send,
      color: "green",
      description: "Posts published this month"
    },
    {
      title: "Scheduled Posts",
      value: "23",
      change: "+5",
      trend: "up",
      icon: Clock,
      color: "orange",
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
      action: () => setShowCreateModal(true),
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
      action: () => setShowCreateModal(true),
      shortcut: "⌘U"
    }
  ];

  return (
    <div className="h-screen bg-gray-50/50 flex overflow-hidden">
      {/* Professional Sidebar */}
      <aside className={`${
        sidebarCollapsed ? 'w-16' : 'w-72'
      } bg-white border-r border-gray-200/60 flex flex-col transition-all duration-300 ease-in-out relative z-10`}>
        
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200/60">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">ScribeSchedule</h1>
                <p className="text-xs text-gray-500">Professional</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-4 h-4 text-gray-600" />
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
                      onClick={() => item.action ? item.action() : setActiveTab(item.id)}
                      className={`${
                        sidebarCollapsed ? 'w-8 h-8 p-0 justify-center' : 'w-full px-3 py-2 justify-start'
                      } flex items-center rounded-lg transition-all duration-200 group relative ${
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
                <div className="w-8 h-8 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
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
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200/60 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 capitalize">{activeTab}</h1>
              <p className="text-sm text-gray-500">
                {activeTab === 'overview' && 'Your social media command center'}
                {activeTab === 'posts' && 'Manage your content library'}
                {activeTab === 'calendar' && 'Schedule and plan your posts'}
                {activeTab === 'analytics' && 'Track your performance metrics'}
                {activeTab === 'settings' && 'Configure your account and preferences'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-mono">⌘K</kbd>
            </div>

            {/* View Toggle */}
            {activeTab === 'posts' && (
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile */}
            <div className="w-8 h-8 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="p-6 space-y-6">
            {activeTab === "overview" && (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {metrics.map((metric, index) => {
                    const Icon = metric.icon;
                    const colorClasses = {
                      blue: 'from-blue-500 to-blue-600 bg-blue-50 text-blue-700',
                      pink: 'from-pink-500 to-pink-600 bg-pink-50 text-pink-700',
                      green: 'from-emerald-500 to-emerald-600 bg-emerald-50 text-emerald-700',
                      orange: 'from-orange-500 to-orange-600 bg-orange-50 text-orange-700'
                    };

                    return (
                      <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-4">
                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${colorClasses[metric.color].split(' ')[0]} ${colorClasses[metric.color].split(' ')[1]} flex items-center justify-center shadow-sm`}>
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                                    <Badge className={`text-xs ${colorClasses[metric.color].split(' ').slice(2).join(' ')}`}>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                          onClick={() => setActiveTab("posts")}
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
                        {[
                          {
                            id: 1,
                            content: "🚀 Excited to announce our new AI-powered content generation feature! This will revolutionize how you create social media content.",
                            platform: "LinkedIn",
                            status: "published",
                            time: "2 hours ago",
                            engagement: { likes: "234", comments: "45", shares: "12" },
                            platformColor: "text-blue-600",
                            platformBg: "bg-blue-50"
                          },
                          {
                            id: 2,
                            content: "Behind the scenes: How we built our content scheduling system using modern web technologies 🛠️ #TechStack #Development",
                            platform: "Twitter",
                            status: "published",
                            time: "5 hours ago",
                            engagement: { likes: "89", comments: "23", shares: "34" },
                            platformColor: "text-sky-600",
                            platformBg: "bg-sky-50"
                          },
                          {
                            id: 3,
                            content: "Tips for better social media engagement: 1. Post consistently 2. Use relevant hashtags 3. Engage with your audience...",
                            platform: "Instagram",
                            status: "scheduled",
                            time: "Tomorrow at 9:00 AM",
                            engagement: { likes: "0", comments: "0", shares: "0" },
                            platformColor: "text-pink-600",
                            platformBg: "bg-pink-50"
                          }
                        ].map((post) => (
                          <div key={post.id} className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200 bg-white">
                            <div className="flex items-start space-x-3">
                              <div className={`w-8 h-8 rounded-lg ${post.platformBg} flex items-center justify-center flex-shrink-0`}>
                                {post.status === 'published' ? (
                                  <CheckCircle className={`w-4 h-4 ${post.platformColor}`} />
                                ) : (
                                  <Clock className={`w-4 h-4 ${post.platformColor}`} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className={`text-sm font-medium ${post.platformColor}`}>
                                    {post.platform}
                                  </span>
                                  <Badge
                                    variant={post.status === 'published' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {post.status}
                                  </Badge>
                                  <span className="text-xs text-gray-500">{post.time}</span>
                                </div>
                                <p className="text-sm text-gray-700 mb-3 line-clamp-2">{post.content}</p>
                                {post.status === 'published' && (
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <div className="flex items-center space-x-1">
                                      <Heart className="w-3 h-3" />
                                      <span>{post.engagement.likes}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <MessageCircle className="w-3 h-3" />
                                      <span>{post.engagement.comments}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Share2 className="w-3 h-3" />
                                      <span>{post.engagement.shares}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <button className="p-1 rounded hover:bg-gray-100 transition-colors">
                                <MoreVertical className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        ))}
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
                          <div className="text-lg font-bold text-gray-900">47</div>
                          <div className="text-xs text-gray-500">Posts</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">23</div>
                          <div className="text-xs text-gray-500">Scheduled</div>
                        </div>
                      </div>

                      <Button
                        onClick={() => setActiveTab("analytics")}
                        variant="outline"
                        className="w-full"
                      >
                        View Detailed Analytics
                        <BarChart3 className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Other Tabs - Professional Empty States */}
            {activeTab === "posts" && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Content Library</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Manage all your social media posts, drafts, and scheduled content in one place.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Post
                  </Button>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Content
                  </Button>
                </div>
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
                    onClick={() => setShowCreateModal(true)}
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
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Track your performance with detailed insights and actionable recommendations.
                </p>
                <div className="flex items-center justify-center space-x-3">
                  <Button
                    onClick={() => setActiveTab("overview")}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Overview
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
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
                    onClick={() => setShowCreateModal(true)}
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
                    onClick={() => setShowCreateModal(true)}
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
                    onClick={() => setShowCreateModal(true)}
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
                    onClick={() => setShowCreateModal(true)}
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
                                  onClick={() => setShowCreateModal(true)}
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
                        onClick={() => setShowCreateModal(true)}
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

            {/* Integrations */}
            {activeTab === "integrations" && (
              <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden -m-6 p-6">
                {/* Background decorations matching landing page */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
                  <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-2xl animate-pulse delay-500"></div>
                </div>

                <div className="relative z-10 space-y-12">
                  {/* Hero Section */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative">
                        <span className="text-6xl animate-bounce">🔗</span>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                      </div>
                      <div className="ml-6">
                        <h2 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                          Connect to 5 major platforms
                        </h2>
                        <div className="h-1.5 w-40 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mt-3 mx-auto animate-pulse"></div>
                      </div>
                    </div>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
                      Publish your content across the most important social media platforms with one click.
                      <span className="font-semibold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text"> Seamless integration</span> for maximum reach.
                    </p>
                  </div>

                  {/* Social Media Platforms */}
                  <div className="mb-16">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Social Media Platforms</h3>
                      <p className="text-gray-600">Connect your social media accounts for seamless publishing</p>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-6">
                      {[
                        {
                          id: 'facebook',
                          name: 'Facebook',
                          icon: Facebook,
                          color: 'text-blue-600',
                          bgColor: 'from-blue-50 to-blue-100',
                          hoverColor: 'hover:from-blue-100 hover:to-blue-200',
                          shadowColor: 'hover:shadow-blue-200/50',
                          gradient: 'from-blue-500 to-blue-600',
                          features: ['Pages & Groups', 'Auto-posting', 'Analytics']
                        },
                        {
                          id: 'instagram',
                          name: 'Instagram',
                          icon: Instagram,
                          color: 'text-pink-500',
                          bgColor: 'from-pink-50 to-purple-100',
                          hoverColor: 'hover:from-pink-100 hover:to-purple-200',
                          shadowColor: 'hover:shadow-pink-200/50',
                          gradient: 'from-pink-500 to-purple-600',
                          features: ['Photos & Videos', 'Stories', 'Reels']
                        },
                        {
                          id: 'twitter',
                          name: 'Twitter',
                          icon: Twitter,
                          color: 'text-sky-500',
                          bgColor: 'from-sky-50 to-blue-100',
                          hoverColor: 'hover:from-sky-100 hover:to-blue-200',
                          shadowColor: 'hover:shadow-sky-200/50',
                          gradient: 'from-sky-500 to-blue-600',
                          features: ['Tweets', 'Threads', 'Engagement']
                        },
                        {
                          id: 'linkedin',
                          name: 'LinkedIn',
                          icon: Linkedin,
                          color: 'text-blue-700',
                          bgColor: 'from-blue-50 to-indigo-100',
                          hoverColor: 'hover:from-blue-100 hover:to-indigo-200',
                          shadowColor: 'hover:shadow-blue-200/50',
                          gradient: 'from-blue-600 to-blue-700',
                          features: ['Professional Posts', 'Articles', 'Company Pages']
                        },
                        {
                          id: 'reddit',
                          name: 'Reddit',
                          icon: MessageCircle,
                          color: 'text-orange-600',
                          bgColor: 'from-orange-50 to-red-100',
                          hoverColor: 'hover:from-orange-100 hover:to-red-200',
                          shadowColor: 'hover:shadow-orange-200/50',
                          gradient: 'from-orange-500 to-red-600',
                          features: ['Subreddits', 'Community Posts', 'Discussions']
                        }
                      ].map((platform) => {
                        const isConnected = connectionStatus[platform.id as keyof typeof connectionStatus];
                        const isLoading = isConnecting[platform.id as keyof typeof isConnecting];

                        return (
                          <div key={platform.id} className={`group relative p-6 text-center bg-gradient-to-br ${platform.bgColor} ${platform.hoverColor} rounded-3xl border border-white/60 shadow-lg ${platform.shadowColor} hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer backdrop-blur-sm`}>
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            {/* Animated border */}
                            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${platform.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm`}></div>

                            <div className="relative z-10">
                              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-xl border border-gray-100">
                                <platform.icon className={`w-7 h-7 ${platform.color} group-hover:scale-110 transition-transform duration-300`} />
                              </div>
                              <h4 className="font-bold text-gray-900 text-base group-hover:text-gray-800 transition-colors duration-300 mb-2">{platform.name}</h4>

                              {/* Features */}
                              <div className="mb-3">
                                {platform.features.map((feature, index) => (
                                  <div key={index} className="text-xs text-gray-600 mb-1">{feature}</div>
                                ))}
                              </div>

                              {/* Connection Status */}
                              <div className="flex items-center justify-center mb-3">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-300'} mr-2`}></div>
                                <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                                  {isConnected ? 'Connected' : 'Not Connected'}
                                </span>
                              </div>

                              {/* Action Button */}
                              {isConnected ? (
                                <Button
                                  onClick={() => disconnectPlatform(platform.id as any)}
                                  disabled={isLoading}
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-xs group-hover:scale-105 transition-transform duration-300"
                                >
                                  {isLoading ? (
                                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <X className="w-3 h-3 mr-1" />
                                  )}
                                  Disconnect
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => connectPlatform(platform.id as any)}
                                  disabled={isLoading}
                                  className={`w-full text-xs bg-gradient-to-r ${platform.gradient} hover:opacity-90 text-white group-hover:scale-105 transition-all duration-300 shadow-lg`}
                                >
                                  {isLoading ? (
                                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <Link className="w-3 h-3 mr-1" />
                                  )}
                                  Connect
                                </Button>
                              )}

                              {/* Bottom accent line */}
                              <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r ${platform.gradient} rounded-full group-hover:w-16 transition-all duration-500`}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Third-Party Integrations */}
                  <div className="mb-16">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Third-Party Integrations</h3>
                      <p className="text-gray-600">Enhance your workflow with powerful integrations</p>
                    </div>

                    <div className="grid lg:grid-cols-4 gap-6">
                      {[
                        {
                          name: 'Zapier',
                          icon: Zap,
                          description: 'Automate workflows with 5000+ apps',
                          status: 'Coming Soon',
                          gradient: 'from-orange-500 to-red-500',
                          bgColor: 'from-orange-50 to-red-50',
                          features: ['Workflow Automation', 'Trigger Actions', 'Data Sync']
                        },
                        {
                          name: 'Google Analytics',
                          icon: BarChart3,
                          description: 'Track website traffic and conversions',
                          status: 'Coming Soon',
                          gradient: 'from-green-500 to-blue-500',
                          bgColor: 'from-green-50 to-blue-50',
                          features: ['Traffic Analytics', 'Conversion Tracking', 'Custom Reports']
                        },
                        {
                          name: 'Canva',
                          icon: Image,
                          description: 'Create stunning visuals and graphics',
                          status: 'Coming Soon',
                          gradient: 'from-purple-500 to-pink-500',
                          bgColor: 'from-purple-50 to-pink-50',
                          features: ['Design Templates', 'Brand Assets', 'Auto-resize']
                        },
                        {
                          name: 'Slack',
                          icon: MessageCircle,
                          description: 'Get notifications in your workspace',
                          status: 'Coming Soon',
                          gradient: 'from-indigo-500 to-purple-500',
                          bgColor: 'from-indigo-50 to-purple-50',
                          features: ['Post Notifications', 'Team Updates', 'Analytics Reports']
                        }
                      ].map((integration, index) => (
                        <div key={index} className={`group relative p-6 bg-gradient-to-br ${integration.bgColor} hover:from-white hover:to-gray-50 rounded-3xl border border-white/60 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer backdrop-blur-sm`}>
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                          <div className="relative z-10">
                            <div className={`w-14 h-14 bg-gradient-to-r ${integration.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-xl`}>
                              <integration.icon className="w-7 h-7 text-white group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg group-hover:text-gray-800 transition-colors duration-300 mb-2">{integration.name}</h4>
                            <p className="text-sm text-gray-600 mb-4 group-hover:text-gray-700 transition-colors duration-300">{integration.description}</p>

                            {/* Features */}
                            <div className="mb-4">
                              {integration.features.map((feature, featureIndex) => (
                                <div key={featureIndex} className="flex items-center text-xs text-gray-500 mb-1">
                                  <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                                  {feature}
                                </div>
                              ))}
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center justify-center mb-4">
                              <Badge
                                variant={integration.status === 'Available' ? 'default' : 'secondary'}
                                className={`text-xs ${integration.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                              >
                                {integration.status}
                              </Badge>
                            </div>

                            {/* Action Button */}
                            <Button
                              disabled={integration.status !== 'Available'}
                              className={`w-full text-sm ${integration.status === 'Available'
                                ? `bg-gradient-to-r ${integration.gradient} hover:opacity-90 text-white`
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              } group-hover:scale-105 transition-all duration-300 shadow-lg`}
                            >
                              {integration.status === 'Available' ? (
                                <>
                                  <Link className="w-4 h-4 mr-2" />
                                  Connect
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4 mr-2" />
                                  Coming Soon
                                </>
                              )}
                            </Button>

                            {/* Bottom accent line */}
                            <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r ${integration.gradient} rounded-full group-hover:w-16 transition-all duration-500`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* API & Webhook Management */}
                  <div className="mb-16">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">API & Webhook Management</h3>
                      <p className="text-gray-600">Manage your API keys, webhooks, and developer settings</p>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* API Keys */}
                      <div className="group relative p-6 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-3xl border border-white/60 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer backdrop-blur-sm">
                        <div className="relative z-10">
                          <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Command className="w-7 h-7 text-white" />
                          </div>
                          <h4 className="font-bold text-gray-900 text-lg mb-2">API Keys</h4>
                          <p className="text-sm text-gray-600 mb-4">Manage your API keys for external integrations</p>
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Active Keys</span>
                              <span className="font-medium text-gray-900">3</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Last Used</span>
                              <span className="font-medium text-gray-900">2 hours ago</span>
                            </div>
                          </div>
                          <Button size="sm" className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                            <Settings className="w-4 h-4 mr-2" />
                            Manage Keys
                          </Button>
                        </div>
                      </div>

                      {/* Webhooks */}
                      <div className="group relative p-6 bg-gradient-to-br from-green-50 to-teal-50 hover:from-green-100 hover:to-teal-100 rounded-3xl border border-white/60 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer backdrop-blur-sm">
                        <div className="relative z-10">
                          <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Zap className="w-7 h-7 text-white" />
                          </div>
                          <h4 className="font-bold text-gray-900 text-lg mb-2">Webhooks</h4>
                          <p className="text-sm text-gray-600 mb-4">Configure webhooks for real-time notifications</p>
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Active Hooks</span>
                              <span className="font-medium text-gray-900">5</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Success Rate</span>
                              <span className="font-medium text-green-600">99.2%</span>
                            </div>
                          </div>
                          <Button size="sm" className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white">
                            <Link className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                        </div>
                      </div>

                      {/* Rate Limits */}
                      <div className="group relative p-6 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-3xl border border-white/60 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer backdrop-blur-sm">
                        <div className="relative z-10">
                          <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Activity className="w-7 h-7 text-white" />
                          </div>
                          <h4 className="font-bold text-gray-900 text-lg mb-2">Rate Limits</h4>
                          <p className="text-sm text-gray-600 mb-4">Monitor API usage and rate limits</p>
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Usage Today</span>
                              <span className="font-medium text-gray-900">847/1000</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '84.7%' }}></div>
                            </div>
                          </div>
                          <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Usage
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Integration Status Dashboard */}
                  <div className="mb-16">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Integration Status</h3>
                      <p className="text-gray-600">Real-time status of all your integrations and connections</p>
                    </div>

                    <div className="bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 rounded-3xl p-8 shadow-2xl border border-white/60 backdrop-blur-sm">
                      <div className="grid lg:grid-cols-4 gap-6">
                        {[
                          { label: 'Connected Platforms', value: '5/5', status: 'excellent', color: 'text-green-600' },
                          { label: 'Active Integrations', value: '12', status: 'good', color: 'text-blue-600' },
                          { label: 'API Health', value: '99.9%', status: 'excellent', color: 'text-green-600' },
                          { label: 'Last Sync', value: '2 min ago', status: 'good', color: 'text-blue-600' }
                        ].map((stat, index) => (
                          <div key={index} className="text-center">
                            <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                            <div className="text-sm text-gray-600">{stat.label}</div>
                            <div className={`w-2 h-2 rounded-full mx-auto mt-2 ${
                              stat.status === 'excellent' ? 'bg-green-400 animate-pulse' : 'bg-blue-400 animate-pulse'
                            }`}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-white via-blue-50/50 to-purple-50/50 rounded-3xl p-12 shadow-2xl border border-white/60 backdrop-blur-sm relative overflow-hidden">
                      {/* Background gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-purple-50/20 rounded-3xl"></div>

                      <div className="relative z-10">
                        <div className="flex items-center justify-center mb-6">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                            <Sparkles className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-900 bg-clip-text text-transparent mb-4">
                          Ready to get started?
                        </h3>
                        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                          Connect your social media accounts and start publishing amazing content with AI assistance.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Button
                            onClick={() => setShowCreateModal(true)}
                            size="lg"
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <Wand2 className="w-5 h-5 mr-2" />
                            Create Your First Post
                          </Button>
                          <Button
                            onClick={() => setActiveTab("overview")}
                            variant="outline"
                            size="lg"
                            className="px-8 py-4 text-lg border-2 hover:bg-gray-50"
                          >
                            <ArrowUpRight className="w-5 h-5 mr-2" />
                            View Dashboard
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
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

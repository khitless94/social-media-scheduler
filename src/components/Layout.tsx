import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Home,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  Image,
  Wand2,
  MessageCircle,
  Globe,
  Zap,
  Clock,
  Users,
  Menu,
  X,
  ChevronLeft,
  Bell,
  Search
} from "lucide-react";

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Professional navigation structure
  const navigationSections = [
    {
      title: "Workspace",
      items: [
        { id: "overview", label: "Overview", icon: Home, shortcut: "⌘1", path: "/dashboard" },
        { id: "create", label: "Create", icon: Wand2, shortcut: "⌘N", path: "/create" },
        { id: "posts", label: "Posts", icon: FileText, shortcut: "⌘2", badge: "24", path: "/posts" },
        { id: "calendar", label: "Calendar", icon: Calendar, shortcut: "⌘3", path: "/calendar" },
        { id: "analytics", label: "Analytics", icon: BarChart3, shortcut: "⌘4", path: "/analytics" }
      ]
    },
    {
      title: "Content Tools",
      items: [
        { id: "ai-copywriting", label: "AI Copywriting", icon: Wand2, shortcut: "⌘W", path: "/ai-copywriting" },
        { id: "caption-generator", label: "Caption Generator", icon: MessageCircle, shortcut: "⌘G", path: "/caption-generator" },
        { id: "media", label: "Media Library", icon: Image, shortcut: "⌘M", path: "/media" }
      ]
    },
    {
      title: "Publishing",
      items: [
        { id: "multi-platform", label: "Multi-Platform", icon: Globe, shortcut: "⌘P", path: "/multi-platform" },
        { id: "auto-publishing", label: "Auto Publishing", icon: Zap, shortcut: "⌘A", path: "/auto-publishing" },
        { id: "smart-scheduling", label: "Smart Scheduling", icon: Clock, shortcut: "⌘S", path: "/smart-scheduling" }
      ]
    },
    {
      title: "Team & Settings",
      items: [
        { id: "collaboration", label: "Team Collaboration", icon: Users, shortcut: "⌘U", path: "/team" },
        { id: "settings", label: "Settings", icon: Settings, shortcut: "⌘,", path: "/settings" }
      ]
    }
  ];

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarCollapsed(false);
      } else {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed]);

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard": return "Overview";
      case "/create": return "Create Post";
      case "/posts": return "My Posts";
      case "/calendar": return "Calendar";
      case "/analytics": return "Analytics";
      case "/media": return "Media Library";
      case "/ai-copywriting": return "AI Copywriting";
      case "/caption-generator": return "Caption Generator";
      case "/settings": return "Settings";
      default: return "Dashboard";
    }
  };

  const getPageDescription = () => {
    switch (location.pathname) {
      case "/dashboard": return "Your social media command center";
      case "/create": return "Create and schedule new posts";
      case "/posts": return "Manage your content library";
      case "/calendar": return "Schedule and plan your posts";
      case "/analytics": return "Track your performance metrics";
      case "/media": return "Manage your media files and folders";
      case "/ai-copywriting": return "Generate compelling content with AI";
      case "/caption-generator": return "Create engaging captions for your posts";
      case "/settings": return "Configure your account and preferences";
      default: return "Manage your social media presence";
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } bg-white border-r border-gray-200/60 flex flex-col transition-all duration-300 ease-in-out fixed lg:relative z-40 h-full`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200/60">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-semibold text-gray-900">ScribeSchedule</span>
                  <p className="text-xs text-gray-500">Professional</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              title={`${sidebarCollapsed ? 'Expand' : 'Collapse'} sidebar (Ctrl+B)`}
            >
              {sidebarCollapsed ? <Menu className="w-4 h-4 text-gray-600" /> : <X className="w-4 h-4 text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {navigationSections.map((section) => (
            <div key={section.title}>
              {!sidebarCollapsed && (
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.path ? location.pathname === item.path : false;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.path) {
                          navigate(item.path);
                        }
                        if (window.innerWidth < 1024) {
                          setSidebarCollapsed(true);
                        }
                      }}
                      className={`${
                        sidebarCollapsed ? 'w-8 h-8 p-0 justify-center' : 'w-full px-3 py-2 justify-start'
                      } flex items-center rounded-lg transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-purple-50 text-purple-700 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <>
                          <span className="ml-3 text-sm font-medium flex-1 text-left">{item.label}</span>
                          <div className="flex items-center space-x-2">
                            {item.badge && (
                              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                            {item.shortcut && (
                              <span className="text-xs text-gray-400">{item.shortcut}</span>
                            )}
                          </div>
                        </>
                      )}
                      {sidebarCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
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
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200/60">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'K'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email?.split('@')[0] || 'Karthick Kumar'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'karthickhitless@gmail.com'}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200/60 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            
            <div>
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {getPageTitle()}
              </h1>
              <p className="text-sm text-gray-500 hidden sm:block">
                {getPageDescription()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
};

export default Layout;

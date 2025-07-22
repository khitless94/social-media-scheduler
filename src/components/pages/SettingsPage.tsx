import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSocialMediaConnection } from "@/hooks/useSocialMediaConnection";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import SocialMediaConfig from "@/components/settings/SocialMediaConfig";

import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  RefreshCw,
  Save,
  Link
} from "lucide-react";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("connections");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    twitter: false,
    linkedin: false,
    instagram: false,
    facebook: false,
    reddit: false
  });

  // Profile data
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    country: "",
    gender: "",
    mobile_number: "",
    profile_picture: ""
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: false,
    marketing_notifications: true,
    security_notifications: true
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnecting, connectPlatform, disconnectPlatform, refreshConnectionStatus } = useSocialMediaConnection(setConnectionStatus);

  const refreshConnections = async () => {
    setLoading(true);
    try {
      await refreshConnectionStatus();
      toast({
        title: "Success",
        description: "Connection status refreshed"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh connections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Essential functions for profile and notifications
  const handleSaveProfile = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Save to localStorage as fallback
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData));
      toast({
        title: "Profile Saved",
        description: "Your profile has been saved"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [user, profileData, toast]);

  const loadUserData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load from localStorage
      const localProfile = localStorage.getItem(`profile_${user.id}`);
      if (localProfile) {
        const parsed = JSON.parse(localProfile);
        setProfileData({
          ...parsed,
          email: user.email || ""
        });
      } else {
        setProfileData({
          full_name: "",
          email: user.email || "",
          country: "",
          gender: "",
          mobile_number: "",
          profile_picture: ""
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load initial connection status and user data
  useEffect(() => {
    if (user) {
      console.log('🔄 [Settings] Initializing connection status for user:', user.id);
      loadUserData();
    }
  }, [user, loadUserData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 lg:p-6">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-sm lg:text-base text-gray-600">Manage your account settings and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 lg:space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="connections" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3 text-xs sm:text-sm">
              <Link className="w-4 h-4" />
              <span className="hidden sm:inline">Connections</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3 text-xs sm:text-sm">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3 text-xs sm:text-sm">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3 text-xs sm:text-sm">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="space-y-4 lg:space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 lg:p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                  <div>
                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Social Media Connections</h2>
                    <p className="text-sm lg:text-base text-gray-600 mt-1">Connect your social media accounts to start scheduling posts</p>
                  </div>
                  <Button
                    onClick={refreshConnections}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2 w-full sm:w-auto touch-manipulation"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                </div>
              </div>
              <div className="p-0">
                <SocialMediaConfig
                  connectionStatus={connectionStatus}
                  onConnectionStatusChange={setConnectionStatus}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4 lg:space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">Profile Information</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed text-sm lg:text-base"
                    placeholder="Email address"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    value={profileData.country}
                    onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                  >
                    <option value="">Select your country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="IN">India</option>
                    <option value="JP">Japan</option>
                    <option value="BR">Brazil</option>
                    <option value="MX">Mexico</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={profileData.gender}
                    onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.mobile_number}
                    onChange={(e) => setProfileData(prev => ({ ...prev, mobile_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                    placeholder="Enter your mobile number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture URL
                  </label>
                  <input
                    type="url"
                    value={profileData.profile_picture}
                    onChange={(e) => setProfileData(prev => ({ ...prev, profile_picture: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                    placeholder="https://example.com/profile.jpg"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-6">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center justify-center space-x-2 w-full sm:w-auto touch-manipulation"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={loadUserData}
                  disabled={saving}
                  className="w-full sm:w-auto touch-manipulation"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 lg:space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">Notification Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 lg:p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm lg:text-base">Email Notifications</h3>
                    <p className="text-xs lg:text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notifications.email_notifications}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_notifications: checked }))}
                    className="touch-manipulation"
                  />
                </div>

                <div className="flex items-center justify-between p-3 lg:p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm lg:text-base">Push Notifications</h3>
                    <p className="text-xs lg:text-sm text-gray-600">Get notified on your device</p>
                  </div>
                  <Switch
                    checked={notifications.push_notifications}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push_notifications: checked }))}
                    className="touch-manipulation"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 lg:space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">Security Settings</h2>
              <p className="text-sm lg:text-base text-gray-600">Manage your account security and password settings</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;

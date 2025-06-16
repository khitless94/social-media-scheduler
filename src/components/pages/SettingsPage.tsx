import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSocialMediaConnection } from "@/hooks/useSocialMediaConnection";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Link,
  Palette,
  Save,
  RefreshCw,
  Check,
  X,
  ExternalLink,
  Key,
  Globe,
  Smartphone,
  Mail,
  MapPin,
  Users
} from "lucide-react";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    country: "",
    gender: "",
    mobile_number: ""
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: false,
    marketing_notifications: true,
    security_notifications: true
  });

  const [connectionStatus, setConnectionStatus] = useState({
    twitter: false,
    linkedin: false,
    instagram: false,
    facebook: false,
    reddit: false
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const { isConnecting, connectPlatform, disconnectPlatform } = useSocialMediaConnection(setConnectionStatus);

  // Fetch user profile data
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchNotificationSettings();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfileData({
          full_name: data.full_name || "",
          email: user.email || "",
          country: data.country || "",
          gender: data.gender || "",
          mobile_number: data.mobile_number || ""
        });
      } else {
        // Create profile if doesn't exist
        setProfileData({
          full_name: "",
          email: user.email || "",
          country: "",
          gender: "",
          mobile_number: ""
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setNotifications({
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? false,
          marketing_notifications: data.marketing_notifications ?? true,
          security_notifications: data.security_notifications ?? true
        });
      }
    } catch (error: any) {
      console.log("No notification preferences found, using defaults");
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profileData.full_name,
          country: profileData.country,
          gender: profileData.gender,
          mobile_number: profileData.mobile_number,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email_notifications: notifications.email_notifications,
          push_notifications: notifications.push_notifications,
          marketing_notifications: notifications.marketing_notifications,
          security_notifications: notifications.security_notifications,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification preferences updated"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update notifications",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveAllSettings = async () => {
    await Promise.all([saveProfile(), saveNotifications()]);
  };

  const resetSettings = () => {
    fetchUserProfile();
    fetchNotificationSettings();
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to saved values"
    });
  };

  const changePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      toast({
        title: "Success",
        description: "Password updated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    if (!confirm("This will permanently delete all your data, posts, and connections. Are you absolutely sure?")) {
      return;
    }

    setSaving(true);
    try {
      // Delete user data from profiles table
      await supabase.from('profiles').delete().eq('id', user?.id);

      // Delete user preferences
      await supabase.from('user_preferences').delete().eq('user_id', user?.id);

      // Delete OAuth connections
      await supabase.from('oauth_connections').delete().eq('user_id', user?.id);

      // Delete posts
      await supabase.from('posts').delete().eq('user_id', user?.id);

      // Finally delete the auth user
      const { error } = await supabase.rpc('delete_user');

      if (error) throw error;

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted"
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const platforms = [
    {
      name: "Twitter",
      key: "twitter",
      logo: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: "text-sky-600",
      bgColor: "bg-sky-50",
      borderColor: "border-sky-200"
    },
    {
      name: "LinkedIn",
      key: "linkedin",
      logo: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      name: "Instagram",
      key: "instagram",
      logo: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200"
    },
    {
      name: "Facebook",
      key: "facebook",
      logo: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      name: "Reddit",
      key: "reddit",
      logo: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
        </svg>
      ),
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl shadow-lg">
              <SettingsIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your account and preferences</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              className="border-gray-200 hover:bg-gray-50"
              onClick={resetSettings}
              disabled={loading || saving}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white"
              onClick={saveAllSettings}
              disabled={loading || saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <Link className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Connected</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{Object.values(connectionStatus).filter(Boolean).length}</h3>
            <p className="text-sm text-gray-600">Platforms Connected</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Available</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">5</h3>
            <p className="text-sm text-gray-600">Total Platforms</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Secure</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">100%</h3>
            <p className="text-sm text-gray-600">Security Score</p>
          </div>
        </div>

        {/* Settings Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <div className="border-b border-gray-100 bg-gray-50/50">
              <TabsList className="grid w-full grid-cols-4 bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="profile"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none py-4 px-6 font-semibold transition-all"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="connections"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent data-[state=active]:text-green-600 data-[state=active]:shadow-none py-4 px-6 font-semibold transition-all"
                >
                  <Link className="h-4 w-4 mr-2" />
                  Connections
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-orange-600 data-[state=active]:shadow-none py-4 px-6 font-semibold transition-all"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent data-[state=active]:text-red-600 data-[state=active]:shadow-none py-4 px-6 font-semibold transition-all"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Country
                      </label>
                      <select
                        value={profileData.country}
                        onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select Country</option>
                        <option value="US">United States</option>
                        <option value="UK">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="IN">India</option>
                        <option value="JP">Japan</option>
                        <option value="BR">Brazil</option>
                        <option value="MX">Mexico</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Users className="h-4 w-4 inline mr-1" />
                        Gender
                      </label>
                      <select
                        value={profileData.gender}
                        onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Smartphone className="h-4 w-4 inline mr-1" />
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        placeholder="Enter your mobile number"
                        value={profileData.mobile_number}
                        onChange={(e) => setProfileData(prev => ({ ...prev, mobile_number: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Connections Tab */}
              <TabsContent value="connections" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Social Media Connections</h3>
                  <p className="text-gray-600 mb-6">Connect your social media accounts to start scheduling posts</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {platforms.map((platform) => {
                      const isConnected = connectionStatus[platform.key as keyof typeof connectionStatus];
                      const isLoading = isConnecting[platform.key as keyof typeof isConnecting];

                      return (
                        <div
                          key={platform.key}
                          className={`p-6 rounded-xl border-2 transition-all ${
                            isConnected
                              ? `${platform.bgColor} ${platform.borderColor}`
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`${platform.color}`}>{platform.logo}</div>
                              <div>
                                <h4 className={`font-semibold ${platform.color}`}>{platform.name}</h4>
                                <p className="text-sm text-gray-600">
                                  {isConnected ? "Connected" : "Not connected"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {isConnected ? (
                                <>
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => disconnectPlatform(platform.key as keyof typeof connectionStatus)}
                                    disabled={isLoading}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    {isLoading ? "Disconnecting..." : "Disconnect"}
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => connectPlatform(platform.key as keyof typeof connectionStatus)}
                                  disabled={isLoading}
                                  className={`bg-gradient-to-r ${platform.color.includes('sky') ? 'from-sky-500 to-sky-600' :
                                    platform.color.includes('blue') && platform.name === 'LinkedIn' ? 'from-blue-500 to-blue-600' :
                                    platform.color.includes('blue') ? 'from-blue-600 to-blue-700' :
                                    platform.color.includes('pink') ? 'from-pink-500 to-pink-600' :
                                    'from-orange-500 to-orange-600'} text-white hover:opacity-90 disabled:opacity-50`}
                                >
                                  {isLoading ? "Connecting..." : "Connect"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Notification Preferences</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">Email Notifications</h4>
                          <p className="text-sm text-gray-600">Receive updates via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.email_notifications}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_notifications: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-5 w-5 text-green-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">Push Notifications</h4>
                          <p className="text-sm text-gray-600">Get notified on your device</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.push_notifications}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push_notifications: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Bell className="h-5 w-5 text-purple-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">Marketing Updates</h4>
                          <p className="text-sm text-gray-600">Product updates and tips</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.marketing_notifications}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, marketing_notifications: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-red-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">Security Alerts</h4>
                          <p className="text-sm text-gray-600">Important security notifications</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.security_notifications}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, security_notifications: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Security Settings</h3>
                  <div className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-xl">
                      <div className="flex items-start space-x-3 mb-4">
                        <Key className="h-5 w-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">Change Password</h4>
                          <p className="text-sm text-gray-600 mb-4">Update your account password</p>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                              <input
                                type="password"
                                placeholder="Enter new password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                              <input
                                type="password"
                                placeholder="Confirm new password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              />
                            </div>
                            <Button
                              onClick={changePassword}
                              disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {saving ? "Updating..." : "Update Password"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-green-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                            <p className="text-sm text-gray-600">Add an extra layer of security (Available with Supabase Auth)</p>
                          </div>
                        </div>
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            toast({
                              title: "2FA Setup",
                              description: "2FA setup will be available in the next update. Your account is secured with Supabase Auth.",
                            });
                          }}
                        >
                          Enable 2FA
                        </Button>
                      </div>
                    </div>

                    <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <X className="h-5 w-5 text-red-600" />
                          <div>
                            <h4 className="font-medium text-red-900">Delete Account</h4>
                            <p className="text-sm text-red-700">Permanently delete your account and all associated data</p>
                            <p className="text-xs text-red-600 mt-1">This action cannot be undone!</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={deleteAccount}
                          disabled={saving}
                        >
                          {saving ? "Deleting..." : "Delete Account"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

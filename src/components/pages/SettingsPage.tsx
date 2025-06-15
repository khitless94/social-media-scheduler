import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Mail
} from "lucide-react";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: true,
    security: true
  });
  
  const [connections, setConnections] = useState({
    twitter: true,
    linkedin: false,
    instagram: true,
    facebook: false,
    reddit: false
  });

  const platforms = [
    {
      name: "Twitter",
      key: "twitter",
      icon: "🐦",
      color: "text-sky-600",
      bgColor: "bg-sky-50",
      borderColor: "border-sky-200"
    },
    {
      name: "LinkedIn",
      key: "linkedin",
      icon: "💼",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      name: "Instagram",
      key: "instagram",
      icon: "📸",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200"
    },
    {
      name: "Facebook",
      key: "facebook",
      icon: "👥",
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      name: "Reddit",
      key: "reddit",
      icon: "🤖",
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
            <Button variant="outline" className="border-gray-200 hover:bg-gray-50">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white">
              <Save className="h-4 w-4 mr-2" />
              Save All
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
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{Object.values(connections).filter(Boolean).length}</h3>
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
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      <textarea
                        rows={4}
                        placeholder="Tell us about yourself..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
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
                    {platforms.map((platform) => (
                      <div
                        key={platform.key}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          connections[platform.key as keyof typeof connections]
                            ? `${platform.bgColor} ${platform.borderColor}`
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{platform.icon}</div>
                            <div>
                              <h4 className={`font-semibold ${platform.color}`}>{platform.name}</h4>
                              <p className="text-sm text-gray-600">
                                {connections[platform.key as keyof typeof connections] ? "Connected" : "Not connected"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {connections[platform.key as keyof typeof connections] ? (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setConnections(prev => ({ ...prev, [platform.key]: false }))}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  Disconnect
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => setConnections(prev => ({ ...prev, [platform.key]: true }))}
                                className={`bg-gradient-to-r ${platform.color.includes('sky') ? 'from-sky-500 to-sky-600' : 
                                  platform.color.includes('blue') ? 'from-blue-500 to-blue-600' :
                                  platform.color.includes('pink') ? 'from-pink-500 to-pink-600' :
                                  'from-orange-500 to-orange-600'} text-white hover:opacity-90`}
                              >
                                Connect
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
                        checked={notifications.email}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
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
                        checked={notifications.push}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push: checked }))}
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
                        checked={notifications.marketing}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, marketing: checked }))}
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
                        checked={notifications.security}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, security: checked }))}
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
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Key className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">Change Password</h4>
                            <p className="text-sm text-gray-600">Update your account password</p>
                          </div>
                        </div>
                        <Button variant="outline">
                          Change Password
                        </Button>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-green-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                            <p className="text-sm text-gray-600">Add an extra layer of security</p>
                          </div>
                        </div>
                        <Button className="bg-green-600 hover:bg-green-700 text-white">
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
                            <p className="text-sm text-red-700">Permanently delete your account and data</p>
                          </div>
                        </div>
                        <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                          Delete Account
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


import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Settings as SettingsIcon } from "lucide-react";
import ApiKeyManager from "./ApiKeyManager";
import ProfileSettings from "./settings/ProfileSettings";
import SocialMediaConfig from "./settings/SocialMediaConfig";
import { PricingBasic } from "./PricingBasic";

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [sex, setSex] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  const [connectionStatus, setConnectionStatus] = useState({
    twitter: false,
    linkedin: false,
    instagram: false,
    facebook: false,
    reddit: false
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        // Handle common database errors gracefully
        if (error.code === '42P01' || error.message?.includes('relation "profiles" does not exist')) {
          console.log('Profiles table does not exist, using default values');
        } else if (error.code === 'PGRST116') {
          console.log('No profile found, using default values');
        } else {
          console.warn('Profile loading error (non-critical):', error);
        }
        // Don't throw error, just use default values
      } else if (data) {
        setName(data.full_name || "");
        setCountry(data.country || "");
        setSex(data.sex || "");
        setAge(data.age?.toString() || "");
      }
      setEmail(user?.email || "");
    } catch (error: any) {
      console.warn('Profile loading failed, using defaults:', error);
      // Don't show error toast for profile loading issues
      setEmail(user?.email || "");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: name,
          country,
          sex,
          age: age ? parseInt(age) : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Modern Header */}
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
            <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset</span>
            </button>
            <button className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Save All</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Connected</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{Object.values(connectionStatus).filter(Boolean).length}</h3>
            <p className="text-sm text-gray-600">Platforms Connected</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Available</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">5</h3>
            <p className="text-sm text-gray-600">Total Platforms</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Secure</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">100%</h3>
            <p className="text-sm text-gray-600">Security Score</p>
          </div>
        </div>

        <div className="space-y-8">

          <ProfileSettings
            name={name}
            setName={setName}
            email={email}
            country={country}
            setCountry={setCountry}
            sex={sex}
            setSex={setSex}
            age={age}
            setAge={setAge}
            loading={loading}
            saving={saving}
            onSave={saveProfile}
          />

          <SocialMediaConfig
            connectionStatus={connectionStatus}
            onConnectionStatusChange={setConnectionStatus}
          />

          <PricingBasic />
        </div>
      </div>
    </div>
  );
};

export default Settings;

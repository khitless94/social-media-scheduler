
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ApiKeyManager from "./ApiKeyManager";
import ProfileSettings from "./settings/ProfileSettings";
import SocialMediaConfig from "./settings/SocialMediaConfig";
import SubscriptionPlans from "./settings/SubscriptionPlans";

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

      if (error) throw error;

      if (data) {
        setName(data.full_name || "");
        setCountry(data.country || "");
        setSex(data.sex || "");
        setAge(data.age?.toString() || "");
      }
      setEmail(user?.email || "");
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
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
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
          Manage your account settings and integrations.
        </p>
      </div>

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


      <SubscriptionPlans />
    </div>
  );
};

export default Settings;

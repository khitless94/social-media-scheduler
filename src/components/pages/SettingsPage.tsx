import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSocialMediaConnection } from "@/hooks/useSocialMediaConnection";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import SocialMediaConfig from "@/components/settings/SocialMediaConfig";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Link,
  Save,
  RefreshCw,
  X,
  Key,
  Globe,
  Smartphone,
  Mail,
  MapPin,
  Users,
  Camera,
  Upload,
  ChevronDown,
  ChevronUp,
  Wrench
} from "lucide-react";

// Helper function to convert data URI to Blob
function dataURItoBlob(dataURI: string) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("connections");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    country: "",
    gender: "",
    mobile_number: "",
    profile_picture: ""
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

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
  const { isConnecting, connectPlatform, disconnectPlatform, connectionStatus: hookConnectionStatus } = useSocialMediaConnection(setConnectionStatus);

  // Sync connection status from hook
  useEffect(() => {
    if (hookConnectionStatus) {
      console.log('🔄 [Settings] Hook connection status changed:', hookConnectionStatus);
      console.log('🔢 [Settings] Connected platforms count:', Object.values(hookConnectionStatus).filter(Boolean).length);
      console.log('🔍 [Settings] Connection status details:', Object.entries(hookConnectionStatus).map(([platform, connected]) => `${platform}: ${connected}`));
      setConnectionStatus(hookConnectionStatus);
    }
  }, [hookConnectionStatus]);



  const fetchUserProfile = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Handle all database errors gracefully
        if (error.code === '42P01' || error.message?.includes('relation "profiles" does not exist')) {
          console.log("Profiles table doesn't exist, using localStorage fallback");
        } else if (error.code === 'PGRST116') {
          console.log("No profile found, using defaults");
        } else {
          console.warn("Profile fetch error (non-critical):", error);
        }

        // Check localStorage as fallback
        const localProfile = localStorage.getItem(`profile_${user.id}`);
        if (localProfile) {
          try {
            const parsed = JSON.parse(localProfile);
            setProfileData({
              ...parsed,
              email: user.email || ""
            });
            return;
          } catch (e) {
            console.log("Failed to parse local profile");
          }
        }
        // Use default profile data if no localStorage
        setProfileData({
          full_name: "",
          email: user.email || "",
          country: "",
          gender: "",
          mobile_number: "",
          profile_picture: ""
        });
        return;
      }

      if (data) {
        setProfileData({
          full_name: data.full_name || "",
          email: user.email || "",
          country: data.country || "",
          gender: data.sex || "", // Use 'sex' field from database
          mobile_number: data.mobile_number || "",
          profile_picture: data.avatar_url || ""
        });
      } else {
        // Create default profile
        setProfileData({
          full_name: "",
          email: user.email || "",
          country: "",
          gender: "",
          mobile_number: "",
          profile_picture: ""
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);

      // Fallback to localStorage
      const localProfile = localStorage.getItem(`profile_${user.id}`);
      if (localProfile) {
        try {
          const parsed = JSON.parse(localProfile);
          setProfileData({
            ...parsed,
            email: user.email || ""
          });
        } catch (e) {
          setProfileData({
            full_name: "",
            email: user.email || "",
            country: "",
            gender: "",
            mobile_number: "",
            profile_picture: ""
          });
        }
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
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchNotificationSettings = useCallback(async () => {
    if (!user) return;

    try {
      // Try to fetch from database first
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setNotifications({
          email_notifications: data.email_notifications,
          push_notifications: data.push_notifications,
          marketing_notifications: data.marketing_notifications,
          security_notifications: data.security_notifications
        });
        return;
      } else if (error) {
        // Handle database errors gracefully - use defaults
      }
    } catch (error) {
      console.log("Failed to fetch notifications from database, trying localStorage");
    }

    // Fallback to localStorage
    const localNotifications = localStorage.getItem(`notifications_${user.id}`);
    if (localNotifications) {
      try {
        const parsed = JSON.parse(localNotifications);
        setNotifications(parsed);
        return;
      } catch (e) {
        console.log("Failed to parse local notifications, using defaults");
      }
    }

    // Use defaults if no data found
    setNotifications({
      email_notifications: true,
      push_notifications: false,
      marketing_notifications: true,
      security_notifications: true
    });
  }, [user]);

  // Fetch user profile data
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchNotificationSettings();
    }
  }, [user, fetchUserProfile, fetchNotificationSettings]);

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileData(prev => ({ ...prev, profile_picture: result }));
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully"
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateProfile = () => {
    const errors = [];

    // Full name validation
    if (!profileData.full_name.trim()) {
      errors.push("Full name is required");
    } else if (profileData.full_name.trim().length < 4) {
      errors.push("Full name must be at least 4 characters");
    } else if (/\d/.test(profileData.full_name)) {
      errors.push("Full name cannot contain numbers");
    }

    // Country validation
    if (!profileData.country.trim()) {
      errors.push("Country is required");
    }

    // Gender validation
    if (!profileData.gender.trim()) {
      errors.push("Gender is required");
    }

    // Mobile number validation
    if (!profileData.mobile_number.trim()) {
      errors.push("Mobile number is required");
    } else {
      const mobileRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanNumber = profileData.mobile_number.replace(/[\s\-\(\)]/g, '');
      if (!mobileRegex.test(cleanNumber) || cleanNumber.length < 10) {
        errors.push("Please enter a valid mobile number (minimum 10 digits)");
      }
    }

    return errors;
  };

  const saveProfile = useCallback(async () => {
    if (!user) return;

    // Validate profile data
    const validationErrors = validateProfile();
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Prepare the profile data for database
      let avatarUrl = profileData.profile_picture;

      // If a new profile picture is selected (base64 string), upload it
      if (profileData.profile_picture && profileData.profile_picture.startsWith('data:image')) {
        const blob = dataURItoBlob(profileData.profile_picture);
        const fileExtension = profileData.profile_picture.split(';')[0].split('/')[1];
        const fileName = `${user.id}.${fileExtension}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            upsert: true,
            contentType: `image/${fileExtension}`,
          });

        if (uploadError) {
          throw new Error(`Failed to upload avatar: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatarUrl = publicUrlData.publicUrl;
      }

      const profileUpdateData = {
        id: user.id,
        user_id: user.id,
        full_name: profileData.full_name.trim(),
        country: profileData.country.trim(),
        sex: profileData.gender.trim(),
        avatar_url: avatarUrl || null,
        mobile_number: profileData.mobile_number.trim() || null,
        updated_at: new Date().toISOString()
      };

      console.log('Saving profile data:', profileUpdateData);

      // Test database connection first
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (testError) {
        console.error('Database connection test failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }

      console.log('Database connection test passed');

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileUpdateData, {
          onConflict: 'user_id'
        })
        .select();

      if (error) {
        console.error('Profile save error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });

        // Check if it's a column missing error
        if (error.message?.includes('column') && error.message?.includes('does not exist')) {
          toast({
            title: "Database Schema Issue",
            description: `Database column missing: ${error.message}. Please update your database schema.`,
            variant: "destructive"
          });
          return;
        }

        // If table doesn't exist, create it or show error
        if (error.message?.includes('relation "profiles" does not exist') || error.code === '42P01') {
          toast({
            title: "Database Table Missing",
            description: "The profiles table doesn't exist. Please run the database setup script.",
            variant: "destructive"
          });
          return;
        }

        throw error;
      }

      console.log('Profile saved successfully:', data);

      // Also save to localStorage as backup
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData));

      toast({
        title: "Success",
        description: "Profile updated successfully in database"
      });
    } catch (error: any) {
      console.error('Failed to save profile:', {
        message: error?.message || 'Unknown error',
        code: error?.code,
        details: error?.details
      });

      // Fallback to localStorage if database fails
      try {
        localStorage.setItem(`profile_${user.id}`, JSON.stringify(profileData));
        toast({
          title: "Partial Save",
          description: "Profile saved locally. Database sync failed. Please try again later.",
          variant: "destructive"
        });
      } catch (localError) {
        toast({
          title: "Error",
          description: `Failed to save profile: ${error?.message || 'Unknown error'}`,
          variant: "destructive"
        });
      }
    } finally {
      setSaving(false);
    }
  }, [user, profileData, toast]);

  const saveNotifications = useCallback(async () => {
    if (!user) return;

    setSaving(true);

    try {
      // Save to database first
      const notificationData = {
        user_id: user.id,
        email_notifications: notifications.email_notifications,
        push_notifications: notifications.push_notifications,
        marketing_notifications: notifications.marketing_notifications,
        security_notifications: notifications.security_notifications,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_preferences')
        .upsert(notificationData, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Failed to save notifications to database:', error);
        // Fallback to localStorage if database fails
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));

        toast({
          title: "Partial Save",
          description: "Notification preferences saved locally. Database sync failed.",
          variant: "destructive"
        });
        return;
      }

      // Also save to localStorage as backup
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));

      toast({
        title: "Success",
        description: "Notification preferences saved successfully"
      });
    } catch (error: any) {
      console.error('Failed to save notifications:', error);

      // Fallback to localStorage
      try {
        localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
        toast({
          title: "Partial Save",
          description: "Notification preferences saved locally only.",
          variant: "destructive"
        });
      } catch (localError) {
        toast({
          title: "Error",
          description: "Failed to save notification preferences. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setSaving(false);
    }
  }, [user, notifications, toast]);

  const saveAllSettings = useCallback(async () => {
    setSaving(true);
    try {
      // Save both profile and notifications
      await Promise.all([saveProfile(), saveNotifications()]);

      toast({
        title: "All Settings Saved",
        description: "Profile and notification preferences have been saved successfully"
      });
    } catch (error: any) {
      console.error('Failed to save all settings:', error);
      toast({
        title: "Partial Save",
        description: "Some settings may not have been saved. Please check individual sections.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [saveProfile, saveNotifications]);

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
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
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

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast({
        title: "Error",
        description: "New password must be different from current password",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // First verify the current password by attempting to sign in
      if (!user?.email) {
        throw new Error("User email not found");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // If current password is correct, update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) throw updateError;

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
      await supabase.from('profiles').delete().eq('user_id', user?.id);

      // Delete posts and post history
      await supabase.from('posts').delete().eq('user_id', user?.id);
      await supabase.from('post_history').delete().eq('user_id', user?.id);

      // Delete OAuth credentials
      await supabase.from('oauth_credentials').delete().eq('user_id', user?.id);

      // Clear localStorage data
      localStorage.removeItem(`profile_${user.id}`);
      localStorage.removeItem(`notifications_${user.id}`);

      toast({
        title: "Account Data Deleted",
        description: "Your account data has been deleted. You will be signed out."
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
              <h1 className="text-3xl font-bold text-gray-900">Connect Accounts</h1>
              <p className="text-gray-600">Connect and manage your social media accounts</p>
            </div>
          </div>
          <div className="flex space-x-2">
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
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white disabled:opacity-50"
              onClick={saveAllSettings}
              disabled={loading || saving || validateProfile().length > 0}
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
              <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="connections"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent data-[state=active]:text-green-600 data-[state=active]:shadow-none py-4 px-6 font-semibold transition-all"
                >
                  <Link className="h-4 w-4 mr-2" />
                  Social Accounts
                </TabsTrigger>
                <TabsTrigger
                  value="profile"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none py-4 px-6 font-semibold transition-all"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile Settings
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-orange-600 data-[state=active]:shadow-none py-4 px-6 font-semibold transition-all"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Information</h3>

                  {/* Profile Picture Section */}
                  <div className="mb-8 flex flex-col items-center">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                        {profileData.profile_picture ? (
                          <img
                            src={profileData.profile_picture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
                            <User className="h-12 w-12 text-white" />
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                        <Camera className="h-4 w-4 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Click the camera icon to upload a new profile picture</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your full name (minimum 4 characters, no numbers)"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                          profileData.full_name.trim().length > 0 && (profileData.full_name.trim().length < 4 || /\d/.test(profileData.full_name))
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-200 focus:ring-blue-500'
                        }`}
                        required
                      />
                      {profileData.full_name.trim().length > 0 && profileData.full_name.trim().length < 4 && (
                        <p className="text-red-500 text-xs mt-1">Full name must be at least 4 characters</p>
                      )}
                      {/\d/.test(profileData.full_name) && (
                        <p className="text-red-500 text-xs mt-1">Full name cannot contain numbers</p>
                      )}
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
                        Country <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={profileData.country}
                        onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                          !profileData.country ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
                        }`}
                        required
                      >
                        <option value="">Select Country *</option>
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
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={profileData.gender}
                        onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                          !profileData.gender ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
                        }`}
                        required
                      >
                        <option value="">Select Gender *</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Smartphone className="h-4 w-4 inline mr-1" />
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="Enter your mobile number (e.g., +1234567890)"
                        value={profileData.mobile_number}
                        onChange={(e) => setProfileData(prev => ({ ...prev, mobile_number: e.target.value }))}
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                          profileData.mobile_number.trim().length > 0 &&
                          (!/^[\+]?[1-9][\d]{0,15}$/.test(profileData.mobile_number.replace(/[\s\-\(\)]/g, '')) ||
                           profileData.mobile_number.replace(/[\s\-\(\)]/g, '').length < 10)
                            ? 'border-red-300 focus:ring-red-500'
                            : !profileData.mobile_number.trim()
                              ? 'border-red-300 focus:ring-red-500'
                              : 'border-gray-200 focus:ring-blue-500'
                        }`}
                        required
                      />
                      {profileData.mobile_number.trim().length > 0 &&
                       (!/^[\+]?[1-9][\d]{0,15}$/.test(profileData.mobile_number.replace(/[\s\-\(\)]/g, '')) ||
                        profileData.mobile_number.replace(/[\s\-\(\)]/g, '').length < 10) && (
                        <p className="text-red-500 text-xs mt-1">Please enter a valid mobile number (minimum 10 digits)</p>
                      )}
                    </div>
                  </div>

                  {/* Save Profile Button */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setProfileData({
                          full_name: "",
                          email: user?.email || "",
                          country: "",
                          gender: "",
                          mobile_number: "",
                          profile_picture: ""
                        });
                      }}
                      disabled={saving}
                    >
                      Clear Form
                    </Button>
                    <Button
                      onClick={saveProfile}
                      disabled={saving || validateProfile().length > 0}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {saving ? "Saving..." : "Save Profile"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Connections Tab */}
              <TabsContent value="connections" className="mt-0 space-y-6">
                <div className="-m-8">
                  <SocialMediaConfig
                    connectionStatus={connectionStatus}
                    onConnectionStatusChange={setConnectionStatus}
                  />
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




            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

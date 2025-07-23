import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { ModernDateTimePicker } from '@/components/ui/modern-datetime-picker';
import { PostSchedulerDateTimePicker } from '@/components/ui/postscheduler-datetime-picker';
import { FlexibleTimePicker } from '@/components/ui/flexible-time-picker';
import { SimpleFlexibleTimePicker, NativeFlexibleTimePicker } from '@/components/ui/simple-flexible-time-picker';
import {
  createScheduledDateTime,
  validateFutureTime,
  formatDateTimeForUser,
  validateFutureDate,
  formatDateTimeForDisplay,
  logDateTimezoneDebug,
  createScheduledDateTimeFromDate
} from '@/utils/timezone';
import { AIContentGenerator } from '@/components/ui/ai-content-generator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { useSocialMedia } from '@/hooks/useSocialMedia';

type Platform = 'twitter' | 'facebook' | 'linkedin' | 'reddit' | 'instagram';
type ConnectionStatus = 'connected' | 'disconnected' | 'error';
import { SimpleSchedulingService } from '@/services/simpleSchedulingService';
import {
  ArrowLeft,
  Sparkles,
  Wand2,
  Copy,
  CheckCircle,
  Loader2,
  CalendarIcon,
  Send,
  CalendarDays,
  ExternalLink,
  Settings as SettingsIcon,
  FileText
} from 'lucide-react';
import { FaLinkedin, FaTwitter, FaInstagram, FaFacebook, FaReddit } from 'react-icons/fa';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { ensureAuthenticated, authenticatedStorageOperation } from '@/utils/authenticatedRequest';

const CreatePostMinimal: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { postToSocial } = useSocialMedia();

  // Loading state for social media operations
  const [socialMediaLoading, setSocialMediaLoading] = useState(false);

  // Form state
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState<Platform>('twitter');
  const [title, setTitle] = useState(''); // For Reddit posts
  const [selectedSubreddit, setSelectedSubreddit] = useState('');
  const [selectedFlair, setSelectedFlair] = useState('none');
  const [imageUrl, setImageUrl] = useState('');
  const [postType, setPostType] = useState<'now' | 'schedule'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // AI Content Generation
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  // Subreddit management
  const [availableSubreddits, setAvailableSubreddits] = useState<string[]>([
    'testingground4bots',  // Bot-friendly, usually no flair required
    'n8n',               // Real subreddit with flairs
    'test',               // Basic test subreddit
    'SandBoxTest',        // Sandbox for testing
    'FreeKarma4U',        // Usually allows posts without flair
    'test_subreddit'      // Generic test
  ]);
  const [availableFlairs, setAvailableFlairs] = useState<Array<{id: string, text: string, color?: string, textColor?: string, editable?: boolean}>>([]);
  const [loadingFlairs, setLoadingFlairs] = useState(false);

  // Connection status
  const [connectionStatus, setConnectionStatus] = useState<Record<Platform, ConnectionStatus>>({
    twitter: 'disconnected',
    facebook: 'disconnected',
    linkedin: 'disconnected',
    reddit: 'disconnected',
    instagram: 'disconnected'
  });

  // Set default scheduled time to 1 hour from now using timezone utilities
  useEffect(() => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const year = oneHourLater.getFullYear();
    const month = String(oneHourLater.getMonth() + 1).padStart(2, '0');
    const day = String(oneHourLater.getDate()).padStart(2, '0');
    const hours = String(oneHourLater.getHours()).padStart(2, '0');
    const minutes = String(oneHourLater.getMinutes()).padStart(2, '0');

    setScheduleDate(`${year}-${month}-${day}`);
    setScheduleTime(`${hours}:${minutes}`);
  }, []);

  // Load user's preferred subreddits
  useEffect(() => {
    loadUserSubreddits();
  }, [user]);

  // Listen for storage changes to update subreddits when settings change
  useEffect(() => {
    if (!user) return;

    const handleStorageChange = (e: StorageEvent) => {
      const userSpecificKey = `reddit_subreddits_${user.id}`;
      if (e.key === userSpecificKey) {
        console.log('🔄 Storage change detected for user subreddits');
        loadUserSubreddits();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // Also listen for focus events to reload when returning from settings
  useEffect(() => {
    const handleFocus = () => {
      loadUserSubreddits();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Listen for real-time database changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user_preferences_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_preferences',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Real-time update received:', payload);
          loadUserSubreddits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadUserSubreddits = async () => {
    if (!user) return;

    console.log('🔄 Loading user subreddits for user:', user.id);

    try {
      // First try localStorage with user-specific key (matches settings page)
      const userSpecificKey = `reddit_subreddits_${user.id}`;
      const storedData = localStorage.getItem(userSpecificKey);

      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          console.log('📖 Loaded from localStorage:', parsedData);

          if (parsedData.subreddits && Array.isArray(parsedData.subreddits)) {
            setAvailableSubreddits(parsedData.subreddits);
            console.log('📖 Set subreddits from localStorage:', parsedData.subreddits);

            if (parsedData.defaultSubreddit && parsedData.subreddits.includes(parsedData.defaultSubreddit)) {
              setSelectedSubreddit(parsedData.defaultSubreddit);
              console.log('📖 Set default subreddit from localStorage:', parsedData.defaultSubreddit);
            }
            return; // Exit early if localStorage has valid data
          }
        } catch (parseError) {
          console.error('❌ Error parsing localStorage data:', parseError);
        }
      }

      // Fallback to database if localStorage is empty or invalid
      console.log('📖 No valid localStorage data, checking database...');
      const { data, error } = await supabase
        .from('user_preferences')
        .select('reddit_subreddits, default_reddit_subreddit')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('📖 Database query result:', { data, error });

      if (data && data.reddit_subreddits && Array.isArray(data.reddit_subreddits)) {
        console.log('📖 Loaded subreddits from database:', data.reddit_subreddits);
        setAvailableSubreddits(data.reddit_subreddits);

        // Update localStorage with user-specific key to match settings page format
        localStorage.setItem(userSpecificKey, JSON.stringify({
          subreddits: data.reddit_subreddits,
          defaultSubreddit: data.default_reddit_subreddit,
          updated_at: new Date().toISOString()
        }));

        if (data.default_reddit_subreddit && data.reddit_subreddits.includes(data.default_reddit_subreddit)) {
          setSelectedSubreddit(data.default_reddit_subreddit);
          console.log('📖 Set default subreddit from database:', data.default_reddit_subreddit);
        }
      } else {
        console.log('📖 No database data found, using defaults');
        // Keep default subreddits if no user data found
      }
    } catch (error) {
      console.error('❌ Error loading subreddits:', error);
      // Keep default subreddits if database fails
    }
  };

  // Fetch real flairs from Reddit API
  const fetchRedditFlairs = async (subreddit: string) => {
    try {
      console.log(`🔍 [FLAIR DEBUG] Starting flair fetch for r/${subreddit}...`);

      // Get current session for API calls
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ [FLAIR DEBUG] No session available for flair fetching');
        return [];
      }

      console.log(`🔑 [FLAIR DEBUG] Session exists, token length: ${session.access_token?.length || 0}`);

      // Call our edge function to fetch flairs
      const url = 'https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/get-reddit-flairs';
      console.log(`📡 [FLAIR DEBUG] Calling: ${url}`);
      console.log(`📋 [FLAIR DEBUG] Request body:`, { subreddit });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ subreddit })
      });

      console.log(`📥 [FLAIR DEBUG] Response status: ${response.status}`);
      console.log(`📥 [FLAIR DEBUG] Response headers:`, Object.fromEntries(response.headers));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [FLAIR DEBUG] Failed to fetch flairs for r/${subreddit}:`, response.status, errorText);
        return [];
      }

      const data = await response.json();
      console.log(`📊 [FLAIR DEBUG] Response data:`, data);
      console.log(`✅ [FLAIR DEBUG] Fetched ${data.flairs?.length || 0} flairs for r/${subreddit}`);

      return data.flairs || [];
    } catch (error) {
      console.error(`❌ [FLAIR DEBUG] Error fetching flairs for r/${subreddit}:`, error);
      return [];
    }
  };

  // Load available flairs when subreddit changes
  const loadSubredditFlairs = async (subreddit: string) => {
    console.log(`🎯 [FLAIR DEBUG] loadSubredditFlairs called with: "${subreddit}"`);

    // Reset flairs immediately
    setAvailableFlairs([]);
    setSelectedFlair('none');
    setLoadingFlairs(false);

    if (!subreddit) {
      console.log(`⚠️ [FLAIR DEBUG] No subreddit provided, returning`);
      return;
    }

    // For bot testing subreddits, don't fetch flairs (they usually don't require them)
    const botTestingSubreddits = ['testingground4bots', 'test', 'SandBoxTest'];
    if (botTestingSubreddits.includes(subreddit)) {
      console.log(`📝 [FLAIR DEBUG] Using bot testing subreddit r/${subreddit} - no flairs needed`);
      setAvailableFlairs([]);
      return;
    }

    // For real subreddits, fetch actual flairs from Reddit
    console.log(`🔍 [FLAIR DEBUG] Real subreddit detected: r/${subreddit}, starting flair fetch...`);
    setLoadingFlairs(true);

    try {
      const flairs = await fetchRedditFlairs(subreddit);

      if (flairs.length > 0) {
        console.log(`✅ [FLAIR DEBUG] Loaded ${flairs.length} flairs for r/${subreddit}:`, flairs);
        setAvailableFlairs(flairs);
      } else {
        console.log(`⚠️ [FLAIR DEBUG] No flairs found for r/${subreddit} - may not require flairs`);
        setAvailableFlairs([]);
      }
    } catch (error) {
      console.error(`❌ [FLAIR DEBUG] Error loading flairs for r/${subreddit}:`, error);
      setAvailableFlairs([]);
    } finally {
      console.log(`🏁 [FLAIR DEBUG] Flair loading finished for r/${subreddit}`);
      setLoadingFlairs(false);
    }
  };

  // Watch for subreddit changes to load flairs
  useEffect(() => {
    if (selectedSubreddit) {
      loadSubredditFlairs(selectedSubreddit);
    } else {
      setAvailableFlairs([]);
      setSelectedFlair('none');
    }
  }, [selectedSubreddit]);

  // Function to save post to database
  const savePostToDatabase = async (
    content: string,
    platforms: string[],
    status: 'draft' | 'scheduled' | 'published' | 'failed',
    image?: string,
    scheduledFor?: string,
    platformPostIds?: Record<string, string>,
    errorMessage?: string,
    generatedByAI?: boolean,
    aiPrompt?: string,
    title?: string,
    subreddit?: string
  ) => {
    try {
      // Base post data - handle both platform (single) and platforms (array) columns
      const postData: any = {
        content,
        platform: platforms[0], // Single platform for compatibility
        platforms, // Array of platforms
        status,
        image_url: image,
        scheduled_for: scheduledFor,
        platform_post_ids: platformPostIds || {},
        error_message: errorMessage,
        generated_by_ai: generatedByAI || false,
        ai_prompt: aiPrompt,
        user_id: user?.id
      };

      // Try to add Reddit-specific fields, but handle gracefully if columns don't exist
      try {
        if (title) postData.title = title;
        if (subreddit) postData.subreddit = subreddit;
      } catch (e) {
        console.warn('Reddit columns may not exist yet, saving without them');
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();

      if (error) {
        // If error is about missing columns, try again without Reddit fields
        if (error.message?.includes('subreddit') || error.message?.includes('title')) {
          console.warn('Reddit columns not found, saving without title/subreddit');
          const basicPostData = {
            content,
            platform: platforms[0], // Single platform for compatibility
            platforms,
            status,
            image_url: image,
            scheduled_for: scheduledFor,
            platform_post_ids: platformPostIds || {},
            error_message: errorMessage,
            generated_by_ai: generatedByAI || false,
            ai_prompt: aiPrompt,
            user_id: user?.id
          };

          const { data: retryData, error: retryError } = await supabase
            .from('posts')
            .insert([basicPostData])
            .select()
            .single();

          if (retryError) throw retryError;
          return retryData;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error saving post:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create posts",
        variant: "destructive"
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter content for your post",
        variant: "destructive"
      });
      return;
    }

    // For Reddit, title is required
    if (platform === 'reddit' && !title.trim()) {
      toast({
        title: "Title required",
        description: "Reddit posts require a title",
        variant: "destructive"
      });
      return;
    }

    // For Reddit, subreddit is required
    if (platform === 'reddit' && !selectedSubreddit) {
      toast({
        title: "Subreddit required",
        description: "Please select a subreddit for Reddit posts",
        variant: "destructive"
      });
      return;
    }

    setIsPosting(true);
    try {
      if (postType === 'schedule') {
        if (!scheduleDate || !scheduleTime) {
          toast({
            title: "Missing schedule information",
            description: "Please select a date and time for scheduling.",
            variant: "destructive",
          });
          return;
        }

        // Validate the scheduled time using timezone utilities
        const validation = validateFutureTime(scheduleDate, scheduleTime, 1);

        if (!validation.isValid) {
          toast({
            title: "Invalid schedule time",
            description: validation.error,
            variant: "destructive"
          });
          return;
        }

        const scheduledDateTime = validation.scheduledTime!;

        // Schedule the post using SimpleSchedulingService
        const result = await SimpleSchedulingService.schedulePost({
          content,
          platform,
          scheduled_time: scheduledDateTime,
          title: platform === 'reddit' ? title : undefined,
          image_url: imageUrl || undefined
        });

        if (result) {
          toast({
            title: "Post scheduled successfully!",
            description: `Your ${platform} post will be published at ${formatDateTimeForUser(scheduledDateTime)}${platform === 'reddit' ? ` in r/${selectedSubreddit}` : ''}`,
          });

          // Reset form
          setContent('');
          setTitle('');
          setImageUrl('');
          setSelectedSubreddit('');

          // Set default time to 1 hour from now again
          const now = new Date();
          const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

          const year = oneHourLater.getFullYear();
          const month = String(oneHourLater.getMonth() + 1).padStart(2, '0');
          const day = String(oneHourLater.getDate()).padStart(2, '0');
          const hours = String(oneHourLater.getHours()).padStart(2, '0');
          const minutes = String(oneHourLater.getMinutes()).padStart(2, '0');

          setScheduleDate(`${year}-${month}-${day}`);
          setScheduleTime(`${hours}:${minutes}`);
        }
      } else {
        // Post now - attempt to publish immediately
        try {
          console.log('📤 Attempting to post immediately:', {
            platform,
            content,
            title: platform === 'reddit' ? title : undefined,
            subreddit: platform === 'reddit' ? selectedSubreddit : undefined,
            flair: platform === 'reddit' && selectedFlair && selectedFlair !== 'none' ? selectedFlair : undefined,
            image: imageUrl || undefined
          });

          // Use the useSocialMedia hook to post with proper title and subreddit support
          const postResult = await postToSocial({
            content,
            platform,
            title: platform === 'reddit' ? title : undefined,
            subreddit: platform === 'reddit' ? selectedSubreddit : undefined,
            flair: platform === 'reddit' && selectedFlair && selectedFlair !== 'none' ? selectedFlair : undefined,
            image: imageUrl || undefined
          });

          if (postResult.success) {
            // Save to database as 'published' with the post ID
            const dbResult = await savePostToDatabase(
              content,
              [platform],
              'published',
              imageUrl || undefined,
              undefined,
              { [platform]: postResult.postId || 'unknown' },
              undefined,
              false,
              undefined,
              platform === 'reddit' ? title : undefined,
              platform === 'reddit' ? selectedSubreddit : undefined
            );

            toast({
              title: "Post published successfully!",
              description: `Your ${platform} post has been published${platform === 'reddit' ? ` to r/${selectedSubreddit}` : ''}`,
            });

            // Reset form
            setContent('');
            setTitle('');
            setImageUrl('');
            setSelectedSubreddit('');
            setSelectedFlair('none');

          } else {
            // Post failed, save as failed in database
            const dbResult = await savePostToDatabase(
              content,
              [platform],
              'failed',
              imageUrl || undefined,
              undefined,
              {},
              postResult.error || 'Failed to publish to social media platform',
              false,
              undefined,
              platform === 'reddit' ? title : undefined,
              platform === 'reddit' ? selectedSubreddit : undefined
            );

            toast({
              title: "Publishing failed",
              description: postResult.error || `Failed to publish to ${platform}. Post saved as failed.`,
              variant: "destructive"
            });
          }
        } catch (error: any) {
          console.error('Error posting:', error);

          // Save as failed in database
          try {
            await savePostToDatabase(
              content,
              [platform],
              'failed',
              imageUrl || undefined,
              undefined,
              {},
              error.message || 'Unknown error occurred',
              false,
              undefined,
              platform === 'reddit' ? title : undefined,
              platform === 'reddit' ? selectedSubreddit : undefined
            );
          } catch (dbError) {
            console.error('Error saving failed post to database:', dbError);
          }

          toast({
            title: "Error",
            description: error.message || "Failed to publish post",
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive"
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a prompt for AI content generation",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt: `Create a ${platform} post about: ${aiPrompt}. ${platform === 'twitter' ? 'Keep it under 280 characters.' : 'Keep it engaging and platform-appropriate.'}`,
          platform,
          type: 'text'
        }
      });

      if (error) throw error;

      if (data.content) {
        setGeneratedContent(data.content);
        setContent(data.content);
        toast({
          title: "Content generated!",
          description: "AI-generated content has been added to your post.",
        });
      }
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate content",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Interactive Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Left Section - Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Create Post</h1>
                  <div className="text-xs text-gray-500">Platforms</div>
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIGenerator(!showAIGenerator)}
                className="flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">AI Generate</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
                className="flex items-center space-x-2"
              >
                <SettingsIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Layout */}
      <div className="pt-16">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* AI Content Generator */}
          {showAIGenerator && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <Sparkles className="w-5 h-5" />
                  <span>AI Content Generator</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aiPrompt">What would you like to post about?</Label>
                  <Textarea
                    id="aiPrompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., 'Tips for remote work productivity' or 'Exciting product launch announcement'"
                    className="min-h-[80px]"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleGenerateContent}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Main Create Post Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Platform Selection */}
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform *</Label>
                  <Select value={platform} onValueChange={(value) => setPlatform(value as Platform)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">
                        <div className="flex items-center space-x-2">
                          <FaTwitter className="w-4 h-4 text-blue-400" />
                          <span>Twitter</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="facebook">
                        <div className="flex items-center space-x-2">
                          <FaFacebook className="w-4 h-4 text-blue-600" />
                          <span>Facebook</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="linkedin">
                        <div className="flex items-center space-x-2">
                          <FaLinkedin className="w-4 h-4 text-blue-700" />
                          <span>LinkedIn</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="reddit">
                        <div className="flex items-center space-x-2">
                          <FaReddit className="w-4 h-4 text-orange-600" />
                          <span>Reddit</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="instagram">
                        <div className="flex items-center space-x-2">
                          <FaInstagram className="w-4 h-4 text-pink-600" />
                          <span>Instagram</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reddit-specific fields */}
                {platform === 'reddit' && (
                  <div className="space-y-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-orange-800">
                      <FaReddit className="w-5 h-5" />
                      <span className="font-medium">Reddit Post Settings</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Post Title *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter an engaging title for your Reddit post..."
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">
                        A good title is crucial for Reddit engagement
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subreddit">Subreddit *</Label>
                      <Select value={selectedSubreddit} onValueChange={setSelectedSubreddit}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose subreddit..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubreddits.map((subreddit) => (
                            <SelectItem key={subreddit} value={subreddit}>
                              <div className="flex items-center space-x-2">
                                <span>r/{subreddit}</span>
                                <span className="text-xs text-gray-500">
                                  {subreddit === 'test' ? '(Testing)' :
                                   subreddit === 'testingground4bots' ? '(Bot Testing)' :
                                   subreddit === 'SandBoxTest' ? '(Sandbox)' : ''}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          Selected: {selectedSubreddit ? `r/${selectedSubreddit}` : 'None'}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => {
                              console.log('🔄 Manual refresh triggered');
                              loadUserSubreddits();
                              toast({
                                title: "Refreshed",
                                description: "Subreddit list updated from settings",
                              });
                            }}
                            className="text-xs p-0 h-auto text-blue-600"
                          >
                            🔄 Refresh
                          </Button>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => {
                              // Open settings in new tab to avoid losing form data
                              window.open('/settings', '_blank');
                            }}
                            className="text-xs p-0 h-auto"
                          >
                            Manage Subreddits
                          </Button>
                        </div>
                      </div>

                      {availableSubreddits.length === 0 && (
                        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                          ⚠️ No subreddits configured. <button
                            type="button"
                            onClick={() => window.open('/settings', '_blank')}
                            className="underline font-medium"
                          >
                            Add some in Settings
                          </button>
                        </div>
                      )}

                      {/* Post Flair Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="flair">
                          Post Flair (Optional)
                          {loadingFlairs && (
                            <span className="ml-2 text-xs text-blue-600">
                              🔄 Loading flairs...
                            </span>
                          )}
                        </Label>
                        <Select value={selectedFlair} onValueChange={setSelectedFlair} disabled={loadingFlairs}>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              loadingFlairs ? "Loading flairs..." :
                              availableFlairs.length > 0 ? "Select a flair..." :
                              "No flair (none required)"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-gray-500">No flair</span>
                            </SelectItem>
                            {availableFlairs.map((flair) => (
                              <SelectItem key={flair.id} value={flair.id}>
                                <div className="flex items-center space-x-2">
                                  {flair.color && (
                                    <div
                                      className="w-3 h-3 rounded-sm border"
                                      style={{ backgroundColor: flair.color }}
                                    />
                                  )}
                                  <span>{flair.text}</span>
                                </div>
                              </SelectItem>
                            ))}
                            {!loadingFlairs && availableFlairs.length === 0 && (
                              <SelectItem value="no-flairs" disabled>
                                <span className="text-gray-400">No flairs available for this subreddit</span>
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <div className="text-xs space-y-1">
                          <p className="text-gray-500">
                            Some subreddits require post flairs. If posting fails with "must contain post flair":
                          </p>
                          <ul className="text-gray-500 ml-4 space-y-1">
                            <li>• Try posting to <strong>r/testingground4bots</strong> (usually no flair required)</li>
                            <li>• Or try <strong>r/test</strong> (if it exists and allows posts)</li>
                            <li>• Or post to your own profile: <strong>u/yourusername</strong></li>
                          </ul>
                          <p className="text-orange-600 font-medium">
                            💡 Tip: Most bot-testing subreddits don't require flairs
                          </p>
                        </div>
                      </div>

                      {/* Debug info */}
                      <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded space-y-1">
                        <div><strong>Debug:</strong> {availableSubreddits.length} subreddits loaded</div>
                        <div><strong>Selected subreddit:</strong> {selectedSubreddit || 'None'}</div>
                        <div><strong>Available flairs:</strong> {availableFlairs.length}</div>
                        <div><strong>Selected flair:</strong> {selectedFlair || 'None'}</div>
                        <div><strong>Loading flairs:</strong> {loadingFlairs ? 'Yes' : 'No'}</div>
                        {availableFlairs.length > 0 && (
                          <div><strong>Flair list:</strong> {availableFlairs.map(f => f.text).join(', ')}</div>
                        )}
                        {user && (
                          <div><strong>User:</strong> {user.id.slice(0, 8)}...</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={platform === 'reddit' ?
                      "Write your Reddit post content here..." :
                      "What's on your mind?"
                    }
                    className="min-h-[120px] resize-none"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>
                      {platform === 'twitter' && content.length > 280 && (
                        <span className="text-red-500">Character limit exceeded!</span>
                      )}
                    </span>
                    <span>
                      {content.length}{platform === 'twitter' ? '/280' : ''} characters
                    </span>
                  </div>
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full"
                  />
                  {imageUrl && (
                    <div className="mt-2">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="max-w-xs max-h-32 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Post Type Selection */}
                <div className="space-y-2">
                  <Label>Post Type</Label>
                  <Select value={postType} onValueChange={(value) => setPostType(value as 'now' | 'schedule')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select post type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">
                        <div className="flex items-center space-x-2">
                          <Send className="w-4 h-4" />
                          <span>Post Now</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="schedule">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Schedule for Later</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Scheduling Options */}
                {postType === 'schedule' && (
                  <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <CalendarDays className="w-5 h-5" />
                      <span className="font-medium">Schedule Settings</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="scheduleDate">Date</Label>
                        <Input
                          id="scheduleDate"
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="scheduleTime">Time</Label>
                        <Input
                          id="scheduleTime"
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {scheduleDate && scheduleTime && (
                      <div className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                        <strong>Scheduled for:</strong> {formatDateTimeForUser(new Date(`${scheduleDate}T${scheduleTime}`))}
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setContent('');
                      setTitle('');
                      setImageUrl('');
                      setSelectedSubreddit('');
                      setSelectedFlair('none');
                      setAiPrompt('');
                      setGeneratedContent('');
                    }}
                    className="w-full sm:w-auto"
                  >
                    Clear Form
                  </Button>

                  {/* Save as Draft Button (always available) */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      if (!content.trim()) {
                        toast({
                          title: "Content required",
                          description: "Please enter content for your post",
                          variant: "destructive"
                        });
                        return;
                      }

                      if (platform === 'reddit' && !title.trim()) {
                        toast({
                          title: "Title required",
                          description: "Reddit posts require a title",
                          variant: "destructive"
                        });
                        return;
                      }

                      if (platform === 'reddit' && !selectedSubreddit) {
                        toast({
                          title: "Subreddit required",
                          description: "Please select a subreddit for Reddit posts",
                          variant: "destructive"
                        });
                        return;
                      }

                      setIsPosting(true);
                      try {
                        const result = await savePostToDatabase(
                          content,
                          [platform],
                          'draft',
                          imageUrl || undefined,
                          undefined,
                          {},
                          undefined,
                          false,
                          undefined,
                          platform === 'reddit' ? title : undefined,
                          platform === 'reddit' ? selectedSubreddit : undefined
                        );

                        if (result) {
                          toast({
                            title: "Draft saved!",
                            description: `Your ${platform} post has been saved as a draft${platform === 'reddit' ? ` for r/${selectedSubreddit}` : ''}`,
                          });
                        }
                      } catch (error: any) {
                        toast({
                          title: "Error",
                          description: error.message || "Failed to save draft",
                          variant: "destructive"
                        });
                      } finally {
                        setIsPosting(false);
                      }
                    }}
                    disabled={isPosting}
                    className="w-full sm:w-auto"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Save as Draft
                  </Button>

                  {/* Main Action Button */}
                  <Button
                    type="submit"
                    disabled={isPosting || (platform === 'twitter' && content.length > 280)}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{postType === 'schedule' ? 'Scheduling...' : 'Publishing...'}</span>
                      </>
                    ) : (
                      <>
                        {postType === 'schedule' ? (
                          <>
                            <CalendarIcon className="w-4 h-4" />
                            <span>Schedule Post</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Post Now</span>
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
};

export default CreatePostMinimal;

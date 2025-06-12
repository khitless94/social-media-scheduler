import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Copy,
  RefreshCw,
  Calendar as CalendarIcon,
  Clock,
  Image as ImageIcon,
  Send,
  Wand2,
  Zap,
  Users,
  TrendingUp,
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle,
  Settings
} from "lucide-react";
import { FaLinkedin, FaTwitter, FaInstagram, FaFacebook, FaReddit } from "react-icons/fa";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useSocialMediaConnection } from "@/hooks/useSocialMediaConnection";

const CreatePost = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { connectPlatform, isConnecting } = useSocialMediaConnection((newStatus) => {
    setConnectionStatus(newStatus);
  });
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("");
  const [tone, setTone] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [imageType, setImageType] = useState<'generated' | 'description'>('description');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState("");
  const [usageCount, setUsageCount] = useState(0);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({});

  const platforms = [
    { value: "LinkedIn", label: "LinkedIn", icon: "linkedin", color: "bg-blue-600" },
    { value: "Twitter", label: "Twitter", icon: "twitter", color: "bg-sky-400" },
    { value: "Instagram", label: "Instagram", icon: "instagram", color: "bg-gradient-to-r from-pink-500 to-purple-600" },
    { value: "Facebook", label: "Facebook", icon: "facebook", color: "bg-blue-700" },
    { value: "Reddit", label: "Reddit", icon: "reddit", color: "bg-orange-600" },
  ];

  const tones = [
    { value: "Professional", label: "Professional" },
    { value: "Friendly", label: "Friendly" },
    { value: "Casual", label: "Casual" },
    { value: "Enthusiastic", label: "Enthusiastic" },
    { value: "Informative", label: "Informative" },
  ];

  // Check connection status for all platforms
  const checkConnectionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: credentials } = await supabase
        .from('oauth_credentials')
        .select('platform')
        .eq('user_id', user.id);

      const status: Record<string, boolean> = {};
      platforms.forEach(p => {
        status[p.value.toLowerCase()] = credentials?.some(c => c.platform === p.value.toLowerCase()) || false;
      });

      setConnectionStatus(status);
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  useEffect(() => {
    checkConnectionStatus();
  }, []);



  const generatePost = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing prompt",
        description: "Please enter a prompt for your post",
        variant: "destructive",
      });
      return;
    }

    if (!platform || !tone) {
      toast({
        title: "Missing details",
        description: "Please select both platform and tone",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    console.log("Generating post with:", { prompt, platform, tone });

    try {
      // Platform-specific prompts
      const platformPrompts = {
        LinkedIn: `Create a professional LinkedIn post with a ${tone} tone about: ${prompt}. Make it 1-3 paragraphs, professional, and include relevant hashtags.`,
        Twitter: `Create a Twitter post with a ${tone} tone about: ${prompt}. Keep it under 280 characters and include relevant hashtags.`,
        Instagram: `Create an engaging Instagram post with a ${tone} tone about: ${prompt}. Make it engaging with relevant hashtags and emojis.`,
        Facebook: `Create a conversational Facebook post with a ${tone} tone about: ${prompt}. Make it engaging and shareable.`,
        Reddit: `Create a community-focused Reddit post with a ${tone} tone about: ${prompt}. Make it discussion-oriented and authentic.`
      };

      const fullPrompt = platformPrompts[platform as keyof typeof platformPrompts] || 
        `Create an engaging ${platform} post with a ${tone} tone about: ${prompt}.`;

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { 
          prompt: fullPrompt,
          type: 'text',
          platform
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.generatedText) {
        setGeneratedText(data.generatedText);
        setUsageCount(prev => prev + 1);
        toast({
          title: "Content generated!",
          description: "Your post is ready. You can copy it or make changes.",
        });
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error('No content generated');
      }
    } catch (error: any) {
      console.error('Error generating post:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateImage = async () => {
    if (!imagePrompt.trim()) {
      toast({
        title: "Missing image prompt",
        description: "Please enter a prompt for your image",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    console.log("Generating image with prompt:", imagePrompt);

    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { 
          prompt: imagePrompt,
          type: 'image'
        }
      });

      if (error) throw error;

      if (data.type === 'generated' && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setImageType('generated');
        setUsageCount(prev => prev + 1);
        setShowActionButtons(true);
        toast({
          title: "Image generated!",
          description: "Your AI-generated image is ready.",
        });
      } else if (data.imageDescription) {
        setGeneratedImage(data.imageDescription);
        setImageType('description');
        setUsageCount(prev => prev + 1);
        setShowActionButtons(true);
        toast({
          title: "Image description generated!",
          description: "Use this description with your preferred image generator.",
        });
      } else {
        throw new Error('No image or description generated');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({
        title: "Image generation failed",
        description: error.message || "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    toast({
      title: "Copied!",
      description: "Post content copied to clipboard",
    });
  };

  const regeneratePost = () => {
    setGeneratedText("");
    generatePost();
  };

  const postNow = async () => {
    if (!generatedText) {
      toast({
        title: "No content to post",
        description: "Please generate content first",
        variant: "destructive",
      });
      return;
    }

    if (!platform) {
      toast({
        title: "No platform selected",
        description: "Please select a platform",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to post content",
          variant: "destructive",
        });
        return;
      }



      // Check post limit for free tier (200 posts max)
      const { data: postCount } = await supabase
        .from('post_history')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      if (postCount && postCount.length >= 200) {
        toast({
          title: "Post limit reached",
          description: "You've reached the free tier limit of 200 posts. Please upgrade to continue posting.",
          variant: "destructive",
        });
        return;
      }

      // Check if the platform is connected and get access token from database
      const { data: credentials, error: credError } = await supabase
        .from('oauth_credentials')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', user.id)
        .eq('platform', platform.toLowerCase())
        .maybeSingle();

      if (credError) {
        throw new Error('Failed to check platform connection');
      }

      if (!credentials) {
        toast({
          title: "Platform not connected",
          description: `Please connect your ${platform} account first. Click the "Connect ${platform}" button above.`,
          variant: "destructive",
        });
        return;
      }

      // Check if token is expired and needs refresh
      let accessToken = credentials.access_token;
      if (credentials.expires_at && new Date(credentials.expires_at) <= new Date()) {
        toast({
          title: "Token expired",
          description: `Please reconnect your ${platform} account in Settings`,
          variant: "destructive",
        });
        return;
      }

      // Post to the selected platform (include image if generated)
      const postData: any = {
        platform: platform.toLowerCase(),
        content: generatedText
      };

      // If we have a generated image (not just description), include it
      if (generatedImage && imageType === 'generated') {
        postData.imageUrl = generatedImage;
      }

      console.log(`[DEBUG] Posting to ${platform} with data:`, postData);

      // Get the current session and access token
      const { data: sessionData } = await supabase.auth.getSession();
      const userAccessToken = sessionData.session?.access_token;

      console.log(`[DEBUG] User session:`, sessionData);
      console.log(`[DEBUG] Access token exists:`, !!userAccessToken);

      const { data, error } = await supabase.functions.invoke('post-to-social', {
        body: postData,
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
        }
      });

      console.log(`[DEBUG] Edge function response:`, { data, error });

      if (error) {
        console.error('Edge function error:', error);
        console.error('Error details:', error.context || error.details || 'No additional details');

        // Try to get more specific error information
        if (error.message && error.message.includes('400')) {
          console.error('400 Bad Request - likely a request format issue');
        }

        throw new Error(`Failed to call posting service: ${error.message}`);
      }

      if (data?.error) {
        console.error('Posting service error:', data.error);
        throw new Error(data.error);
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response from posting service');
      }

      // Save to post history for tracking
      await supabase
        .from('post_history')
        .insert({
          user_id: user.id,
          content: generatedText,
          platform: platform.toLowerCase(),
          status: 'success',
          post_id: data?.postId || null
        });

      toast({
        title: "Posted successfully!",
        description: `Your content has been posted to ${platform}`,
      });

      // Reset form
      setPrompt("");
      setGeneratedText("");
      setImagePrompt("");
      setGeneratedImage("");
    } catch (error: any) {
      console.error('Error posting content:', error);
      
      // Save failed post to history
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('post_history')
            .insert({
              user_id: user.id,
              content: generatedText,
              platform: platform.toLowerCase(),
              status: 'failed',
              error_message: error.message
            });
        }
      } catch (historyError) {
        console.error('Error saving to history:', historyError);
      }

      toast({
        title: "Post failed",
        description: error.message || "Failed to post your content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const schedulePost = async () => {
    if (!generatedText) {
      toast({
        title: "No content to schedule",
        description: "Please generate content first",
        variant: "destructive",
      });
      return;
    }

    if (!scheduleDate || !scheduleTime) {
      toast({
        title: "Missing schedule details",
        description: "Please select both date and time",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to schedule posts",
          variant: "destructive",
        });
        return;
      }

      const scheduledDateTime = new Date(`${format(scheduleDate, "yyyy-MM-dd")}T${scheduleTime}`);

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          prompt,
          generated_text: generatedText,
          platform,
          scheduled_time: scheduledDateTime.toISOString(),
          status: 'scheduled',
          image_url: imageType === 'generated' ? generatedImage : null
        } as any);

      if (error) throw error;

      toast({
        title: "Post scheduled!",
        description: `Your post will be published on ${format(scheduleDate, "PPP")} at ${scheduleTime}`,
      });

      // Reset form
      setPrompt("");
      setGeneratedText("");
      setImagePrompt("");
      setGeneratedImage("");
      setScheduleDate(undefined);
      setScheduleTime("");
    } catch (error: any) {
      console.error('Error scheduling post:', error);
      toast({
        title: "Scheduling failed",
        description: error.message || "Failed to schedule your post. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full">
            <Zap className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Powered by AI Agents</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Create Brilliant Content
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transform your ideas into engaging social media content with the power of advanced AI agents.
            Generate, customize, and optimize content for any platform.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-white/50 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Wand2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <span>Content Creator</span>
                </CardTitle>
                <CardDescription className="text-base">
                  Describe your idea and let our AI agents craft the perfect post
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt Input */}
                <div className="space-y-3">
                  <Label htmlFor="prompt" className="text-sm font-semibold text-gray-700">What do you want to create?</Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g., Write a motivational LinkedIn post about productivity tips for remote workers, including actionable advice and inspiring quotes..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] resize-none text-base leading-relaxed border-2 focus:border-purple-400"
                  />
                </div>

                {/* Platform Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Platform</Label>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {platforms.map((p) => {
                        const IconComponent = p.icon === 'linkedin' ? FaLinkedin :
                                            p.icon === 'twitter' ? FaTwitter :
                                            p.icon === 'instagram' ? FaInstagram :
                                            p.icon === 'facebook' ? FaFacebook : FaReddit;
                        const isConnected = connectionStatus[p.value.toLowerCase()];
                        return (
                          <Button
                            key={p.value}
                            variant={platform === p.value ? "default" : "outline"}
                            onClick={() => setPlatform(p.value)}
                            className={`justify-start space-x-3 h-14 transition-all duration-200 relative ${
                              platform === p.value
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-transparent shadow-lg scale-105'
                                : 'hover:bg-gray-50 hover:scale-102'
                            }`}
                          >
                            <div className="p-1 bg-white/20 rounded">
                              <IconComponent className="h-5 w-5" style={{
                                color: platform === p.value ? 'white' : (
                                  p.icon === 'linkedin' ? '#0077B5' :
                                  p.icon === 'twitter' ? '#1DA1F2' :
                                  p.icon === 'instagram' ? '#E4405F' :
                                  p.icon === 'facebook' ? '#1877F2' : '#FF4500'
                                )
                              }} />
                            </div>
                            <span className="font-medium">{p.label}</span>
                            <div className="absolute top-1 right-1">
                              {isConnected ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </Button>
                        );
                      })}
                    </div>

                    {/* Quick Connect Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900">Connect Social Media Accounts</h4>
                          <p className="text-sm text-blue-700">Connect your accounts to post content directly</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => connectPlatform('twitter')}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            disabled={isConnecting.twitter}
                          >
                            {isConnecting.twitter ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <FaTwitter className="h-3 w-3 mr-1" />
                                Connect Twitter
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => navigate('/settings')}
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-100"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            All Settings
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {platform && !connectionStatus[platform.toLowerCase()] && (
                    <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <div className="flex-1">
                        <span className="text-sm text-amber-700 font-medium">
                          {platform} account not connected
                        </span>
                        <p className="text-xs text-amber-600 mt-1">
                          Connect your {platform} account in Settings to post content directly.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-300 text-amber-700 hover:bg-amber-100"
                          onClick={() => navigate('/settings')}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Settings
                        </Button>
                        <Button
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          onClick={() => connectPlatform(platform.toLowerCase() as any)}
                          disabled={isConnecting[platform.toLowerCase() as keyof typeof isConnecting]}
                        >
                          {isConnecting[platform.toLowerCase() as keyof typeof isConnecting] ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              Connect {platform}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tone Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Tone & Style</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="h-12 border-2 focus:border-purple-400">
                      <SelectValue placeholder="Choose tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>{t.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={generatePost}
                  disabled={isGenerating || !prompt.trim() || !platform || !tone}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      AI Agents Working...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-5 w-5" />
                      Generate with AI {usageCount > 0 && `(${usageCount})`}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-white/50 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Globe className="h-6 w-6 text-blue-600" />
                  </div>
                  <span>Content Preview</span>
                  {platform && (
                    <Badge className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                      {platform}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-base">
                  See how your content will look on {platform || 'your chosen platform'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedText ? (
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200 min-h-[250px] shadow-inner">
                        <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">
                          {generatedText}
                        </p>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Generated
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={copyToClipboard} variant="outline" className="flex-1 h-11 hover:bg-purple-50">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Content
                      </Button>
                      <Button onClick={regeneratePost} variant="outline" className="flex-1 h-11 hover:bg-blue-50">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                      {!showActionButtons && (
                        <Button onClick={postNow} className="flex-1 h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                          <Send className="h-4 w-4 mr-2" />
                          Post Now to {platform}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <div className="p-4 bg-gray-100 rounded-full mb-4">
                      <TrendingUp className="h-12 w-12 text-gray-300" />
                    </div>
                    <p className="text-center text-lg font-medium">
                      Your generated content will appear here
                    </p>
                    <p className="text-center text-sm mt-2">
                      Start by describing what you want to create
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Image Generation Section */}
        {generatedText && (
          <Card className="bg-white/90 backdrop-blur-sm border-white/50 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <ImageIcon className="h-6 w-6 text-pink-600" />
                </div>
                <span>AI Image Generator</span>
                <Badge variant="secondary" className="ml-auto">
                  Optional
                </Badge>
              </CardTitle>
              <CardDescription className="text-base">
                Generate an AI image using advanced AI models or get a description to use with other tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="imagePrompt" className="text-sm font-semibold text-gray-700">Image Prompt</Label>
                    <Textarea
                      id="imagePrompt"
                      placeholder="e.g., A modern robot sitting at a desk writing on a laptop, digital art style"
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      className="min-h-[100px] border-2 focus:border-pink-400"
                    />
                  </div>

                  <Button 
                    onClick={generateImage} 
                    disabled={isGeneratingImage || !imagePrompt.trim()}
                    className="w-full h-12 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 transition-all duration-300"
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Image...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Generate Image {usageCount > 0 && `(${usageCount})`}
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-center">
                  {generatedImage ? (
                    <div className="space-y-3 w-full">
                      <Label className="text-sm font-semibold text-gray-700">
                        Generated {imageType === 'generated' ? 'Image' : 'Image Description'}
                      </Label>
                      {imageType === 'generated' ? (
                        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-inner">
                          <img src={generatedImage} alt="Generated image" className="max-w-full h-auto rounded-lg" />
                        </div>
                      ) : (
                        <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-inner">
                          <p className="text-gray-800 text-sm leading-relaxed">{generatedImage}</p>
                          <p className="text-xs text-gray-500 mt-3">Use this description with your preferred image generation tool</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <div className="p-3 bg-gray-100 rounded-full mb-3 inline-block">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                      <p className="text-sm">Image will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedule Section */}
        {generatedText && (
          <Card className="bg-white/90 backdrop-blur-sm border-white/50 shadow-2xl" data-schedule-section>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-green-600" />
                </div>
                <span>Schedule Post</span>
                <Badge variant="secondary" className="ml-auto">
                  Optional
                </Badge>
              </CardTitle>
              <CardDescription className="text-base">
                Choose when to publish your content across social media platforms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-12 justify-start text-left font-normal border-2 focus:border-green-400",
                          !scheduleDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduleDate ? format(scheduleDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={scheduleDate}
                        onSelect={setScheduleDate}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Time</Label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="h-12 border-2 focus:border-green-400"
                  />
                </div>
              </div>

              <Button 
                onClick={schedulePost}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
                disabled={!scheduleDate || !scheduleTime}
              >
                <Send className="mr-2 h-4 w-4" />
                Schedule Post
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Action Buttons - Show at bottom when image is generated */}
        {showActionButtons && generatedText && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 shadow-lg">
            <div className="max-w-7xl mx-auto flex gap-4">
              <Button 
                onClick={postNow} 
                className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg font-semibold"
              >
                <Send className="h-5 w-5 mr-2" />
                Post Now to {platform}
              </Button>
              <Button 
                onClick={() => {
                  // Scroll to schedule section
                  const scheduleSection = document.querySelector('[data-schedule-section]');
                  if (scheduleSection) {
                    scheduleSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                variant="outline" 
                className="flex-1 h-12 text-lg font-semibold hover:bg-purple-50"
              >
                <CalendarIcon className="h-5 w-5 mr-2" />
                Schedule Later
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePost;
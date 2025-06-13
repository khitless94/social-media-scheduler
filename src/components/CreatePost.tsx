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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Create Amazing Content
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate engaging social media posts with AI-powered content creation
          </p>
          
          {/* Stats */}
          <div className="flex justify-center space-x-8 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">50K+</div>
              <div className="text-sm text-gray-500">Posts Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">5</div>
              <div className="text-sm text-gray-500">Platforms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">99%</div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Content Creation Card */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Wand2 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">AI Content Generator</CardTitle>
                    <CardDescription className="text-blue-100">
                      Create engaging posts with artificial intelligence
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Content Prompt */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prompt" className="text-base font-semibold text-gray-700">
                      What would you like to create?
                    </Label>
                    <span className="text-sm text-gray-500">{prompt.length}/500</span>
                  </div>
                  
                  <Textarea
                    id="prompt"
                    placeholder="Describe your content idea... e.g., 'Write a motivational LinkedIn post about productivity tips for remote workers'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] resize-none border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg p-4 transition-all duration-200"
                  />

                  {/* Quick Templates */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-600">Quick Templates</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { emoji: "💼", text: "Professional LinkedIn post", color: "bg-blue-50 hover:bg-blue-100 text-blue-700" },
                        { emoji: "🌱", text: "Lifestyle Instagram post", color: "bg-pink-50 hover:bg-pink-100 text-pink-700" },
                        { emoji: "🚀", text: "Tech Twitter thread", color: "bg-purple-50 hover:bg-purple-100 text-purple-700" },
                        { emoji: "📈", text: "Business growth tips", color: "bg-green-50 hover:bg-green-100 text-green-700" }
                      ].map((template, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setPrompt(template.text)}
                          className={`p-3 rounded-lg text-sm font-medium transition-colors duration-200 ${template.color} border border-gray-200`}
                        >
                          <span className="mr-2">{template.emoji}</span>
                          {template.text}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Platform Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-700">Select Platform</Label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {platforms.map((p) => {
                      const IconComponent = p.icon === 'linkedin' ? FaLinkedin :
                                          p.icon === 'twitter' ? FaTwitter :
                                          p.icon === 'instagram' ? FaInstagram :
                                          p.icon === 'facebook' ? FaFacebook : FaReddit;
                      const isConnected = connectionStatus[p.value.toLowerCase()];
                      const platformColors = {
                        linkedin: '#0077B5',
                        twitter: '#1DA1F2',
                        instagram: '#E4405F',
                        facebook: '#1877F2',
                        reddit: '#FF4500'
                      };

                      return (
                        <Button
                          key={p.value}
                          variant="outline"
                          onClick={() => setPlatform(p.value)}
                          className={`h-16 p-4 border-2 transition-all duration-200 ${
                            platform === p.value
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div className="p-2 rounded-lg bg-gray-50">
                              <IconComponent
                                className="h-6 w-6"
                                style={{ color: platformColors[p.icon as keyof typeof platformColors] }}
                              />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-semibold text-gray-900">{p.label}</div>
                              <div className="text-sm text-gray-500">
                                {isConnected ? '✓ Connected' : '○ Not connected'}
                              </div>
                            </div>
                            <div className="flex items-center">
                              {isConnected ? (
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              ) : (
                                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Tone Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-700">Content Tone</Label>

                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg transition-all duration-200">
                      <SelectValue placeholder="Choose your content tone" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg shadow-lg border border-gray-200">
                      {tones.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="rounded-md my-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="font-medium">{t.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate Button */}
                <div className="pt-6">
                  <Button
                    onClick={generatePost}
                    disabled={isGenerating || !prompt.trim() || !platform || !tone}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span>Generating Content...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-6 w-6" />
                          <span>Generate Content</span>
                          {usageCount > 0 && (
                            <span className="px-2 py-1 bg-white/20 rounded-full text-sm">
                              {usageCount}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Section */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Globe className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Content Preview</CardTitle>
                    <CardDescription className="text-indigo-100">
                      See how your content will look
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {generatedText ? (
                  <div className="space-y-6">
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 min-h-[250px] relative">
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                          ✨ AI Generated
                        </span>
                      </div>
                      <div className="mt-6">
                        <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">
                          {generatedText}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        className="h-12 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Content
                      </Button>
                      <Button
                        onClick={regeneratePost}
                        variant="outline"
                        className="h-12 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 bg-gray-100 rounded-full mb-4">
                      <TrendingUp className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Content Preview
                    </h3>
                    <p className="text-gray-500 max-w-sm">
                      Your generated content will appear here. Fill out the form to get started.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;

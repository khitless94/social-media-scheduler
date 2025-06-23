import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useSocialMediaConnection, type Platform, type ConnectionStatus } from '@/hooks/useSocialMediaConnection';
import { useAuth } from '@/hooks/useAuth';
import { useSocialMedia } from '@/hooks/useSocialMedia';
import {
  ArrowLeft,
  Home,
  Sparkles,
  Wand2,
  Eye,
  Copy,
  RefreshCw,
  Target,
  CheckCircle,
  AlertCircle,
  Settings,
  Loader2,
  CalendarIcon,
  Clock,
  Send,
  CalendarDays
} from 'lucide-react';
import { FaLinkedin, FaTwitter, FaInstagram, FaFacebook, FaReddit } from 'react-icons/fa';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Real social media posting hook
  const { postToSocial, loading: socialMediaLoading } = useSocialMedia();

  // State management
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('');
  const [tone, setTone] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Real-time connection status
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    twitter: false,
    linkedin: false,
    instagram: false,
    facebook: false,
    reddit: false
  });

  // Use the real-time social media connection hook
  const { connectPlatform: connectToSocialPlatform, isConnecting, refreshConnectionStatus } = useSocialMediaConnection(setConnectionStatus);

  // Configuration
  const platforms = [
    { value: 'linkedin', label: 'LinkedIn', icon: 'linkedin' as const },
    { value: 'twitter', label: 'Twitter', icon: 'twitter' as const },
    { value: 'instagram', label: 'Instagram', icon: 'instagram' as const },
    { value: 'facebook', label: 'Facebook', icon: 'facebook' as const },
    { value: 'reddit', label: 'Reddit', icon: 'reddit' as const }
  ];

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'humorous', label: 'Humorous' },
    { value: 'inspirational', label: 'Inspirational' }
  ];

  // Real-time connection status is handled by useSocialMediaConnection hook
  // No need for manual localStorage checking

  // Generate content function
  const generatePost = async () => {
    if (!prompt.trim() || !platform || !tone) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Mock content generation for demo
      const mockContent = generateMockContent(prompt, platform, tone);
      setGeneratedText(mockContent);
      setUsageCount(prev => prev + 1);
      
      toast({
        title: "Content generated!",
        description: "Your post is ready. You can copy it or make changes.",
      });
    } catch (error) {
      console.error('Error generating post:', error);
      toast({
        title: "Generation failed",
        description: "There was an error generating your post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockContent = (userPrompt: string, selectedPlatform: string, selectedTone: string): string => {
    const toneAdjectives = {
      professional: ['strategic', 'innovative', 'efficient', 'results-driven'],
      casual: ['awesome', 'amazing', 'cool', 'fantastic'],
      friendly: ['wonderful', 'great', 'lovely', 'delightful'],
      humorous: ['hilarious', 'witty', 'entertaining', 'amusing'],
      inspirational: ['motivating', 'empowering', 'uplifting', 'transformative']
    };

    const platformTemplates = {
      linkedin: `🚀 Excited to share insights about ${userPrompt}! This ${toneAdjectives[selectedTone as keyof typeof toneAdjectives]?.[0] || 'amazing'} topic has been on my mind lately.

Key takeaways:
• Innovation drives success
• Collaboration creates value
• Continuous learning is essential

What are your thoughts? Let's discuss in the comments!

#Innovation #Leadership #Growth #${userPrompt.replace(/\s+/g, '')}`,

      twitter: `🔥 Just discovered something ${toneAdjectives[selectedTone as keyof typeof toneAdjectives]?.[1] || 'incredible'} about ${userPrompt}!

This could be a game-changer 🚀

#${userPrompt.replace(/\s+/g, '')} #Innovation #TechTrends`,

      instagram: `✨ ${userPrompt} is absolutely ${toneAdjectives[selectedTone as keyof typeof toneAdjectives]?.[2] || 'amazing'}! 📸

🌟 Key insights:
💡 Innovation is everywhere
🚀 Growth mindset wins
💪 Keep pushing forward

What do you think? Drop a comment below! 👇

#${userPrompt.replace(/\s+/g, '')} #Inspiration #Growth #Innovation`,

      facebook: `Hey everyone! 👋

I've been thinking a lot about ${userPrompt} lately, and it's truly ${toneAdjectives[selectedTone as keyof typeof toneAdjectives]?.[3] || 'fascinating'}!

Here's what I've learned:
🔹 Every challenge is an opportunity
🔹 Small steps lead to big changes
🔹 Community support makes all the difference

Would love to hear your experiences with this! Share your thoughts in the comments 💬`,

      reddit: `TIL about ${userPrompt} and it's honestly mind-blowing 🤯

For those who haven't heard about this yet, here's the deal:

The ${toneAdjectives[selectedTone as keyof typeof toneAdjectives]?.[0] || 'interesting'} thing is how this connects to so many other areas.

Key points:
- This changes everything we thought we knew
- The applications are endless
- More research is definitely needed

Anyone else following developments in this space? Would love to discuss!`
    };

    return platformTemplates[selectedPlatform as keyof typeof platformTemplates] || 
           `This is a ${selectedTone} post about ${userPrompt}. ${toneAdjectives[selectedTone as keyof typeof toneAdjectives]?.[0] || 'Great'} content coming your way!`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  const regeneratePost = () => {
    generatePost();
  };

  // Real platform connection using the hook
  const handleConnectPlatform = async (platformName: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to connect social media accounts.",
        variant: "destructive",
      });
      return;
    }

    try {
      await connectToSocialPlatform(platformName as Platform);
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: "Connection failed",
        description: `Failed to connect to ${platformName}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Post content function
  const handlePostNow = async () => {
    if (!generatedText.trim()) {
      toast({
        title: "No content to post",
        description: "Please generate content first.",
        variant: "destructive",
      });
      return;
    }

    if (!platform) {
      toast({
        title: "No platform selected",
        description: "Please select a platform to post to.",
        variant: "destructive",
      });
      return;
    }

    if (!connectionStatus[platform as Platform]) {
      toast({
        title: "Platform not connected",
        description: `Please connect to ${platform} first.`,
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to post content.",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    try {
      console.log(`🚀 Posting to ${platform} with real API...`);

      // Use the real social media posting API
      const result = await postToSocial({
        content: generatedText,
        platform: platform as Platform,
        subreddit: platform === 'reddit' ? 'test' : undefined, // Default subreddit for Reddit
        image: undefined // No image support in this version
      });

      if (result.success) {
        toast({
          title: "Posted successfully!",
          description: `Your content has been posted to ${platform}. ${result.postId ? `Post ID: ${result.postId}` : ''}`,
        });

        // Clear the form after successful post
        setGeneratedText('');
        setPrompt('');
        setPlatform('');
        setTone('');
        setScheduleDate(undefined);
        setScheduleTime('');
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }

    } catch (error) {
      console.error('Posting error:', error);
      toast({
        title: "Posting failed",
        description: error.message || "There was an error posting your content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  // Schedule post function
  const handleSchedulePost = async () => {
    if (!generatedText.trim()) {
      toast({
        title: "No content to schedule",
        description: "Please generate content first.",
        variant: "destructive",
      });
      return;
    }

    if (!platform) {
      toast({
        title: "No platform selected",
        description: "Please select a platform to schedule for.",
        variant: "destructive",
      });
      return;
    }

    if (!connectionStatus[platform as Platform]) {
      toast({
        title: "Platform not connected",
        description: `Please connect to ${platform} first.`,
        variant: "destructive",
      });
      return;
    }

    if (!scheduleDate || !scheduleTime) {
      toast({
        title: "Schedule incomplete",
        description: "Please select both date and time for scheduling.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to schedule content.",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    try {
      const scheduledDateTime = new Date(scheduleDate);
      const [hours, minutes] = scheduleTime.split(':');
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

      // Check if scheduled time is in the future
      if (scheduledDateTime <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      console.log(`📅 Scheduling post for ${platform} at ${format(scheduledDateTime, "PPP 'at' p")}...`);

      // For now, we'll post immediately since the scheduling API needs to be implemented
      // In a real implementation, you would save this to a database and use a cron job
      toast({
        title: "Scheduling not yet implemented",
        description: "Posting immediately instead. Scheduling feature coming soon!",
        variant: "default",
      });

      // Use the real social media posting API
      const result = await postToSocial({
        content: generatedText,
        platform: platform as Platform,
        subreddit: platform === 'reddit' ? 'test' : undefined,
        image: undefined
      });

      if (result.success) {
        toast({
          title: "Posted successfully!",
          description: `Your content has been posted to ${platform}. (Scheduled posting coming soon!)`,
        });

        // Clear the form after successful post
        setGeneratedText('');
        setPrompt('');
        setPlatform('');
        setTone('');
        setScheduleDate(undefined);
        setScheduleTime('');
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }

    } catch (error) {
      console.error('Scheduling error:', error);
      toast({
        title: "Scheduling failed",
        description: error.message || "There was an error scheduling your content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-semibold text-gray-900">ScribeSchedule</span>
                <span className="ml-2 text-sm text-gray-500">Content Creator</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Professional Header Section */}
      <section className="pt-20 pb-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-6">
              <Wand2 className="w-8 h-8 text-blue-600" />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Create Professional Content
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Generate engaging social media content with AI assistance. 
              Professional, authentic, and optimized for your audience.
            </p>
            
            {/* Professional Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
              {[
                { number: "50K+", label: "Posts Created" },
                { number: "5", label: "Platforms" },
                { number: "99%", label: "Success Rate" },
                { number: "24/7", label: "AI Available" }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Content Creation Panel - Takes 2 columns */}
            <div className="lg:col-span-2">
              <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
                {/* Professional Header */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Content Generator</h3>
                        <p className="text-sm text-gray-500">
                          Create professional social media content
                        </p>
                      </div>
                    </div>
                    
                    {/* Usage Counter */}
                    {usageCount > 0 && (
                      <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                        <div className="text-xs text-gray-500 font-medium">Generated Today</div>
                        <div className="text-lg font-semibold text-gray-900">{usageCount}</div>
                      </div>
                    )}
                  </div>
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Content Prompt Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prompt" className="text-sm font-medium text-gray-900">
                        Content Description
                      </Label>
                      <span className="text-xs text-gray-500">{prompt.length}/500</span>
                    </div>
                    
                    <Textarea
                      id="prompt"
                      placeholder="Describe your content idea... e.g., 'Create a motivational LinkedIn post about productivity tips for remote workers'"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[120px] resize-none border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg p-4 text-sm transition-all duration-200 bg-white"
                    />

                    {/* Professional Quick Templates */}
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-900">Quick Templates</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { emoji: "💼", text: "Professional LinkedIn post", category: "Business" },
                          { emoji: "🌱", text: "Lifestyle Instagram post", category: "Lifestyle" },
                          { emoji: "🚀", text: "Tech Twitter thread", category: "Technology" },
                          { emoji: "📈", text: "Business growth tips", category: "Growth" }
                        ].map((template, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setPrompt(template.text)}
                            className="p-4 text-left border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{template.emoji}</span>
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{template.category}</div>
                                <div className="text-sm font-medium text-gray-900">{template.text}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Platform Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-900">Select Platform</Label>
                      <Button
                        onClick={refreshConnectionStatus}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-gray-500 hover:text-gray-700"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Refresh Status
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {platforms.map((p) => {
                        const IconComponent = p.icon === 'linkedin' ? FaLinkedin :
                                            p.icon === 'twitter' ? FaTwitter :
                                            p.icon === 'instagram' ? FaInstagram :
                                            p.icon === 'facebook' ? FaFacebook : FaReddit;
                        const isConnected = connectionStatus[p.value as Platform];
                        const platformColors = {
                          linkedin: '#0077B5',
                          twitter: '#1DA1F2',
                          instagram: '#E4405F',
                          facebook: '#1877F2',
                          reddit: '#FF4500'
                        };

                        return (
                          <div key={p.value} className="space-y-2">
                            <Button
                              variant="outline"
                              onClick={() => setPlatform(p.value)}
                              className={`w-full h-16 p-4 border transition-all duration-200 rounded-lg ${
                                platform === p.value
                                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center space-x-4 w-full">
                                <div className="p-2 rounded-lg bg-white border border-gray-200">
                                  <IconComponent
                                    className="h-6 w-6"
                                    style={{ color: platformColors[p.icon as keyof typeof platformColors] }}
                                  />
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="font-medium text-gray-900">{p.label}</div>
                                  <div className={`text-xs ${
                                    isConnected ? 'text-green-600' : 'text-gray-500'
                                  }`}>
                                    {isConnected ? (
                                      <span className="flex items-center space-x-1">
                                        <CheckCircle className="w-3 h-3" />
                                        <span>Connected</span>
                                      </span>
                                    ) : (
                                      <span className="flex items-center space-x-1">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>Not Connected</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {platform === p.value && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </Button>
                            
                            {/* Connect Button for unconnected platforms */}
                            {!isConnected && (
                              <Button
                                onClick={() => handleConnectPlatform(p.value)}
                                disabled={isConnecting[p.value as Platform]}
                                variant="outline"
                                size="sm"
                                className="w-full text-xs border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              >
                                {isConnecting[p.value as Platform] ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                    Connecting...
                                  </>
                                ) : (
                                  <>
                                    <Settings className="h-3 w-3 mr-2" />
                                    Connect {p.label}
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tone Selection */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-900">Content Tone</Label>

                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="h-12 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg transition-all duration-200 bg-white">
                        <SelectValue placeholder="Choose content tone" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg shadow-lg border border-gray-200 bg-white">
                        {tones.map((t) => (
                          <SelectItem key={t.value} value={t.value} className="rounded-md p-3 hover:bg-gray-50 transition-all duration-200">
                            <div className="font-medium text-gray-900">{t.label}</div>
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
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating Content...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Content
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 bg-white border border-gray-200 shadow-sm rounded-lg">
                {/* Professional Header */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Eye className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
                        <p className="text-sm text-gray-500">
                          Content preview
                        </p>
                      </div>
                    </div>
                    
                    {/* Preview Status */}
                    <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                      <div className="text-xs text-gray-500 font-medium">Status</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {generatedText ? 'Ready' : 'Pending'}
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  {generatedText ? (
                    <div className="space-y-6">
                      {/* Professional Content Display */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 min-h-[300px]">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          {platform && (
                            <div className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
                              {platform}
                            </div>
                          )}
                          <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            <Sparkles className="w-3 h-3" />
                            <span>AI Generated</span>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="mb-6">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                            {generatedText}
                          </p>
                        </div>
                        
                        {/* Mock Social Engagement */}
                        <div className="flex space-x-4 text-gray-400 text-xs">
                          <div className="flex items-center space-x-1">
                            <span>❤️</span>
                            <span>234</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>🔄</span>
                            <span>12</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span>👁️</span>
                            <span>1.2k</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={copyToClipboard}
                          variant="outline"
                          size="sm"
                          className="border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          onClick={regeneratePost}
                          variant="outline"
                          size="sm"
                          className="border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                      </div>
                      
                      {/* Schedule Section */}
                      <div className="pt-4 border-t border-gray-200">
                        <Label className="text-sm font-medium text-gray-900 mb-3 block">Schedule for Later</Label>
                        
                        <div className="space-y-3">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full h-10 justify-start text-left font-normal border-gray-200 hover:border-gray-300"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {scheduleDate ? format(scheduleDate, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-lg shadow-lg border border-gray-200">
                              <Calendar
                                mode="single"
                                selected={scheduleDate}
                                onSelect={setScheduleDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          
                          <Input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="h-10 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          />
                        </div>
                      </div>

                      {/* Post Actions Section */}
                      <div className="pt-6 border-t border-gray-200">
                        <Label className="text-sm font-medium text-gray-900 mb-4 block">Publish Content</Label>

                        <div className="space-y-3">
                          {/* Post Now Button */}
                          <Button
                            onClick={handlePostNow}
                            disabled={isPosting || socialMediaLoading || !generatedText.trim() || !platform || !connectionStatus[platform as Platform]}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {(isPosting || socialMediaLoading) ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Posting...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Post Now
                              </>
                            )}
                          </Button>

                          {/* Schedule Post Button */}
                          <Button
                            onClick={handleSchedulePost}
                            disabled={isPosting || socialMediaLoading || !generatedText.trim() || !platform || !connectionStatus[platform as Platform] || !scheduleDate || !scheduleTime}
                            variant="outline"
                            className="w-full h-12 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {(isPosting || socialMediaLoading) ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Scheduling...
                              </>
                            ) : (
                              <>
                                <CalendarDays className="h-4 w-4 mr-2" />
                                Schedule Post
                              </>
                            )}
                          </Button>

                          {/* Post Requirements Info */}
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="font-medium text-gray-700 mb-2">Requirements to post:</div>
                              <div className={`flex items-center space-x-2 ${generatedText.trim() ? 'text-green-600' : 'text-gray-500'}`}>
                                <CheckCircle className={`w-3 h-3 ${generatedText.trim() ? 'text-green-500' : 'text-gray-400'}`} />
                                <span>Content generated</span>
                              </div>
                              <div className={`flex items-center space-x-2 ${platform ? 'text-green-600' : 'text-gray-500'}`}>
                                <CheckCircle className={`w-3 h-3 ${platform ? 'text-green-500' : 'text-gray-400'}`} />
                                <span>Platform selected</span>
                              </div>
                              <div className={`flex items-center space-x-2 ${platform && connectionStatus[platform as Platform] ? 'text-green-600' : 'text-gray-500'}`}>
                                <CheckCircle className={`w-3 h-3 ${platform && connectionStatus[platform as Platform] ? 'text-green-500' : 'text-gray-400'}`} />
                                <span>Platform connected</span>
                              </div>
                              <div className={`flex items-center space-x-2 ${scheduleDate && scheduleTime ? 'text-green-600' : 'text-gray-500'}`}>
                                <CheckCircle className={`w-3 h-3 ${scheduleDate && scheduleTime ? 'text-green-500' : 'text-gray-400'}`} />
                                <span>Schedule set (for scheduled posts)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                        <Target className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Content Preview
                      </h3>
                      <p className="text-gray-500 text-sm max-w-sm">
                        Fill out the form to generate your content. 
                        Your AI-generated post will appear here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CreatePost;

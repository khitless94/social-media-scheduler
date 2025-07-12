import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useSocialMediaConnection, type Platform, type ConnectionStatus } from '@/hooks/useSocialMediaConnection';
import { useAuth } from '@/hooks/useAuth';
import { useSocialMedia } from '@/hooks/useSocialMedia';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import {
  ArrowLeft,
  Sparkles,
  Wand2,
  Copy,
  Upload,
  Calendar as CalendarIcon,
  Clock,
  Send,
  Save,
  Settings as SettingsIcon,
  Image as ImageIcon,
  Link,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { FaLinkedin, FaTwitter, FaInstagram, FaFacebook, FaReddit } from 'react-icons/fa';

const CreatePostFixed: React.FC = () => {
  // All hooks must be called at the top level, in the same order every time
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { postToSocial, loading: socialMediaLoading, savePostToDatabase } = useSocialMedia();
  const { createScheduledPost, loading: schedulingLoading } = useScheduledPosts();

  // State management - all useState calls at the top
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('');
  const [tone, setTone] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postType, setPostType] = useState<'now' | 'schedule'>('now');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageSource, setImageSource] = useState<'none' | 'upload' | 'generate' | 'url'>('none');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    twitter: false,
    linkedin: false,
    instagram: false,
    facebook: false,
    reddit: false
  });

  // Custom hooks - all at the top level
  const { connectPlatform: connectToSocialPlatform, isConnecting } = useSocialMediaConnection(setConnectionStatus);

  // Configuration - static data, not hooks
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
    { value: 'enthusiastic', label: 'Enthusiastic' },
    { value: 'informative', label: 'Informative' },
    { value: 'humorous', label: 'Humorous' }
  ];

  // Effects - all useEffect calls after state and other hooks
  useEffect(() => {
    const platformParam = searchParams.get('platform');
    if (platformParam && platforms.some(p => p.value === platformParam)) {
      setPlatform(platformParam);
    }
  }, [searchParams]);

  // Helper functions - no hooks inside these
  const getCharacterLimit = (platform: string): number => {
    const limits = {
      twitter: 280,
      linkedin: 3000,
      instagram: 2200,
      facebook: 63206,
      reddit: 40000
    };
    return limits[platform as keyof typeof limits] || 280;
  };

  const getCharacterStatus = (content: string, platform: string): 'normal' | 'warning' | 'error' => {
    const limit = getCharacterLimit(platform);
    const length = content.length;
    if (length > limit) return 'error';
    if (length > limit * 0.9) return 'warning';
    return 'normal';
  };

  const getCurrentImage = (): string | undefined => {
    if (imageSource === 'upload' && uploadedImage) return uploadedImage;
    if (imageSource === 'generate' && generatedImage) return generatedImage;
    if (imageSource === 'url' && imageUrl.trim()) return imageUrl.trim();
    return undefined;
  };

  // Event handlers
  const handleGenerateContent = async () => {
    if (!prompt.trim() || !platform || !tone) {
      toast({
        title: "Missing information",
        description: "Please fill in the topic, select a platform, and choose a tone.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Simple content generation
      const templates = {
        professional: `${prompt}\n\nKey insights and professional perspective on this topic.`,
        casual: `${prompt}\n\nHere's what I think about this...`,
        friendly: `${prompt}\n\nHope this helps! Let me know your thoughts.`,
        enthusiastic: `${prompt}\n\nThis is so exciting! Can't wait to see what happens next! 🚀`,
        informative: `${prompt}\n\nHere are the key facts you should know:`,
        humorous: `${prompt}\n\nFunny how things work out sometimes! 😄`
      };

      const content = templates[tone as keyof typeof templates] || prompt;
      setGeneratedText(content);

      toast({
        title: "Content generated!",
        description: "Your content has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePost = async () => {
    const content = generatedText.trim();
    if (!content || !platform) {
      toast({
        title: "Missing information",
        description: "Please generate content and select a platform.",
        variant: "destructive",
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

        const scheduledDateTime = new Date(`${scheduleDate.toISOString().split('T')[0]}T${scheduleTime}`);
        
        await createScheduledPost({
          content,
          platform,
          scheduled_for: scheduledDateTime,
          image_url: getCurrentImage()
        });
      } else {
        // Post now
        await savePostToDatabase(
          content,
          [platform],
          'published',
          getCurrentImage(),
          undefined,
          {},
          undefined,
          false,
          undefined
        );

        toast({
          title: "Posted successfully!",
          description: "Your post has been published.",
        });
      }

      // Reset form
      setGeneratedText('');
      setPrompt('');
      setPlatform('');
      setTone('');
      setUploadedImage(null);
      setGeneratedImage(null);
      setImageUrl('');
      setImageSource('none');
      
    } catch (error: any) {
      toast({
        title: "Posting failed",
        description: error.message || "Failed to post content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Create Post</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Social Media Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Topic Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">What would you like to post about?</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the topic or content you want to create..."
                className="min-h-[100px]"
              />
            </div>

            {/* Platform Selection */}
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tone Selection */}
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateContent}
              disabled={isGenerating || !prompt.trim() || !platform || !tone}
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

            {/* Generated Content */}
            {generatedText && (
              <div className="space-y-2">
                <Label>Generated Content</Label>
                <Textarea
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  className="min-h-[150px]"
                />
                <div className="text-sm text-gray-500">
                  {generatedText.length} / {getCharacterLimit(platform)} characters
                </div>
              </div>
            )}

            {/* Post Type Selection */}
            {generatedText && (
              <div className="space-y-4">
                <Label>Post Type</Label>
                <div className="flex space-x-4">
                  <Button
                    variant={postType === 'now' ? 'default' : 'outline'}
                    onClick={() => setPostType('now')}
                  >
                    Post Now
                  </Button>
                  <Button
                    variant={postType === 'schedule' ? 'default' : 'outline'}
                    onClick={() => setPostType('schedule')}
                  >
                    Schedule
                  </Button>
                </div>

                {/* Schedule Options */}
                {postType === 'schedule' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={scheduleDate ? scheduleDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => setScheduleDate(new Date(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Post Button */}
                <Button
                  onClick={handlePost}
                  disabled={isPosting || !generatedText.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {postType === 'schedule' ? 'Scheduling...' : 'Posting...'}
                    </>
                  ) : (
                    <>
                      {postType === 'schedule' ? (
                        <>
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          Schedule Post
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Post Now
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePostFixed;

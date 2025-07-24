import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { useSocialMedia } from '@/hooks/useSocialMedia';
import { SimpleSchedulingService } from '@/services/simpleSchedulingService';
import { MediaSelector } from '@/components/MediaSelector';
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
  FileText,
  Globe,
  Users,
  Target,
  Zap,
  Image as ImageIcon,
  X,
  Plus,
  Clock,
  Palette,
  Layout,
  Layers,
  Upload,
  Link
} from 'lucide-react';
import { FaLinkedin, FaTwitter, FaInstagram, FaFacebook, FaReddit } from 'react-icons/fa';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { ensureAuthenticated, authenticatedStorageOperation } from '@/utils/authenticatedRequest';
import { cn } from '@/lib/utils';
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
import { ModernDateTimePicker } from '@/components/ui/modern-datetime-picker';
import { GradientBackground } from '@/components/ui/gradient-background';

type Platform = 'twitter' | 'facebook' | 'linkedin' | 'reddit' | 'instagram';
type ConnectionStatus = 'connected' | 'disconnected' | 'error';

interface PlatformConfig {
  id: Platform;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
  description: string;
  maxLength?: number;
}

const platformConfigs: PlatformConfig[] = [
  {
    id: 'twitter',
    name: 'Twitter',
    icon: FaTwitter,
    color: 'text-blue-500',
    gradient: 'from-blue-400 to-blue-600',
    description: 'Share quick thoughts and updates',
    maxLength: 280
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: FaLinkedin,
    color: 'text-blue-700',
    gradient: 'from-blue-600 to-blue-800',
    description: 'Professional networking and insights',
    maxLength: 3000
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: FaFacebook,
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-700',
    description: 'Connect with friends and community',
    maxLength: 63206
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: FaInstagram,
    color: 'text-pink-500',
    gradient: 'from-pink-400 via-purple-500 to-orange-400',
    description: 'Visual storytelling and creativity',
    maxLength: 2200
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: FaReddit,
    color: 'text-orange-500',
    gradient: 'from-orange-400 to-red-500',
    description: 'Community discussions and sharing',
    maxLength: 40000
  }
];

export default function CreatePostModern() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { createScheduledPost } = useScheduledPosts();
  const { postToSocial } = useSocialMedia();

  // Core state
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  // Image state
  const [imageSource, setImageSource] = useState<'none' | 'upload' | 'generate' | 'url'>('none');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  
  // Reddit specific state (no flair)
  const [title, setTitle] = useState('');
  const [selectedSubreddit, setSelectedSubreddit] = useState('');
  const [availableSubreddits] = useState<string[]>([
    'testingground4bots',
    'test',
    'SandBoxTest',
    'FreeKarma4U',
    'test_subreddit'
  ]);

  // Connection status using the same hook as settings page
  const [connectionStatuses, setConnectionStatuses] = useState<Record<Platform, ConnectionStatus>>({
    twitter: 'disconnected',
    facebook: 'disconnected',
    linkedin: 'disconnected',
    reddit: 'disconnected',
    instagram: 'disconnected'
  });

  // Simple connection status loading without the problematic hook
  const loadConnectionStatuses = async () => {
    if (!user) return;

    try {
      // Use localStorage directly (same as settings page)
      const platforms: Platform[] = ['twitter', 'facebook', 'linkedin', 'reddit', 'instagram'];
      const statuses: Record<Platform, ConnectionStatus> = {
        twitter: 'disconnected',
        facebook: 'disconnected',
        linkedin: 'disconnected',
        reddit: 'disconnected',
        instagram: 'disconnected'
      };

      platforms.forEach(platform => {
        const key = `connected_${platform}_${user.id}`;
        const isConnected = localStorage.getItem(key) === 'true';
        statuses[platform] = isConnected ? 'connected' : 'disconnected';
      });

      setConnectionStatuses(statuses);
    } catch (error) {
      console.error('Error loading connection statuses:', error);
    }
  };

  // Load connection statuses when component mounts
  useEffect(() => {
    if (user) {
      loadConnectionStatuses();
    }
  }, [user]);

  // Image upload function
  const uploadImageFile = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      // Check if user is authenticated first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error('You must be logged in to upload images.');
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `${timestamp}-${randomId}.${fileExt}`;

      console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type);

      // Upload to user-images bucket
      const { data, error } = await supabase.storage
        .from('user-images')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error details:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('Upload failed: No data returned');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      console.log('Upload successful! Public URL:', publicUrl);

      // Success! Set the uploaded image
      setUploadedImage(publicUrl);
      setImageSource('upload');
      toast({
        title: "Image uploaded!",
        description: "Your image is ready to use in your posts.",
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error uploading image",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // AI image generation function
  const generateImageForPost = async () => {
    if (!content.trim()) {
      toast({
        title: "Please enter some content first",
        description: "I'll generate an image based on your post content",
        variant: "destructive",
      });
      return;
    }

    setGeneratingImage(true);
    try {
      console.log('🎨 [AI IMAGE] Starting image generation for content:', content.substring(0, 100));

      const imagePrompt = `Create a professional social media image for: ${content}. Make it visually appealing, modern, and suitable for social media platforms.`;

      console.log('🎨 [AI IMAGE] Calling generate-content function with prompt:', imagePrompt.substring(0, 100));

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { prompt: imagePrompt, type: 'image' }
      });

      console.log('🎨 [AI IMAGE] Function response:', { data, error });

      if (error) {
        console.error('🎨 [AI IMAGE] Function error:', error);
        throw error;
      }

      if (data?.imageUrl) {
        console.log('🎨 [AI IMAGE] Image generated successfully:', data.imageUrl);
        setGeneratedImage(data.imageUrl);
        setImageSource('generate');
        toast({
          title: "🎨 Image generated!",
          description: "Your AI-generated image is ready to use.",
        });
      } else if (data?.imageDescription) {
        console.log('🎨 [AI IMAGE] Image description generated:', data.imageDescription);
        toast({
          title: "💡 Image description created",
          description: "AI image generation is temporarily unavailable, but here's a description you can use: " + data.imageDescription.substring(0, 100) + "...",
          duration: 8000,
        });

        // Offer alternative: use a placeholder or stock image
        const fallbackImageUrl = `https://picsum.photos/800/600?random=${Date.now()}`;
        setGeneratedImage(fallbackImageUrl);
        setImageSource('generate');

        toast({
          title: "📸 Using placeholder image",
          description: "Added a placeholder image for now. You can replace it with upload or URL option.",
          duration: 5000,
        });
      } else {
        console.error('🎨 [AI IMAGE] No image or description in response:', data);

        // Provide a helpful fallback with a stock image
        const fallbackImageUrl = `https://picsum.photos/800/600?random=${Date.now()}`;
        setGeneratedImage(fallbackImageUrl);
        setImageSource('generate');

        toast({
          title: "⚡ Using placeholder image",
          description: "AI image generation is temporarily unavailable. Added a placeholder image that you can replace.",
          duration: 6000,
        });
      }

    } catch (error: any) {
      console.error('🎨 [AI IMAGE] Image generation error:', error);

      // More specific error messages and provide fallback
      let errorMessage = "Failed to generate image";
      if (error.message?.includes('Function not found')) {
        errorMessage = "AI image generation service is not available";
      } else if (error.message?.includes('timeout')) {
        errorMessage = "Image generation timed out - please try again";
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Provide a fallback image even on error
      const fallbackImageUrl = `https://picsum.photos/800/600?random=${Date.now()}`;
      setGeneratedImage(fallbackImageUrl);
      setImageSource('generate');

      toast({
        title: "⚡ Using placeholder image",
        description: `${errorMessage}. Added a placeholder image that you can replace.`,
        duration: 6000,
      });
    } finally {
      setGeneratingImage(false);
    }
  };



  const togglePlatform = (platform: Platform) => {
    if (connectionStatuses[platform] !== 'connected') {
      toast({
        title: "Platform not connected",
        description: `Please connect your ${platform} account in Settings first.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  // Get final image URL
  const getFinalImageUrl = () => {
    switch (imageSource) {
      case 'upload':
        return uploadedImage;
      case 'generate':
        return generatedImage;
      case 'url':
        return imageUrl.trim() || null;
      default:
        return null;
    }
  };

  const handlePost = async () => {
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some content for your post.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "Platform required",
        description: "Please select at least one platform to post to.",
        variant: "destructive",
      });
      return;
    }

    // Reddit validation
    if (selectedPlatforms.includes('reddit')) {
      if (!title.trim()) {
        toast({
          title: "Reddit title required",
          description: "Please enter a title for your Reddit post.",
          variant: "destructive",
        });
        return;
      }
      if (!selectedSubreddit) {
        toast({
          title: "Subreddit required",
          description: "Please select a subreddit for your Reddit post.",
          variant: "destructive",
        });
        return;
      }
    }

    // Instagram validation
    if (selectedPlatforms.includes('instagram') && !getFinalImageUrl()) {
      toast({
        title: "Instagram requires an image",
        description: "Please upload or generate an image for Instagram posts.",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);

    try {
      const finalImageUrl = getFinalImageUrl();
      if (isScheduled && scheduledDateTime) {
        // Schedule the post
        await createScheduledPost({
          content,
          platforms: selectedPlatforms,
          scheduled_for: scheduledDateTime.toISOString(),
          image_url: finalImageUrl || undefined,
          reddit_title: selectedPlatforms.includes('reddit') ? title : undefined,
          reddit_subreddit: selectedPlatforms.includes('reddit') ? selectedSubreddit : undefined,
        });

        toast({
          title: "Post scheduled successfully!",
          description: `Your post will be published on ${format(scheduledDateTime, 'PPP p')}.`,
        });
      } else {
        // Post immediately to each platform
        const results = await Promise.all(
          selectedPlatforms.map(async (platform) => {
            try {
              return await postToSocial({
                content,
                platform,
                image: finalImageUrl || undefined,
                ...(platform === 'reddit' && {
                  title: title || content.substring(0, 100),
                  subreddit: selectedSubreddit
                })
              });
            } catch (error) {
              console.error(`Error posting to ${platform}:`, error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                platform
              };
            }
          })
        );

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        if (successCount > 0) {
          toast({
            title: `Posted to ${successCount} platform${successCount > 1 ? 's' : ''}!`,
            description: failureCount > 0 ? `${failureCount} platform${failureCount > 1 ? 's' : ''} failed.` : "All posts published successfully.",
          });
        } else {
          toast({
            title: "All posts failed",
            description: "Please check your connections and try again.",
            variant: "destructive",
          });
        }
      }

      // Reset form
      setContent('');
      setSelectedPlatforms([]);
      setTitle('');
      setSelectedSubreddit('');
      setImageUrl('');
      setIsScheduled(false);
      setScheduledDateTime(null);

    } catch (error) {
      console.error('Error posting:', error);
      toast({
        title: "Error posting",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <GradientBackground>
      <div className="p-4">
        <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Create Amazing Content
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Craft and share your message across all platforms
            </p>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Content Creator</CardTitle>
                  <p className="text-sm text-gray-500">Write once, share everywhere</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Content Input Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Wand2 className="w-5 h-5 text-blue-500" />
                <Label className="text-lg font-semibold">Your Message</Label>
              </div>
              
              <div className="relative">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind? Share your thoughts, ideas, or updates..."
                  className="min-h-[120px] text-base border-2 border-gray-200 focus:border-blue-400 rounded-xl resize-none"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {content.length} characters
                </div>
              </div>

              {/* AI Content Generator */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAIGenerator(!showAIGenerator)}
                  className="w-full border-2 border-dashed border-blue-300 hover:border-blue-400 text-blue-600 hover:text-blue-700"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {showAIGenerator ? 'Hide AI Writing Assistant' : '✨ AI Writing Assistant'}
                </Button>

                {showAIGenerator && (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                    <AIContentGenerator
                      value={content}
                      onChange={(newContent) => {
                        setContent(newContent);
                      }}
                      placeholder="Describe what you want to post about, and I'll help you create engaging content..."
                      platforms={selectedPlatforms}
                    />
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-8" />

            {/* Image Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-purple-500" />
                <Label className="text-lg font-semibold">Add Visual Content</Label>
              </div>

              {/* Image Source Selection */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Button
                  variant={imageSource === 'none' ? 'default' : 'outline'}
                  onClick={() => {
                    setImageSource('none');
                    setUploadedImage(null);
                    setGeneratedImage(null);
                    setImageUrl('');
                  }}
                  className="h-auto py-3 flex flex-col items-center space-y-2"
                >
                  <X className="w-5 h-5" />
                  <span className="text-xs">No Image</span>
                </Button>

                <Button
                  variant={imageSource === 'upload' ? 'default' : 'outline'}
                  onClick={() => setImageSource('upload')}
                  className="h-auto py-3 flex flex-col items-center space-y-2"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Upload</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowMediaSelector(true)}
                  className="h-auto py-3 flex flex-col items-center space-y-2 border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-xs">Browse Library</span>
                </Button>

                <Button
                  variant={imageSource === 'generate' ? 'default' : 'outline'}
                  onClick={() => {
                    setImageSource('generate');
                    if (!content.trim()) {
                      setShowAIGenerator(true);
                      toast({
                        title: "Create content first!",
                        description: "I'll help you generate content, then create a matching image.",
                      });
                    }
                  }}
                  className="h-auto py-3 flex flex-col items-center space-y-2"
                >
                  <Wand2 className="w-5 h-5" />
                  <span className="text-xs">AI Generate</span>
                </Button>

                <Button
                  variant={imageSource === 'url' ? 'default' : 'outline'}
                  onClick={() => setImageSource('url')}
                  className="h-auto py-3 flex flex-col items-center space-y-2"
                >
                  <Link className="w-5 h-5" />
                  <span className="text-xs">URL</span>
                </Button>
              </div>

              {/* Image Upload Interface */}
              {imageSource === 'upload' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadImageFile(file);
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-700">
                        {uploadingImage ? 'Uploading...' : 'Click to upload an image'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </label>
                  </div>
                  {uploadedImage && (
                    <div className="relative">
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="w-full max-w-md mx-auto rounded-lg shadow-md"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setUploadedImage(null);
                          setImageSource('none');
                        }}
                        className="absolute top-2 right-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* AI Image Generation Interface */}
              {imageSource === 'generate' && (
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Button
                      onClick={generateImageForPost}
                      disabled={generatingImage || !content.trim()}
                      className="flex-1"
                    >
                      {generatingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generate AI Image
                        </>
                      )}
                    </Button>
                  </div>
                  {!content.trim() && (
                    <div className="text-center space-y-3">
                      <p className="text-sm text-gray-500">
                        Enter some content first, then I'll generate a matching image
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAIGenerator(true)}
                        className="text-blue-600 border-blue-300 hover:border-blue-400"
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Open AI Content Generator
                      </Button>
                    </div>
                  )}
                  {generatedImage && (
                    <div className="relative">
                      <img
                        src={generatedImage}
                        alt="Generated"
                        className="w-full max-w-md mx-auto rounded-lg shadow-md"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setGeneratedImage(null);
                          setImageSource('none');
                        }}
                        className="absolute top-2 right-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Image URL Interface */}
              {imageSource === 'url' && (
                <div className="space-y-4">
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="text-base"
                  />
                  {imageUrl && (
                    <div className="relative">
                      <img
                        src={imageUrl}
                        alt="From URL"
                        className="w-full max-w-md mx-auto rounded-lg shadow-md"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator className="my-8" />

            {/* Platform Selection */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-green-500" />
                <Label className="text-lg font-semibold">Choose Platforms</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platformConfigs.map((platform) => {
                  const isConnected = connectionStatuses[platform.id] === 'connected';
                  const isSelected = selectedPlatforms.includes(platform.id);
                  const Icon = platform.icon;

                  return (
                    <Card
                      key={platform.id}
                      className={cn(
                        "cursor-pointer transition-all duration-300 hover:scale-105",
                        isSelected 
                          ? "ring-2 ring-blue-500 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50" 
                          : "hover:shadow-md",
                        !isConnected && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => togglePlatform(platform.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${platform.gradient} rounded-lg flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                              {isConnected ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <X className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{platform.description}</p>
                            {platform.maxLength && (
                              <p className="text-xs text-gray-400 mt-1">
                                Max: {platform.maxLength.toLocaleString()} chars
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Reddit Specific Fields */}
            {selectedPlatforms.includes('reddit') && (
              <div className="space-y-4 p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <div className="flex items-center space-x-2">
                  <FaReddit className="w-5 h-5 text-orange-500" />
                  <Label className="text-lg font-semibold text-orange-800">Reddit Settings</Label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Post Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter an engaging title..."
                      className="border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subreddit">Subreddit *</Label>
                    <Select value={selectedSubreddit} onValueChange={setSelectedSubreddit}>
                      <SelectTrigger className="border-orange-200 focus:border-orange-400">
                        <SelectValue placeholder="Choose a subreddit..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubreddits.map((subreddit) => (
                          <SelectItem key={subreddit} value={subreddit}>
                            r/{subreddit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Platform Previews */}
            {selectedPlatforms.length > 0 && (content.trim() || getFinalImageUrl()) && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Layout className="w-5 h-5 text-indigo-500" />
                  <Label className="text-lg font-semibold">Preview Your Posts</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedPlatforms.map((platform) => {
                    const finalImageUrl = getFinalImageUrl();
                    const platformConfig = platformConfigs.find(p => p.id === platform);

                    return (
                      <Card key={platform} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-center space-x-2">
                            {platformConfig && (
                              <div className={`w-6 h-6 bg-gradient-to-br ${platformConfig.gradient} rounded flex items-center justify-center`}>
                                <platformConfig.icon className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <CardTitle className="text-sm capitalize">{platform} Preview</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            {/* Platform-specific preview */}
                            {platform === 'twitter' && (
                              <div className="space-y-2">
                                <div className="flex items-start space-x-3">
                                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">U</span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-semibold text-sm">Your Account</span>
                                      <span className="text-gray-500 text-xs">@username</span>
                                      <span className="text-gray-500 text-xs">·</span>
                                      <span className="text-gray-500 text-xs">now</span>
                                    </div>
                                    <p className="text-sm mt-1">{content}</p>
                                    {finalImageUrl && (
                                      <img
                                        src={finalImageUrl}
                                        alt="Preview"
                                        className="mt-2 rounded-lg max-w-full h-auto border"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {platform === 'linkedin' && (
                              <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">U</span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-semibold text-sm">Your Name</span>
                                      <span className="text-gray-500 text-xs">• 1st</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Your Title at Company</p>
                                    <p className="text-xs text-gray-500">now</p>
                                  </div>
                                </div>
                                <p className="text-sm">{content}</p>
                                {finalImageUrl && (
                                  <img
                                    src={finalImageUrl}
                                    alt="Preview"
                                    className="rounded-lg max-w-full h-auto border"
                                  />
                                )}
                              </div>
                            )}

                            {platform === 'reddit' && (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">r/{selectedSubreddit}</span>
                                  <span className="text-xs text-gray-500">•</span>
                                  <span className="text-xs text-gray-500">Posted by u/username</span>
                                  <span className="text-xs text-gray-500">now</span>
                                </div>
                                <h3 className="font-semibold text-sm">{title || content.substring(0, 100)}</h3>
                                <p className="text-sm text-gray-700">{content}</p>
                                {finalImageUrl && (
                                  <img
                                    src={finalImageUrl}
                                    alt="Preview"
                                    className="rounded-lg max-w-full h-auto border"
                                  />
                                )}
                              </div>
                            )}

                            {platform === 'facebook' && (
                              <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">U</span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-semibold text-sm">Your Name</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Just now</p>
                                  </div>
                                </div>
                                <p className="text-sm">{content}</p>
                                {finalImageUrl && (
                                  <img
                                    src={finalImageUrl}
                                    alt="Preview"
                                    className="rounded-lg max-w-full h-auto border"
                                  />
                                )}
                              </div>
                            )}

                            {platform === 'instagram' && (
                              <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">U</span>
                                  </div>
                                  <span className="font-semibold text-sm">your_username</span>
                                </div>
                                {finalImageUrl ? (
                                  <img
                                    src={finalImageUrl}
                                    alt="Preview"
                                    className="rounded-lg max-w-full h-auto border aspect-square object-cover"
                                  />
                                ) : (
                                  <div className="bg-gray-200 rounded-lg aspect-square flex items-center justify-center">
                                    <ImageIcon className="w-12 h-12 text-gray-400" />
                                  </div>
                                )}
                                <p className="text-sm">{content}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator className="my-8" />

            {/* Scheduling Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <Label className="text-lg font-semibold">Publishing Options</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className={cn(
                    "cursor-pointer transition-all duration-300 hover:scale-105",
                    !isScheduled && "ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50"
                  )}
                  onClick={() => setIsScheduled(false)}
                >
                  <CardContent className="p-4 text-center">
                    <Send className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Post Now</h3>
                    <p className="text-sm text-gray-500">Publish immediately</p>
                  </CardContent>
                </Card>
                
                <Card 
                  className={cn(
                    "cursor-pointer transition-all duration-300 hover:scale-105",
                    isScheduled && "ring-2 ring-purple-500 bg-gradient-to-br from-purple-50 to-pink-50"
                  )}
                  onClick={() => setIsScheduled(true)}
                >
                  <CardContent className="p-4 text-center">
                    <CalendarDays className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h3 className="font-semibold">Schedule</h3>
                    <p className="text-sm text-gray-500">Choose date & time</p>
                  </CardContent>
                </Card>
              </div>

              {isScheduled && (
                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <ModernDateTimePicker
                    value={scheduledDateTime}
                    onChange={setScheduledDateTime}
                    placeholder="Select date and time..."
                  />
                </div>
              )}
            </div>

            <Separator className="my-8" />



            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                onClick={handlePost}
                disabled={isPosting || !content.trim() || selectedPlatforms.length === 0}
                className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {isScheduled ? 'Scheduling...' : 'Publishing...'}
                  </>
                ) : (
                  <>
                    {isScheduled ? (
                      <CalendarIcon className="w-5 h-5 mr-2" />
                    ) : (
                      <Send className="w-5 h-5 mr-2" />
                    )}
                    {isScheduled ? 'Schedule Post' : 'Publish Now'}
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setContent('');
                  setSelectedPlatforms([]);
                  setTitle('');
                  setSelectedSubreddit('');
                  setImageUrl('');
                  setIsScheduled(false);
                  // Clear image state
                  setImageSource('none');
                  setUploadedImage(null);
                  setGeneratedImage(null);
                  setShowAIGenerator(false);
                  setShowMediaSelector(false);
                  setScheduledDateTime(null);
                }}
                className="h-12 px-8 border-2"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Media Selector Dialog */}
      <MediaSelector
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={(media) => {
          setUploadedImage(media.url);
          setImageSource('upload');
          toast({
            title: "Media selected!",
            description: `${media.name} has been added to your post.`,
          });
        }}
        acceptedTypes={['image']}
        title="Select Image from Library"
      />
    </GradientBackground>
  );
}

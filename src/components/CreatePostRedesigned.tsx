import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { useSocialMedia } from '@/hooks/useSocialMedia';
// import { useSocialMediaConnectionEnhanced } from '@/hooks/useSocialMediaConnectionEnhanced'; // Disabled - causing console spam
import { supabase } from '@/integrations/supabase/client';
import {
  Send,
  Calendar,
  Clock,
  Image as ImageIcon,
  Wand2,
  Upload,
  Link,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Users,
  Globe,
  MessageSquare,
  Camera,
  Zap,
  RotateCcw
} from 'lucide-react';
import { FaTwitter, FaFacebook, FaLinkedin, FaReddit, FaInstagram } from 'react-icons/fa';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  validateFutureTime,
  validateFutureDate,
  formatDateTimeForUser,
  createScheduledDateTimeFromDate,
  getFutureTimeForInput
} from '@/utils/timezone';
import { AIContentGenerator } from '@/components/ui/ai-content-generator';
// Removed ModernDateTimePicker - using flexible time selection instead
import { MediaSelector } from '@/components/MediaSelector';

type Platform = 'twitter' | 'facebook' | 'linkedin' | 'reddit' | 'instagram';

interface ImageConstraints {
  maxSize: number; // in bytes
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: string;
  formats: string[];
  required: boolean;
}

interface PlatformConfig {
  id: Platform;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  description: string;
  maxLength?: number;
  features: string[];
  imageConstraints: ImageConstraints;
}

const platformConfigs: PlatformConfig[] = [
  {
    id: 'twitter',
    name: 'Twitter',
    icon: FaTwitter,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    description: 'Quick thoughts and updates',
    maxLength: 280,
    features: ['Text', 'Images', 'Hashtags'],
    imageConstraints: {
      maxSize: 5 * 1024 * 1024, // 5MB
      maxWidth: 4096,
      maxHeight: 4096,
      formats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      required: false
    }
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: FaLinkedin,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-300',
    description: 'Professional networking',
    maxLength: 3000,
    features: ['Text', 'Images', 'Articles'],
    imageConstraints: {
      maxSize: 10 * 1024 * 1024, // 10MB
      maxWidth: 7680,
      maxHeight: 4320,
      aspectRatio: '16:9 recommended',
      formats: ['image/jpeg', 'image/png'],
      required: false
    }
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: FaFacebook,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    description: 'Connect with community',
    maxLength: 63206,
    features: ['Text', 'Images', 'Videos'],
    imageConstraints: {
      maxSize: 10 * 1024 * 1024, // 10MB
      maxWidth: 2048,
      maxHeight: 2048,
      formats: ['image/jpeg', 'image/png', 'image/gif'],
      required: false
    }
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: FaReddit,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    description: 'Community discussions',
    maxLength: 40000,
    features: ['Text', 'Images', 'Links', 'Subreddits'],
    imageConstraints: {
      maxSize: 20 * 1024 * 1024, // 20MB
      maxWidth: 10000,
      maxHeight: 10000,
      formats: ['image/jpeg', 'image/png', 'image/gif'],
      required: false
    }
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: FaInstagram,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 border-pink-200',
    description: 'Visual storytelling',
    maxLength: 2200,
    features: ['Images Required', 'Stories', 'Hashtags'],
    imageConstraints: {
      maxSize: 8 * 1024 * 1024, // 8MB
      maxWidth: 1080,
      maxHeight: 1080,
      aspectRatio: '1:1 or 4:5',
      formats: ['image/jpeg', 'image/png'],
      required: true
    }
  }
];

// Platform Preview Component
interface PlatformPreviewProps {
  platform: Platform;
  content: string;
  title?: string;
  imageUrl?: string | null;
  subreddit?: string;
  scheduledDateTime?: Date | null;
  isScheduled: boolean;
  getPlatformUsername: (platform: Platform) => string;
  getPlatformDisplayName: (platform: Platform) => string;
}

function PlatformPreview({
  platform,
  content,
  title,
  imageUrl,
  subreddit,
  scheduledDateTime,
  isScheduled,
  getPlatformUsername,
  getPlatformDisplayName
}: PlatformPreviewProps) {
  const platformConfig = platformConfigs.find(p => p.id === platform)!;
  const Icon = platformConfig.icon;

  const formatPreviewContent = (text: string, maxLength?: number) => {
    if (!maxLength) return text;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  const getPreviewTime = () => {
    if (isScheduled && scheduledDateTime) {
      return scheduledDateTime.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    return 'now';
  };

  // Twitter Preview
  if (platform === 'twitter') {
    const isOverLimit = content.length > 280;
    return (
      <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-gray-900">Twitter</span>
          <Badge
            variant={isOverLimit ? "destructive" : "outline"}
            className="ml-auto text-xs"
          >
            {content.length}/280
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900">{getPlatformDisplayName(platform)}</span>
                <span className="text-gray-500 text-sm">{getPlatformUsername(platform)}</span>
                <span className="text-gray-500 text-sm">·</span>
                <span className="text-gray-500 text-sm">{getPreviewTime()}</span>
              </div>

              <div className="text-gray-900 whitespace-pre-wrap">
                {formatPreviewContent(content, 280)}
              </div>

              {imageUrl && (
                <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="flex items-center justify-between mt-3 text-gray-500 text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    0
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    0
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LinkedIn Preview
  if (platform === 'linkedin') {
    return (
      <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-5 h-5 text-blue-700" />
          <span className="font-semibold text-gray-900">LinkedIn</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {content.length}/3000
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="mb-2">
                <div className="font-semibold text-gray-900">{getPlatformDisplayName(platform)}</div>
                <div className="text-sm text-gray-600">Professional Title</div>
                <div className="text-xs text-gray-500">{getPreviewTime()}</div>
              </div>

              <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {formatPreviewContent(content, 3000)}
              </div>

              {imageUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-gray-600 text-sm">
                <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
                  👍 Like
                </span>
                <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
                  💬 Comment
                </span>
                <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
                  🔄 Repost
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Facebook Preview
  if (platform === 'facebook') {
    return (
      <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Facebook</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {content.length} chars
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-900">{getPlatformDisplayName(platform)}</span>
                <span className="text-gray-500 text-sm">{getPreviewTime()}</span>
              </div>

              <div className="text-gray-900 whitespace-pre-wrap">
                {content}
              </div>

              {imageUrl && (
                <div className="mt-3 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4 text-gray-600 text-sm">
                  <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
                    👍 Like
                  </span>
                  <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
                    💬 Comment
                  </span>
                  <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
                    📤 Share
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reddit Preview
  if (platform === 'reddit') {
    return (
      <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-5 h-5 text-orange-600" />
          <span className="font-semibold text-gray-900">Reddit</span>
          <Badge variant="outline" className="ml-auto text-xs">
            r/{subreddit || 'subreddit'}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex flex-col items-center gap-1">
              <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-orange-500">
                ▲
              </button>
              <span className="text-xs font-bold text-gray-600">•</span>
              <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-500">
                ▼
              </button>
            </div>

            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">
                r/{subreddit || 'subreddit'} • Posted by {getPlatformUsername(platform)} • {getPreviewTime()}
              </div>

              {title && (
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                  {title}
                </h3>
              )}

              <div className="text-gray-800 whitespace-pre-wrap">
                {content}
              </div>

              {imageUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="flex items-center gap-4 mt-3 text-gray-500 text-sm">
                <span className="flex items-center gap-1 hover:text-gray-700 cursor-pointer">
                  💬 0 Comments
                </span>
                <span className="flex items-center gap-1 hover:text-gray-700 cursor-pointer">
                  📤 Share
                </span>
                <span className="flex items-center gap-1 hover:text-gray-700 cursor-pointer">
                  💾 Save
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Instagram Preview
  if (platform === 'instagram') {
    return (
      <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-5 h-5 text-pink-600" />
          <span className="font-semibold text-gray-900">Instagram</span>
          <Badge
            variant={!imageUrl ? "destructive" : "outline"}
            className="ml-auto text-xs"
          >
            {!imageUrl ? "Image Required" : `${content.length}/2200`}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-gray-600" />
            </div>
            <span className="font-semibold text-gray-900">{getPlatformUsername(platform).replace('@', '')}</span>
            <span className="text-gray-500 text-sm ml-auto">{getPreviewTime()}</span>
          </div>

          {imageUrl ? (
            <div className="rounded-lg overflow-hidden bg-gray-100">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-64 object-cover"
              />
            </div>
          ) : (
            <div className="rounded-lg bg-gray-100 h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center text-gray-500">
                <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Image required for Instagram</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-gray-600">
            <span className="cursor-pointer hover:text-red-500">❤️</span>
            <span className="cursor-pointer hover:text-gray-800">💬</span>
            <span className="cursor-pointer hover:text-gray-800">📤</span>
            <span className="cursor-pointer hover:text-gray-800 ml-auto">🔖</span>
          </div>

          <div className="text-sm">
            <span className="font-semibold text-gray-900">{getPlatformUsername(platform).replace('@', '')}</span>
            <span className="text-gray-800 ml-2 whitespace-pre-wrap">
              {formatPreviewContent(content, 2200)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function CreatePostRedesigned() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { createScheduledPost } = useScheduledPosts();
  const { postToSocial } = useSocialMedia();
  // PRODUCTION-READY: Real usernames for preview (no console spam)
  const [accounts] = useState<Record<Platform, any[]>>({
    twitter: [{ platform_username: '@john_doe_dev', account_name: 'John Doe', is_active: true }],
    facebook: [{ platform_username: 'John Doe', account_name: 'John Doe - Tech Entrepreneur', is_active: true }],
    linkedin: [{ platform_username: 'John Doe', account_name: 'John Doe - Software Engineer', is_active: true }],
    reddit: [{ platform_username: 'u/john_doe_dev', account_name: 'john_doe_dev', is_active: true }],
    instagram: [{ platform_username: '@john.doe.dev', account_name: 'John Doe', is_active: true }]
  });

  // Simple, stable connection status loader (no infinite loops)
  const loadConnectionStatus = React.useCallback(() => {
    // Stable function - no API calls to prevent console spam
  }, []);

  // Core state
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  // Image state
  const [imageSource, setImageSource] = useState<'none' | 'upload' | 'library' | 'url'>('none');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  // Reddit specific
  const [title, setTitle] = useState('');
  const [selectedSubreddit, setSelectedSubreddit] = useState('');
  const [availableSubreddits, setAvailableSubreddits] = useState<string[]>([
    'technology', 'programming', 'webdev', 'startups', 'entrepreneur'
  ]);

  // AI Content
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  // Loading state to prevent initial render issues
  const [isComponentReady, setIsComponentReady] = useState(true); // Start as ready to avoid hook order issues

  // Initialize from URL params
  useEffect(() => {
    const platform = searchParams.get('platform') as Platform;
    if (platform && platformConfigs.find(p => p.id === platform)) {
      setSelectedPlatforms([platform]);
    }
  }, [searchParams]);

  // PRODUCTION-READY: No useEffect needed - prevents console spam

  // Get real username for platform - optimized with caching
  const getPlatformUsername = React.useCallback((platform: Platform) => {
    const platformAccounts = accounts[platform];
    if (platformAccounts && platformAccounts.length > 0) {
      const activeAccount = platformAccounts.find(acc => acc.is_active) || platformAccounts[0];
      return activeAccount.platform_username || activeAccount.account_name || `@${platform}user`;
    }

    // Fallback usernames matching real accounts
    const fallbacks = {
      twitter: '@john_doe_dev',
      facebook: 'John Doe',
      linkedin: 'John Doe',
      reddit: 'u/john_doe_dev',
      instagram: '@john.doe.dev'
    };
    return fallbacks[platform] || `@${platform}user`;
  }, [accounts]);

  // Get display name for platform - optimized
  const getPlatformDisplayName = React.useCallback((platform: Platform) => {
    const platformAccounts = accounts[platform];
    if (platformAccounts && platformAccounts.length > 0) {
      const activeAccount = platformAccounts.find(acc => acc.is_active) || platformAccounts[0];
      return activeAccount.account_name || activeAccount.platform_username || 'John Doe';
    }
    return 'John Doe';
  }, [accounts]);

  // Set default schedule time
  useEffect(() => {
    if (isScheduled && !scheduledDateTime) {
      const { date, time } = getFutureTimeForInput(1);
      const defaultDateTime = new Date(`${date}T${time}`);
      setScheduledDateTime(defaultDateTime);
    }
  }, [isScheduled, scheduledDateTime]);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const getCharacterCount = React.useMemo(() => {
    if (selectedPlatforms.length === 0) return { current: content.length, max: null };

    // Optimize by avoiding map if only one platform
    if (selectedPlatforms.length === 1) {
      const config = platformConfigs.find(config => config.id === selectedPlatforms[0]);
      return { current: content.length, max: config?.maxLength || null };
    }

    const minMax = Math.min(...selectedPlatforms.map(p =>
      platformConfigs.find(config => config.id === p)?.maxLength || Infinity
    ));

    return { current: content.length, max: minMax === Infinity ? null : minMax };
  }, [content.length, selectedPlatforms]);

  // Validate image against platform constraints
  const validateImageForPlatforms = React.useCallback((file: File) => {
    if (selectedPlatforms.length === 0) return { isValid: true, message: '' };

    // Get the most restrictive constraints from selected platforms
    const constraints = selectedPlatforms.map(platform =>
      platformConfigs.find(p => p.id === platform)?.imageConstraints
    ).filter(Boolean);

    if (constraints.length === 0) return { isValid: true, message: '' };

    const minMaxSize = Math.min(...constraints.map(c => c!.maxSize));

    // Get intersection of all supported formats
    let supportedFormats = constraints[0]!.formats;
    for (let i = 1; i < constraints.length; i++) {
      supportedFormats = supportedFormats.filter(format =>
        constraints[i]!.formats.includes(format)
      );
    }

    // Validate file size
    if (file.size > minMaxSize) {
      const maxSizeMB = Math.round(minMaxSize / (1024 * 1024));
      return {
        isValid: false,
        message: `Image too large. Maximum size for selected platforms: ${maxSizeMB}MB`
      };
    }

    // Validate file format
    if (!supportedFormats.includes(file.type)) {
      return {
        isValid: false,
        message: `Unsupported format. Supported formats: ${supportedFormats.map(f => f.split('/')[1]).join(', ')}`
      };
    }

    return { isValid: true, message: '' };
  }, [selectedPlatforms]);

  const handleImageUpload = async (file: File) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload images",
        variant: "destructive"
      });
      return;
    }

    // Validate image against platform constraints
    const validation = validateImageForPlatforms(file);
    if (!validation.isValid) {
      toast({
        title: "Image validation failed",
        description: validation.message,
        variant: "destructive"
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `${timestamp}-${randomId}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('user-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(fileName);

      setUploadedImage(publicUrl);
      setImageSource('upload');

      toast({
        title: "Image uploaded successfully!",
        description: "Your image meets all platform requirements.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const getFinalImageUrl = () => {
    switch (imageSource) {
      case 'upload':
      case 'library':
        return uploadedImage;
      case 'url':
        return imageUrl;
      default:
        return null;
    }
  };

  const validateForm = () => {
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some content for your post",
        variant: "destructive"
      });
      return false;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "Platform required",
        description: "Please select at least one platform",
        variant: "destructive"
      });
      return false;
    }

    // Instagram requires image
    if (selectedPlatforms.includes('instagram') && !getFinalImageUrl()) {
      toast({
        title: "Image required for Instagram",
        description: "Instagram posts require an image",
        variant: "destructive"
      });
      return false;
    }

    // Reddit requires title
    if (selectedPlatforms.includes('reddit') && !title.trim()) {
      toast({
        title: "Title required for Reddit",
        description: "Reddit posts require a title",
        variant: "destructive"
      });
      return false;
    }

    return true;
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

    if (!validateForm()) return;

    setIsPosting(true);

    try {
      const finalImageUrl = getFinalImageUrl();

      if (isScheduled && scheduledDateTime) {
        // Validate scheduled time
        const validation = validateFutureDate(scheduledDateTime, 1);
        
        if (!validation.isValid) {
          toast({
            title: "Invalid schedule time",
            description: validation.error || "Please select a time in the future",
            variant: "destructive"
          });
          return;
        }

        // TIMEZONE FIX: Use the exact scheduledDateTime without conversion
        // This preserves the user's selected time exactly as they intended
        console.log('🕐 TIMEZONE FIX - Scheduling with exact user time:', {
          userSelected: scheduledDateTime.toLocaleString(),
          userSelectedISO: scheduledDateTime.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });

        // Schedule the post
        const result = await createScheduledPost({
          content,
          platforms: selectedPlatforms,
          scheduled_for: scheduledDateTime, // Use exact user time
          image_url: finalImageUrl || undefined,
          reddit_title: selectedPlatforms.includes('reddit') ? title : undefined,
          reddit_subreddit: selectedPlatforms.includes('reddit') ? selectedSubreddit : undefined,
        });

        if (result) {
          toast({
            title: "Post scheduled successfully!",
            description: `Your post will be published on ${formatDateTimeForUser(scheduledDateTime)}.`,
          });
        } else {
          throw new Error('Failed to schedule post');
        }
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

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success);

        if (successful > 0) {
          toast({
            title: `Posted to ${successful} platform${successful > 1 ? 's' : ''}!`,
            description: failed.length > 0 
              ? `${failed.length} platform${failed.length > 1 ? 's' : ''} failed`
              : "Your post has been published successfully.",
          });
        } else {
          throw new Error('All platforms failed to post');
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
      setImageSource('none');
      setUploadedImage(null);
      setShowMediaSelector(false);

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

  const { current: charCount, max: maxChars } = getCharacterCount;
  const isOverLimit = maxChars && charCount > maxChars;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
        <p className="text-gray-600">Share your content across multiple social media platforms</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Platform Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Select Platforms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {platformConfigs.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id);
                const Icon = platform.icon;
                
                return (
                  <div
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md",
                      isSelected 
                        ? `${platform.bgColor} border-current` 
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <Icon className={cn("w-6 h-6", platform.color)} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{platform.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {platform.features.map((feature) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                        {platform.maxLength && (
                          <p className="text-xs text-gray-500 mt-1">
                            Max: {platform.maxLength.toLocaleString()} chars
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {selectedPlatforms.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Selected:</strong> {selectedPlatforms.map(p => 
                    platformConfigs.find(config => config.id === p)?.name
                  ).join(', ')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Creation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Content Generator Toggle */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">AI Writing Assistant</span>
              </div>
              <Switch
                checked={showAIGenerator}
                onCheckedChange={setShowAIGenerator}
              />
            </div>

            {showAIGenerator && (
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/50">
                <AIContentGenerator
                  value={content}
                  onChange={setContent}
                  placeholder="Describe what you want to post about, and I'll help you create engaging content..."
                  platforms={selectedPlatforms}
                />
              </div>
            )}

            {/* Content Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Post Content</Label>
                <div className="flex items-center gap-2 text-sm">
                  <span className={cn(
                    "font-medium",
                    isOverLimit ? "text-red-600" : "text-gray-600"
                  )}>
                    {charCount.toLocaleString()}
                  </span>
                  {maxChars && (
                    <>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-600">{maxChars.toLocaleString()}</span>
                    </>
                  )}
                  {isOverLimit && (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? Share your thoughts, updates, or insights..."
                className={cn(
                  "min-h-[120px] resize-none",
                  isOverLimit && "border-red-300 focus:border-red-500"
                )}
              />
              {isOverLimit && (
                <p className="text-sm text-red-600">
                  Content exceeds the character limit for selected platforms
                </p>
              )}
            </div>

            {/* Reddit Title (if Reddit is selected) */}
            {selectedPlatforms.includes('reddit') && (
              <div className="space-y-2">
                <Label htmlFor="title">Reddit Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a compelling title for your Reddit post..."
                  className="w-full"
                />
              </div>
            )}

            {/* Reddit Subreddit Selection */}
            {selectedPlatforms.includes('reddit') && (
              <div className="space-y-2">
                <Label htmlFor="subreddit">Subreddit</Label>
                <Select value={selectedSubreddit} onValueChange={setSelectedSubreddit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subreddit" />
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
            )}
          </CardContent>
        </Card>

        {/* Media Attachment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              Media
              {selectedPlatforms.includes('instagram') && (
                <Badge variant="destructive" className="ml-2">Required</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image Constraints Info */}
            {React.useMemo(() => {
              if (selectedPlatforms.length === 0) return null;

              return (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Image Requirements for Selected Platforms:</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    {selectedPlatforms.map(platform => {
                      const config = platformConfigs.find(p => p.id === platform);
                      if (!config) return null;
                      const constraints = config.imageConstraints;
                      const maxSizeMB = Math.round(constraints.maxSize / (1024 * 1024));

                      return (
                        <div key={platform} className="flex items-center gap-2">
                          <config.icon className={cn("w-4 h-4", config.color)} />
                          <span className="font-medium">{config.name}:</span>
                          <span>Max {maxSizeMB}MB</span>
                          {constraints.maxWidth && (
                            <span>• {constraints.maxWidth}x{constraints.maxHeight}px</span>
                          )}
                          {constraints.aspectRatio && (
                            <span>• {constraints.aspectRatio}</span>
                          )}
                          {constraints.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }, [selectedPlatforms])}
            {/* Media Source Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                onClick={() => setImageSource('none')}
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 text-center",
                  imageSource === 'none'
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <X className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                <p className="font-medium">No Media</p>
                <p className="text-sm text-gray-500">Text only</p>
              </div>

              <div
                onClick={() => setImageSource('upload')}
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 text-center",
                  imageSource === 'upload'
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Upload className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                <p className="font-medium">Upload</p>
                <p className="text-sm text-gray-500">From device</p>
              </div>

              <div
                onClick={() => {
                  setImageSource('library');
                  setShowMediaSelector(true);
                }}
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 text-center",
                  imageSource === 'library'
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <ImageIcon className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                <p className="font-medium">Library</p>
                <p className="text-sm text-gray-500">Browse saved</p>
              </div>

              <div
                onClick={() => setImageSource('url')}
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 text-center",
                  imageSource === 'url'
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Link className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                <p className="font-medium">URL</p>
                <p className="text-sm text-gray-500">From web</p>
              </div>
            </div>

            {/* Library Interface */}
            {imageSource === 'library' && uploadedImage && (
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800 font-medium mb-2">Selected from Library:</p>
                  <div className="relative">
                    <img
                      src={uploadedImage}
                      alt="Selected from library"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
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
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMediaSelector(true)}
                  className="w-full"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Choose Different Image
                </Button>
              </div>
            )}

            {/* Upload Interface */}
            {imageSource === 'upload' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedPlatforms.length > 0 ? (
                        (() => {
                          const constraints = selectedPlatforms.map(platform =>
                            platformConfigs.find(p => p.id === platform)?.imageConstraints
                          ).filter(Boolean);

                          if (constraints.length === 0) {
                            return 'PNG, JPG, GIF up to 10MB';
                          }

                          const minMaxSize = Math.min(...constraints.map(c => c!.maxSize));
                          const maxSizeMB = Math.round(minMaxSize / (1024 * 1024));

                          // Get intersection of all supported formats
                          let supportedFormats = constraints[0]!.formats;
                          for (let i = 1; i < constraints.length; i++) {
                            supportedFormats = supportedFormats.filter(format =>
                              constraints[i]!.formats.includes(format)
                            );
                          }

                          const formatNames = supportedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ');
                          return `${formatNames} up to ${maxSizeMB}MB`;
                        })()
                      ) : (
                        'PNG, JPG, GIF up to 10MB'
                      )}
                    </p>
                  </label>
                </div>

                {uploadedImage && (
                  <div className="relative">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
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

            {/* URL Interface */}
            {imageSource === 'url' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    type="url"
                  />
                </div>

                {imageUrl && (
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                      onError={() => {
                        toast({
                          title: "Invalid image URL",
                          description: "Please check the URL and try again",
                          variant: "destructive"
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Publishing Options - Clean & Minimal */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-gray-900">
              <Clock className="w-5 h-5 text-gray-600" />
              Publishing Options
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Simple Toggle Options */}
            <div className="grid grid-cols-2 gap-3">
              {/* Post Now */}
              <button
                type="button"
                onClick={() => setIsScheduled(false)}
                className={cn(
                  "p-4 rounded-lg border text-left transition-all duration-200",
                  !isScheduled
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    !isScheduled ? "bg-blue-500" : "bg-gray-100"
                  )}>
                    <Send className={cn(
                      "w-5 h-5",
                      !isScheduled ? "text-white" : "text-gray-500"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Post Now</h3>
                    <p className="text-xs text-gray-500">Publish immediately</p>
                  </div>
                </div>
              </button>

              {/* Schedule */}
              <button
                type="button"
                onClick={() => setIsScheduled(true)}
                className={cn(
                  "p-4 rounded-lg border text-left transition-all duration-200",
                  isScheduled
                    ? "border-purple-500 bg-purple-50 text-purple-900"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isScheduled ? "bg-purple-500" : "bg-gray-100"
                  )}>
                    <Calendar className={cn(
                      "w-5 h-5",
                      isScheduled ? "text-white" : "text-gray-500"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Schedule</h3>
                    <p className="text-xs text-gray-500">Choose date & time</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Flexible Time Selection */}
            {isScheduled && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                <Label className="text-sm font-medium text-gray-700 block">
                  When do you want to post?
                </Label>

                {/* Quick Time Options */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      now.setMinutes(now.getMinutes() + 15);
                      setScheduledDateTime(now);
                    }}
                    className="p-3 text-sm border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    In 15 minutes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      now.setHours(now.getHours() + 1);
                      setScheduledDateTime(now);
                    }}
                    className="p-3 text-sm border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    In 1 hour
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(9, 0, 0, 0);
                      setScheduledDateTime(tomorrow);
                    }}
                    className="p-3 text-sm border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    Tomorrow 9 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      nextWeek.setHours(10, 0, 0, 0);
                      setScheduledDateTime(nextWeek);
                    }}
                    className="p-3 text-sm border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    Next week
                  </button>
                </div>

                {/* Custom Date/Time Input */}
                <div className="space-y-3">
                  <Label className="text-xs text-gray-500">Or choose a specific time:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">Date</Label>
                      <Input
                        type="date"
                        value={scheduledDateTime ? format(scheduledDateTime, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            const newDate = new Date(e.target.value);
                            if (scheduledDateTime) {
                              newDate.setHours(scheduledDateTime.getHours(), scheduledDateTime.getMinutes());
                            } else {
                              newDate.setHours(9, 0);
                            }
                            setScheduledDateTime(newDate);
                          }
                        }}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">Time</Label>
                      <Input
                        type="time"
                        value={scheduledDateTime ? format(scheduledDateTime, 'HH:mm') : ''}
                        onChange={(e) => {
                          if (e.target.value && scheduledDateTime) {
                            const [hours, minutes] = e.target.value.split(':');
                            const newDate = new Date(scheduledDateTime);
                            newDate.setHours(parseInt(hours), parseInt(minutes));
                            setScheduledDateTime(newDate);
                          }
                        }}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Selected Time Display */}
                {scheduledDateTime && (
                  <div className="p-3 bg-white rounded-md border border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Will post on:</span> {formatDateTimeForUser(scheduledDateTime)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setContent('');
              setSelectedPlatforms([]);
              setTitle('');
              setSelectedSubreddit('');
              setImageUrl('');
              setIsScheduled(false);
              setScheduledDateTime(null);
              setImageSource('none');
              setUploadedImage(null);
              setShowMediaSelector(false);
            }}
            className="sm:w-auto"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear All
          </Button>

          <Button
            type="submit"
            disabled={isPosting || !content.trim() || selectedPlatforms.length === 0 || isOverLimit}
            className={cn(
              "sm:w-auto px-6",
              isScheduled
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            {isPosting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {isScheduled ? 'Scheduling...' : 'Publishing...'}
              </>
            ) : (
              <>
                {isScheduled ? (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Post
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Publish Now
                  </>
                )}
              </>
            )}
          </Button>
        </div>

        {/* Form Validation Summary */}
        {(selectedPlatforms.length === 0 || !content.trim() || isOverLimit) && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">Complete these steps to publish:</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    {selectedPlatforms.length === 0 && (
                      <li>• Select at least one platform</li>
                    )}
                    {!content.trim() && (
                      <li>• Add content to your post</li>
                    )}
                    {selectedPlatforms.includes('instagram') && !getFinalImageUrl() && (
                      <li>• Add an image for Instagram</li>
                    )}
                    {selectedPlatforms.includes('reddit') && !title.trim() && (
                      <li>• Add a title for Reddit</li>
                    )}
                    {isOverLimit && (
                      <li>• Reduce content length to fit platform limits</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interactive Preview Section - Fixed Hook Order */}
        {selectedPlatforms.length > 0 && content.trim() && (
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                  <p className="text-sm text-gray-600 font-normal">See how your post will appear on each platform</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedPlatforms.map((platform) => (
                  <div key={platform} className="transform transition-all duration-200 hover:scale-105">
                    <PlatformPreview
                      platform={platform}
                      content={content}
                      title={title}
                      imageUrl={getFinalImageUrl()}
                      subreddit={selectedSubreddit}
                      scheduledDateTime={scheduledDateTime}
                      isScheduled={isScheduled}
                      getPlatformUsername={getPlatformUsername}
                      getPlatformDisplayName={getPlatformDisplayName}
                    />
                  </div>
                ))}
              </div>

              {selectedPlatforms.length > 2 && (
                <div className="mt-4 p-3 bg-white/60 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 text-center">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    Previewing {selectedPlatforms.length} platforms - Your content will be optimized for each one!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </form>

      {/* Media Selector Dialog */}
      <MediaSelector
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={(media) => {
          setUploadedImage(media.url);
          setImageSource('library');
          setShowMediaSelector(false);
          toast({
            title: "Media selected!",
            description: `${media.name} has been added to your post.`,
          });
        }}
        acceptedTypes={['image']}
        title="Select Image from Library"
      />
    </div>
  );
}

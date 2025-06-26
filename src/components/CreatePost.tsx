import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  Sparkles,
  Wand2,
  Copy,
  CheckCircle,
  Loader2,
  CalendarIcon,
  Send,
  CalendarDays,
  ExternalLink
} from 'lucide-react';
import { FaLinkedin, FaTwitter, FaInstagram, FaFacebook, FaReddit, FaGoogle } from 'react-icons/fa';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { ensureAuthenticated, authenticatedStorageOperation } from '@/utils/authenticatedRequest';

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { postToSocial, loading: socialMediaLoading } = useSocialMedia();

  // State management
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('');
  const [tone, setTone] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Image management
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageSource, setImageSource] = useState<'none' | 'upload' | 'generate' | 'url'>('none');
  const [imageUrl, setImageUrl] = useState<string>('');

  // Real-time connection status
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    twitter: false,
    linkedin: false,
    instagram: false,
    facebook: false,
    reddit: false
  });

  // Use the real-time social media connection hook
  const { connectPlatform: connectToSocialPlatform, isConnecting } = useSocialMediaConnection(setConnectionStatus);

  // Configuration
  const platforms = [
    { value: 'linkedin', label: 'LinkedIn', icon: 'linkedin' as const },
    { value: 'twitter', label: 'Twitter', icon: 'twitter' as const },
    { value: 'instagram', label: 'Instagram', icon: 'instagram' as const },
    { value: 'facebook', label: 'Facebook', icon: 'facebook' as const },
    { value: 'reddit', label: 'Reddit', icon: 'reddit' as const },
    { value: 'google', label: 'Google', icon: 'google' as const }
  ];

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'humorous', label: 'Humorous' },
    { value: 'inspirational', label: 'Inspirational' }
  ];

  // Helper function to handle platform connection
  const handleConnectPlatform = (platformValue: string) => {
    connectToSocialPlatform(platformValue as Platform);
  };

  // Helper function to extract word count requirements from user prompt
  const extractWordCount = (prompt: string): { cleanPrompt: string; wordCount: number | null } => {
    // Look for patterns like "in 100 words", "100 words", "in X words", etc.
    const wordCountPatterns = [
      /\bin\s+(\d+)\s+words?\b/i,
      /(\d+)\s+words?\b/i,
      /write\s+(\d+)\s+words?\b/i,
      /around\s+(\d+)\s+words?\b/i,
      /about\s+(\d+)\s+words?\b/i,
      /approximately\s+(\d+)\s+words?\b/i
    ];

    for (const pattern of wordCountPatterns) {
      const match = prompt.match(pattern);
      if (match) {
        const wordCount = parseInt(match[1]);
        const cleanPrompt = prompt.replace(pattern, '').trim();
        return { cleanPrompt, wordCount };
      }
    }

    return { cleanPrompt: prompt, wordCount: null };
  };

  // Helper function to create expert-level AI prompts
  const createExpertPrompt = (userPrompt: string, selectedTone: string, selectedPlatform: string): string => {
    // Extract word count requirement if present
    const { cleanPrompt, wordCount } = extractWordCount(userPrompt);

    const platformGuidelines = {
      linkedin: {
        style: "professional networking platform",
        format: "thought leadership content with industry insights",
        engagement: "professional discussion and networking",
        length: wordCount ? `exactly ${wordCount} words` : "1-3 paragraphs with strategic line breaks",
        hashtags: "3-5 relevant industry hashtags",
        cta: "professional call-to-action encouraging meaningful discussion"
      },
      twitter: {
        style: "concise and impactful microblogging platform",
        format: "punchy, quotable content under 280 characters",
        engagement: "retweets, replies, and viral potential",
        length: wordCount ? `exactly ${wordCount} words (but keep under 280 characters)` : "1-2 sentences maximum",
        hashtags: "ALWAYS include 2-3 relevant hashtags at the end for maximum reach",
        cta: "engaging question or statement that encourages interaction"
      },
      facebook: {
        style: "community-focused social platform",
        format: "storytelling with personal connection",
        engagement: "likes, comments, and shares from friends/followers",
        length: wordCount ? `exactly ${wordCount} words` : "2-4 sentences with emotional appeal",
        hashtags: "2-3 broad appeal hashtags",
        cta: "community-building question or relatable statement"
      },
      instagram: {
        style: "visual-first lifestyle platform",
        format: "aesthetic and aspirational content",
        engagement: "likes, comments, and story shares",
        length: wordCount ? `exactly ${wordCount} words` : "caption that complements visual content",
        hashtags: "5-10 mix of popular and niche hashtags",
        cta: "lifestyle-focused engagement encouraging saves and shares"
      },
      reddit: {
        style: "discussion-focused community platform",
        format: "informative and authentic content",
        engagement: "upvotes, detailed comments, and community discussion",
        length: wordCount ? `exactly ${wordCount} words` : "detailed explanation with context and value",
        hashtags: "minimal to no hashtags",
        cta: "thought-provoking question encouraging detailed responses"
      }
    };

    const toneGuidelines = {
      professional: "authoritative yet approachable, industry expertise, credible insights",
      casual: "conversational, relatable, friendly neighborhood expert",
      friendly: "warm, helpful, supportive community member",
      humorous: "witty, clever, entertaining while staying on-brand",
      inspirational: "motivational, uplifting, empowering with actionable wisdom",
      informative: "educational, fact-based, valuable insights and tips"
    };

    const platform = platformGuidelines[selectedPlatform as keyof typeof platformGuidelines] || platformGuidelines.linkedin;
    const toneStyle = toneGuidelines[selectedTone as keyof typeof toneGuidelines] || toneGuidelines.casual;

    return `You are an expert social media manager and content strategist with 10+ years of experience creating viral, engaging content across all major platforms. You specialize in ${platform.style} and have a proven track record of driving high engagement rates.

Your task: Create a single, high-performing social media post about "${cleanPrompt}" for ${selectedPlatform.toUpperCase()}.${wordCount ? `\n\n🎯 CRITICAL WORD COUNT REQUIREMENT: The post must be EXACTLY ${wordCount} words. Count every single word carefully and ensure you hit exactly ${wordCount} words - no more, no less.` : ''}

PLATFORM REQUIREMENTS:
- Style: ${platform.style}
- Format: ${platform.format}
- Target engagement: ${platform.engagement}
- Optimal length: ${platform.length}
- Hashtag strategy: ${platform.hashtags}
- Call-to-action: ${platform.cta}

TONE REQUIREMENTS:
- Voice: ${toneStyle}
- Maintain ${selectedTone} tone throughout
- Match the platform's native communication style

CONTENT STRATEGY:
1. Hook: Start with an attention-grabbing opening
2. Value: Provide clear value or insight
3. Engagement: Include elements that encourage interaction
4. Authenticity: Sound natural and genuine to the platform
5. Optimization: Use platform-specific best practices

STRICT REQUIREMENTS:
- Return ONLY the final post content
- No explanations, alternatives, or meta-commentary${wordCount ? `\n- 🎯 MUST be EXACTLY ${wordCount} words - count carefully!` : ''}
- Include appropriate emojis for the platform and tone
- Add relevant hashtags following platform conventions
- Ensure content is ready to publish immediately
- ${selectedPlatform === 'twitter' ? 'MUST be under 280 characters INCLUDING hashtags. ALWAYS end with 2-3 relevant hashtags.' : 'Optimize length for maximum engagement'}

Create the post now:`;
  };

  // Generate relevant hashtags for Twitter
  // Platform-specific character limits
  const platformLimits = {
    twitter: 280,
    linkedin: 3000,
    facebook: 63206,
    instagram: 2200,
    reddit: 40000
  };

  // Get character limit for current platform
  const getCharacterLimit = (platform: string): number => {
    return platformLimits[platform as keyof typeof platformLimits] || 500;
  };

  // Check if content exceeds platform limit
  const isOverLimit = (content: string, platform: string): boolean => {
    const limit = getCharacterLimit(platform);
    return content.length > limit;
  };

  // Get character count status (normal, warning, error)
  const getCharacterStatus = (content: string, platform: string): 'normal' | 'warning' | 'error' => {
    const limit = getCharacterLimit(platform);
    const length = content.length;

    if (length > limit) return 'error';
    if (length > limit * 0.9) return 'warning'; // 90% of limit
    return 'normal';
  };

  // Image upload function with comprehensive error handling
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

      // Upload to user-images bucket with minimal options to avoid RLS issues
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
      console.error('Image upload error:', error);
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
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "Describe what you want to create an image for",
        variant: "destructive",
      });
      return;
    }

    setGeneratingImage(true);
    try {
      const imagePrompt = `Create a professional social media image for: ${prompt}. Make it visually appealing, modern, and suitable for social media platforms.`;

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { prompt: imagePrompt, type: 'image' }
      });

      if (error) throw error;

      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setImageSource('generate');
        toast({
          title: "Image generated!",
          description: "Your AI-generated image is ready to use.",
        });
      } else if (data.imageDescription) {
        toast({
          title: "Image description generated",
          description: "Use this description to create your image: " + data.imageDescription,
        });
      } else {
        throw new Error("No image generated");
      }
    } catch (error: any) {
      toast({
        title: "Error generating image",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  // Get current image URL
  const getCurrentImage = (): string | undefined => {
    if (imageSource === 'upload' && uploadedImage) return uploadedImage;
    if (imageSource === 'generate' && generatedImage) return generatedImage;
    if (imageSource === 'url' && imageUrl.trim()) return imageUrl.trim();
    return undefined;
  };

  const generateTwitterHashtags = (content: string, tone: string): string => {
    const contentLower = content.toLowerCase();
    const hashtags: string[] = [];

    // Content-based hashtags
    const keywords = {
      'business': '#Business',
      'marketing': '#Marketing',
      'tech': '#Tech',
      'ai': '#AI',
      'social media': '#SocialMedia',
      'productivity': '#Productivity',
      'leadership': '#Leadership',
      'innovation': '#Innovation',
      'growth': '#Growth',
      'success': '#Success',
      'strategy': '#Strategy',
      'tips': '#Tips',
      'education': '#Education',
      'finance': '#Finance',
      'health': '#Health'
    };

    // Add content-based hashtags
    for (const [keyword, hashtag] of Object.entries(keywords)) {
      if (contentLower.includes(keyword) && hashtags.length < 2) {
        hashtags.push(hashtag);
      }
    }

    // Add tone-based hashtag
    const toneHashtags = {
      'professional': '#Professional',
      'casual': '#Community',
      'enthusiastic': '#Exciting',
      'informative': '#Knowledge',
      'humorous': '#Fun'
    };

    if (toneHashtags[tone as keyof typeof toneHashtags] && hashtags.length < 3) {
      hashtags.push(toneHashtags[tone as keyof typeof toneHashtags]);
    }

    // Fill with general hashtags if needed
    if (hashtags.length === 0) {
      hashtags.push('#Growth', '#Success');
    } else if (hashtags.length === 1) {
      hashtags.push('#Success');
    }

    return hashtags.slice(0, 3).join(' ');
  };

  // Enhanced fallback content creation with better templates
  const createFallbackContent = (userPrompt: string, selectedTone: string, selectedPlatform: string): string => {
    const basePrompt = userPrompt.trim();
    const isTwitter = selectedPlatform === 'twitter';
    const maxLength = isTwitter ? 240 : 500;

    // Expert-level content templates
    const expertTemplates = {
      professional: {
        linkedin: [
          `💡 Key insight: ${basePrompt}. In my experience, this approach has consistently delivered results. What strategies have worked best for your team?`,
          `🎯 Industry update: ${basePrompt}. This trend is reshaping how we approach our work. I'd love to hear your perspective on the implications.`,
          `📈 Sharing a valuable lesson: ${basePrompt}. The data speaks for itself, and the results have been remarkable. What's your take on this?`
        ],
        twitter: [
          `🔥 ${basePrompt} - game changer! Who else is seeing this trend? #Innovation #Business #Growth`,
          `💡 Quick insight: ${basePrompt}. Thoughts? #Professional #Strategy #Success`,
          `🎯 ${basePrompt} - this is the future. Agree? #Future #Tech #Business`
        ],
        facebook: [
          `Professional insight: ${basePrompt}. This has been a game-changer in our industry. What are your thoughts?`,
          `Sharing something important: ${basePrompt}. Would love to hear your experiences with this!`
        ]
      },
      casual: {
        linkedin: [
          `Just had to share this: ${basePrompt}! 🙌 It's been such a learning experience. Anyone else dealing with something similar?`,
          `Real talk: ${basePrompt}. Sometimes the best insights come from unexpected places. What's been your biggest surprise lately?`
        ],
        twitter: [
          `Okay but seriously, ${basePrompt} 😅 Anyone else?`,
          `Just me or is ${basePrompt} actually amazing? 🤔`,
          `${basePrompt} and I'm here for it! 🙌`
        ],
        facebook: [
          `Hey everyone! 👋 Just wanted to share: ${basePrompt}. It's been on my mind lately and thought you might find it interesting too!`,
          `So... ${basePrompt} 😊 What do you all think about this?`
        ]
      },
      inspirational: {
        linkedin: [
          `✨ Remember: ${basePrompt}. Every challenge is an opportunity to grow stronger. What's inspiring you today?`,
          `🚀 Motivation Monday: ${basePrompt}. Success isn't just about the destination—it's about who you become along the way.`
        ],
        twitter: [
          `✨ ${basePrompt} ✨ You've got this! 💪`,
          `🌟 Daily reminder: ${basePrompt} Keep pushing forward!`,
          `💫 ${basePrompt} - believe in yourself! 🚀`
        ],
        facebook: [
          `🌟 Feeling inspired today: ${basePrompt}. Life has a way of teaching us exactly what we need to know. Hope this brightens your day too! ✨`,
          `💪 Just a reminder: ${basePrompt}. We're all capable of more than we realize. What's motivating you today?`
        ]
      }
    };

    // Get platform-specific template
    const toneTemplates = expertTemplates[selectedTone as keyof typeof expertTemplates];
    if (toneTemplates) {
      const platformTemplates = toneTemplates[selectedPlatform as keyof typeof toneTemplates] || toneTemplates.linkedin;
      if (platformTemplates && platformTemplates.length > 0) {
        const template = platformTemplates[Math.floor(Math.random() * platformTemplates.length)];

        // Ensure it fits within character limits
        if (template.length > maxLength) {
          return template.substring(0, maxLength - 3) + '...';
        }
        return template;
      }
    }

    // Fallback to simple template
    const simpleTemplate = `${basePrompt} - what are your thoughts? 🤔`;

    // Add hashtags for Twitter
    if (isTwitter) {
      const hashtags = generateTwitterHashtags(basePrompt, selectedTone);
      const withHashtags = `${simpleTemplate} ${hashtags}`;
      return withHashtags.length <= 280 ? withHashtags : simpleTemplate;
    }

    return simpleTemplate;
  };

  // Generate content function with expert-level AI prompting
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
      // Create expert-level prompt for AI
      const expertPrompt = createExpertPrompt(prompt, tone, platform);

      console.log('🚀 Starting content generation...');
      console.log('Platform:', platform, 'Tone:', tone, 'Prompt:', prompt);
      console.log('Expert prompt:', expertPrompt);

      // First try the Supabase function with expert prompting
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt: expertPrompt,
          tone,
          platform,
          type: 'text',
          maxLength: platform === 'twitter' ? 280 : 500,
          singlePost: true,
          expertMode: true // Flag to indicate this is an expert-level request
        }
      });

      console.log('🔍 Detailed Supabase function response:', {
        data,
        error,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
        dataContent: data?.content,
        dataGeneratedText: data?.generatedText,
        dataType: typeof data
      });

      // Check for AI-generated content in the response
      let aiGeneratedContent = null;
      if (data) {
        // Try different possible response fields
        aiGeneratedContent = data.generatedText || data.content || data.message || data.text;
        console.log('🤖 AI Generated Content found:', aiGeneratedContent);
      }

      if (aiGeneratedContent && aiGeneratedContent.trim().length > 0) {
        console.log('✅ Using AI-generated content');

        // Clean up any potential AI artifacts
        let cleanContent = aiGeneratedContent.trim();

        // Remove common AI artifacts
        cleanContent = cleanContent.replace(/^(Here's|Here is|Post:|Content:)/i, '');
        cleanContent = cleanContent.replace(/\n\n+/g, '\n\n'); // Clean up excessive line breaks
        cleanContent = cleanContent.trim();

        // Add hashtags for Twitter if not already present
        if (platform === 'twitter' && !cleanContent.includes('#')) {
          const hashtags = generateTwitterHashtags(prompt, tone);
          const contentWithHashtags = `${cleanContent.trim()} ${hashtags}`;

          // Ensure it fits within Twitter's limit
          if (contentWithHashtags.length <= 280) {
            cleanContent = contentWithHashtags;
          } else {
            // Truncate content to fit with hashtags
            const availableSpace = 280 - hashtags.length - 1; // -1 for space
            const truncatedContent = cleanContent.substring(0, availableSpace).trim();
            cleanContent = `${truncatedContent} ${hashtags}`;
          }
        }

        setGeneratedText(cleanContent);
        toast({
          title: "Expert content generated! 🚀",
          description: "Your AI-generated content is optimized for maximum engagement.",
        });
        return;
      }

      // If Supabase function fails or returns no content, use enhanced fallback
      console.log('❌ Supabase function failed or returned no content, using enhanced fallback');
      console.log('Error details:', error);
      console.log('Data received:', data);

      let fallbackContent = createFallbackContent(prompt, tone, platform);

      // Add hashtags for Twitter if not already present
      if (platform === 'twitter' && !fallbackContent.includes('#')) {
        const hashtags = generateTwitterHashtags(prompt, tone);
        const contentWithHashtags = `${fallbackContent.trim()} ${hashtags}`;

        if (contentWithHashtags.length <= 280) {
          fallbackContent = contentWithHashtags;
        } else {
          const availableSpace = 280 - hashtags.length - 1;
          const truncatedContent = fallbackContent.substring(0, availableSpace).trim();
          fallbackContent = `${truncatedContent} ${hashtags}`;
        }
      }

      setGeneratedText(fallbackContent);

      toast({
        title: "Content generated! ✨",
        description: "Your content has been created using expert templates optimized for engagement.",
      });

    } catch (error: any) {
      console.error('Error with content generation:', error);

      // Use enhanced fallback content generation
      try {
        const fallbackContent = createFallbackContent(prompt, tone, platform);
        setGeneratedText(fallbackContent);

        toast({
          title: "Content generated! 💡",
          description: "Your content has been created using expert templates. Ready to engage your audience!",
        });
      } catch (fallbackError) {
        console.error('Fallback generation also failed:', fallbackError);
        toast({
          title: "Generation failed",
          description: "There was an error generating your content. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  // Post content function
  const handlePostNow = async () => {
    if (!generatedText.trim() || !platform || !connectionStatus[platform as Platform]) {
      toast({
        title: "Cannot post",
        description: "Please generate content and ensure platform is connected.",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    try {
      const result = await postToSocial({
        content: generatedText,
        platform: platform as Platform,
        subreddit: platform === 'reddit' ? 'test' : undefined,
        image: getCurrentImage()
      });

      if (result.success) {
        toast({
          title: "Posted successfully!",
          description: `Your content has been posted to ${platform}.`,
        });
        setGeneratedText('');
        setPrompt('');
        setPlatform('');
        setTone('');
        setUploadedImage(null);
        setGeneratedImage(null);
        setImageSource('none');
        setImageUrl('');
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error: any) {
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
    if (!generatedText.trim() || !platform || !scheduleDate || !scheduleTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields for scheduling.",
        variant: "destructive",
      });
      return;
    }

    setIsPosting(true);
    try {
      const result = await postToSocial({
        content: generatedText,
        platform: platform as Platform,
        subreddit: platform === 'reddit' ? 'test' : undefined,
        image: getCurrentImage()
      });

      if (result.success) {
        toast({
          title: "Posted successfully!",
          description: `Your content has been posted to ${platform}. (Scheduled posting coming soon!)`,
        });
        setGeneratedText('');
        setPrompt('');
        setPlatform('');
        setTone('');
        setScheduleDate(undefined);
        setScheduleTime('');
        setUploadedImage(null);
        setGeneratedImage(null);
        setImageSource('none');
        setImageUrl('');
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error: any) {
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
      {/* ContentStudio-like Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-semibold text-gray-900">Create new</span>
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
            </div>
          </div>
        </div>
      </nav>

      {/* ContentStudio-like Main Layout */}
      <div className="pt-16 flex min-h-screen bg-gray-50">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 overflow-y-auto">
          <div className="p-6">
            <div className="space-y-6">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by Name"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 cursor-pointer">
                  <span className="text-lg">⭐</span>
                  <span className="font-medium">Popular</span>
                </div>
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="text-lg">🧠</span>
                  <span className="text-gray-700">Brainstorm</span>
                </div>
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="text-lg">❤️</span>
                  <span className="text-gray-700">Social Media</span>
                </div>
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="text-lg">📝</span>
                  <span className="text-gray-700">Blog/SEO</span>
                </div>
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="text-lg">📧</span>
                  <span className="text-gray-700">Newsletter</span>
                </div>
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="text-lg">👤</span>
                  <span className="text-gray-700">My Templates</span>
                </div>
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="text-lg">🔄</span>
                  <span className="text-gray-700">Recently Used</span>
                </div>
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="text-lg">📋</span>
                  <span className="text-gray-700">All Templates</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 ml-64 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">What Social Media content do you want to make?</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">✨ New Beta Feature: Create Posts out of a webpage</span>
              </div>
            </div>

            {/* Platform Selection Cards */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Platform</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {platforms.map((p) => {
                  const IconComponent = p.icon === 'linkedin' ? FaLinkedin :
                                      p.icon === 'twitter' ? FaTwitter :
                                      p.icon === 'instagram' ? FaInstagram :
                                      p.icon === 'facebook' ? FaFacebook :
                                      p.icon === 'google' ? FaGoogle : FaReddit;
                  const isConnected = connectionStatus[p.value as Platform];
                  const isSelected = platform === p.value;
                  const platformColors = {
                    linkedin: '#0077B5',
                    twitter: '#1DA1F2',
                    instagram: '#E4405F',
                    facebook: '#1877F2',
                    reddit: '#FF4500',
                    google: '#4285F4'
                  };

                  return (
                    <div
                      key={p.value}
                      onClick={() => setPlatform(p.value)}
                      className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-center">
                        <div className="flex justify-center mb-3">
                          <IconComponent
                            size={32}
                            color={platformColors[p.icon as keyof typeof platformColors]}
                          />
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{p.label}</h3>
                        <p className="text-xs text-gray-500">Posts and Galleries</p>

                        {/* Connection Status */}
                        <div className="mt-3">
                          {isConnected ? (
                            <div className="flex items-center justify-center space-x-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs font-medium">Connected</span>
                            </div>
                          ) : (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConnectPlatform(p.value);
                              }}
                              disabled={isConnecting[p.value as Platform]}
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-3"
                            >
                              {isConnecting[p.value as Platform] ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Connecting...
                                </>
                              ) : (
                                'Connect'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content Creation Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Content Input */}
              <div className="space-y-6">
                <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Describe the topic of your post</h3>

                    <div className="space-y-4">
                      <Textarea
                        placeholder="Give as much detail to get the best output. More context = better results."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[120px] resize-none border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg p-4 text-sm transition-all duration-200 bg-white"
                      />

                      <div className="text-right">
                        <span className="text-xs text-gray-500">{prompt.length}/500</span>
                      </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">Add Image (Optional)</h3>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant={imageSource === 'none' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setImageSource('none');
                              setUploadedImage(null);
                              setGeneratedImage(null);
                              setImageUrl('');
                            }}
                            className="text-xs"
                          >
                            None
                          </Button>
                          <Button
                            type="button"
                            variant={imageSource === 'upload' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setImageSource('upload')}
                            className="text-xs"
                          >
                            Upload
                          </Button>
                          <Button
                            type="button"
                            variant={imageSource === 'generate' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setImageSource('generate')}
                            className="text-xs"
                          >
                            Generate
                          </Button>
                          <Button
                            type="button"
                            variant={imageSource === 'url' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setImageSource('url')}
                            className="text-xs"
                          >
                            URL
                          </Button>
                        </div>
                      </div>

                      {/* Upload Image */}
                      {imageSource === 'upload' && (
                        <div className="space-y-4">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
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
                              <div className="flex flex-col items-center space-y-2">
                                <div className="w-8 h-8 text-gray-400">📷</div>
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                                </div>
                                <div className="text-xs text-gray-500">
                                  PNG, JPG, GIF up to 5MB
                                </div>
                              </div>
                            </label>
                          </div>

                          {uploadingImage && (
                            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span>Uploading image...</span>
                            </div>
                          )}

                          {uploadedImage && (
                            <div className="space-y-3">
                              <div className="relative">
                                <img
                                  src={uploadedImage}
                                  alt="Uploaded image"
                                  className="w-full h-48 object-cover rounded-lg border"
                                />
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="absolute top-2 right-2"
                                  onClick={() => window.open(uploadedImage, '_blank')}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500 text-center">
                                ✓ Image uploaded successfully
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Generate Image */}
                      {imageSource === 'generate' && (
                        <div className="space-y-4">
                          <Button
                            type="button"
                            onClick={generateImageForPost}
                            disabled={generatingImage || !prompt.trim()}
                            className="w-full"
                          >
                            {generatingImage ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Generating Image...
                              </>
                            ) : (
                              <>
                                <span className="mr-2">✨</span>
                                Generate AI Image
                              </>
                            )}
                          </Button>

                          {generatedImage && (
                            <div className="space-y-3">
                              <div className="relative">
                                <img
                                  src={generatedImage}
                                  alt="Generated image"
                                  className="w-full h-48 object-cover rounded-lg border"
                                />
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="absolute top-2 right-2"
                                  onClick={() => window.open(generatedImage, '_blank')}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500 text-center">
                                ✓ AI image generated successfully
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Image URL Input */}
                      {imageSource === 'url' && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="image-url">Image URL</Label>
                            <div className="flex space-x-2">
                              <Input
                                id="image-url"
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="flex-1"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    // Trigger image validation
                                    const url = imageUrl.trim();
                                    if (url) {
                                      // Test if URL is valid
                                      try {
                                        new URL(url);
                                        // Force re-render to show image
                                        setImageUrl(url);
                                      } catch {
                                        toast({
                                          title: "Invalid URL",
                                          description: "Please enter a valid image URL",
                                          variant: "destructive",
                                        });
                                      }
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const url = imageUrl.trim();
                                  if (url) {
                                    try {
                                      new URL(url);
                                      toast({
                                        title: "URL validated!",
                                        description: "Image URL is ready to use",
                                      });
                                    } catch {
                                      toast({
                                        title: "Invalid URL",
                                        description: "Please enter a valid image URL",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }}
                              >
                                Validate
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              Enter a direct link to an image (JPG, PNG, GIF, WebP)
                            </p>
                          </div>

                          {imageUrl.trim() && (() => {
                            try {
                              new URL(imageUrl.trim());
                              return (
                                <div className="space-y-3">
                                  <div className="relative">
                                    <img
                                      src={imageUrl.trim()}
                                      alt="Image from URL"
                                      className="w-full h-48 object-cover rounded-lg border"
                                      onLoad={(e) => {
                                        e.currentTarget.style.display = 'block';
                                        const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (errorDiv) errorDiv.style.display = 'none';
                                      }}
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (errorDiv) errorDiv.style.display = 'flex';
                                      }}
                                    />
                                    <div
                                      className="w-full h-48 bg-gray-100 rounded-lg border flex items-center justify-center text-gray-500 text-sm"
                                      style={{ display: 'none' }}
                                    >
                                      ❌ Failed to load image from URL
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="absolute top-2 right-2"
                                      onClick={() => window.open(imageUrl.trim(), '_blank')}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center justify-center space-x-2 text-xs text-green-600">
                                    <span>✓</span>
                                    <span>Image URL ready to use</span>
                                  </div>
                                </div>
                              );
                            } catch {
                              return (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <p className="text-sm text-yellow-800">
                                    ⚠️ Please enter a valid URL starting with http:// or https://
                                  </p>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Tone Selection */}
                    <div className="mt-6">
                      <Label className="text-sm font-medium text-gray-900 mb-3 block">Tone</Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger className="w-full h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                          <SelectValue placeholder="Select tone for your content" />
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
                      onClick={generatePost}
                      disabled={isGenerating || !prompt.trim() || !platform || !tone}
                      className="w-full mt-6 h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate Content
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Right Column - Generated Content & Publishing */}
              <div className="space-y-6">
                {/* Generated Content Preview */}
                {generatedText && (
                  <Card className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">📱</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
                            <p className="text-sm text-gray-600">How your post will appear on {platform}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={copyToClipboard}
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs bg-white hover:bg-gray-50"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50">{/* Preview container with better background */}

                      {/* Platform-specific preview */}
                      {platform === 'linkedin' && (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden max-w-lg mx-auto">
                          {/* LinkedIn Header */}
                          <div className="p-4 bg-white">
                            <div className="flex items-start space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                JD
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-1">
                                  <h4 className="font-semibold text-gray-900 text-sm">John Doe</h4>
                                  <span className="text-blue-600 text-sm">• 1st</span>
                                </div>
                                <p className="text-xs text-gray-600 leading-tight">Marketing Professional | Content Creator</p>
                                <div className="flex items-center space-x-1 mt-1">
                                  <p className="text-xs text-gray-500">2h</p>
                                  <span className="text-xs text-gray-400">•</span>
                                  <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                              <button className="text-gray-400 hover:text-gray-600 p-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* LinkedIn Content */}
                          <div className="px-4 pb-3">
                            <div className="w-full text-sm leading-relaxed text-gray-900 whitespace-pre-wrap">
                              {generatedText || "Your content will appear here..."}
                            </div>
                          </div>

                          {/* LinkedIn Image */}
                          {getCurrentImage() && (
                            <div className="px-4 pb-3">
                              <img
                                src={getCurrentImage()}
                                alt="Post image"
                                className="w-full h-64 object-cover rounded-lg border"
                              />
                            </div>
                          )}

                          {/* LinkedIn Engagement Stats */}
                          <div className="px-4 py-2 border-t border-gray-100">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <div className="flex -space-x-1">
                                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">👍</span>
                                  </div>
                                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">❤️</span>
                                  </div>
                                  <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">💡</span>
                                  </div>
                                </div>
                                <span className="ml-2">24</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span>8 comments</span>
                                <span>2 reposts</span>
                                <span className={`text-xs ${getCharacterStatus(generatedText, 'linkedin') === 'error' ? 'text-red-500' : getCharacterStatus(generatedText, 'linkedin') === 'warning' ? 'text-yellow-500' : 'text-gray-400'}`}>
                                  {generatedText.length}/3,000
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* LinkedIn Actions */}
                          <div className="px-2 py-1 border-t border-gray-100 bg-gray-50">
                            <div className="flex items-center justify-around">
                              <button className="flex items-center space-x-2 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                </svg>
                                <span className="text-xs font-medium">Like</span>
                              </button>
                              <button className="flex items-center space-x-2 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs font-medium">Comment</span>
                              </button>
                              <button className="flex items-center space-x-2 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                                </svg>
                                <span className="text-xs font-medium">Repost</span>
                              </button>
                              <button className="flex items-center space-x-2 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                </svg>
                                <span className="text-xs font-medium">Send</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {platform === 'twitter' && (
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden max-w-lg mx-auto">
                          {/* Twitter Header */}
                          <div className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                JD
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-1">
                                  <h4 className="font-bold text-gray-900 text-sm">John Doe</h4>
                                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-gray-500 text-sm">@johndoe</span>
                                  <span className="text-gray-400 text-sm">·</span>
                                  <span className="text-gray-500 text-sm">2h</span>
                                </div>

                                {/* Twitter Content */}
                                <div className="mt-3">
                                  <div className="w-full text-sm leading-relaxed text-gray-900 whitespace-pre-wrap">
                                    {generatedText || "Your tweet will appear here..."}
                                  </div>
                                </div>

                                {/* Twitter Image */}
                                {getCurrentImage() && (
                                  <div className="mt-3">
                                    <img
                                      src={getCurrentImage()}
                                      alt="Tweet image"
                                      className="w-full h-64 object-cover rounded-2xl border"
                                    />
                                  </div>
                                )}

                                {/* Character count for Twitter */}
                                <div className="mt-2 text-right">
                                  <span className={`text-xs ${getCharacterStatus(generatedText, 'twitter') === 'error' ? 'text-red-500' : getCharacterStatus(generatedText, 'twitter') === 'warning' ? 'text-yellow-500' : 'text-gray-400'}`}>
                                    {generatedText.length}/280
                                  </span>
                                </div>

                                {/* Twitter Actions */}
                                <div className="flex items-center justify-between mt-4 max-w-xs">
                                  <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs">24</span>
                                  </button>
                                  <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500 hover:bg-green-50 p-2 rounded-full transition-colors">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" />
                                    </svg>
                                    <span className="text-xs">12</span>
                                  </button>
                                  <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs">89</span>
                                  </button>
                                  <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {platform === 'facebook' && (
                        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                          {/* Facebook Header */}
                          <div className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                JD
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-semibold text-gray-900">John Doe</h4>
                                </div>
                                <p className="text-xs text-gray-500">2 hours ago • 🌍</p>
                              </div>
                              <button className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                            </div>

                            {/* Facebook Content */}
                            <div className="mt-3">
                              <div className="w-full text-sm leading-relaxed whitespace-pre-wrap">
                                {generatedText || "Your content will appear here..."}
                              </div>
                            </div>

                            {/* Facebook Image */}
                            {getCurrentImage() && (
                              <div className="mt-3">
                                <img
                                  src={getCurrentImage()}
                                  alt="Facebook post image"
                                  className="w-full h-64 object-cover rounded-lg"
                                />
                              </div>
                            )}
                          </div>

                          {/* Facebook Actions */}
                          <div className="border-t border-gray-200">
                            <div className="flex items-center justify-around py-2">
                              <button className="flex items-center space-x-2 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded flex-1 justify-center">
                                <span className="text-blue-500">👍</span>
                                <span className="text-sm font-medium">Like</span>
                              </button>
                              <button className="flex items-center space-x-2 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded flex-1 justify-center">
                                <span className="text-gray-500">💬</span>
                                <span className="text-sm font-medium">Comment</span>
                              </button>
                              <button className="flex items-center space-x-2 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded flex-1 justify-center">
                                <span className="text-gray-500">📤</span>
                                <span className="text-sm font-medium">Share</span>
                              </button>
                            </div>
                            <div className="px-4 py-2 border-t border-gray-100 text-right">
                              <span className={`text-xs ${getCharacterStatus(generatedText, 'facebook') === 'error' ? 'text-red-500' : getCharacterStatus(generatedText, 'facebook') === 'warning' ? 'text-yellow-500' : 'text-gray-400'}`}>
                                {generatedText.length}/63,206
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {platform === 'instagram' && (
                        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden max-w-sm mx-auto">
                          {/* Instagram Header */}
                          <div className="p-3 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                JD
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">johndoe</h4>
                                <p className="text-xs text-gray-500">Location</p>
                              </div>
                              <button className="text-gray-400">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Instagram Image */}
                          <div className="bg-gray-100 aspect-square flex items-center justify-center">
                            {getCurrentImage() ? (
                              <img
                                src={getCurrentImage()}
                                alt="Post image"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-400 text-sm">📷 Add Image</span>
                            )}
                          </div>

                          {/* Instagram Actions */}
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-4">
                                <button className="text-gray-700">❤️</button>
                                <button className="text-gray-700">💬</button>
                                <button className="text-gray-700">📤</button>
                              </div>
                              <button className="text-gray-700">🔖</button>
                            </div>

                            <div className="text-sm">
                              <p className="font-semibold mb-1">24 likes</p>
                              <div>
                                <span className="font-semibold">johndoe</span>
                                <span className="text-sm ml-1 whitespace-pre-wrap">
                                  {generatedText || "Your caption will appear here..."}
                                </span>
                              </div>
                              <p className="text-gray-500 text-xs mt-1">2 HOURS AGO</p>
                              <div className="mt-2 text-right">
                                <span className={`text-xs ${getCharacterStatus(generatedText, 'instagram') === 'error' ? 'text-red-500' : getCharacterStatus(generatedText, 'instagram') === 'warning' ? 'text-yellow-500' : 'text-gray-400'}`}>
                                  {generatedText.length}/2,200
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {platform === 'reddit' && (
                        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                          {/* Reddit Header */}
                          <div className="p-3 bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <span className="font-semibold">r/SampleSubreddit</span>
                              <span>•</span>
                              <span>Posted by u/johndoe</span>
                              <span>2 hours ago</span>
                            </div>
                          </div>

                          {/* Reddit Content */}
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Post Title</h3>
                            <div className="w-full text-sm leading-relaxed whitespace-pre-wrap">
                              {generatedText || "Your content will appear here..."}
                            </div>

                            {/* Reddit Image */}
                            {getCurrentImage() && (
                              <div className="mt-3">
                                <img
                                  src={getCurrentImage()}
                                  alt="Reddit post image"
                                  className="w-full h-64 object-cover rounded-lg"
                                />
                              </div>
                            )}
                          </div>

                          {/* Reddit Actions */}
                          <div className="px-4 pb-3">
                            <div className="flex items-center space-x-4 text-xs text-gray-600">
                              <div className="flex items-center space-x-1">
                                <button className="text-orange-500">⬆️</button>
                                <span className="font-semibold">24</span>
                                <button className="text-blue-500">⬇️</button>
                              </div>
                              <button className="flex items-center space-x-1">
                                <span>💬</span>
                                <span>8 Comments</span>
                              </button>
                              <button className="flex items-center space-x-1">
                                <span>📤</span>
                                <span>Share</span>
                              </button>
                              <button className="flex items-center space-x-1">
                                <span>🔖</span>
                                <span>Save</span>
                              </button>
                              <span className={`text-xs ${getCharacterStatus(generatedText, 'reddit') === 'error' ? 'text-red-500' : getCharacterStatus(generatedText, 'reddit') === 'warning' ? 'text-yellow-500' : 'text-gray-400'}`}>
                                {generatedText.length}/40,000
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Default preview for other platforms */}
                      {!['linkedin', 'twitter', 'facebook', 'instagram', 'reddit'].includes(platform) && (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-lg mx-auto">
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Content Preview</h4>
                            <div className="w-full text-sm leading-relaxed whitespace-pre-wrap p-3 border border-gray-200 rounded-lg bg-gray-50">
                              {generatedText || "Your content will appear here..."}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Character count and stats */}
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <span className="text-gray-600">
                              <span className="font-medium">{generatedText.length}</span> characters
                            </span>
                            {platform && (
                              <span className={`${getCharacterStatus(generatedText, platform) === 'error' ? 'text-red-600' : getCharacterStatus(generatedText, platform) === 'warning' ? 'text-yellow-600' : 'text-green-600'}`}>
                                {getCharacterLimit(platform) - generatedText.length} remaining
                              </span>
                            )}
                            {platform && (
                              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                                {platform.charAt(0).toUpperCase() + platform.slice(1)} limit: {getCharacterLimit(platform).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                              {platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Platform'} optimized
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Publishing Section */}
                <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Publish Content</h3>

                    {/* Scheduling */}
                    <div className="space-y-4 mb-6">
                      <Label className="text-sm font-medium text-gray-900">Schedule (Optional)</Label>
                      <div className="grid grid-cols-2 gap-3">
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

                    {/* Action Buttons */}
                    <div className="space-y-3">
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
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Wand2,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Image,
  Download,
  ExternalLink
} from "lucide-react";
import { FaReddit } from "react-icons/fa";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSocialMedia } from "@/hooks/useSocialMedia";
import { ensureAuthenticated, authenticatedStorageOperation } from "@/utils/authenticatedRequest";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
  onPostSuccess?: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onOpenSettings, onPostSuccess }) => {
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [selectedContentType, setSelectedContentType] = useState("general");
  const [selectedTargetPlatforms, setSelectedTargetPlatforms] = useState<string[]>([]);
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateImage, setGenerateImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageSource, setImageSource] = useState<'none' | 'generate' | 'upload' | 'url'>('none');
  const [imageUrl, setImageUrl] = useState('');
  const { toast } = useToast();
  const { connections, postToMultiplePlatforms, checkConnectionStatus } = useSocialMedia();

  const platforms = [
    { id: "twitter", name: "Twitter", icon: Twitter, color: "bg-blue-500" },
    { id: "facebook", name: "Facebook", icon: Facebook, color: "bg-blue-600" },
    { id: "instagram", name: "Instagram", icon: Instagram, color: "bg-pink-500" },
    { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "bg-blue-700" },
    { id: "reddit", name: "Reddit", icon: FaReddit, color: "bg-orange-500" },
  ];

  const toneOptions = [
    { id: "professional", name: "Professional", emoji: "💼", description: "Formal and business-like" },
    { id: "casual", name: "Casual", emoji: "😊", description: "Friendly and relaxed" },
    { id: "enthusiastic", name: "Enthusiastic", emoji: "🚀", description: "Energetic and exciting" },
    { id: "informative", name: "Informative", emoji: "📚", description: "Educational and factual" },
    { id: "humorous", name: "Humorous", emoji: "😄", description: "Light-hearted and funny" },
    { id: "inspirational", name: "Inspirational", emoji: "✨", description: "Motivating and uplifting" },
  ];

  const contentTypes = [
    { id: "general", name: "General Post", emoji: "📝", description: "Standard social media post" },
    { id: "announcement", name: "Announcement", emoji: "📢", description: "Important news or updates" },
    { id: "promotion", name: "Promotion", emoji: "🎯", description: "Marketing or promotional content" },
    { id: "educational", name: "Educational", emoji: "🎓", description: "Teaching or how-to content" },
    { id: "behind-scenes", name: "Behind the Scenes", emoji: "🎬", description: "Company culture or process" },
    { id: "user-generated", name: "User Generated", emoji: "👥", description: "Customer stories or testimonials" },
  ];

  const platformLimits = {
    twitter: 280,
    facebook: 63206,
    instagram: 2200,
    linkedin: 3000,
    reddit: 40000,
  };

  const connectedPlatforms = useMemo(() =>
    connections
      .filter(conn => conn.isConnected)
      .map(conn => conn.platform),
    [connections]
  );

  useEffect(() => {
    if (isOpen) {
      console.log('🔄 [CreatePostModal] Modal opened, checking connection status...');
      checkConnectionStatus();
    }
  }, [isOpen, checkConnectionStatus]);

  // Listen for OAuth success messages to refresh connections
  useEffect(() => {
    const handleOAuthSuccess = (event: MessageEvent) => {
      if (event.data?.type === 'oauth_success') {
        console.log('🎉 [CreatePostModal] OAuth success detected, refreshing connections...');
        setTimeout(() => {
          checkConnectionStatus();
        }, 1000); // Small delay to ensure localStorage is updated
      }
    };

    // Listen for localStorage changes (OAuth success flags)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.startsWith('connected_') || event.key?.startsWith('oauth_success_')) {
        console.log('📦 [CreatePostModal] Connection storage updated, refreshing...');
        setTimeout(() => {
          checkConnectionStatus();
        }, 500);
      }
    };

    window.addEventListener('message', handleOAuthSuccess);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('message', handleOAuthSuccess);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkConnectionStatus]);

  // Remove the infinite loop debug - only log when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('📊 [CreatePostModal] Modal opened - Connection status:', {
        connections,
        connectedPlatforms,
        selectedPlatforms
      });
    }
  }, [isOpen]); // Only depend on isOpen, not the arrays that change frequently

  useEffect(() => {
    const connected = connections
      .filter(conn => conn.isConnected)
      .map(conn => conn.platform);
    const newSelectedPlatforms = connected.filter(platform => selectedTargetPlatforms.includes(platform));

    // Only update if the array actually changed to prevent infinite loops
    setSelectedPlatforms(prev => {
      if (JSON.stringify(prev.sort()) !== JSON.stringify(newSelectedPlatforms.sort())) {
        return newSelectedPlatforms;
      }
      return prev;
    });
  }, [connections, selectedTargetPlatforms]);

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

  const cleanAIGeneratedContent = (content: string): string => {
    let cleaned = content.trim();

    // Remove AI instruction phrases at the beginning
    const instructionPatterns = [
      /^(Sure!|Here are|Here's|I'll help|Let me|I can help).*?(\n|:)/i,
      /^(Here are some|Here's some).*?ideas.*?(\n|:)/i,
      /^.*social media content ideas.*?(\n|:)/i,
      /^.*engaging.*content.*?(\n|:)/i,
    ];

    instructionPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '').trim();
    });

    // Remove ending instruction phrases
    const endingPatterns = [
      /\n\n.*customize.*$/i,
      /\n\n.*suggestions.*$/i,
      /Feel free to customize.*$/i,
      /You can customize.*$/i,
      /These are just suggestions.*$/i,
    ];

    endingPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '').trim();
    });

    // If content has numbered list, extract ONLY the first item
    if (cleaned.match(/^\d+\./m)) {
      const lines = cleaned.split('\n');
      let firstPost = '';

      for (const line of lines) {
        if (line.match(/^1\./)) {
          firstPost = line.replace(/^1\.\s*/, '').trim();
          break;
        }
      }

      if (firstPost) {
        cleaned = firstPost;
      }
    }

    // Remove any remaining **Caption:** or **Content:** markers
    cleaned = cleaned.replace(/\*\*(Caption|Content):\*\*/gi, '').trim();

    // Remove ### headers
    cleaned = cleaned.replace(/^###.*$/gm, '').trim();

    // Remove --- separators
    cleaned = cleaned.replace(/^---.*$/gm, '').trim();

    // Clean up multiple newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

    // If still too long for Twitter, truncate smartly
    if (cleaned.length > 280) {
      const truncated = cleaned.substring(0, 277);
      const lastSpace = truncated.lastIndexOf(' ');
      cleaned = (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "...";
    }

    return cleaned;
  };

  // Generate relevant hashtags for Twitter based on content and tone
  const getTwitterHashtags = (content: string, tone: string): string => {
    const contentLower = content.toLowerCase();
    const hashtags: string[] = [];

    // Tone-based hashtags
    const toneHashtags: Record<string, string[]> = {
      'professional': ['#Business', '#Professional', '#Growth'],
      'casual': ['#Community', '#Social', '#Lifestyle'],
      'enthusiastic': ['#Exciting', '#Amazing', '#Success'],
      'informative': ['#Tips', '#Knowledge', '#Education'],
      'humorous': ['#Fun', '#Humor', '#Entertainment']
    };

    // Content-based hashtags
    const contentKeywords: Record<string, string[]> = {
      'marketing': ['#Marketing', '#DigitalMarketing', '#SocialMedia'],
      'business': ['#Business', '#Entrepreneur', '#Startup'],
      'technology': ['#Tech', '#Innovation', '#Digital'],
      'social media': ['#SocialMedia', '#Content', '#Engagement'],
      'ai': ['#AI', '#ArtificialIntelligence', '#Tech'],
      'productivity': ['#Productivity', '#Efficiency', '#WorkSmart'],
      'leadership': ['#Leadership', '#Management', '#Success'],
      'finance': ['#Finance', '#Money', '#Investment'],
      'health': ['#Health', '#Wellness', '#Fitness'],
      'education': ['#Education', '#Learning', '#Knowledge']
    };

    // Add tone-based hashtag
    if (toneHashtags[tone]) {
      hashtags.push(toneHashtags[tone][0]);
    }

    // Add content-based hashtags
    for (const [keyword, tags] of Object.entries(contentKeywords)) {
      if (contentLower.includes(keyword)) {
        hashtags.push(tags[0]);
        if (hashtags.length >= 3) break;
      }
    }

    // Fill with general hashtags if needed
    if (hashtags.length < 2) {
      const generalHashtags = ['#Growth', '#Success', '#Innovation', '#Strategy'];
      for (const tag of generalHashtags) {
        if (!hashtags.includes(tag) && hashtags.length < 3) {
          hashtags.push(tag);
        }
      }
    }

    return hashtags.slice(0, 3).join(' ');
  };

  const generateVariation = (baseContent: string, tone: string): string => {
    const safeContent = baseContent || "Check out this amazing content!";
    
    try {
      const variations: Record<string, string> = {
        professional: safeContent.replace(/!/g, '.').replace(/😊|😄|🚀|✨/g, ''),
        casual: safeContent.replace(/\./g, '!') + ' 😊',
        enthusiastic: safeContent.replace(/\./g, '!') + ' 🚀',
        informative: `Did you know? ${safeContent}`,
        humorous: safeContent + ' 😄',
        inspirational: `✨ ${safeContent} ✨`
      };
      
      return variations[tone] || safeContent;
    } catch (error) {
      console.warn("Error generating variation:", error);
      return safeContent;
    }
  };

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "Describe what you want to create a post about",
        variant: "destructive",
      });
      return;
    }

    if (selectedTargetPlatforms.length === 0) {
      toast({
        title: "Please select platforms",
        description: "Choose at least one platform to generate content for",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      console.log('Attempting to generate content with:', {
        prompt,
        tone: selectedTone,
        contentType: selectedContentType,
        platforms: selectedTargetPlatforms
      });

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt: `Create a single ${selectedTone} social media post about: ${prompt}. ${selectedTargetPlatforms.includes('twitter') ? 'Keep it under 280 characters for Twitter.' : 'Keep it concise and engaging.'} Return ONLY the post content, no instructions or multiple options.`,
          tone: selectedTone,
          contentType: selectedContentType,
          platforms: selectedTargetPlatforms,
          type: 'text',
          maxLength: selectedTargetPlatforms.includes('twitter') ? 280 : 500,
          singlePost: true
        }
      });

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      let generatedContent = data?.content || data?.generatedText || data?.message || "Check out this amazing content!";

      // Clean up AI-generated content - remove instructional text
      generatedContent = cleanAIGeneratedContent(generatedContent);

      // Add hashtags for Twitter if not already present
      if (selectedTargetPlatforms.includes('twitter') && !generatedContent.includes('#')) {
        const hashtags = getTwitterHashtags(prompt, selectedTone);
        const contentWithHashtags = `${generatedContent.trim()} ${hashtags}`;

        // Ensure it fits within Twitter's limit
        if (contentWithHashtags.length <= 280) {
          generatedContent = contentWithHashtags;
        } else {
          // Truncate content to fit with hashtags
          const availableSpace = 280 - hashtags.length - 1; // -1 for space
          const truncatedContent = generatedContent.substring(0, availableSpace).trim();
          generatedContent = `${truncatedContent} ${hashtags}`;
        }
      }

      // Generate variations for all tone options
      const variations = toneOptions.map((tone, index) => {
        let content = index === 0 ? generatedContent : generateVariation(generatedContent, tone.id);

        // Add hashtags to Twitter variations if not present
        if (selectedTargetPlatforms.includes('twitter') && !content.includes('#')) {
          const hashtags = getTwitterHashtags(prompt, tone.id);
          const contentWithHashtags = `${content.trim()} ${hashtags}`;

          if (contentWithHashtags.length <= 280) {
            content = contentWithHashtags;
          } else {
            const availableSpace = 280 - hashtags.length - 1;
            const truncatedContent = content.substring(0, availableSpace).trim();
            content = `${truncatedContent} ${hashtags}`;
          }
        }

        return {
          id: index + 1,
          content,
          style: tone.name,
          tone: tone.id,
          contentType: selectedContentType,
          platforms: selectedTargetPlatforms,
          emoji: tone.emoji,
          image: generatedImage || uploadedImage || (imageUrl.trim() ? imageUrl.trim() : null)
        };
      });

      const validVariations = variations.filter(v => v.content && v.content.trim().length > 0);
      if (validVariations.length === 0) {
        throw new Error("Failed to generate any valid content variations");
      }

      setGeneratedPosts(validVariations);
      setStep(2);

      toast({
        title: "Content generated!",
        description: `Created ${validVariations.length} variations for you to choose from.`,
      });
    } catch (error: any) {
      console.error('Content generation error:', error);

      // Create better fallback content if AI generation fails
      const createFallbackContent = (tone: string) => {
        const basePrompt = prompt.trim();
        const contentTypeEmoji = contentTypes.find(ct => ct.id === selectedContentType)?.emoji || "📝";
        const hasTwitter = selectedTargetPlatforms.includes('twitter');
        const maxLength = hasTwitter ? 240 : 500; // Leave room for hashtags

        let content = '';
        const twitterHashtags = hasTwitter ? getTwitterHashtags(basePrompt, tone) : '';

        switch (tone) {
          case 'professional':
            content = `${contentTypeEmoji} ${basePrompt}\n\nWe're excited to share this with our community. This represents an important step forward.${hasTwitter ? `\n\n${twitterHashtags}` : '\n\n#business #professional'}`;
            break;
          case 'casual':
            content = `Hey everyone! 😊\n\n${basePrompt}\n\nWhat do you think? Let us know in the comments!${hasTwitter ? `\n\n${twitterHashtags}` : '\n\n#community #casual'}`;
            break;
          case 'enthusiastic':
            content = `🚀 AMAZING NEWS! 🚀\n\n${basePrompt}\n\nWe can't contain our excitement about this! 🎉${hasTwitter ? `\n\n${twitterHashtags}` : '\n\n#exciting #amazing'}`;
            break;
          case 'informative':
            content = `📚 ${basePrompt}\n\nKey points:\n• Important information\n• Valuable insights\n• Actionable takeaways${hasTwitter ? `\n\n${twitterHashtags}` : '\n\n#education #knowledge'}`;
            break;
          case 'humorous':
            content = `😄 ${basePrompt}\n\nWell, this is interesting! 🤔 More exciting than watching paint dry!\n\n#humor #funny`;
            break;
          case 'inspirational':
            content = `✨ ${basePrompt} ✨\n\nEvery great journey begins with a single step. Believe in the possibilities!\n\n#inspiration #motivation`;
            break;
          default:
            content = `${contentTypeEmoji} ${basePrompt}\n\nWe're excited to share this update with you. Stay tuned!\n\n#update #news`;
        }

        // Truncate if too long
        if (content.length > maxLength) {
          const truncated = content.substring(0, maxLength - 3);
          const lastSpace = truncated.lastIndexOf(' ');
          content = (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "...";
        }

        return content;
      };

      // Generate better fallback variations
      const fallbackVariations = toneOptions.map((tone, index) => {
        let content = createFallbackContent(tone.id);
        // Apply the same cleanup to fallback content
        content = cleanAIGeneratedContent(content);

        return {
          id: index + 1,
          content,
          style: tone.name,
          tone: tone.id,
          contentType: selectedContentType,
          platforms: selectedTargetPlatforms,
          emoji: tone.emoji,
          image: generatedImage || uploadedImage || (imageUrl.trim() ? imageUrl.trim() : null)
        };
      });

      setGeneratedPosts(fallbackVariations);
      setStep(2);

      toast({
        title: "Content generated successfully!",
        description: `Created ${fallbackVariations.length} content variations using our smart templates. You can edit them as needed.`,
        variant: "default",
      });
    } finally {
      setGenerating(false);
    }
  };

  const selectPost = (post: any) => {
    setSelectedPost(post);
    setStep(3);
  };

  const publishPost = async () => {
    if (!selectedPost) {
      toast({
        title: "No post selected",
        description: "Please select a post to publish",
        variant: "destructive",
      });
      return;
    }

    console.log('Publishing post:', {
      selectedPost,
      selectedPlatforms,
      generatedImage,
      uploadedImage
    });

    setLoading(true);
    try {
      const platformsData = selectedPlatforms.map(platform => ({ platform }));
      const finalImage = selectedPost.image || generatedImage || uploadedImage || (imageUrl.trim() ? imageUrl.trim() : null);

      console.log('🖼️ [CreatePostModal] Image debug info:');
      console.log('🖼️ selectedPost.image:', selectedPost.image);
      console.log('🖼️ generatedImage:', generatedImage);
      console.log('🖼️ uploadedImage:', uploadedImage);
      console.log('🖼️ imageUrl:', imageUrl);
      console.log('🖼️ imageSource:', imageSource);
      console.log('🖼️ finalImage:', finalImage);

      // Check content length and truncate if needed
      const maxLength = platformsData.some(p => p.platform === 'twitter') ? 280 : 3000;
      let contentToPost = selectedPost.content;

      if (contentToPost.length > maxLength) {
        // Truncate at word boundary
        const truncated = contentToPost.substring(0, maxLength - 3);
        const lastSpace = truncated.lastIndexOf(' ');
        contentToPost = (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "...";
      }

      console.log('Calling postToMultiplePlatforms with:', {
        originalLength: selectedPost.content.length,
        truncatedLength: contentToPost.length,
        content: contentToPost,
        platformsData,
        finalImage
      });

      const results = await postToMultiplePlatforms(contentToPost, platformsData, finalImage || undefined);

      console.log('Publishing results:', results);

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      // Show detailed results
      results.forEach(result => {
        if (!result.success) {
          console.error(`Failed to post to ${result.platform}:`, result.error);
        } else {
          console.log(`✅ Successfully posted to ${result.platform}:`, {
            postId: result.postId,
            message: result.message
          });

          // Debug the postId structure
          console.log(`[DEBUG] ${result.platform} postId type:`, typeof result.postId);
          console.log(`[DEBUG] ${result.platform} postId value:`, result.postId);
          console.log(`[DEBUG] ${result.platform} full result:`, result);

          // Check if postId is missing, null, undefined, or empty
          const hasValidPostId = result.postId &&
                                result.postId !== null &&
                                result.postId !== undefined &&
                                result.postId !== '' &&
                                result.postId !== 'null' &&
                                result.postId !== 'undefined';

          if (!hasValidPostId) {
            console.warn(`⚠️ ${result.platform} post succeeded but no valid postId returned. PostId: ${result.postId}. Check your ${result.platform} account to verify.`);
          }
        }
      });

      if (successCount > 0) {
        const successPlatforms = results.filter(r => r.success).map(r => r.platform).join(', ');
        const hasPostIds = results.some(r => r.success && r.postId &&
                                         r.postId !== null &&
                                         r.postId !== undefined &&
                                         r.postId !== '' &&
                                         r.postId !== 'null' &&
                                         r.postId !== 'undefined');

        toast({
          title: "Post published successfully!",
          description: `Published to ${successPlatforms}${failureCount > 0 ? ` (${failureCount} failed)` : ''}${!hasPostIds ? '. Check your accounts to verify.' : ''}`,
        });

        if (onPostSuccess) {
          onPostSuccess();
        }

        handleClose();
      } else {
        // Show specific error messages
        const errorMessages = results.map(r => `${r.platform}: ${r.error}`).join(', ');
        throw new Error(`Failed to publish to any platforms. Errors: ${errorMessages}`);
      }
    } catch (error: any) {
      console.error('Publishing error:', error);
      toast({
        title: "Error publishing post",
        description: error.message || "Failed to publish post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setPrompt("");
    setSelectedTone("professional");
    setSelectedContentType("general");
    setSelectedTargetPlatforms([]);
    setGeneratedPosts([]);
    setSelectedPost(null);
    setSelectedPlatforms([]);
    setGenerateImage(false);
    setGeneratedImage(null);
    setGeneratingImage(false);
    setUploadedImage(null);
    setUploadingImage(false);
    setImageSource('none');
    setImageUrl('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-white border-0 shadow-2xl rounded-3xl">
        {/* Modern Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 rounded-t-3xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {step === 1 && "Create Amazing Content"}
                  {step === 2 && "Choose Your Favorite"}
                  {step === 3 && "Publish & Schedule"}
                </h1>
                <p className="text-white/90 text-sm">
                  {step === 1 && "Let AI create engaging posts for your audience"}
                  {step === 2 && "Select the variation that resonates with you"}
                  {step === 3 && "Choose platforms and schedule your posts"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modern Step Indicator */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-center space-x-8">
            {[
              { num: 1, label: "Create", icon: "✨" },
              { num: 2, label: "Select", icon: "🎯" },
              { num: 3, label: "Publish", icon: "🚀" }
            ].map((stepItem, index) => (
              <div key={stepItem.num} className="flex items-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold transition-all ${
                    step >= stepItem.num
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step >= stepItem.num ? stepItem.icon : stepItem.num}
                  </div>
                  <span className={`text-xs font-medium ${
                    step >= stepItem.num ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                    {stepItem.label}
                  </span>
                </div>
                {index < 2 && (
                  <div className={`w-16 h-1 mx-4 rounded-full transition-all ${
                    step > stepItem.num ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">AI Social Post Generator</h3>
              <p className="text-gray-600">Describe your post and let our AI create engaging content</p>
            </div>

            <div className="space-y-6">
              {/* Content Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Describe your post *</label>
                <Textarea
                  placeholder="Advertisement for a 2 week holiday in Mexico for under $999"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* Platform Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-medium">Target Platforms *</label>
                    <p className="text-xs text-gray-500">
                      Connected: {connectedPlatforms.length} of {platforms.length} platforms
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await checkConnectionStatus();
                    }}
                    className="text-xs"
                  >
                    🔄 Refresh
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {platforms.map((platform) => {
                    const Icon = platform.icon;
                    const isConnected = connectedPlatforms.includes(platform.id);
                    const isSelected = selectedTargetPlatforms.includes(platform.id);

                    return (
                      <div
                        key={platform.id}
                        className={`relative p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                        } ${!isConnected ? 'opacity-50' : ''}`}
                        onClick={() => {
                          if (!isConnected) {
                            if (onOpenSettings) {
                              onOpenSettings();
                              onClose();
                            } else {
                              toast({
                                title: "Platform not connected",
                                description: `Please connect your ${platform.name} account in Settings`,
                                variant: "destructive",
                              });
                            }
                            return;
                          }
                          setSelectedTargetPlatforms(prev =>
                            prev.includes(platform.id)
                              ? prev.filter(p => p !== platform.id)
                              : [...prev, platform.id]
                          );
                        }}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <div className={`p-2 rounded-full ${platform.color}`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium">{platform.name}</span>
                          {!isConnected && (
                            <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-blue-100">
                              Click to Connect
                            </Badge>
                          )}
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="w-5 h-5 gradient-primary rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tone Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Content Tone</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {toneOptions.map((tone) => (
                    <div
                      key={tone.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedTone === tone.id ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTone(tone.id)}
                    >
                      <div className="text-center space-y-1">
                        <div className="text-2xl">{tone.emoji}</div>
                        <div className="font-medium text-sm">{tone.name}</div>
                        <div className="text-xs text-gray-500">{tone.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Content Type</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {contentTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedContentType === type.id ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedContentType(type.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{type.emoji}</div>
                        <div>
                          <div className="font-medium text-sm">{type.name}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Options Section */}
              <div className="border-t pt-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">Image Options</label>
                  <p className="text-xs text-gray-500 mb-4">Add an image to make your posts more engaging</p>

                  {/* Image Source Selection */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <Button
                      variant={imageSource === 'none' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setImageSource('none');
                        setGenerateImage(false);
                        setGeneratedImage(null);
                        setUploadedImage(null);
                        setImageUrl('');
                      }}
                      className="text-xs"
                    >
                      No Image
                    </Button>
                    <Button
                      variant={imageSource === 'generate' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setImageSource('generate');
                        setGenerateImage(true);
                        setUploadedImage(null);
                        setImageUrl('');
                      }}
                      className="text-xs"
                    >
                      🤖 AI Generate
                    </Button>
                    <Button
                      variant={imageSource === 'upload' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setImageSource('upload');
                        setGenerateImage(false);
                        setGeneratedImage(null);
                        setImageUrl('');
                      }}
                      className="text-xs"
                    >
                      📁 Upload
                    </Button>
                    <Button
                      variant={imageSource === 'url' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setImageSource('url');
                        setGenerateImage(false);
                        setGeneratedImage(null);
                        setUploadedImage(null);
                      }}
                      className="text-xs"
                    >
                      🔗 URL
                    </Button>
                  </div>
                </div>

                {/* AI Image Generation */}
                {imageSource === 'generate' && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-2">AI Image Generation</h4>
                    <p className="text-xs text-gray-500 mb-4">Generate a custom image for your post using DALL-E</p>

                    <div className="space-y-4">
                      <Button
                        onClick={generateImageForPost}
                        disabled={generatingImage || !prompt.trim()}
                        variant="outline"
                        className="w-full"
                      >
                        {generatingImage ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            <span>Generating Image...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Wand2 className="w-4 h-4" />
                            <span>Generate AI Image</span>
                          </div>
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
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = generatedImage;
                                link.download = 'generated-image.png';
                                link.click();
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 text-center">
                            ✓ AI image generated successfully
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Manual Image Upload */}
                {imageSource === 'upload' && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-2">Upload Your Own Image</h4>
                    <p className="text-xs text-gray-500 mb-4">Upload your own image to use with your posts</p>

                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
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
                            <Image className="w-8 h-8 text-gray-400" />
                            <div className="text-sm text-gray-600">
                              <span className="font-medium text-purple-600">Click to upload</span> or drag and drop
                            </div>
                            <div className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 5MB
                            </div>
                          </div>
                        </label>
                      </div>

                      {uploadingImage && (
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
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
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 text-center">
                            ✓ Image uploaded successfully
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Image URL Input */}
                {imageSource === 'url' && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-2">Image URL</h4>
                    <p className="text-xs text-gray-500 mb-4">Enter a direct link to an image</p>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <Input
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="flex-1"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const url = imageUrl.trim();
                                if (url) {
                                  try {
                                    new URL(url);
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
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={generateContent}
                  disabled={generating || !prompt.trim() || selectedTargetPlatforms.length === 0}
                  className="w-full btn-primary"
                >
                  {generating ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating amazing content...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Wand2 className="w-4 h-4" />
                      <span>Generate Posts</span>
                    </div>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    // Create a simple manual post
                    const manualPost = {
                      id: 1,
                      content: prompt || "Your content here...",
                      style: "Manual",
                      tone: selectedTone,
                      contentType: selectedContentType,
                      platforms: selectedTargetPlatforms,
                      emoji: "✏️",
                      image: generatedImage || uploadedImage || (imageUrl.trim() ? imageUrl.trim() : null)
                    };
                    setGeneratedPosts([manualPost]);
                    setStep(2);
                  }}
                  disabled={!prompt.trim() || selectedTargetPlatforms.length === 0}
                  className="w-full"
                >
                  <div className="flex items-center space-x-2">
                    <span>✏️</span>
                    <span>Skip AI - Use Manual Content</span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Choose Your Favorite</h3>
              <p className="text-gray-500">Select the post variation you like best</p>
            </div>

            {generatedPosts.length === 0 ? (
              <div className="text-center space-y-4">
                <div className="text-gray-500">
                  <p>No post variations were generated.</p>
                  <p className="text-sm">This might be due to a content generation error.</p>
                </div>
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Go Back and Try Again
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {generatedPosts.map((post) => (
                <Card key={post.id} className="cursor-pointer hover:shadow-lg hover:border-purple-200 transition-all duration-200 border-2" onClick={() => selectPost(post)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                          <span className="text-xl">{post.emoji}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-base text-gray-800">{post.style} Style</span>
                          <p className="text-xs text-gray-500">Click to select this variation</p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                        Select This
                      </Button>
                    </div>

                    {/* Image Preview */}
                    {post.image && (
                      <div className="mb-4">
                        <img
                          src={post.image}
                          alt="Post image"
                          className="w-full h-40 object-cover rounded-lg border shadow-sm"
                        />
                      </div>
                    )}

                    {/* Content Preview */}
                    <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {post.content || "Content not available"}
                      </div>
                    </div>

                    {/* Platform-specific character counts */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {selectedTargetPlatforms.map(platformId => {
                          const limit = platformLimits[platformId as keyof typeof platformLimits] || 280;
                          const contentLength = (post.content || "").length;
                          const isOverLimit = contentLength > limit;
                          const platform = platforms.find(p => p.id === platformId);

                          // Calculate how much over the limit we are
                          const overBy = Math.max(0, contentLength - limit);

                          return (
                            <div key={platformId} className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs border ${
                              isOverLimit ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'
                            }`}>
                              {platform && <platform.icon className="w-3 h-3" />}
                              <span className="font-medium">{platform?.name}</span>
                              <span className={`font-mono ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
                                {contentLength}/{limit}
                              </span>
                              {isOverLimit && (
                                <span className="text-red-500 font-medium" title={`${overBy} characters over limit`}>
                                  ⚠️ -{overBy}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}

            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Ready to Publish</h3>
              <p className="text-gray-500">Select which platforms to publish to</p>
            </div>

            {selectedPost && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg">{selectedPost.emoji}</span>
                    <span className="font-medium">{selectedPost.style} Style</span>
                  </div>

                  {/* Image Preview */}
                  {(selectedPost.image || generatedImage || uploadedImage || (imageUrl.trim() ? imageUrl.trim() : null)) && (
                    <div className="mb-3">
                      <img
                        src={selectedPost.image || generatedImage || uploadedImage || imageUrl.trim()}
                        alt="Post image"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedPost.content}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Image Status Indicator */}
            {(selectedPost?.image || generatedImage || uploadedImage || (imageUrl.trim() ? imageUrl.trim() : null)) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Image className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {generatedImage ? 'AI-generated image' : uploadedImage ? 'Uploaded image' : imageUrl.trim() ? 'Image from URL' : 'Image'} will be included with your posts
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-3">Select Platforms to Publish</label>
              {connectedPlatforms.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No platforms connected. Please go to Settings to connect your social media accounts first.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {platforms
                  .filter(platform => connectedPlatforms.includes(platform.id))
                  .map((platform) => {
                    const Icon = platform.icon;
                    const isSelected = selectedPlatforms.includes(platform.id);

                    return (
                      <div
                        key={platform.id}
                        className={`relative p-3 border rounded-lg cursor-pointer transition-all ${
                          isSelected ? 'border-purple-300 bg-purple-50 ring-2 ring-purple-200' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedPlatforms(prev =>
                            prev.includes(platform.id)
                              ? prev.filter(p => p !== platform.id)
                              : [...prev, platform.id]
                          );
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${platform.color}`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium">{platform.name}</span>
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={publishPost}
                disabled={loading || selectedPlatforms.length === 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Publishing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Publish to {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;

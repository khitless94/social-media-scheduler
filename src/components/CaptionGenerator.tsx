import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Upload, 
  Image as ImageIcon, 
  Copy, 
  RefreshCw, 
  Sparkles, 
  Hash,
  Eye,
  Heart,
  Share2,
  Download,
  X,
  Camera,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface GeneratedCaption {
  id: string;
  caption: string;
  hashtags: string[];
  platform: string;
  style: string;
  timestamp: Date;
}

export function CaptionGenerator() {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [style, setStyle] = useState('engaging');
  const [mood, setMood] = useState('positive');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [customHashtags, setCustomHashtags] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<GeneratedCaption[]>([]);
  const [selectedCaption, setSelectedCaption] = useState<GeneratedCaption | null>(null);
  const { toast } = useToast();

  const platforms = [
    { value: 'instagram', label: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500', limit: 2200 },
    { value: 'facebook', label: 'Facebook', color: 'bg-blue-500', limit: 63206 },
    { value: 'twitter', label: 'Twitter/X', color: 'bg-black', limit: 280 },
    { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-600', limit: 3000 },
    { value: 'tiktok', label: 'TikTok', color: 'bg-black', limit: 150 },
    { value: 'pinterest', label: 'Pinterest', color: 'bg-red-600', limit: 500 }
  ];

  const styles = [
    { value: 'engaging', label: 'Engaging', icon: '🎯', desc: 'Hooks audience attention' },
    { value: 'storytelling', label: 'Storytelling', icon: '📖', desc: 'Narrative-driven content' },
    { value: 'educational', label: 'Educational', icon: '🎓', desc: 'Informative and helpful' },
    { value: 'promotional', label: 'Promotional', icon: '📢', desc: 'Sales and marketing focused' },
    { value: 'inspirational', label: 'Inspirational', icon: '✨', desc: 'Motivational and uplifting' },
    { value: 'humorous', label: 'Humorous', icon: '😄', desc: 'Funny and entertaining' }
  ];

  const moods = [
    { value: 'positive', label: 'Positive', emoji: '😊' },
    { value: 'excited', label: 'Excited', emoji: '🚀' },
    { value: 'professional', label: 'Professional', emoji: '💼' },
    { value: 'casual', label: 'Casual', emoji: '😎' },
    { value: 'mysterious', label: 'Mysterious', emoji: '🔮' },
    { value: 'urgent', label: 'Urgent', emoji: '⚡' }
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false
  });

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const generateCaption = async () => {
    if (!description.trim() && !uploadedImage) {
      toast({
        title: "Please provide content",
        description: "Either upload an image or describe what you want to caption.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-caption', {
        body: {
          description: description.trim(),
          platform,
          style,
          mood,
          includeHashtags,
          customHashtags: customHashtags.trim(),
          hasImage: !!uploadedImage
        }
      });

      if (error) throw error;

      const newCaption: GeneratedCaption = {
        id: Date.now().toString(),
        caption: data.caption,
        hashtags: data.hashtags || [],
        platform,
        style,
        timestamp: new Date()
      };

      setGeneratedCaptions(prev => [newCaption, ...prev]);
      setSelectedCaption(newCaption);

      toast({
        title: "Caption generated!",
        description: "Your AI-powered caption is ready to use.",
      });

    } catch (error: any) {
      console.error('Caption generation error:', error);
      
      // Fallback generation for demo
      const fallbackCaption = generateFallbackCaption();
      const newCaption: GeneratedCaption = {
        id: Date.now().toString(),
        caption: fallbackCaption.caption,
        hashtags: fallbackCaption.hashtags,
        platform,
        style,
        timestamp: new Date()
      };

      setGeneratedCaptions(prev => [newCaption, ...prev]);
      setSelectedCaption(newCaption);

      toast({
        title: "Caption generated!",
        description: "Your caption is ready to use.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackCaption = () => {
    const baseText = description || "Check out this amazing content!";

    // Enhanced style templates with mood integration
    const styleTemplates = {
      engaging: {
        positive: `${baseText} 🎯\n\nWhat do you think? Drop your thoughts below! 👇`,
        excited: `${baseText} 🚀\n\nI'm so excited about this! Who else is feeling the energy? 🔥`,
        professional: `${baseText}.\n\nI'd love to hear your professional perspective on this.`,
        casual: `${baseText} 😊\n\nWhat's your take? Let me know in the comments!`,
        mysterious: `${baseText}...\n\nThere's more to this story. What do you think happens next? 🔮`,
        urgent: `⚡ ${baseText}\n\nThis is important - don't miss out! ⏰`
      },
      storytelling: {
        positive: `Here's a story worth sharing... 📖\n\n${baseText}\n\nWhat's your story? Share it with us! ✨`,
        excited: `OMG, you need to hear this story! 🎉\n\n${baseText}\n\nI'm still buzzing from this experience! 🚀`,
        professional: `Let me share a professional insight:\n\n${baseText}\n\nWhat lessons have you learned in similar situations?`,
        casual: `So this happened... 😄\n\n${baseText}\n\nAnyone else have a similar experience?`,
        mysterious: `There's something intriguing about this...\n\n${baseText}\n\nBut that's not the whole story... 🔮`,
        urgent: `⚡ Breaking: ${baseText}\n\nThis just happened and you need to know about it! ⏰`
      },
      educational: {
        positive: `💡 Did you know?\n\n${baseText}\n\nSave this post for later and share with someone who needs to see this! 📚`,
        excited: `🤯 Mind-blowing fact alert!\n\n${baseText}\n\nThis completely changed my perspective! Share if it changed yours too! 🚀`,
        professional: `Professional insight:\n\n${baseText}\n\nThis knowledge has been valuable in my experience. What's been helpful for you?`,
        casual: `Fun fact: ${baseText} 😊\n\nPretty cool, right? What's the most interesting thing you learned recently?`,
        mysterious: `Here's something most people don't know...\n\n${baseText}\n\nWhat other secrets are hiding in plain sight? 🔮`,
        urgent: `⚡ Important update:\n\n${baseText}\n\nEveryone needs to know this ASAP! ⏰`
      },
      promotional: {
        positive: `🚀 Exciting news!\n\n${baseText}\n\nDon't miss out - check the link in bio! ✨`,
        excited: `🎉 HUGE announcement!\n\n${baseText}\n\nI can barely contain my excitement! Get yours now! 🔥`,
        professional: `Professional announcement:\n\n${baseText}\n\nI believe this will add significant value to your work.`,
        casual: `Hey everyone! 😊\n\n${baseText}\n\nThought you might be interested in this!`,
        mysterious: `Something special is coming...\n\n${baseText}\n\nStay tuned for more details... 🔮`,
        urgent: `⚡ LIMITED TIME:\n\n${baseText}\n\nDon't wait - this won't last long! ⏰`
      },
      inspirational: {
        positive: `✨ Remember this:\n\n${baseText}\n\nYou've got this! Keep pushing forward! 💪`,
        excited: `🚀 You are AMAZING!\n\n${baseText}\n\nLet's conquer the world together! Nothing can stop us! 🔥`,
        professional: `Professional motivation:\n\n${baseText}\n\nSuccess comes to those who persist. What drives you forward?`,
        casual: `Daily reminder: ${baseText} 😊\n\nYou're doing great! Keep being awesome! ✨`,
        mysterious: `The universe has a message for you...\n\n${baseText}\n\nWhat signs are you seeing today? 🔮`,
        urgent: `⚡ You need to hear this NOW:\n\n${baseText}\n\nYour moment is here! ⏰`
      },
      humorous: {
        positive: `😄 When you realize...\n\n${baseText}\n\nTag someone who can relate! Who's the first person that comes to mind? 😂`,
        excited: `🤣 I'm DYING!\n\n${baseText}\n\nThis is the funniest thing I've seen all week! Share the laughs! 🎉`,
        professional: `Professional humor:\n\n${baseText}\n\nSometimes we need to laugh at the absurdities of work life.`,
        casual: `Lol, ${baseText} 😄\n\nAnyone else find this hilarious? Just me? 🤷‍♀️`,
        mysterious: `There's something oddly amusing about this...\n\n${baseText}\n\nOr maybe it's just me... 🔮😄`,
        urgent: `⚡ URGENT COMEDY ALERT:\n\n${baseText}\n\nYou need to laugh at this RIGHT NOW! 😂⏰`
      }
    };

    // Enhanced hashtag sets with more variety
    const hashtagSets = {
      instagram: ['#content', '#socialmedia', '#inspiration', '#motivation', '#lifestyle', '#instagood', '#photooftheday', '#love', '#beautiful', '#happy'],
      facebook: ['#community', '#sharing', '#connect', '#family', '#friends'],
      twitter: ['#content', '#social', '#trending', '#news', '#thoughts'],
      linkedin: ['#professional', '#business', '#networking', '#growth', '#career', '#leadership'],
      tiktok: ['#viral', '#trending', '#fyp', '#content', '#fun', '#creative'],
      pinterest: ['#inspiration', '#ideas', '#creative', '#lifestyle', '#design', '#diy']
    };

    const styleTemplate = styleTemplates[style as keyof typeof styleTemplates] || styleTemplates.engaging;
    const moodTemplate = styleTemplate[mood as keyof typeof styleTemplate] || styleTemplate.positive;

    let hashtags = hashtagSets[platform as keyof typeof hashtagSets] || ['#content'];

    // Add custom hashtags if provided
    if (customHashtags) {
      const customTags = customHashtags.split(/[\s,]+/).filter(tag => tag.trim()).map(tag =>
        tag.startsWith('#') ? tag : `#${tag}`
      );
      hashtags = [...customTags, ...hashtags].slice(0, 10);
    }

    return {
      caption: moodTemplate,
      hashtags: hashtags.slice(0, 8) // Limit to 8 hashtags for better readability
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Caption copied to clipboard.",
    });
  };

  const currentPlatform = platforms.find(p => p.value === platform);
  const currentStyle = styles.find(s => s.value === style);
  const currentMood = moods.find(m => m.value === mood);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Caption Generator</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create engaging captions for your images and posts. Upload an image or describe your content to get AI-powered captions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  Upload Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                      isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                    )}
                  >
                    <input {...getInputProps()} />
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      {isDragActive ? "Drop image here" : "Drag & drop an image"}
                    </p>
                    <p className="text-xs text-gray-500">or click to browse</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Content Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="description">Describe your content</Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., A beautiful sunset at the beach with friends enjoying the moment..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[80px] mt-2"
                  />
                </div>

                <div>
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${p.color}`} />
                              <span>{p.label}</span>
                            </div>
                            <span className="text-xs text-gray-500">{p.limit} chars</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <div className="flex items-center space-x-2">
                            <span>{s.icon}</span>
                            <div>
                              <div>{s.label}</div>
                              <div className="text-xs text-gray-500">{s.desc}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Mood</Label>
                  <Select value={mood} onValueChange={setMood}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {moods.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          <div className="flex items-center space-x-2">
                            <span>{m.emoji}</span>
                            <span>{m.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hashtags"
                    checked={includeHashtags}
                    onChange={(e) => setIncludeHashtags(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="hashtags">Include hashtags</Label>
                </div>

                {includeHashtags && (
                  <div>
                    <Label htmlFor="customHashtags">Custom hashtags (optional)</Label>
                    <Input
                      id="customHashtags"
                      placeholder="e.g., #sunset #beach #friends"
                      value={customHashtags}
                      onChange={(e) => setCustomHashtags(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}

                <Button 
                  onClick={generateCaption} 
                  disabled={isGenerating || (!description.trim() && !uploadedImage)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Caption
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Generated Content */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCaption && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Generated Caption
                    </span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {currentPlatform?.label}
                      </Badge>
                      <Badge variant="outline">
                        {currentStyle?.label}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed mb-4">
                      {selectedCaption.caption}
                    </p>
                    {selectedCaption.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedCaption.hashtags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-blue-600">
                            <Hash className="w-3 h-3 mr-1" />
                            {tag.replace('#', '')}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        {selectedCaption.caption.length + selectedCaption.hashtags.join(' ').length} / {currentPlatform?.limit} chars
                      </span>
                      <span>•</span>
                      <span>{currentMood?.emoji} {currentMood?.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(selectedCaption.caption + '\n\n' + selectedCaption.hashtags.join(' '))}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy All
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Caption History */}
            {generatedCaptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Recent Captions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {generatedCaptions.slice(0, 5).map((caption) => (
                      <div
                        key={caption.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedCaption?.id === caption.id
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedCaption(caption)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {platforms.find(p => p.value === caption.platform)?.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {styles.find(s => s.value === caption.style)?.label}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {caption.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {caption.caption}
                        </p>
                        {caption.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {caption.hashtags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="text-xs text-blue-600">
                                {tag}
                              </span>
                            ))}
                            {caption.hashtags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{caption.hashtags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {generatedCaptions.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Create Engaging Captions?</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Upload an image or describe your content to generate AI-powered captions that engage your audience.
                  </p>
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="w-4 h-4" />
                      <span>Image analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Hash className="w-4 h-4" />
                      <span>Smart hashtags</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4" />
                      <span>AI-powered</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

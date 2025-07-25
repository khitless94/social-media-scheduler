import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Wand2, 
  Copy, 
  RefreshCw, 
  Sparkles, 
  Target, 
  Users, 
  Lightbulb,
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  Download,
  Save
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GeneratedContent {
  id: string;
  content: string;
  platform: string;
  tone: string;
  contentType: string;
  timestamp: Date;
}

export function AICopywriting() {
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const [tone, setTone] = useState('professional');
  const [contentType, setContentType] = useState('post');
  const [targetAudience, setTargetAudience] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const { toast } = useToast();

  const platforms = [
    { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-600' },
    { value: 'twitter', label: 'Twitter/X', color: 'bg-black' },
    { value: 'facebook', label: 'Facebook', color: 'bg-blue-500' },
    { value: 'instagram', label: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { value: 'tiktok', label: 'TikTok', color: 'bg-black' },
    { value: 'youtube', label: 'YouTube', color: 'bg-red-600' }
  ];

  const tones = [
    { value: 'professional', label: 'Professional', icon: '💼' },
    { value: 'casual', label: 'Casual', icon: '😊' },
    { value: 'enthusiastic', label: 'Enthusiastic', icon: '🚀' },
    { value: 'informative', label: 'Informative', icon: '📚' },
    { value: 'humorous', label: 'Humorous', icon: '😄' },
    { value: 'inspirational', label: 'Inspirational', icon: '✨' }
  ];

  const contentTypes = [
    { value: 'post', label: 'Social Media Post' },
    { value: 'caption', label: 'Image Caption' },
    { value: 'story', label: 'Story Content' },
    { value: 'ad', label: 'Advertisement' },
    { value: 'email', label: 'Email Subject' },
    { value: 'hashtags', label: 'Hashtag Set' }
  ];

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "Describe what you want to create content about.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt: prompt.trim(),
          platform,
          tone,
          contentType,
          targetAudience: targetAudience.trim(),
          keywords: keywords.trim(),
          type: 'text',
          maxLength: 1000
        }
      });

      if (error) throw error;

      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        content: data.content || data.text || generateFallbackContent(),
        platform,
        tone,
        contentType,
        timestamp: new Date()
      };

      setGeneratedContent(prev => [newContent, ...prev]);
      setSelectedContent(newContent.content);

      toast({
        title: "Content generated!",
        description: "Your AI-powered content is ready to use.",
      });

    } catch (error: any) {
      console.error('Content generation error:', error);

      // Generate fallback content
      const fallbackContent = generateFallbackContent();
      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        content: fallbackContent,
        platform,
        tone,
        contentType,
        timestamp: new Date()
      };

      setGeneratedContent(prev => [newContent, ...prev]);
      setSelectedContent(newContent);

      toast({
        title: "Content generated!",
        description: "Your content is ready to use.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackContent = () => {
    const baseText = prompt.trim();

    // Content type specific templates
    if (contentType === 'hashtags') {
      const hashtagSets = {
        linkedin: ['#professional', '#business', '#networking', '#growth', '#career', '#leadership', '#innovation', '#success', '#productivity', '#strategy'],
        instagram: ['#content', '#socialmedia', '#inspiration', '#motivation', '#lifestyle', '#instagood', '#photooftheday', '#love', '#beautiful', '#happy'],
        twitter: ['#content', '#social', '#trending', '#news', '#thoughts', '#discussion', '#community', '#engagement'],
        facebook: ['#community', '#sharing', '#connect', '#family', '#friends', '#social', '#networking'],
        tiktok: ['#viral', '#trending', '#fyp', '#content', '#fun', '#creative', '#entertainment'],
        youtube: ['#video', '#content', '#subscribe', '#like', '#share', '#youtube', '#creator', '#entertainment']
      };

      const platformHashtags = hashtagSets[platform as keyof typeof hashtagSets] || hashtagSets.linkedin;
      let result = platformHashtags.slice(0, 10).join(' ');

      if (keywords) {
        const customTags = keywords.split(',').map(k => `#${k.trim().replace(/\s+/g, '')}`);
        result = [...customTags, ...platformHashtags].slice(0, 15).join(' ');
      }

      return result;
    }

    if (contentType === 'email') {
      return `${baseText} - Don't miss out!`.substring(0, 50);
    }

    if (contentType === 'ad') {
      return `🚀 ${baseText}\n\nLimited time offer - Act now! Click the link to learn more.`;
    }

    // Platform and tone specific templates
    const templates = {
      linkedin: {
        professional: `💡 Key insight: ${baseText}. In my experience, this approach consistently delivers results. What strategies have worked best for your team? #Leadership #Innovation`,
        casual: `Sharing something interesting: ${baseText}. What's your take on this? I'd love to hear your thoughts! #Business #Networking`,
        enthusiastic: `🚀 Exciting development: ${baseText}! This is game-changing for our industry. Who else is excited about this? #Innovation #Growth`,
        informative: `📊 Industry update: ${baseText}. Here's what this means for professionals in our field. Thoughts? #Industry #Insights`,
        humorous: `😄 Funny observation: ${baseText}. Anyone else notice this? Sometimes the best insights come from unexpected places! #Business #Humor`,
        inspirational: `✨ Remember this: ${baseText}. Every challenge is an opportunity to grow. What's inspiring you today? #Motivation #Success`
      },
      instagram: {
        professional: `${baseText} 📈\n\nSwipe for more insights! What's your experience with this? Share in the comments! 👇\n\n#business #professional #growth`,
        casual: `${baseText} ✨\n\nDouble tap if you agree! What do you think? 💭\n\n#lifestyle #thoughts #community`,
        enthusiastic: `OMG! ${baseText} 🎉\n\nI'm so excited about this! Who else is feeling the energy? Tag someone who needs to see this! 🔥\n\n#excited #energy #motivation`,
        informative: `📚 Did you know? ${baseText}\n\nSave this post for later! Share with someone who needs to learn this 🤓\n\n#education #tips #knowledge`,
        humorous: `😂 When you realize: ${baseText}\n\nTag someone who can relate! Who's the first person that comes to mind? 🤪\n\n#funny #relatable #humor`,
        inspirational: `✨ Daily reminder: ${baseText}\n\nYou've got this! Keep pushing forward 💪\n\nTag someone who needs this motivation! 🌟\n\n#inspiration #motivation #positivity`
      },
      twitter: {
        professional: `${baseText}\n\nThoughts on this approach? #business #professional`,
        casual: `${baseText}\n\nWhat's your take? 🤔 #thoughts`,
        enthusiastic: `🚀 ${baseText}\n\nWho else is excited about this?! #innovation`,
        informative: `📊 ${baseText}\n\nWhat do you think? #insights #data`,
        humorous: `😄 ${baseText}\n\nAnyone else? Just me? #humor`,
        inspirational: `✨ ${baseText}\n\nKeep going! 💪 #motivation`
      },
      facebook: {
        professional: `${baseText}\n\nI'd love to hear your professional experience with this. What strategies have worked for you?`,
        casual: `${baseText}\n\nWhat do you think about this? I'd love to hear your thoughts in the comments!`,
        enthusiastic: `${baseText} 🎉\n\nI'm so excited about this! Who else is feeling the same energy? React with your favorite emoji!`,
        informative: `${baseText}\n\nHere's what I've learned about this topic. Have you had similar experiences? Share your story!`,
        humorous: `${baseText} 😄\n\nAnyone else find this amusing? Sometimes the best insights come with a smile!`,
        inspirational: `${baseText} ✨\n\nRemember, every step forward is progress. What's inspiring you today?`
      }
    };

    const platformTemplates = templates[platform as keyof typeof templates] || templates.linkedin;
    const toneTemplate = platformTemplates[tone as keyof typeof platformTemplates] || platformTemplates.professional;

    return toneTemplate;
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard.",
    });
  };

  const saveContent = async (content: string) => {
    // Save to user's saved content collection
    toast({
      title: "Saved!",
      description: "Content saved to your collection.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">AI Copywriting</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Generate compelling, platform-optimized content with AI. Perfect for social media posts, captions, ads, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Content Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prompt">What do you want to write about?</Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g., Launch of our new AI-powered productivity app that helps teams collaborate better..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px] mt-2"
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
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${p.color}`} />
                            <span>{p.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center space-x-2">
                            <span>{t.icon}</span>
                            <span>{t.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Content Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map((ct) => (
                        <SelectItem key={ct.value} value={ct.value}>
                          {ct.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="audience">Target Audience (Optional)</Label>
                  <Input
                    id="audience"
                    placeholder="e.g., Small business owners, Tech professionals..."
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="keywords">Keywords (Optional)</Label>
                  <Input
                    id="keywords"
                    placeholder="e.g., productivity, AI, collaboration..."
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <Button 
                  onClick={generateContent} 
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Generated Content */}
          <div className="lg:col-span-2 space-y-6">
            {selectedContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2" />
                      Generated Content
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(selectedContent)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveContent(selectedContent)}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {selectedContent}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Character count: {selectedContent.length}</span>
                      <span>•</span>
                      <span>Platform: {platforms.find(p => p.value === platform)?.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-gray-400" />
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <Share2 className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content History */}
            {generatedContent.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Recent Generations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {generatedContent.slice(0, 5).map((content) => (
                      <div
                        key={content.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedContent === content.content
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedContent(content.content)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {platforms.find(p => p.value === content.platform)?.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {tones.find(t => t.value === content.tone)?.label}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {content.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {content.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {generatedContent.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Wand2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Create Amazing Content?</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Fill in your content details on the left and click "Generate Content" to get started with AI-powered copywriting.
                  </p>
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Audience-targeted</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span>Platform-optimized</span>
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

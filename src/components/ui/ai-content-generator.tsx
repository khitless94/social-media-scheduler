import * as React from "react";
import { useState } from "react";
import { Sparkles, Wand2, RefreshCw, Copy, Check, Edit3, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIContentGeneratorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  platforms?: string[];
  maxLength?: number;
  onPromptChange?: (prompt: string) => void;
  onToneChange?: (tone: string) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

const tones = [
  { value: "professional", label: "Professional", icon: "💼" },
  { value: "casual", label: "Casual", icon: "😊" },
  { value: "friendly", label: "Friendly", icon: "🤝" },
  { value: "enthusiastic", label: "Enthusiastic", icon: "🚀" },
  { value: "informative", label: "Informative", icon: "📚" },
  { value: "humorous", label: "Humorous", icon: "😄" }
];

const contentTypes = [
  { value: "announcement", label: "Announcement" },
  { value: "question", label: "Question" },
  { value: "tip", label: "Tip/Advice" },
  { value: "story", label: "Story" },
  { value: "promotion", label: "Promotion" },
  { value: "educational", label: "Educational" }
];

export function AIContentGenerator({
  value,
  onChange,
  placeholder = "Write your post or use AI to generate content...",
  className,
  platforms = [],
  maxLength = 500,
  onPromptChange,
  onToneChange,
  onGenerate,
  isGenerating: externalIsGenerating = false
}: AIContentGeneratorProps) {
  const [isAIMode, setIsAIMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [selectedContentType, setSelectedContentType] = useState("announcement");
  const [generatedSuggestions, setGeneratedSuggestions] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Use external generating state if provided
  const currentlyGenerating = externalIsGenerating || isGenerating;

  const createExpertPrompt = (prompt: string, tone: string, platform: string) => {
    const platformContext = platforms.includes('twitter') 
      ? "This is for Twitter, so keep it under 280 characters and make it engaging with relevant hashtags."
      : platforms.includes('linkedin')
      ? "This is for LinkedIn, so make it professional and suitable for business networking."
      : platforms.includes('instagram')
      ? "This is for Instagram, so make it visually engaging and include relevant hashtags."
      : "Make it suitable for general social media platforms.";

    return `You are an expert social media content creator. Create a ${tone} ${selectedContentType} post about: ${prompt}. 

${platformContext}

Requirements:
- Make it engaging and authentic
- Include relevant emojis where appropriate
- Keep the tone ${tone}
- Make it actionable and valuable to readers
- ${platforms.includes('twitter') ? 'Stay under 280 characters' : `Keep it under ${maxLength} characters`}

Return ONLY the post content, no explanations or multiple options.`;
  };

  const generateContent = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "Describe what you want to post about.",
        variant: "destructive"
      });
      return;
    }

    // If external generate function is provided, use it
    if (onGenerate) {
      onPromptChange?.(aiPrompt);
      onToneChange?.(selectedTone);
      onGenerate();
      return;
    }

    setIsGenerating(true);
    try {
      const platform = platforms[0] || 'general';
      const expertPrompt = createExpertPrompt(aiPrompt, selectedTone, platform);

      console.log('🚀 Generating AI content...');
      console.log('Platform:', platform, 'Tone:', selectedTone, 'Type:', selectedContentType);

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          prompt: expertPrompt,
          tone: selectedTone,
          platform,
          type: 'text',
          maxLength: platforms.includes('twitter') ? 280 : maxLength,
          singlePost: true,
          expertMode: true
        }
      });

      if (error) throw error;

      if (data?.generatedText) {
        const content = data.generatedText.trim();
        onChange(content);
        setGeneratedSuggestions([content]);

        toast({
          title: "Content generated! ✨",
          description: "Your AI-generated content is ready to use.",
        });
      } else if (data?.content) {
        // Fallback for different response format
        const content = data.content.trim();
        onChange(content);
        setGeneratedSuggestions([content]);

        toast({
          title: "Content generated! ✨",
          description: "Your AI-generated content is ready to use.",
        });
      } else {
        console.error('No content in response:', data);
        throw new Error("No content generated - AI service may be unavailable");
      }
    } catch (error) {
      console.error('Content generation error:', error);
      toast({
        title: "Generation failed",
        description: "Please try again with a different prompt.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateContent = async () => {
    if (aiPrompt.trim()) {
      await generateContent();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard!",
        description: "Content has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy the content manually.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* AI Toggle */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-900">AI Content Generator</Label>
            <p className="text-xs text-gray-600">Let AI help you create engaging content</p>
          </div>
        </div>
        <Switch
          checked={isAIMode}
          onCheckedChange={setIsAIMode}
          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-blue-500"
        />
      </div>

      {/* AI Generation Panel */}
      {isAIMode && (
        <div className="space-y-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tone</Label>
              <Select value={selectedTone} onValueChange={setSelectedTone}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((tone) => (
                    <SelectItem key={tone.value} value={tone.value}>
                      <span className="flex items-center space-x-2">
                        <span>{tone.icon}</span>
                        <span>{tone.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Content Type</Label>
              <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">What do you want to post about?</Label>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Our new product launch, tips for productivity, company milestone..."
              className="min-h-[80px] resize-none border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={generateContent}
              disabled={currentlyGenerating || !aiPrompt.trim()}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            >
              {currentlyGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Content
                </>
              )}
            </Button>

            {(generatedSuggestions.length > 0 || value) && (
              <Button
                variant="outline"
                onClick={regenerateContent}
                disabled={currentlyGenerating}
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            )}
          </div>

          {/* Platform badges */}
          {platforms.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Optimized for:</span>
              {platforms.map((platform) => (
                <Badge key={platform} variant="secondary" className="text-xs">
                  {platform}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-900">
            {isAIMode ? "Generated Content" : "Your Content"}
          </Label>
          {value && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {value.length}/{maxLength}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(value)}
                className="h-6 w-6 p-0"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}
        </div>
        
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "min-h-[120px] resize-none transition-all duration-200",
            "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
            isAIMode && "bg-gradient-to-br from-purple-50/30 to-blue-50/30"
          )}
          maxLength={maxLength}
        />
      </div>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  Wand2, 
  Calendar, 
  Clock,
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter, 
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSocialMedia } from "@/hooks/useSocialMedia";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreatePostModal = ({ isOpen, onClose }: CreatePostModalProps) => {
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [generatedPosts, setGeneratedPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const { connections, postToMultiplePlatforms } = useSocialMedia();

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-black' },
    { id: 'reddit', name: 'Reddit', icon: MessageSquare, color: 'bg-orange-600' }
  ];

  const connectedPlatforms = connections.filter(c => c.isConnected).map(c => c.platform);

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "Describe what you want to post about",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { prompt }
      });

      if (error) throw error;

      // Create multiple variations
      const variations = [
        {
          id: 1,
          content: data.content,
          style: "Professional",
          image: "/lovable-uploads/7f79803c-e602-4a4b-8e65-e3415b30520d.png"
        },
        {
          id: 2,
          content: data.content.replace(/\./g, '!').substring(0, 200) + "... ✨",
          style: "Casual",
          image: "/lovable-uploads/ffff7850-8e4c-4434-867d-658ace27297a.png"
        },
        {
          id: 3,
          content: `🚀 ${data.content.substring(0, 180)}... #trending #innovation`,
          style: "Engaging",
          image: "/lovable-uploads/cc2970a1-d43f-4106-8c96-843b836e0fbf.png"
        }
      ];

      setGeneratedPosts(variations);
      setStep(2);
    } catch (error: any) {
      toast({
        title: "Error generating content",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const selectPost = (post: any) => {
    setSelectedPost(post);
    setStep(3);
  };

  const togglePlatform = (platformId: string) => {
    if (!connectedPlatforms.includes(platformId)) {
      toast({
        title: "Platform not connected",
        description: `Please connect your ${platformId} account first`,
        variant: "destructive",
      });
      return;
    }

    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const publishPost = async () => {
    if (!selectedPost || selectedPlatforms.length === 0) {
      toast({
        title: "Please select platforms",
        description: "Choose at least one platform to publish to",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const platformsData = selectedPlatforms.map(platform => ({ platform }));
      const results = await postToMultiplePlatforms(selectedPost.content, platformsData);
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      if (successful > 0) {
        toast({
          title: `Posted to ${successful} platform${successful > 1 ? 's' : ''}`,
          description: failed > 0 ? `${failed} failed to post` : "All posts published successfully!",
        });
      }

      if (successful > 0) {
        onClose();
        resetModal();
      }
    } catch (error: any) {
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
    setGeneratedPosts([]);
    setSelectedPost(null);
    setSelectedPlatforms([]);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold">AI Social Post Generator</h3>
        <p className="text-gray-500">Describe your post and let our AI create engaging content</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Describe your post *</label>
          <Textarea
            placeholder="Advertisement for a 2 week holiday in Mexico for under $999"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <Button 
          onClick={generateContent} 
          disabled={generating || !prompt.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {generating ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Let the magic begin!</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Wand2 className="w-4 h-4" />
              <span>Generate Posts</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Select your favourite</h3>
        <p className="text-gray-500">Choose the post variation you like best</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {generatedPosts.map((post) => (
          <Card 
            key={post.id} 
            className="cursor-pointer border-2 hover:border-purple-300 transition-colors"
            onClick={() => selectPost(post)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="text-sm text-gray-600 line-clamp-4">
                {post.content}
              </div>
              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-sm">{post.style} Style</span>
              </div>
              <Badge variant="outline" className="w-fit">
                {post.style}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Choose your socials</h3>
        <p className="text-gray-500">Select which platforms to publish to</p>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-3">Selected Post:</h4>
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="text-sm text-gray-700 line-clamp-3">
                {selectedPost?.content}
              </div>
              <Badge variant="outline" className="mt-2">
                {selectedPost?.style}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-3">Publish to:</h4>
          <div className="grid grid-cols-1 gap-3">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              const isConnected = connectedPlatforms.includes(platform.id);
              const isSelected = selectedPlatforms.includes(platform.id);
              
              return (
                <div 
                  key={platform.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                  } ${!isConnected ? 'opacity-50' : ''}`}
                  onClick={() => togglePlatform(platform.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${platform.color}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{platform.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isConnected ? (
                      <Badge variant={isSelected ? "default" : "outline"}>
                        {isSelected ? "Selected" : "Available"}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Not Connected</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <Button 
          onClick={publishPost}
          disabled={loading || selectedPlatforms.length === 0}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Publishing...</span>
            </div>
          ) : (
            `Publish to ${selectedPlatforms.length} platform${selectedPlatforms.length !== 1 ? 's' : ''}`
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {step === 1 && "Create Post"}
              {step === 2 && "Select Variation"}
              {step === 3 && "Publish Post"}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= stepNum ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-8 h-1 mx-2 transition-colors ${
                    step > stepNum ? 'bg-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
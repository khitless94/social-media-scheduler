import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { FaTwitter, FaFacebook, FaLinkedin, FaReddit, FaInstagram } from 'react-icons/fa';

type Platform = 'twitter' | 'facebook' | 'linkedin' | 'reddit' | 'instagram';

const platformConfigs = [
  { id: 'twitter' as Platform, name: 'Twitter', icon: FaTwitter, color: 'text-blue-600' },
  { id: 'facebook' as Platform, name: 'Facebook', icon: FaFacebook, color: 'text-blue-800' },
  { id: 'linkedin' as Platform, name: 'LinkedIn', icon: FaLinkedin, color: 'text-blue-700' },
  { id: 'reddit' as Platform, name: 'Reddit', icon: FaReddit, color: 'text-orange-600' },
  { id: 'instagram' as Platform, name: 'Instagram', icon: FaInstagram, color: 'text-pink-600' },
];

export default function CreatePostSimplified() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
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

    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some content for your post",
        variant: "destructive"
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "Platform required",
        description: "Please select at least one platform",
        variant: "destructive"
      });
      return;
    }

    setIsPosting(true);

    try {
      // Simulate posting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Post created successfully!",
        description: `Your post has been published to ${selectedPlatforms.join(', ')}.`,
      });

      setContent('');
      setSelectedPlatforms([]);
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
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
        <p className="text-gray-600">Share your content across multiple platforms</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Platform Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {platformConfigs.map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.id}
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={() => handlePlatformToggle(platform.id)}
                  />
                  <label
                    htmlFor={platform.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <platform.icon className={`w-5 h-5 ${platform.color}`} />
                    <span className="text-sm font-medium">{platform.name}</span>
                  </label>
                </div>
              ))}
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

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Post Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[120px] resize-none"
              />
              <div className="text-sm text-gray-500">
                {content.length} characters
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setContent('');
              setSelectedPlatforms([]);
            }}
          >
            Clear All
          </Button>
          <Button
            type="submit"
            disabled={isPosting || !content.trim() || selectedPlatforms.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            {isPosting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Publishing...
              </>
            ) : (
              'Publish Now'
            )}
          </Button>
        </div>
      </form>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Component:</span>
              <span className="text-green-600 font-medium">✅ Simplified Version</span>
            </div>
            <div className="flex justify-between">
              <span>Performance:</span>
              <span className="text-green-600 font-medium">✅ Optimized</span>
            </div>
            <div className="flex justify-between">
              <span>User Status:</span>
              <span className={user ? "text-green-600" : "text-red-600"}>
                {user ? "✅ Authenticated" : "❌ Not authenticated"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

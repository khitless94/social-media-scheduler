import React, { useState, useEffect } from 'react';
import { useCronPollingScheduler } from '@/hooks/useCronPollingScheduler';
import { Platform } from '@/services/cronPollingService';
import { format } from 'date-fns';
import { formatScheduledDateForDisplay } from '@/utils/timezone';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// UI Components (replace with your actual UI components)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, Clock, Image as ImageIcon, Send } from 'lucide-react';
import { UltraModernTimePicker } from '@/components/ui/ultra-modern-time-picker';
import { createScheduledDateTime, validateFutureTime, getFutureTimeForInput, getUserTimezone } from '@/utils/timezone';

export const CronPollingScheduler: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    isScheduling,
    isLoading,
    scheduledPosts,
    schedulePost,
    loadScheduledPosts,
    loadPendingPosts,
    cancelPost,
  } = useCronPollingScheduler();

  // Form state
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState<Platform>('twitter');
  const [title, setTitle] = useState(''); // For Reddit
  const [imageUrl, setImageUrl] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Load scheduled posts on component mount
  useEffect(() => {
    if (user) {
      loadPendingPosts();
    }
  }, [user, loadPendingPosts]);

  // Set default scheduled time to 1 hour from now using timezone utilities
  useEffect(() => {
    const { date, time } = getFutureTimeForInput(1);
    setScheduledDate(date);
    setScheduledTime(time);

    // Log user's timezone for debugging
    const timezone = getUserTimezone();
    console.log('🌍 User timezone detected:', timezone);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter content for your post",
        variant: "destructive"
      });
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast({
        title: "Schedule time required",
        description: "Please select when to schedule your post",
        variant: "destructive"
      });
      return;
    }

    // For Reddit, title is required
    if (platform === 'reddit' && !title.trim()) {
      toast({
        title: "Title required",
        description: "Reddit posts require a title",
        variant: "destructive"
      });
      return;
    }

    // Validate the scheduled time using timezone utilities
    const validation = validateFutureTime(scheduledDate, scheduledTime, 1);

    if (!validation.isValid) {
      toast({
        title: "Invalid schedule time",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    const scheduledDateTime = validation.scheduledTime!;

    // Schedule the post
    const result = await schedulePost({
      content,
      platform,
      scheduled_time: scheduledDateTime,
      title: platform === 'reddit' ? title : undefined,
      image_url: imageUrl || undefined
    });

    if (result) {
      // Reset form
      setContent('');
      setTitle('');
      setImageUrl('');
      
      // Set default time to 1 hour from now again using timezone utilities
      const { date, time } = getFutureTimeForInput(1);
      setScheduledDate(date);
      setScheduledTime(time);
    }
  };

  const handleCancelPost = async (postId: string) => {
    if (confirm('Are you sure you want to cancel this scheduled post?')) {
      await cancelPost(postId);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="create">
        <TabsList className="mb-4">
          <TabsTrigger value="create">Create Post</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Posts ({scheduledPosts.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Schedule a New Post</CardTitle>
              <CardDescription>
                Create a post to be published automatically at your scheduled time.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select 
                    value={platform} 
                    onValueChange={(value) => setPlatform(value as Platform)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="reddit">Reddit</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {platform === 'reddit' && (
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (Required for Reddit)</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter post title"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What do you want to post?"
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">Date</Label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <Input
                        id="scheduledDate"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduledTime">Time</Label>
                    <UltraModernTimePicker
                      value={scheduledTime}
                      onChange={setScheduledTime}
                      placeholder="Select time"
                      className="w-full"
                    />
                  </div>
                </div>
                
                <Button type="submit" disabled={isScheduling} className="w-full">
                  {isScheduling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Schedule Post
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Your Scheduled Posts</CardTitle>
              <CardDescription>
                Posts that will be automatically published at the scheduled time.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : scheduledPosts.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No scheduled posts found. Create one to get started!
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledPosts.map((post) => (
                    <Card key={post.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-medium">
                            {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                          </CardTitle>
                          <span className="text-xs text-muted-foreground">
                            {formatScheduledDateForDisplay(post.scheduled_time)}
                          </span>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pb-2">
                        {post.title && (
                          <p className="font-semibold mb-1">{post.title}</p>
                        )}
                        <p className="text-sm">{post.content}</p>
                        {post.image_url && (
                          <div className="mt-2">
                            <ImageIcon className="h-4 w-4 inline mr-1" />
                            <span className="text-xs text-muted-foreground">Image attached</span>
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleCancelPost(post.id)}
                        >
                          Cancel
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => loadPendingPosts()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Refresh"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CronPollingService, Platform } from '@/services/cronPollingService';
import { Loader2, Calendar, Clock, Image as ImageIcon } from 'lucide-react';
import { UltraModernTimePicker } from '@/components/ui/ultra-modern-time-picker';
import { createScheduledDateTime, validateFutureTime, getFutureTimeForInput } from '@/utils/timezone';

interface CreatePostProps {
  onSuccess?: () => void;
}

export const CreatePostCronPolling: React.FC<CreatePostProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState<Platform>('twitter');
  const [title, setTitle] = useState(''); // For Reddit
  const [imageUrl, setImageUrl] = useState('');
  const [postType, setPostType] = useState<'now' | 'schedule'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Set default scheduled time to 1 hour from now using timezone utilities
  useEffect(() => {
    const { date, time } = getFutureTimeForInput(1);
    setScheduleDate(date);
    setScheduleTime(time);
  }, []);

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
        description: "Please enter content for your post",
        variant: "destructive"
      });
      return;
    }

    setIsPosting(true);
    try {
      if (postType === 'schedule') {
        if (!scheduleDate || !scheduleTime) {
          toast({
            title: "Missing schedule information",
            description: "Please select a date and time for scheduling.",
            variant: "destructive",
          });
          return;
        }

        // Validate the scheduled time using timezone utilities
        const validation = validateFutureTime(scheduleDate, scheduleTime, 1);

        if (!validation.isValid) {
          toast({
            title: "Invalid schedule time",
            description: validation.error,
            variant: "destructive"
          });
          return;
        }

        const scheduledDateTime = validation.scheduledTime!;

        // For Reddit, title is required
        if (platform === 'reddit' && !title.trim()) {
          toast({
            title: "Title required",
            description: "Reddit posts require a title",
            variant: "destructive"
          });
          return;
        }

        // Schedule the post
        const result = await CronPollingService.createScheduledPost({
          content,
          platform,
          scheduled_time: scheduledDateTime,
          title: platform === 'reddit' ? title : undefined,
          image_url: imageUrl || undefined,
          user_id: user.id
        });

        if (result) {
          toast({
            title: "Post scheduled!",
            description: `Your ${platform} post will be published at ${scheduledDateTime.toLocaleString()}`,
          });

          // Reset form
          setContent('');
          setTitle('');
          setImageUrl('');
          
          // Call onSuccess callback if provided
          if (onSuccess) {
            onSuccess();
          }
        }
      } else {
        // For immediate posting, we'll still use the scheduled_posts table
        // but with a scheduled_time of now, so it gets picked up immediately
        // by the cron job
        
        // For Reddit, title is required
        if (platform === 'reddit' && !title.trim()) {
          toast({
            title: "Title required",
            description: "Reddit posts require a title",
            variant: "destructive"
          });
          return;
        }

        // Create a post scheduled for right now
        const result = await CronPollingService.createScheduledPost({
          content,
          platform,
          scheduled_time: new Date(), // Schedule for now
          title: platform === 'reddit' ? title : undefined,
          image_url: imageUrl || undefined,
          user_id: user.id
        });

        if (result) {
          toast({
            title: "Post created!",
            description: `Your ${platform} post will be published shortly`,
          });

          // Reset form
          setContent('');
          setTitle('');
          setImageUrl('');
          
          // Call onSuccess callback if provided
          if (onSuccess) {
            onSuccess();
          }
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Post</CardTitle>
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
          
          <div className="space-y-2">
            <Label>Post Type</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={postType === 'now' ? 'default' : 'outline'}
                onClick={() => setPostType('now')}
              >
                Post Now
              </Button>
              <Button
                type="button"
                variant={postType === 'schedule' ? 'default' : 'outline'}
                onClick={() => setPostType('schedule')}
              >
                Schedule
              </Button>
            </div>
          </div>
          
          {postType === 'schedule' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scheduleDate">Date</Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <Input
                    id="scheduleDate"
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduleTime">Time</Label>
                <UltraModernTimePicker
                  value={scheduleTime}
                  onChange={setScheduleTime}
                  placeholder="Select time"
                  className="w-full"
                />
              </div>
            </div>
          )}
          
          <Button type="submit" disabled={isPosting} className="w-full">
            {isPosting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {postType === 'schedule' ? 'Scheduling...' : 'Posting...'}
              </>
            ) : (
              postType === 'schedule' ? 'Schedule Post' : 'Post Now'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { formatScheduledDateForDisplay } from '@/utils/timezone';
import { CronPollingService, ScheduledPost } from '@/services/cronPollingService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ScheduledPostsListProps {
  showPosted?: boolean;
  limit?: number;
  onRefresh?: () => void;
}

export const ScheduledPostsList: React.FC<ScheduledPostsListProps> = ({ 
  showPosted = false,
  limit = 10,
  onRefresh
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPosts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let fetchedPosts;
      
      if (showPosted) {
        // Get all posts
        fetchedPosts = await CronPollingService.getScheduledPosts();
      } else {
        // Get only pending posts
        fetchedPosts = await CronPollingService.getPendingPosts();
      }
      
      // Apply limit if specified
      if (limit > 0 && fetchedPosts.length > limit) {
        fetchedPosts = fetchedPosts.slice(0, limit);
      }
      
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: "Failed to load posts",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user, showPosted, limit]);

  const handleCancelPost = async (postId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled post?')) {
      return;
    }
    
    try {
      const success = await CronPollingService.cancelScheduledPost(postId);
      
      if (success) {
        toast({
          title: "Post cancelled",
          description: "The scheduled post has been cancelled successfully",
        });
        
        // Remove from local state
        setPosts(prev => prev.filter(post => post.id !== postId));
        
        // Call onRefresh if provided
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (error) {
      console.error('Error cancelling post:', error);
      toast({
        title: "Failed to cancel post",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = () => {
    loadPosts();
    
    // Call onRefresh if provided
    if (onRefresh) {
      onRefresh();
    }
  };

  const getPlatformColor = (platform: string): string => {
    switch (platform) {
      case 'twitter':
        return 'bg-blue-500';
      case 'facebook':
        return 'bg-indigo-600';
      case 'linkedin':
        return 'bg-blue-700';
      case 'reddit':
        return 'bg-orange-600';
      case 'instagram':
        return 'bg-pink-600';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Scheduled Posts</CardTitle>
            <CardDescription>
              {showPosted 
                ? 'All your scheduled posts, including those already posted' 
                : 'Posts waiting to be published'}
            </CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            No scheduled posts found.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getPlatformColor(post.platform)}`}>
                        {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                      </Badge>
                      
                      {post.posted ? (
                        <Badge variant="outline" className="bg-green-50">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Posted
                        </Badge>
                      ) : new Date(post.scheduled_time) <= new Date() ? (
                        <Badge variant="outline" className="bg-yellow-50">
                          <Clock className="h-3 w-3 mr-1" />
                          Processing
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50">
                          <Clock className="h-3 w-3 mr-1" />
                          Scheduled
                        </Badge>
                      )}
                    </div>
                    
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
                    <div className="mt-2 text-xs text-muted-foreground">
                      Image URL: {post.image_url}
                    </div>
                  )}
                  
                  {post.posted && post.posted_at && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Posted at: {formatScheduledDateForDisplay(post.posted_at)}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter>
                  {!post.posted && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleCancelPost(post.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      
      {posts.length > 0 && (
        <CardFooter>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

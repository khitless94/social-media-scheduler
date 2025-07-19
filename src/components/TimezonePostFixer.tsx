import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Clock, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  platform: string;
  status: string;
  scheduled_at: string;
  created_at: string;
}

export function TimezonePostFixer() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<string>('');
  const [correctTime, setCorrectTime] = useState('');
  const [userTimezone, setUserTimezone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      // Detect user's timezone
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimezone(detectedTimezone);
      
      loadPosts();
    }
  }, [user]);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id)
        .in('status', ['scheduled', 'ready_for_posting'])
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error('Error loading posts:', error);
    }
  };

  const fixPostTimezone = async () => {
    if (!selectedPost || !correctTime) {
      toast({
        title: "❌ Missing Information",
        description: "Please select a post and enter the correct time",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('fix_post_timezone', {
        p_post_id: selectedPost,
        p_correct_local_time: correctTime,
        p_user_timezone: userTimezone
      });

      if (error) throw error;

      toast({
        title: "✅ Timezone Fixed",
        description: "Post time has been corrected successfully",
      });

      // Reload posts to show updated times
      loadPosts();
      setSelectedPost('');
      setCorrectTime('');

    } catch (error: any) {
      toast({
        title: "❌ Fix Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatLocalTime = (utcTime: string) => {
    const date = new Date(utcTime);
    return date.toLocaleString('en-US', {
      timeZone: userTimezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCurrentLocalTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:00`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🕐 Timezone Post Fixer
        </h1>
        <p className="text-gray-600">
          Fix timezone issues in your scheduled posts
        </p>
      </div>

      {/* Current Timezone Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-800">Your Timezone:</span>
          <span className="text-blue-700">{userTimezone}</span>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-800">Current Time:</span>
          <span className="text-blue-700">{new Date().toLocaleString()}</span>
        </div>
      </Card>

      {/* Posts with Timezone Issues */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Scheduled Posts (Check for Timezone Issues)
        </h3>
        
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No scheduled posts found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPost === post.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPost(post.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">{post.platform}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        post.status === 'scheduled' 
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">
                      {post.content.substring(0, 100)}...
                    </p>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Scheduled (UTC):</span>
                        <span className="text-gray-900">{new Date(post.scheduled_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Your Local Time:</span>
                        <span className="text-gray-900 font-medium">{formatLocalTime(post.scheduled_at)}</span>
                      </div>
                    </div>
                  </div>
                  {selectedPost === post.id && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Fix Timezone Form */}
      {selectedPost && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="font-semibold text-green-800 mb-4">
            Fix Selected Post Timezone
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Correct Local Time (YYYY-MM-DD HH:MM:SS)
              </label>
              <Input
                type="text"
                value={correctTime}
                onChange={(e) => setCorrectTime(e.target.value)}
                placeholder={getCurrentLocalTime()}
                className="border-green-300 focus:border-green-500"
              />
              <p className="text-xs text-green-600 mt-1">
                Example: 2025-07-19 11:41:00 (for 11:41 AM today)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">
                Your Timezone
              </label>
              <Input
                type="text"
                value={userTimezone}
                onChange={(e) => setUserTimezone(e.target.value)}
                className="border-green-300 focus:border-green-500"
              />
            </div>
            
            <Button 
              onClick={fixPostTimezone}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Fixing...' : 'Fix Timezone'}
            </Button>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">
          🔧 How to Fix Your LinkedIn Post
        </h3>
        <div className="text-sm text-yellow-700 space-y-2">
          <div><strong>1. Select your LinkedIn post</strong> from the list above</div>
          <div><strong>2. Enter the correct time:</strong> 2025-07-19 11:41:00</div>
          <div><strong>3. Click "Fix Timezone"</strong> to update the post</div>
          <div><strong>4. The post will be rescheduled</strong> for the correct time</div>
          <div><strong>5. Automation will handle it</strong> when the time comes</div>
        </div>
      </Card>
    </div>
  );
}

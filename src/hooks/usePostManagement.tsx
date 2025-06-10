import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePostManagement = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [historyPosts, setHistoryPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch scheduled/draft posts from posts table
      const { data: scheduledPosts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch posted content from post_history table
      const { data: postedPosts, error: historyError } = await supabase
        .from('post_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;

      // Transform history posts to match the structure
      const transformedHistoryPosts = (postedPosts || []).map(post => ({
        id: post.id,
        user_id: post.user_id,
        prompt: 'Manual Post',
        generated_text: post.content,
        platform: post.platform,
        status: post.status === 'success' ? 'Posted' : 'Failed',
        created_at: post.created_at,
        updated_at: post.updated_at,
        image_url: null,
        scheduled_time: null
      }));

      // Combine all posts
      const allPosts = [...(scheduledPosts || []), ...transformedHistoryPosts];
      setPosts(allPosts);
      setHistoryPosts(transformedHistoryPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error fetching posts",
        description: "Failed to load your posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string, isHistoryPost: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to delete posts.",
          variant: "destructive",
        });
        return;
      }

      const tableName = isHistoryPost ? 'post_history' : 'posts';
      
      // Add user_id check for security
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from local state immediately
      setPosts(prev => prev.filter(p => p.id !== postId));
      setHistoryPosts(prev => prev.filter(p => p.id !== postId));

      toast({
        title: "Post deleted",
        description: "The post has been deleted successfully.",
      });

    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error deleting post",
        description: error.message || "Failed to delete the post. Please try again.",
        variant: "destructive",
      });
      
      // Refresh to get current state from server
      await fetchPosts();
    }
  };

  const editPost = async (postId: string, updatedData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to edit posts.",
          variant: "destructive",
        });
        return;
      }

      // Determine if this is a history post or regular post
      const currentPost = posts.find(p => p.id === postId);
      const isHistoryPost = currentPost?.prompt === 'Manual Post';
      const tableName = isHistoryPost ? 'post_history' : 'posts';

      const { error } = await supabase
        .from(tableName)
        .update({
          ...updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Post updated",
        description: "Your post has been updated successfully.",
      });

      fetchPosts(); // Refresh the posts
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast({
        title: "Error updating post",
        description: error.message || "Failed to update the post.",
        variant: "destructive",
      });
    }
  };

  return {
    posts,
    setPosts,
    historyPosts,
    setHistoryPosts,
    loading,
    fetchPosts,
    deletePost,
    editPost
  };
};
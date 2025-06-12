import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePostManagement = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [historyPosts, setHistoryPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);





  const fetchPosts = useCallback(async () => {
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
  }, []); // Empty dependency array since we get user inside the function

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

      // Auto-detect which table the post is in based on the post data
      const currentPost = posts.find(p => p.id === postId);
      const autoDetectedIsHistory = currentPost?.prompt === 'Manual Post';

      // Try both tables to ensure we find and delete the post
      let deleteSuccess = false;

      // First try the auto-detected table
      const primaryTable = autoDetectedIsHistory ? 'post_history' : 'posts';

      const { error: primaryError, data: primaryData } = await supabase
        .from(primaryTable)
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id)
        .select();

      if (!primaryError && primaryData && primaryData.length > 0) {
        deleteSuccess = true;
      } else {
        // Try the other table
        const secondaryTable = primaryTable === 'posts' ? 'post_history' : 'posts';

        const { error: secondaryError, data: secondaryData } = await supabase
          .from(secondaryTable)
          .delete()
          .eq('id', postId)
          .eq('user_id', user.id)
          .select();

        if (!secondaryError && secondaryData && secondaryData.length > 0) {
          deleteSuccess = true;
        }
      }

      if (!deleteSuccess) {
        throw new Error(`Post not found or you don't have permission to delete it.`);
      }

      toast({
        title: "Post deleted",
        description: "The post has been deleted successfully.",
      });

      // Immediately refresh from database to ensure UI is in sync
      await fetchPosts();

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
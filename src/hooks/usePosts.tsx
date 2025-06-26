import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  platform: string; // Changed from platforms array to single platform
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at?: string; // Changed from scheduled_for to match your table
  published_at?: string;
  image_url?: string;
  platform_post_ids: Record<string, string>;
  engagement_stats: Record<string, any>;
  created_at: string;
  updated_at: string;
  generated_by_ai: boolean;
  ai_prompt?: string;
  error_message?: string;
  retry_count: number;
}

export interface PostFilters {
  status?: string;
  platform?: string;
  search?: string;
}

export const usePosts = (filters: PostFilters = {}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();

  const fetchPosts = async () => {
    console.log('🔍 [usePosts] fetchPosts called');
    console.log('🔍 [usePosts] user:', user);
    console.log('🔍 [usePosts] user.id:', user?.id);

    if (!user?.id) {
      console.log('❌ [usePosts] No user ID, stopping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 [usePosts] Starting fetch for user:', user.id);

      let query = supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('🔍 [usePosts] Query built, applying filters...');

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.platform && filters.platform !== 'all') {
        query = query.eq('platform', filters.platform);
      }

      if (filters.search) {
        query = query.ilike('content', `%${filters.search}%`);
      }

      console.log('🔍 [usePosts] Executing query...');
      const { data, error: fetchError } = await query;

      console.log('🔍 [usePosts] Query result:', { data, error: fetchError });
      console.log('🔍 [usePosts] Data length:', data?.length || 0);

      if (fetchError) {
        console.error('❌ [usePosts] Fetch error:', fetchError);
        throw fetchError;
      }

      console.log('✅ [usePosts] Setting posts:', data);
      setPosts(data || []);
    } catch (err) {
      console.error('❌ [usePosts] Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: Partial<Post>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            ...postData,
            user_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Refresh posts list
      await fetchPosts();
      return data;
    } catch (err) {
      console.error('Error creating post:', err);
      throw err;
    }
  };

  const updatePost = async (id: string, updates: Partial<Post>) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      // Refresh posts list
      await fetchPosts();
      return data;
    } catch (err) {
      console.error('Error updating post:', err);
      throw err;
    }
  };

  const deletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Refresh posts list
      await fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      throw err;
    }
  };

  const getPostStats = () => {
    const total = posts.length;
    const drafts = posts.filter(p => p.status === 'draft').length;
    const scheduled = posts.filter(p => p.status === 'scheduled').length;
    const published = posts.filter(p => p.status === 'published').length;
    const failed = posts.filter(p => p.status === 'failed').length;

    return { total, drafts, scheduled, published, failed };
  };

  useEffect(() => {
    fetchPosts();
  }, [user?.id, filters.status, filters.platform, filters.search]);

  return {
    posts,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    refreshPosts: fetchPosts,
    stats: getPostStats(),
  };
};

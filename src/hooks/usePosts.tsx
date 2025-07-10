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

// Sample posts for fallback when database is not available
const getSamplePosts = (userId: string): Post[] => {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return [
    {
      id: 'sample-1',
      user_id: userId,
      content: "🚀 Just launched my new social media scheduler! Excited to share content across all platforms seamlessly. #productivity #socialmedia #tech",
      platform: "twitter",
      status: "published" as const,
      published_at: twoDaysAgo.toISOString(),
      platform_post_ids: { twitter: "1234567890" },
      engagement_stats: { twitter: { likes: 45, retweets: 12, replies: 8 } },
      created_at: twoDaysAgo.toISOString(),
      updated_at: twoDaysAgo.toISOString(),
      generated_by_ai: false,
      retry_count: 0
    },
    {
      id: 'sample-2',
      user_id: userId,
      content: "Working on some exciting new features for content creators. AI-powered content generation is the future! 🤖✨ #AI #contentcreation #innovation",
      platform: "linkedin",
      status: "published" as const,
      published_at: oneDayAgo.toISOString(),
      platform_post_ids: { linkedin: "activity-9876543210" },
      engagement_stats: { linkedin: { likes: 78, comments: 15, shares: 23 } },
      created_at: oneDayAgo.toISOString(),
      updated_at: oneDayAgo.toISOString(),
      generated_by_ai: true,
      ai_prompt: "Create a professional post about AI in content creation",
      retry_count: 0
    },
    {
      id: 'sample-3',
      user_id: userId,
      content: "Beautiful sunset from my office window today 🌅 Sometimes you need to pause and appreciate the simple moments. #sunset #mindfulness #worklife",
      platform: "instagram",
      status: "scheduled" as const,
      scheduled_at: twoHoursLater.toISOString(),
      platform_post_ids: {},
      engagement_stats: {},
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      generated_by_ai: false,
      retry_count: 0
    },
    {
      id: 'sample-4',
      user_id: userId,
      content: "Draft post about the importance of consistent social media presence. Need to add more statistics and examples before publishing.",
      platform: "facebook",
      status: "draft" as const,
      platform_post_ids: {},
      engagement_stats: {},
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      generated_by_ai: false,
      retry_count: 0
    },
    {
      id: 'sample-5',
      user_id: userId,
      content: "TIL: The best time to post on social media varies by platform and audience. Here's what I've learned from analyzing engagement data... 📊",
      platform: "reddit",
      status: "scheduled" as const,
      scheduled_at: tomorrow.toISOString(),
      platform_post_ids: {},
      engagement_stats: {},
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      generated_by_ai: true,
      ai_prompt: "Create an educational post about social media timing",
      retry_count: 0
    },
    {
      id: 'sample-6',
      user_id: userId,
      content: "Failed to post this earlier due to API limits. Will retry later. Content about the latest social media trends and predictions for 2024.",
      platform: "twitter",
      status: "failed" as const,
      error_message: "Rate limit exceeded",
      platform_post_ids: {},
      engagement_stats: {},
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      generated_by_ai: false,
      retry_count: 2
    }
  ];
};

export const usePosts = (filters: PostFilters = {}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();

  // Only fetch real data when user is available
  useEffect(() => {
    if (!user?.id) {
      console.log('🔍 [usePosts] No user yet, waiting for authentication');
      setPosts([]);
      setError(null);
      setLoading(false);
    }
  }, [user]);

  const fetchPosts = async () => {
    console.log('🔍 [usePosts] fetchPosts called');
    console.log('🔍 [usePosts] user:', user);
    console.log('🔍 [usePosts] user.id:', user?.id);

    if (!user?.id) {
      console.log('❌ [usePosts] No user ID, cannot fetch posts');
      setPosts([]);
      setError('Please log in to see your posts.');
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

        // Handle specific database errors gracefully
        if (fetchError.code === '42P01' || fetchError.message?.includes('relation "posts" does not exist')) {
          console.log('📝 Posts table does not exist');
          setPosts([]);
          setError('Posts table not found. Please run the database setup script in Supabase.');
        } else if (fetchError.code === 'PGRST116') {
          console.log('📭 No posts found, setting empty array');
          setPosts([]);
          setError(null);
        } else {
          console.warn('Database error:', fetchError);
          setPosts([]);
          setError(`Database error: ${fetchError.message}`);
        }
      } else {
        console.log('✅ [usePosts] Setting posts:', data);
        setPosts(data || []);
        setError(null);
      }
    } catch (err) {
      console.error('❌ [usePosts] Error fetching posts:', err);
      setPosts([]);
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

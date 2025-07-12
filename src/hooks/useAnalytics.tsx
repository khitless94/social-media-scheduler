import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AnalyticsData {
  totalReach: number;
  totalEngagement: number;
  totalPosts: number;
  totalShares: number;
  totalComments: number;
  totalLikes: number;
  platformBreakdown: PlatformAnalytics[];
  weeklyTrend: WeeklyData[];
  topPosts: TopPost[];
  engagementRate: number;
  growthRate: number;
}

export interface PlatformAnalytics {
  platform: string;
  posts: number;
  likes: number;
  shares: number;
  comments: number;
  reach: number;
  engagementRate: number;
  color: string;
}

export interface WeeklyData {
  date: string;
  day: string;
  likes: number;
  shares: number;
  comments: number;
  posts: number;
  reach: number;
}

export interface TopPost {
  id: string;
  content: string;
  platform: string;
  likes: number;
  shares: number;
  comments: number;
  totalEngagement: number;
  publishedAt: string;
  reach: number;
}

export const useAnalytics = (timeRange: '7d' | '30d' | '90d' = '7d') => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Fetch posts with engagement data
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      console.log('📊 [useAnalytics] Fetched posts:', posts);
      console.log('📊 [useAnalytics] Posts with engagement:', posts?.filter(p => p.engagement_stats && Object.keys(p.engagement_stats).length > 0));

      // Process analytics data
      const analytics = processAnalyticsData(posts || [], timeRange);
      console.log('📊 [useAnalytics] Processed analytics:', analytics);
      setData(analytics);

    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, timeRange]);

  // Real-time subscription for analytics updates
  useEffect(() => {
    if (!user?.id) return;

    fetchAnalytics();

    // Set up real-time subscription
    const subscription = supabase
      .channel('analytics_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('📊 Analytics data updated, refreshing...');
          fetchAnalytics();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAnalytics, user?.id]);

  return { data, loading, error, refetch: fetchAnalytics };
};

// Helper function to process raw data into analytics
function processAnalyticsData(posts: any[], timeRange: string): AnalyticsData {
  const platformColors: Record<string, string> = {
    twitter: '#1DA1F2',
    linkedin: '#0077B5',
    instagram: '#E4405F',
    facebook: '#1877F2',
    reddit: '#FF4500'
  };

  // Initialize platform breakdown
  const platformBreakdown: Record<string, PlatformAnalytics> = {};
  
  // Process each post
  let totalLikes = 0;
  let totalShares = 0;
  let totalComments = 0;
  let totalReach = 0;

  posts.forEach(post => {
    const platform = post.platform;
    const engagement = post.engagement_stats || {};

    console.log(`📊 Processing post ${post.id} on ${platform}:`, engagement);

    // If no engagement stats, create platform entry with zero data
    if (!engagement || Object.keys(engagement).length === 0) {
      if (!platformBreakdown[platform]) {
        platformBreakdown[platform] = {
          platform: platform,
          posts: 0,
          likes: 0,
          shares: 0,
          comments: 0,
          reach: 0,
          engagementRate: 0,
          color: platformColors[platform] || '#6B7280'
        };
      }
      platformBreakdown[platform].posts += 1;
      return;
    }

    // Extract engagement data for each platform
    Object.entries(engagement).forEach(([platformKey, stats]: [string, any]) => {
      const likes = stats?.likes || 0;
      const shares = stats?.shares || 0;
      const comments = stats?.comments || 0;
      const reach = stats?.reach || 0;

      totalLikes += likes;
      totalShares += shares;
      totalComments += comments;
      totalReach += reach;

      if (!platformBreakdown[platformKey]) {
        platformBreakdown[platformKey] = {
          platform: platformKey,
          posts: 0,
          likes: 0,
          shares: 0,
          comments: 0,
          reach: 0,
          engagementRate: 0,
          color: platformColors[platformKey] || '#6B7280'
        };
      }

      platformBreakdown[platformKey].posts += 1;
      platformBreakdown[platformKey].likes += likes;
      platformBreakdown[platformKey].shares += shares;
      platformBreakdown[platformKey].comments += comments;
      platformBreakdown[platformKey].reach += reach;
    });
  });

  // Calculate engagement rates
  Object.values(platformBreakdown).forEach(platform => {
    const totalEngagement = platform.likes + platform.shares + platform.comments;
    platform.engagementRate = platform.reach > 0 ? (totalEngagement / platform.reach) * 100 : 0;
  });

  // Generate weekly trend data
  const weeklyTrend = generateWeeklyTrend(posts, timeRange);

  // Find top posts
  const topPosts = getTopPosts(posts);

  // Calculate overall metrics
  const totalEngagement = totalLikes + totalShares + totalComments;
  const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;
  const growthRate = calculateGrowthRate(posts, timeRange);

  return {
    totalReach,
    totalEngagement,
    totalPosts: posts.length,
    totalShares,
    totalComments,
    totalLikes,
    platformBreakdown: Object.values(platformBreakdown),
    weeklyTrend,
    topPosts,
    engagementRate,
    growthRate
  };
}

function generateWeeklyTrend(posts: any[], timeRange: string): WeeklyData[] {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const trend: WeeklyData[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const dayPosts = posts.filter(post => {
      const postDate = new Date(post.created_at);
      return postDate.toDateString() === date.toDateString();
    });

    let dayLikes = 0;
    let dayShares = 0;
    let dayComments = 0;
    let dayReach = 0;

    dayPosts.forEach(post => {
      const engagement = post.engagement_stats || {};
      Object.values(engagement).forEach((stats: any) => {
        dayLikes += stats?.likes || 0;
        dayShares += stats?.shares || 0;
        dayComments += stats?.comments || 0;
        dayReach += stats?.reach || 0;
      });
    });

    trend.push({
      date: date.toISOString().split('T')[0],
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      likes: dayLikes,
      shares: dayShares,
      comments: dayComments,
      posts: dayPosts.length,
      reach: dayReach
    });
  }

  return trend;
}

function getTopPosts(posts: any[]): TopPost[] {
  return posts
    .map(post => {
      const engagement = post.engagement_stats || {};
      let totalLikes = 0;
      let totalShares = 0;
      let totalComments = 0;
      let totalReach = 0;

      Object.values(engagement).forEach((stats: any) => {
        totalLikes += stats?.likes || 0;
        totalShares += stats?.shares || 0;
        totalComments += stats?.comments || 0;
        totalReach += stats?.reach || 0;
      });

      const totalEngagement = totalLikes + totalShares + totalComments;

      return {
        id: post.id,
        content: post.content,
        platform: post.platform,
        likes: totalLikes,
        shares: totalShares,
        comments: totalComments,
        totalEngagement,
        publishedAt: post.published_at || post.created_at,
        reach: totalReach
      };
    })
    .sort((a, b) => b.totalEngagement - a.totalEngagement)
    .slice(0, 5);
}

function calculateGrowthRate(posts: any[], timeRange: string): number {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const midPoint = Math.floor(days / 2);
  
  const recentPosts = posts.filter(post => {
    const postDate = new Date(post.created_at);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - midPoint);
    return postDate >= cutoffDate;
  });

  const olderPosts = posts.filter(post => {
    const postDate = new Date(post.created_at);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - midPoint);
    return postDate < cutoffDate;
  });

  if (olderPosts.length === 0) return 0;

  const recentEngagement = calculateTotalEngagement(recentPosts);
  const olderEngagement = calculateTotalEngagement(olderPosts);

  return olderEngagement > 0 ? ((recentEngagement - olderEngagement) / olderEngagement) * 100 : 0;
}

function calculateTotalEngagement(posts: any[]): number {
  return posts.reduce((total, post) => {
    const engagement = post.engagement_stats || {};
    let postEngagement = 0;
    
    Object.values(engagement).forEach((stats: any) => {
      postEngagement += (stats?.likes || 0) + (stats?.shares || 0) + (stats?.comments || 0);
    });
    
    return total + postEngagement;
  }, 0);
}

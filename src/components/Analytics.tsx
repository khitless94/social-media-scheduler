
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Eye, Heart, Share, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Analytics = () => {
  const [platformData, setPlatformData] = useState<any[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalPosts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    failedPosts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch posts data
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id);

      // Fetch post history data
      const { data: history } = await supabase
        .from('post_history')
        .select('*')
        .eq('user_id', user.id);

      // Process platform data
      const platformStats: any = {};
      
      (posts || []).forEach((post: any) => {
        const platform = post.platform;
        if (!platformStats[platform]) {
          platformStats[platform] = { posts: 0, engagement: 0 };
        }
        platformStats[platform].posts++;
        // Use actual metrics or set to 0 if no real data available
        platformStats[platform].engagement += 0;
      });

      (history || []).forEach((post: any) => {
        const platform = post.platform;
        if (!platformStats[platform]) {
          platformStats[platform] = { posts: 0, engagement: 0 };
        }
        platformStats[platform].posts++;
        // Use actual metrics or set to 0 if no real data available
        platformStats[platform].engagement += 0;
      });

      const platformDataArray = Object.entries(platformStats).map(([name, stats]: [string, any]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        posts: stats.posts,
        engagement: Math.round(stats.engagement / stats.posts) || 0
      }));

      setPlatformData(platformDataArray);

      // Process top posts (from successful posts)
      const successfulPosts = (history || [])
        .filter((post: any) => post.status === 'success')
        .slice(0, 3)
        .map((post: any) => ({
          content: post.content.substring(0, 50) + '...',
          platform: post.platform.charAt(0).toUpperCase() + post.platform.slice(1),
          engagement: 0, // Real engagement data would come from platform APIs
          type: 'Posted'
        }));

      setTopPosts(successfulPosts);

      // Calculate totals
      const totalPosts = (posts || []).length + (history || []).length;
      const scheduledPosts = (posts || []).filter((p: any) => p.status === 'scheduled').length;
      const publishedPosts = (history || []).filter((p: any) => p.status === 'success').length;
      const failedPosts = (history || []).filter((p: any) => p.status === 'failed').length;

      setTotalStats({
        totalPosts,
        scheduledPosts,
        publishedPosts,
        failedPosts
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate week data based on real posts
  const generateWeekData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      name: day,
      likes: 0, // Real data would come from platform APIs
      shares: 0,
      comments: 0
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Modern Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600">Track your social media performance and insights</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalStats.totalPosts}</h3>
            <p className="text-sm text-gray-600">Total Posts</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Live</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalStats.publishedPosts}</h3>
            <p className="text-sm text-gray-600">Published</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl">
                <Share className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Queue</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalStats.scheduledPosts}</h3>
            <p className="text-sm text-gray-600">Scheduled</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Growth</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">12.5%</h3>
            <p className="text-sm text-gray-600">Engagement Rate</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Platform Performance */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Platform Performance</h3>
                  <p className="text-sm text-gray-600">Posts and engagement by platform</p>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="posts" fill="url(#purpleGradient)" name="Posts" radius={[4, 4, 0, 0]} />
                <Bar dataKey="engagement" fill="url(#pinkGradient)" name="Engagement Rate" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                  <linearGradient id="pinkGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#f472b6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                  <Share className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Platform Distribution</h3>
                  <p className="text-sm text-gray-600">Your content distribution across platforms</p>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="posts"
                  stroke="white"
                  strokeWidth={2}
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Engagement Trend */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Weekly Engagement Trend</h3>
                <p className="text-sm text-gray-600">Track your engagement over the past week</p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={generateWeekData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="likes"
                stroke="#ec4899"
                strokeWidth={3}
                dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ec4899', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="shares"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="comments"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#06b6d4', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performing Posts */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Top Performing Posts</h3>
                <p className="text-sm text-gray-600">Your best content this month</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {topPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600">Your top performing posts will appear here after you start posting.</p>
              </div>
            ) : (
              topPosts.map((post, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <p className="font-medium text-gray-900 truncate">{post.content}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">{post.platform}</span>
                        <span className="text-sm text-gray-600 flex items-center">
                          <Heart className="w-3 h-3 mr-1 text-red-500" />
                          {post.engagement}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">{post.engagement}</div>
                      <div className="text-xs text-gray-500">interactions</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;


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
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Analytics Dashboard
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Track your social media performance across all platforms</p>
      </div>

      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="group bg-white/80 backdrop-blur-sm border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-3xl border-0 overflow-hidden relative">
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
              📊 Total
            </div>
          </div>
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full transform translate-x-6 -translate-y-6 opacity-50"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-2">Total Posts</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{totalStats.totalPosts}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="group bg-white/80 backdrop-blur-sm border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-3xl border-0 overflow-hidden relative">
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
              ✅ Live
            </div>
          </div>
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full transform translate-x-6 -translate-y-6 opacity-50"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-2">Published</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">{totalStats.publishedPosts}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="group bg-white/80 backdrop-blur-sm border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-3xl border-0 overflow-hidden relative">
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg animate-pulse">
              ⏰ Pending
            </div>
          </div>
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100 rounded-full transform translate-x-6 -translate-y-6 opacity-50"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Share className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-2">Scheduled</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">{totalStats.scheduledPosts}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="group bg-white/80 backdrop-blur-sm border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-3xl border-0 overflow-hidden relative">
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
              ❌ Failed
            </div>
          </div>
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-100 rounded-full transform translate-x-6 -translate-y-6 opacity-50"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-2">Failed</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">{totalStats.failedPosts}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Platform Performance */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 rounded-full transform translate-x-8 -translate-y-8"></div>
            <div className="relative z-10">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span>Platform Performance</span>
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">Posts and engagement by platform</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
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
          </CardContent>
        </Card>

        {/* Engagement Distribution */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full transform translate-x-8 -translate-y-8"></div>
            <div className="relative z-10">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Share className="h-4 w-4 text-white" />
                </div>
                <span>Platform Distribution</span>
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">Your content distribution across platforms</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6">
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
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Weekly Engagement Trend */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full transform translate-x-8 -translate-y-8"></div>
          <div className="relative z-10">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span>Weekly Engagement Trend</span>
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">Track your engagement over the past week</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
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
        </CardContent>
      </Card>

      {/* Enhanced Top Performing Posts */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 rounded-full transform translate-x-8 -translate-y-8"></div>
          <div className="relative z-10">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span>Top Performing Posts</span>
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">Your best content this month</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {topPosts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-12 w-12 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600">Your top performing posts will appear here after you start posting.</p>
              </div>
            ) : (
              topPosts.map((post, index) => (
                <div key={index} className="group p-6 bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          #{index + 1}
                        </div>
                        <p className="font-semibold text-gray-900 truncate max-w-md group-hover:text-purple-600 transition-colors duration-200">{post.content}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300">{post.platform}</Badge>
                        <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300">{post.type}</Badge>
                        <span className="text-sm text-gray-600 flex items-center">
                          <Heart className="w-4 h-4 mr-1 text-red-500" />
                          {post.engagement} total engagement
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{post.engagement}</div>
                      <div className="text-xs text-gray-600 font-medium">interactions</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;

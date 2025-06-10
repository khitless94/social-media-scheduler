
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
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Analytics Dashboard
        </h2>
        <p className="text-gray-600">Track your social media performance across all platforms</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/70 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold text-blue-600">{totalStats.totalPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">{totalStats.publishedPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Share className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-orange-600">{totalStats.scheduledPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{totalStats.failedPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Performance */}
        <Card className="bg-white/70 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
            <CardDescription>Posts and engagement by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="posts" fill="#8b5cf6" name="Posts" />
                <Bar dataKey="engagement" fill="#ec4899" name="Engagement Rate" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Distribution */}
        <Card className="bg-white/70 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
            <CardDescription>Your content distribution across platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="posts"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Engagement Trend */}
      <Card className="bg-white/70 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>Weekly Engagement Trend</span>
          </CardTitle>
          <CardDescription>Track your engagement over the past week</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={generateWeekData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} />
                <Line type="monotone" dataKey="shares" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="comments" stroke="#06b6d4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performing Posts */}
      <Card className="bg-white/70 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
          <CardDescription>Your best content this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No posts yet</p>
                <p className="text-sm">Your top performing posts will appear here after you start posting.</p>
              </div>
            ) : (
              topPosts.map((post, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-white/30">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate max-w-md">{post.content}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <Badge variant="outline">{post.platform}</Badge>
                      <Badge variant="outline">{post.type}</Badge>
                      <span className="text-sm text-gray-600">{post.engagement} total engagement</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">{post.engagement}</div>
                    <div className="text-xs text-gray-600">interactions</div>
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

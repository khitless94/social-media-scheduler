import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, Eye, Heart, Share2, MessageCircle,
  Users, BarChart3, Calendar, RefreshCw, Download, Filter
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { realEngagementService } from '@/services/engagementService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import EngagementDebug from './EngagementDebug';

const RealTimeAnalytics = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedMetric, setSelectedMetric] = useState('engagement');
  const [syncing, setSyncing] = useState(false);
  const { data, loading, error, refetch } = useAnalytics(timeRange);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSyncRealData = async () => {
    if (!user?.id) return;

    setSyncing(true);
    toast({
      title: "Syncing Real Engagement Data",
      description: "Fetching live data from your connected social media platforms...",
    });

    try {
      await realEngagementService.syncRealData(user.id);
      await refetch(); // Refresh analytics data
      toast({
        title: "Real Data Synced!",
        description: "Your analytics now show live engagement data from connected social media platforms.",
      });
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "Failed to sync real engagement data. Connect your social media accounts first.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading real-time analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️ Error loading analytics</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!data || (data.totalPosts === 0 && data.totalEngagement === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center max-w-md">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600 mb-4">
            {data?.totalPosts === 0
              ? "Start posting content to see your analytics"
              : "Sync your real engagement data from social media platforms"
            }
          </p>
          <div className="space-y-3">
            <Button
              onClick={handleSyncRealData}
              disabled={syncing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {syncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Real Engagement Data
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500">
              This will fetch live engagement data from your connected social media platforms
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const overviewStats = [
    {
      title: "Total Reach",
      value: formatNumber(data.totalReach),
      change: `${data.growthRate > 0 ? '+' : ''}${data.growthRate.toFixed(1)}%`,
      trend: data.growthRate >= 0 ? 'up' : 'down',
      icon: Eye,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Engagement",
      value: formatNumber(data.totalEngagement),
      change: `${data.engagementRate.toFixed(1)}%`,
      trend: 'up',
      icon: Heart,
      color: "from-pink-500 to-rose-600"
    },
    {
      title: "Total Posts",
      value: data.totalPosts.toString(),
      change: `${timeRange}`,
      trend: 'neutral',
      icon: BarChart3,
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Avg. Engagement",
      value: data.totalPosts > 0 ? formatNumber(Math.round(data.totalEngagement / data.totalPosts)) : '0',
      change: "per post",
      trend: 'up',
      icon: TrendingUp,
      color: "from-purple-500 to-violet-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Real-Time Analytics</h1>
              <p className="text-gray-600">Live insights from your social media performance</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            {/* Data Status Indicator */}
            <Badge
              variant={data && data.totalEngagement > 0 ? "default" : "secondary"}
              className="text-xs"
            >
              {data && data.totalEngagement > 0 ? "Real Data" : "No Engagement Data"}
            </Badge>

            <Button
              onClick={handleSyncRealData}
              variant="outline"
              size="sm"
              disabled={syncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Real Data'}
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {overviewStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-sm`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                            <Badge 
                              variant={stat.trend === 'up' ? 'default' : stat.trend === 'down' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {stat.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                              {stat.trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                              {stat.change}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="posts">Top Posts</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Weekly Trend */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span>Engagement Trend</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="likes" 
                      stackId="1"
                      stroke="#ec4899" 
                      fill="#ec4899" 
                      fillOpacity={0.6}
                      name="Likes"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="shares" 
                      stackId="1"
                      stroke="#06b6d4" 
                      fill="#06b6d4" 
                      fillOpacity={0.6}
                      name="Shares"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="comments" 
                      stackId="1"
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6}
                      name="Comments"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="platforms" className="space-y-6">
            {/* Platform Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Platform Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.platformBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="platform" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Bar dataKey="likes" fill="#ec4899" name="Likes" />
                      <Bar dataKey="shares" fill="#06b6d4" name="Shares" />
                      <Bar dataKey="comments" fill="#10b981" name="Comments" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Platform Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.platformBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="posts"
                        label={({ platform, posts }) => `${platform}: ${posts}`}
                      >
                        {data.platformBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <Heart className="h-12 w-12 text-pink-500 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-gray-900">{formatNumber(data.totalLikes)}</div>
                  <div className="text-sm text-gray-600">Total Likes</div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <Share2 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-gray-900">{formatNumber(data.totalShares)}</div>
                  <div className="text-sm text-gray-600">Total Shares</div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-gray-900">{formatNumber(data.totalComments)}</div>
                  <div className="text-sm text-gray-600">Total Comments</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            {/* Top Performing Posts */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Top Performing Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topPosts.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No posts with engagement data yet</p>
                    </div>
                  ) : (
                    data.topPosts.map((post, index) => (
                      <div key={post.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 line-clamp-2 mb-2">{post.content}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="capitalize">{post.platform}</span>
                              <div className="flex items-center space-x-1">
                                <Heart className="w-3 h-3" />
                                <span>{post.likes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Share2 className="w-3 h-3" />
                                <span>{post.shares}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="w-3 h-3" />
                                <span>{post.comments}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{post.totalEngagement}</div>
                            <div className="text-xs text-gray-500">Total Engagement</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debug" className="space-y-6">
            {/* Debug Information */}
            <EngagementDebug />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RealTimeAnalytics;

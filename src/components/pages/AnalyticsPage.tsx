import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Heart, 
  Share2, 
  MessageCircle,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedMetric, setSelectedMetric] = useState("engagement");

  // Mock analytics data
  const overviewStats = [
    {
      title: "Total Reach",
      value: "12.5K",
      change: "+15.3%",
      trend: "up",
      icon: Eye,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Engagement",
      value: "2.8K",
      change: "+8.7%",
      trend: "up",
      icon: Heart,
      color: "from-pink-500 to-rose-600"
    },
    {
      title: "Shares",
      value: "456",
      change: "-2.1%",
      trend: "down",
      icon: Share2,
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Comments",
      value: "189",
      change: "+12.4%",
      trend: "up",
      icon: MessageCircle,
      color: "from-purple-500 to-violet-600"
    }
  ];

  const engagementData = [
    { name: 'Mon', likes: 45, shares: 12, comments: 8 },
    { name: 'Tue', likes: 52, shares: 18, comments: 12 },
    { name: 'Wed', likes: 38, shares: 9, comments: 6 },
    { name: 'Thu', likes: 67, shares: 24, comments: 15 },
    { name: 'Fri', likes: 89, shares: 31, comments: 22 },
    { name: 'Sat', likes: 76, shares: 28, comments: 18 },
    { name: 'Sun', likes: 58, shares: 19, comments: 11 }
  ];

  const platformData = [
    { name: 'Twitter', posts: 24, engagement: 68, color: '#1DA1F2' },
    { name: 'LinkedIn', posts: 18, engagement: 45, color: '#0077B5' },
    { name: 'Instagram', posts: 32, engagement: 89, color: '#E4405F' },
    { name: 'Facebook', posts: 15, engagement: 34, color: '#1877F2' }
  ];

  const topPosts = [
    {
      id: 1,
      content: "🚀 Excited to share our latest product update! New features that will revolutionize your workflow.",
      platform: "Twitter",
      engagement: 156,
      reach: 2400,
      date: "2024-01-14"
    },
    {
      id: 2,
      content: "Behind the scenes of our amazing team working on innovative solutions for the future.",
      platform: "LinkedIn",
      engagement: 89,
      reach: 1800,
      date: "2024-01-13"
    },
    {
      id: 3,
      content: "Check out this stunning visual representation of our growth journey! 📈",
      platform: "Instagram",
      engagement: 234,
      reach: 3200,
      date: "2024-01-12"
    }
  ];

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
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
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            
            <Button variant="outline" className="border-gray-200 hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {overviewStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-xl`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className={`flex items-center space-x-1 text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Engagement Trend */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Engagement Trend</h3>
                <p className="text-sm text-gray-600">Daily engagement over the past week</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Likes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Shares</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Comments</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementData}>
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
                <Line type="monotone" dataKey="likes" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} />
                <Line type="monotone" dataKey="shares" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} />
                <Line type="monotone" dataKey="comments" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Performance */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Platform Performance</h3>
                <p className="text-sm text-gray-600">Posts and engagement by platform</p>
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
                <Bar dataKey="posts" fill="#3b82f6" name="Posts" radius={[4, 4, 0, 0]} />
                <Bar dataKey="engagement" fill="#8b5cf6" name="Engagement" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution & Top Posts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Platform Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Platform Distribution</h3>
                <p className="text-sm text-gray-600">Content distribution</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
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
                  stroke="white"
                  strokeWidth={2}
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Performing Posts */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Top Performing Posts</h3>
                <p className="text-sm text-gray-600">Your best content this period</p>
              </div>
              <Button variant="outline" size="sm">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-4">
              {topPosts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h4>
                  <p className="text-gray-600">Your top performing posts will appear here</p>
                </div>
              ) : (
                topPosts.map((post, index) => (
                  <div key={post.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-blue-600">{post.platform}</span>
                          <span className="text-xs text-gray-500">{post.date}</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2 mb-2">{post.content}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Heart className="h-3 w-3" />
                            <span>{post.engagement}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{post.reach}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
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
    </div>
  );
};

export default AnalyticsPage;

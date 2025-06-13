
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Clock, CheckCircle, BarChart3, Sparkles, TrendingUp, Users, Zap, ArrowUpRight, Star, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Analytics from "./Analytics";
import CreatePostModal from "./CreatePostModal";

const Dashboard = () => {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [postHistory, setPostHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
    
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch scheduled/draft posts
      const { data: scheduledPosts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch posted content history
      const { data: postedPosts } = await supabase
        .from('post_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setPosts(scheduledPosts || []);
      setPostHistory(postedPosts || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Posted": return "bg-green-100 text-green-800 border-green-200";
      case "Draft": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPlatformColor = (platform: string) => {
    const normalizedPlatform = platform?.toLowerCase();
    switch (normalizedPlatform) {
      case "linkedin": return "bg-blue-600";
      case "twitter": return "bg-sky-400";
      case "instagram": return "bg-gradient-to-r from-pink-500 to-purple-600";
      case "facebook": return "bg-blue-700";
      case "reddit": return "bg-orange-600";
      default: return "bg-gray-600";
    }
  };

  const totalPosts = posts.length + postHistory.length;
  const scheduledPosts = posts.filter(post => post.status?.toLowerCase() === 'scheduled');
  const publishedPosts = postHistory.filter(post => post.status === 'success');
  const upcomingPosts = scheduledPosts.filter(post => 
    post.scheduled_time && new Date(post.scheduled_time) > new Date()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl animate-pulse delay-500 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Enhanced Welcome Section */}
        <div className="text-center space-y-6 py-12">
          {/* Floating Achievement Badges */}
          <div className="flex justify-center space-x-4 mb-6">
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 shadow-lg animate-bounce">
              <Star className="w-4 h-4 mr-2" />
              Content Creator
            </Badge>
            <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 shadow-lg animate-bounce delay-300">
              <Zap className="w-4 h-4 mr-2" />
              AI Powered
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 px-4 leading-tight">
            <span className="inline-block">{greeting}!</span> <span className="inline-block">👋</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Ready to create amazing content? Let's turn your ideas into engaging social media posts with the power of AI.
          </p>

          {/* Enhanced CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 px-8 py-4 text-lg rounded-full group"
              onClick={() => navigate('/create')}
            >
              <Plus className="mr-2 group-hover:rotate-90 transition-transform duration-300" size={20} />
              Create New Post
              <Sparkles className="ml-2 group-hover:scale-110 transition-transform duration-300" size={16} />
            </Button>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>AI ready to assist</span>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs for Overview and Analytics */}
        <Tabs defaultValue="overview" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 bg-white shadow-xl rounded-full p-1 border-0">
            <TabsTrigger
              value="overview"
              className="flex items-center justify-center space-x-2 rounded-full data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:via-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 py-3 px-4 sm:px-6 text-gray-600 hover:text-gray-900 min-w-0"
            >
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base truncate">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center justify-center space-x-2 rounded-full data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:via-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 py-3 px-4 sm:px-6 text-gray-600 hover:text-gray-900 min-w-0"
            >
              <BarChart3 className="h-4 w-4 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base truncate">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 mt-8">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="group bg-white/80 backdrop-blur-sm border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-3xl border-0 overflow-hidden relative">
                {/* Floating Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                    📊 Total
                  </div>
                </div>
                <CardHeader className="pb-3 relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-full transform translate-x-8 -translate-y-8 opacity-50"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900">Total Posts</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">
                    {totalPosts}
                  </div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                    Across all platforms
                  </p>
                </CardContent>
              </Card>

              <Card className="group bg-white/80 backdrop-blur-sm border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-3xl border-0 overflow-hidden relative">
                {/* Floating Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg animate-pulse">
                    ⏰ Pending
                  </div>
                </div>
                <CardHeader className="pb-3 relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-full transform translate-x-8 -translate-y-8 opacity-50"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900">Scheduled</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
                    {scheduledPosts.length}
                  </div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Target className="w-4 h-4 mr-1 text-blue-500" />
                    Ready to publish
                  </p>
                </CardContent>
              </Card>

              <Card className="group bg-white/80 backdrop-blur-sm border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 rounded-3xl border-0 overflow-hidden relative">
                {/* Floating Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                    ✅ Live
                  </div>
                </div>
                <CardHeader className="pb-3 relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-full transform translate-x-8 -translate-y-8 opacity-50"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900">Published</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
                    {publishedPosts.length}
                  </div>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Users className="w-4 h-4 mr-1 text-green-500" />
                    Successfully posted
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Upcoming Posts */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-2xl rounded-3xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full transform translate-x-8 -translate-y-8"></div>
                <div className="relative z-10">
                  <CardTitle className="flex items-center space-x-3 text-xl font-bold text-gray-900">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <span>Upcoming Posts</span>
                    <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                      {upcomingPosts.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    Your scheduled posts ready to go live
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {upcomingPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Calendar className="h-12 w-12 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming posts scheduled</h3>
                    <p className="text-gray-600 mb-6">Create your first post to get started!</p>
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-full px-8 py-3"
                      onClick={() => navigate('/create')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create & Schedule Post
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingPosts.slice(0, 5).map((post, index) => (
                      <div key={post.id} className="group p-6 bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 truncate max-w-md mb-3 group-hover:text-blue-600 transition-colors duration-200">
                              {post.generated_text || post.prompt}
                            </h4>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <div className={`w-4 h-4 rounded-full ${getPlatformColor(post.platform)} shadow-sm`}></div>
                                <span className="text-sm font-medium text-gray-700 capitalize">{post.platform}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {new Date(post.scheduled_time).toLocaleDateString()} at{" "}
                                  {new Date(post.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className={`${getStatusColor(post.status)} shadow-sm`}>
                              {post.status}
                            </Badge>
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors duration-200">
                              <span className="text-xs font-bold">#{index + 1}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {upcomingPosts.length > 5 && (
                      <Link to="/posts">
                        <Button variant="outline" className="w-full mt-4 rounded-full border-2 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200">
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          View All Posts ({upcomingPosts.length - 5} more)
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-8">
            <Analytics />
          </TabsContent>
        </Tabs>

        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    </div>
  );
};

export default Dashboard;

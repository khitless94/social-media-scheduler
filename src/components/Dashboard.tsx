
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Clock, CheckCircle, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Analytics from "./Analytics";
import CreatePostModal from "./CreatePostModal";

const Dashboard = () => {
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
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {greeting}! 👋
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Ready to create amazing content? Let's turn your ideas into engaging social media posts with the power of AI.
        </p>
        <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2" size={20} />
          Create New Post
        </Button>
      </div>

      {/* Tabs for Overview and Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/70 backdrop-blur-sm border-white/20 hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{totalPosts}</div>
                <p className="text-xs text-gray-600">Across all platforms</p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-white/20 hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {scheduledPosts.length}
                </div>
                <p className="text-xs text-gray-600">Ready to publish</p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-white/20 hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {publishedPosts.length}
                </div>
                <p className="text-xs text-gray-600">Successfully posted</p>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Posts */}
          <Card className="bg-white/70 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Upcoming Posts</span>
              </CardTitle>
              <CardDescription>
                Your scheduled posts ready to go live
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingPosts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No upcoming posts scheduled</p>
                  <p className="text-sm">Create your first post to get started!</p>
                  <Button className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" onClick={() => setShowCreateModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create & Schedule Post
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingPosts.slice(0, 5).map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-white/30 hover:shadow-md transition-shadow duration-200">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 truncate max-w-md">
                          {post.generated_text || post.prompt}
                        </h4>
                        <div className="flex items-center space-x-3 mt-2">
                          <div className={`w-3 h-3 rounded-full ${getPlatformColor(post.platform)}`}></div>
                          <span className="text-sm text-gray-600 capitalize">{post.platform}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(post.scheduled_time).toLocaleDateString()} at{" "}
                            {new Date(post.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(post.status)}>
                        {post.status}
                      </Badge>
                    </div>
                  ))}
                  {upcomingPosts.length > 5 && (
                    <Link to="/posts">
                      <Button variant="outline" className="w-full">
                        View All Posts
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics />
        </TabsContent>
      </Tabs>

      <CreatePostModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  );
};

export default Dashboard;

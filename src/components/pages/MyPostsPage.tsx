import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Share2,
  Calendar,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  BarChart3,
  ExternalLink
} from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MyPostsPage = () => {
  console.log('🚀 [MyPostsPage] Component is rendering!');

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  // Use real data from Supabase
  console.log('🔍 [MyPostsPage] About to call usePosts with filters:', {
    status: statusFilter,
    platform: platformFilter,
    search: searchTerm
  });

  const {
    posts,
    loading,
    error,
    deletePost,
    refreshPosts,
    stats
  } = usePosts({
    status: statusFilter,
    platform: platformFilter,
    search: searchTerm
  });

  console.log('🔍 [MyPostsPage] usePosts returned:', {
    posts: posts?.length || 0,
    loading,
    error,
    stats
  });

  // Add a test button to create a sample post for debugging
  const createTestPost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user found for test post creation');
        return;
      }

      console.log('🧪 Creating test post for user:', user.id);

      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            content: 'This is a test post created on ' + new Date().toLocaleString(),
            platform: 'twitter',
            status: 'draft',
            platform_post_ids: {},
            engagement_stats: {},
            generated_by_ai: false,
            retry_count: 0
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating test post:', error);
      } else {
        console.log('✅ Test post created:', data);
        refreshPosts(); // Refresh the posts list
      }
    } catch (err) {
      console.error('❌ Exception creating test post:', err);
    }
  };

  // Debug logging
  console.log('🔍 [MyPostsPage] Render state:', {
    posts: posts?.length || 0,
    loading,
    error,
    statusFilter,
    platformFilter,
    searchTerm
  });

  const handleDeletePost = async (id: string) => {
    try {
      await deletePost(id);
      toast.success("Post deleted successfully");
    } catch (error) {
      toast.error("Failed to delete post");
      console.error("Delete error:", error);
    }
  };

  const handleRefresh = () => {
    refreshPosts();
    toast.success("Posts refreshed");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-700 border-green-200";
      case "scheduled": return "bg-orange-100 text-orange-700 border-orange-200";
      case "draft": return "bg-gray-100 text-gray-700 border-gray-200";
      case "failed": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter": return "text-sky-600";
      case "linkedin": return "text-blue-600";
      case "instagram": return "text-pink-600";
      case "facebook": return "text-blue-700";
      case "reddit": return "text-orange-600";
      default: return "text-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPlatform = (platform: string) => {
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-semibold text-gray-900">Content Library</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>

              <Button
                onClick={createTestPost}
                variant="outline"
                className="px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <span>🧪 Create Test Post</span>
              </Button>

              <Button
                onClick={() => navigate('/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Post</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Posts</h1>
              <p className="text-gray-600">Manage all your social media posts, drafts, and scheduled content</p>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
              <Plus className="h-5 w-5 mr-2" />
              Create Post
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.total}</h3>
            <p className="text-sm text-gray-600">All Posts</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl">
                <Edit className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full">Draft</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.drafts}</h3>
            <p className="text-sm text-gray-600">Drafts</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Queue</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.scheduled}</h3>
            <p className="text-sm text-gray-600">Scheduled</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Live</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.published}</h3>
            <p className="text-sm text-gray-600">Published</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">Failed</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{loading ? '...' : stats.failed}</h3>
            <p className="text-sm text-gray-600">Failed</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="failed">Failed</option>
              </select>
              
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="all">All Platforms</option>
                <option value="twitter">Twitter</option>
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="reddit">Reddit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Posts Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter} className="w-full">
            {/* Tab Navigation */}
            <div className="border-b border-gray-100 bg-gray-50/50">
              <TabsList className="grid w-full grid-cols-5 bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="all"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none py-4 px-6 font-semibold transition-all"
                >
                  All Posts
                </TabsTrigger>
                <TabsTrigger
                  value="draft"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-500 data-[state=active]:bg-transparent data-[state=active]:text-gray-600 data-[state=active]:shadow-none py-4 px-6 font-semibold transition-all"
                >
                  Drafts
                </TabsTrigger>
                <TabsTrigger
                  value="scheduled"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-orange-600 data-[state=active]:shadow-none py-4 px-6 font-semibold transition-all"
                >
                  Scheduled
                </TabsTrigger>
                <TabsTrigger
                  value="published"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent data-[state=active]:text-green-600 data-[state=active]:shadow-none py-4 px-6 font-semibold transition-all"
                >
                  Published
                </TabsTrigger>
                <TabsTrigger
                  value="failed"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent data-[state=active]:text-red-600 data-[state=active]:shadow-none py-4 px-6 font-semibold transition-all"
                >
                  Failed
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <TabsContent value={statusFilter} className="mt-0">
                {error ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading posts</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={handleRefresh} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading posts...</h3>
                    <p className="text-gray-600">Please wait while we fetch your content</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts found</h3>
                    <p className="text-gray-600 mb-4">Create your first post to get started</p>
                    <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div key={post.id} className="p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Badge className={`${getStatusColor(post.status)} border`}>
                              {post.status === 'published' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {post.status === 'scheduled' && <Clock className="h-3 w-3 mr-1" />}
                              {post.status === 'draft' && <Edit className="h-3 w-3 mr-1" />}
                              {post.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                              {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                            </Badge>
                            <span className={`text-sm font-medium ${getPlatformColor(post.platform)}`}>
                              {formatPlatform(post.platform)}
                            </span>
                            {post.generated_by_ai && (
                              <Badge variant="secondary" className="text-xs">
                                AI Generated
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {post.image_url && (
                          <div className="mb-4">
                            <img
                              src={post.image_url}
                              alt="Post image"
                              className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                        )}

                        <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>

                        {post.error_message && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">
                              <AlertCircle className="h-4 w-4 inline mr-1" />
                              {post.error_message}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            {post.status === 'scheduled' && post.scheduled_at && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>Scheduled for {formatDate(post.scheduled_at)}</span>
                              </div>
                            )}
                            {post.status === 'published' && post.published_at && (
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="h-4 w-4" />
                                <span>Published {formatDate(post.published_at)}</span>
                              </div>
                            )}
                            {post.status === 'published' && Object.keys(post.engagement_stats).length > 0 && (
                              <div className="flex items-center space-x-4">
                                {Object.entries(post.engagement_stats).map(([platform, stats]: [string, any]) => (
                                  <div key={platform} className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-400">{platform}:</span>
                                    {stats.likes && (
                                      <span className="flex items-center space-x-1">
                                        <Eye className="h-3 w-3" />
                                        <span>{stats.likes}</span>
                                      </span>
                                    )}
                                    {stats.shares && (
                                      <span className="flex items-center space-x-1">
                                        <Share2 className="h-3 w-3" />
                                        <span>{stats.shares}</span>
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <span>Created {formatDate(post.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
        </div>
      </div>
    </div>
  );
};

export default MyPostsPage;

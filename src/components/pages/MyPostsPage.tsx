import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  MoreHorizontal
} from "lucide-react";

const MyPostsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  // Mock data - replace with actual data fetching
  const posts = [
    {
      id: 1,
      content: "🚀 Excited to share our latest product update! New features that will revolutionize your workflow. Check it out and let us know what you think! #ProductUpdate #Innovation",
      platform: "Twitter",
      status: "published",
      scheduledFor: "2024-01-15 10:00 AM",
      engagement: { likes: 45, shares: 12, comments: 8 },
      createdAt: "2024-01-14"
    },
    {
      id: 2,
      content: "Behind the scenes of our amazing team working on innovative solutions for the future. Teamwork makes the dream work! 💪",
      platform: "LinkedIn",
      status: "scheduled",
      scheduledFor: "2024-01-16 9:00 AM",
      engagement: { likes: 0, shares: 0, comments: 0 },
      createdAt: "2024-01-14"
    },
    {
      id: 3,
      content: "Check out this stunning visual representation of our growth journey! 📈 From startup to success story.",
      platform: "Instagram",
      status: "draft",
      scheduledFor: null,
      engagement: { likes: 0, shares: 0, comments: 0 },
      createdAt: "2024-01-13"
    }
  ];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    const matchesPlatform = platformFilter === "all" || post.platform.toLowerCase() === platformFilter;
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-700 border-green-200";
      case "scheduled": return "bg-orange-100 text-orange-700 border-orange-200";
      case "draft": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter": return "text-sky-600";
      case "linkedin": return "text-blue-600";
      case "instagram": return "text-pink-600";
      case "facebook": return "text-blue-700";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Posts</h1>
              <p className="text-gray-600">Manage and track your content across all platforms</p>
            </div>
          </div>
          
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
            <Plus className="h-5 w-5 mr-2" />
            Create Post
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{posts.length}</h3>
            <p className="text-sm text-gray-600">All Posts</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl">
                <Edit className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full">Draft</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{posts.filter(p => p.status === 'draft').length}</h3>
            <p className="text-sm text-gray-600">Drafts</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Queue</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{posts.filter(p => p.status === 'scheduled').length}</h3>
            <p className="text-sm text-gray-600">Scheduled</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Live</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{posts.filter(p => p.status === 'published').length}</h3>
            <p className="text-sm text-gray-600">Published</p>
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
              </select>
            </div>
          </div>
        </div>

        {/* Posts Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter} className="w-full">
            {/* Tab Navigation */}
            <div className="border-b border-gray-100 bg-gray-50/50">
              <TabsList className="grid w-full grid-cols-4 bg-transparent p-0 h-auto">
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
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <TabsContent value={statusFilter} className="mt-0">
                {filteredPosts.length === 0 ? (
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
                    {filteredPosts.map((post) => (
                      <div key={post.id} className="p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Badge className={`${getStatusColor(post.status)} border`}>
                              {post.status === 'published' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {post.status === 'scheduled' && <Clock className="h-3 w-3 mr-1" />}
                              {post.status === 'draft' && <Edit className="h-3 w-3 mr-1" />}
                              {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                            </Badge>
                            <span className={`text-sm font-medium ${getPlatformColor(post.platform)}`}>
                              {post.platform}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            {post.status === 'scheduled' && post.scheduledFor && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>Scheduled for {post.scheduledFor}</span>
                              </div>
                            )}
                            {post.status === 'published' && (
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center space-x-1">
                                  <Eye className="h-4 w-4" />
                                  <span>{post.engagement.likes}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Share2 className="h-4 w-4" />
                                  <span>{post.engagement.shares}</span>
                                </span>
                              </div>
                            )}
                          </div>
                          <span>Created {post.createdAt}</span>
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
  );
};

export default MyPostsPage;

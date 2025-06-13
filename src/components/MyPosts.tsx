// Refactored MyPosts.tsx with typing & state fix
import { useState, useEffect, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/posts/PostCard";
import { PostFilters } from "@/components/posts/PostFilters";
import { EmptyState } from "@/components/posts/EmptyState";
import { EditPostModal } from "@/components/posts/EditPostModal";
import { usePostManagement } from "@/hooks/usePostManagement";
import { FileText } from "lucide-react";
import {
  getStatusColor,
  getPlatformColor,
  filterPosts,
  groupPostsByStatus
} from "@/utils/postUtils";

export type TabType = "all" | "draft" | "scheduled" | "posted";

const MyPosts = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<TabType>("all");
  const [editingPost, setEditingPost] = useState<any>(null);

  const {
    posts,
    loading,
    fetchPosts,
    deletePost,
    editPost
  } = usePostManagement();

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]); // Now safe to depend on fetchPosts since it's memoized

  // Remove debug logging to reduce console noise

  const handleEditPost = useCallback((post: any) => {
    setEditingPost(post);
  }, []);

  const handleSaveEdit = useCallback(async (postId: string, updatedData: any) => {
    await editPost(postId, updatedData);
    // editPost already calls fetchPosts internally, no need to call it again
    setEditingPost(null);
  }, [editPost]);

  const handleDeletePost = useCallback(async (postId: string, isHistoryPost: boolean) => {
    await deletePost(postId, isHistoryPost);
    // fetchPosts is already called inside deletePost hook
  }, [deletePost]);



  const filteredPosts = useMemo(() =>
    filterPosts(posts, searchTerm, platformFilter, statusFilter),
    [posts, searchTerm, platformFilter, statusFilter]
  );

  const groupedPosts = useMemo(() =>
    groupPostsByStatus(filteredPosts),
    [filteredPosts]
  );

  const renderPosts = useCallback((type: TabType) => {
    const postGroup = type === "all" ? filteredPosts : groupedPosts[type];
    if (!postGroup || postGroup.length === 0) {
      return <EmptyState type={type} />;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {postGroup.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
            getStatusColor={getStatusColor}
            getPlatformColor={getPlatformColor}
          />
        ))}
      </div>
    );
  }, [filteredPosts, groupedPosts, handleEditPost, handleDeletePost, getStatusColor, getPlatformColor]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/15 to-purple-400/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400/15 to-blue-400/15 rounded-full blur-2xl animate-pulse delay-500 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-6 py-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">{filteredPosts.length}</span>
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            My Content Hub
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Manage all your social media content in one powerful dashboard.
            <span className="text-purple-600 font-semibold"> Track, edit, and optimize</span> your posts across all platforms.
          </p>

          {/* Quick Stats */}
          <div className="flex justify-center space-x-8 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{filteredPosts.length}</div>
              <div className="text-sm text-gray-500">Total Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{groupedPosts.scheduled.length}</div>
              <div className="text-sm text-gray-500">Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{groupedPosts.posted.length}</div>
              <div className="text-sm text-gray-500">Published</div>
            </div>
          </div>
        </div>

      <PostFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        platformFilter={platformFilter}
        setPlatformFilter={setPlatformFilter}
        statusFilter={statusFilter}
        setStatusFilter={(value: string) => setStatusFilter(value as TabType)}
      />

        <Tabs defaultValue="all" value={statusFilter} onValueChange={(val) => setStatusFilter(val as TabType)} className="space-y-8 max-w-6xl mx-auto">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl p-2 border-0">
            <TabsTrigger
              value="all"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 py-3 px-4 font-semibold"
            >
              All ({filteredPosts.length})
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-600 data-[state=active]:to-gray-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 py-3 px-4 font-semibold"
            >
              Drafts ({groupedPosts.draft.length})
            </TabsTrigger>
            <TabsTrigger
              value="scheduled"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 py-3 px-4 font-semibold"
            >
              Scheduled ({groupedPosts.scheduled.length})
            </TabsTrigger>
            <TabsTrigger
              value="posted"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 py-3 px-4 font-semibold"
            >
              Posted ({groupedPosts.posted.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-8">{renderPosts("all")}</TabsContent>
          <TabsContent value="draft" className="mt-8">{renderPosts("draft")}</TabsContent>
          <TabsContent value="scheduled" className="mt-8">{renderPosts("scheduled")}</TabsContent>
          <TabsContent value="posted" className="mt-8">{renderPosts("posted")}</TabsContent>
        </Tabs>

        <EditPostModal
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          post={editingPost}
          onSave={handleSaveEdit}
        />
      </div>
    </div>
  );
};

export default MyPosts;

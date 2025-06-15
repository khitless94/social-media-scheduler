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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Modern Header */}
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

          <div className="flex items-center space-x-3">
            <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 shadow-lg hover:shadow-xl">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Post</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{filteredPosts.length}</h3>
            <p className="text-sm text-gray-600">All Posts</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-full">Draft</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{groupedPosts.draft.length}</h3>
            <p className="text-sm text-gray-600">Drafts</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Queue</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{groupedPosts.scheduled.length}</h3>
            <p className="text-sm text-gray-600">Scheduled</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Live</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{groupedPosts.posted.length}</h3>
            <p className="text-sm text-gray-600">Published</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <PostFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            platformFilter={platformFilter}
            setPlatformFilter={setPlatformFilter}
            statusFilter={statusFilter}
            setStatusFilter={(value: string) => setStatusFilter(value as TabType)}
          />
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Tabs defaultValue="all" value={statusFilter} onValueChange={(val) => setStatusFilter(val as TabType)} className="w-full">
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
                  value="posted"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent data-[state=active]:text-green-600 data-[state=active]:shadow-none py-4 px-6 font-semibold transition-all"
                >
                  Published
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <TabsContent value="all" className="mt-0">{renderPosts("all")}</TabsContent>
              <TabsContent value="draft" className="mt-0">{renderPosts("draft")}</TabsContent>
              <TabsContent value="scheduled" className="mt-0">{renderPosts("scheduled")}</TabsContent>
              <TabsContent value="posted" className="mt-0">{renderPosts("posted")}</TabsContent>
            </div>
          </Tabs>
        </div>

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

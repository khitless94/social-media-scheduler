// Refactored MyPosts.tsx with typing & state fix
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/posts/PostCard";
import { PostFilters } from "@/components/posts/PostFilters";
import { EmptyState } from "@/components/posts/EmptyState";
import { EditPostModal } from "@/components/posts/EditPostModal";
import { usePostManagement } from "@/hooks/usePostManagement";
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
  }, [fetchPosts]);

  const handleEditPost = (post: any) => {
    setEditingPost(post);
  };

  const handleSaveEdit = async (postId: string, updatedData: any) => {
    await editPost(postId, updatedData);
    fetchPosts();
    setEditingPost(null);
  };

  const handleDeletePost = async (postId: string) => {
    await deletePost(postId);
    await fetchPosts(); // Ensure refresh happens after deletion
  };

  const filteredPosts = filterPosts(posts, searchTerm, platformFilter, statusFilter);
  const groupedPosts = groupPostsByStatus(filteredPosts);

  const renderPosts = (type: TabType) => {
    const postGroup = type === "all" ? filteredPosts : groupedPosts[type];
    if (!postGroup || postGroup.length === 0) {
      return <EmptyState type={type} />;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {postGroup.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onEdit={handleEditPost}
            onDelete={() => handleDeletePost(post.id)}
            getStatusColor={getStatusColor}
            getPlatformColor={getPlatformColor}
          />
        ))}
      </div>
    );
  };

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
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          My Posts
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Manage all your social media content in one place.
        </p>
      </div>

      <PostFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        platformFilter={platformFilter}
        setPlatformFilter={setPlatformFilter}
        statusFilter={statusFilter}
        setStatusFilter={(value: string) => setStatusFilter(value as TabType)}
      />

      <Tabs defaultValue="all" value={statusFilter} onValueChange={(val) => setStatusFilter(val as TabType)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm">
          <TabsTrigger value="all">All ({filteredPosts.length})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({groupedPosts.draft.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({groupedPosts.scheduled.length})</TabsTrigger>
          <TabsTrigger value="posted">Posted ({groupedPosts.posted.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderPosts("all")}</TabsContent>
        <TabsContent value="draft">{renderPosts("draft")}</TabsContent>
        <TabsContent value="scheduled">{renderPosts("scheduled")}</TabsContent>
        <TabsContent value="posted">{renderPosts("posted")}</TabsContent>
      </Tabs>

      <EditPostModal
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        post={editingPost}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default MyPosts;

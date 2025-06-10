export const getStatusColor = (status: string) => {
  switch (status) {
    case "scheduled": 
    case "Scheduled": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Posted": 
    case "success": return "bg-green-100 text-green-800 border-green-200";
    case "draft": 
    case "Draft": return "bg-gray-100 text-gray-800 border-gray-200";
    case "Failed": 
    case "failed": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const getPlatformColor = (platform: string) => {
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

export const filterPosts = (
  posts: any[],
  searchTerm: string,
  platformFilter: string,
  statusFilter: string
) => {
  return posts.filter(post => {
    const matchesSearch = post.generated_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.prompt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === "all" || 
                           post.platform?.toLowerCase() === platformFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || 
                         post.status?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesPlatform && matchesStatus;
  });
};

export const groupPostsByStatus = (posts: any[]) => {
  return {
    draft: posts.filter(post => post.status?.toLowerCase() === "draft"),
    scheduled: posts.filter(post => post.status?.toLowerCase() === "scheduled"),
    posted: posts.filter(post => ["posted", "success"].includes(post.status?.toLowerCase())),
  };
};
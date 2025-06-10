import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar, Clock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface PostCardProps {
  post: any;
  onEdit: (post: any) => void;
  onDelete: (postId: string, isHistoryPost: boolean) => void;
  getStatusColor: (status: string) => string;
  getPlatformColor: (platform: string) => string;
}

export const PostCard = ({ post, onEdit, onDelete, getStatusColor, getPlatformColor }: PostCardProps) => {
  const isHistoryPost = post.prompt === 'Manual Post';
  
  return (
    <Card className="bg-white/70 backdrop-blur-sm border-white/20 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${getPlatformColor(post.platform)}`}></div>
            <span className="font-medium text-gray-900 capitalize">{post.platform}</span>
            <Badge className={getStatusColor(post.status)}>
              {post.status === 'success' ? 'Posted' : post.status}
            </Badge>
          </div>
          <div className="flex space-x-2">
            {!isHistoryPost && post.status?.toLowerCase() !== 'posted' && (
              <Button 
                variant="ghost" 
                size="sm" 
                title="Edit post"
                onClick={() => onEdit(post)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" title="Delete post">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Post</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this post? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(post.id, isHistoryPost)} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-gray-800 line-clamp-3">
          {post.generated_text || post.prompt}
        </p>
        {post.image_url && (
          <img 
            src={post.image_url} 
            alt="Post image" 
            className="w-full h-32 object-cover rounded-lg"
          />
        )}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </span>
          {post.scheduled_time && (
            <span className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>
                {new Date(post.scheduled_time).toLocaleDateString()} at{" "}
                {new Date(post.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
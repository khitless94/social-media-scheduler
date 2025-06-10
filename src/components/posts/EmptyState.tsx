import { Button } from "@/components/ui/button";
import { Calendar, Edit, Clock } from "lucide-react";

interface EmptyStateProps {
  type: 'all' | 'draft' | 'scheduled' | 'posted';
}

export const EmptyState = ({ type }: EmptyStateProps) => {
  const states = {
    all: {
      icon: Calendar,
      title: "No posts found",
      description: "Try adjusting your filters or create your first post.",
      showButton: true
    },
    draft: {
      icon: Edit,
      title: "No drafts",
      description: "All your posts are scheduled or published!",
      showButton: false
    },
    scheduled: {
      icon: Clock,
      title: "No scheduled posts",
      description: "Schedule your next post to see it here.",
      showButton: false
    },
    posted: {
      icon: Calendar,
      title: "No published posts",
      description: "Your published posts will appear here.",
      showButton: false
    }
  };

  const state = states[type];
  const IconComponent = state.icon;

  return (
    <div className="text-center py-12">
      <IconComponent className="h-16 w-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{state.title}</h3>
      <p className="text-gray-500 mb-4">{state.description}</p>
      {state.showButton && (
        <Button>Create New Post</Button>
      )}
    </div>
  );
};
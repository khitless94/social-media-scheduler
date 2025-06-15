import { Button } from "@/components/ui/button";
import { Calendar, Edit, Clock, Sparkles, CheckCircle, Target } from "lucide-react";

interface EmptyStateProps {
  type: 'all' | 'draft' | 'scheduled' | 'posted';
}

export const EmptyState = ({ type }: EmptyStateProps) => {
  const states = {
    all: {
      icon: Sparkles,
      title: "Create your first post",
      description: "Easy to get followers when they are most engaged! Design posts and schedule when to post.",
      features: [
        "Choose from different post variations, including general",
        "Determine posting schedule according to you",
        "Use pre-designed templates to get started quickly"
      ],
      showButton: true,
      showFeatures: true
    },
    draft: {
      icon: Edit,
      title: "No drafts",
      description: "All your posts are scheduled or published!",
      features: [],
      showButton: false,
      showFeatures: false
    },
    scheduled: {
      icon: Clock,
      title: "No scheduled posts",
      description: "Schedule your next post to see it here.",
      features: [],
      showButton: false,
      showFeatures: false
    },
    posted: {
      icon: Calendar,
      title: "No published posts",
      description: "Your published posts will appear here.",
      features: [],
      showButton: false,
      showFeatures: false
    }
  };

  const state = states[type];
  const IconComponent = state.icon;

  if (type === 'all' && state.showFeatures) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Illustration/Preview */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              {/* Mock social media post preview */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">SS</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">ScribeSchedule</div>
                    <div className="text-sm text-gray-500">2 hours ago</div>
                  </div>
                </div>

                <div className="text-gray-800 leading-relaxed">
                  🚀 Just launched our new AI-powered content creation feature!
                  Create engaging posts in seconds with smart suggestions and scheduling.

                  #SocialMedia #AI #ContentCreation
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-br from-blue-400 to-purple-500 h-24 rounded-lg"></div>
                  <div className="bg-gradient-to-br from-green-400 to-blue-500 h-24 rounded-lg"></div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-4 text-gray-500">
                    <span className="flex items-center space-x-1">
                      <span>❤️</span>
                      <span className="text-sm">24</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>💬</span>
                      <span className="text-sm">8</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>🔄</span>
                      <span className="text-sm">12</span>
                    </span>
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    ✓ Scheduled
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Content */}
          <div className="order-1 lg:order-2 text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{state.title}</h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">{state.description}</p>

            {/* Features list */}
            <div className="space-y-4 mb-8">
              {state.features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                <Sparkles className="w-4 h-4 mr-2" />
                Create with AI
              </Button>
              <Button variant="outline" className="px-6 py-3 rounded-xl font-medium border-gray-200 hover:bg-gray-50 transition-all duration-200">
                Create new
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default empty state for other types
  return (
    <div className="text-center py-12">
      <IconComponent className="h-16 w-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{state.title}</h3>
      <p className="text-gray-500 mb-4">{state.description}</p>
      {state.showButton && (
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
          Create New Post
        </Button>
      )}
    </div>
  );
};
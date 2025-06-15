import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Clock,
  CheckCircle,
  Edit,
  Filter,
  Grid3X3,
  List
} from "lucide-react";

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Mock scheduled posts data
  const scheduledPosts = [
    {
      id: 1,
      content: "🚀 Exciting product launch announcement!",
      platform: "Twitter",
      scheduledFor: new Date(2024, 0, 15, 10, 0),
      status: "scheduled"
    },
    {
      id: 2,
      content: "Behind the scenes content for our community",
      platform: "LinkedIn",
      scheduledFor: new Date(2024, 0, 16, 9, 0),
      status: "scheduled"
    },
    {
      id: 3,
      content: "Weekly team update and achievements",
      platform: "Instagram",
      scheduledFor: new Date(2024, 0, 18, 14, 30),
      status: "scheduled"
    }
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getPostsForDate = (date: Date) => {
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.scheduledFor);
      return postDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter": return "bg-sky-100 text-sky-700 border-sky-200";
      case "linkedin": return "bg-blue-100 text-blue-700 border-blue-200";
      case "instagram": return "bg-pink-100 text-pink-700 border-pink-200";
      case "facebook": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl shadow-lg">
              <CalendarIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
              <p className="text-gray-600">Plan and schedule your social media content</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "month" 
                    ? "bg-blue-500 text-white shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "list" 
                    ? "bg-blue-500 text-white shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
              <Plus className="h-5 w-5 mr-2" />
              Schedule Post
            </Button>
          </div>
        </div>

        {/* Calendar Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">This Month</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{scheduledPosts.length}</h3>
            <p className="text-sm text-gray-600">Scheduled Posts</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Today</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">0</h3>
            <p className="text-sm text-gray-600">Posts Today</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">This Week</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">2</h3>
            <p className="text-sm text-gray-600">Posts This Week</p>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {viewMode === "month" ? (
            <>
              {/* Calendar Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth("prev")}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                      className="px-3 py-1 text-sm"
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth("next")}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-6">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {dayNames.map(day => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentDate).map((date, index) => {
                    if (!date) {
                      return <div key={index} className="h-24 p-2"></div>;
                    }

                    const postsForDate = getPostsForDate(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isSelected = selectedDate?.toDateString() === date.toDateString();

                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedDate(date)}
                        className={`h-24 p-2 border border-gray-100 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                          isToday ? "bg-blue-50 border-blue-200" : ""
                        } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
                      >
                        <div className={`text-sm font-medium mb-1 ${
                          isToday ? "text-blue-600" : "text-gray-900"
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {postsForDate.slice(0, 2).map(post => (
                            <div
                              key={post.id}
                              className={`text-xs px-2 py-1 rounded border ${getPlatformColor(post.platform)} truncate`}
                            >
                              {post.platform}
                            </div>
                          ))}
                          {postsForDate.length > 2 && (
                            <div className="text-xs text-gray-500 px-2">
                              +{postsForDate.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* List View */
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Upcoming Posts</h3>
              {scheduledPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No scheduled posts</h3>
                  <p className="text-gray-600 mb-4">Schedule your first post to see it here</p>
                  <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Post
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledPosts
                    .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())
                    .map(post => (
                      <div key={post.id} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Badge className={`${getPlatformColor(post.platform)} border`}>
                                {post.platform}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {post.scheduledFor.toLocaleDateString()} at {post.scheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-gray-700 line-clamp-2">{post.content}</p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Clock className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;

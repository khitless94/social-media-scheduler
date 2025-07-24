import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  FileImage, 
  Video, 
  File, 
  Star, 
  Calendar,
  Download,
  Eye,
  Share2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MediaAnalytics {
  totalItems: number;
  totalSize: number;
  totalFavorites: number;
  totalFolders: number;
  mostUsedMedia: Array<{
    name: string;
    usage_count: number;
    url: string;
    type: string;
  }>;
  recentUploads: Array<{
    name: string;
    type: string;
    size: number;
    created_at: string;
  }>;
  storageByType: {
    image?: { count: number; total_size: number };
    video?: { count: number; total_size: number };
    document?: { count: number; total_size: number };
  };
}

export function MediaAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<MediaAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get basic stats
      const { data: mediaItems, error: mediaError } = await supabase
        .from('media_library')
        .select('*')
        .eq('user_id', user.id);

      if (mediaError) throw mediaError;

      // Get folder count
      const { data: folders, error: folderError } = await supabase
        .from('media_folders')
        .select('id')
        .eq('user_id', user.id);

      if (folderError) throw folderError;

      // Process analytics
      const totalItems = mediaItems?.length || 0;
      const totalSize = mediaItems?.reduce((sum, item) => sum + item.size, 0) || 0;
      const totalFavorites = mediaItems?.filter(item => item.is_favorite).length || 0;
      const totalFolders = folders?.length || 0;

      // Most used media
      const mostUsedMedia = mediaItems
        ?.sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 5)
        .map(item => ({
          name: item.name,
          usage_count: item.usage_count,
          url: item.url,
          type: item.type
        })) || [];

      // Recent uploads
      const recentUploads = mediaItems
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(item => ({
          name: item.name,
          type: item.type,
          size: item.size,
          created_at: item.created_at
        })) || [];

      // Storage by type
      const storageByType = mediaItems?.reduce((acc, item) => {
        if (!acc[item.type]) {
          acc[item.type] = { count: 0, total_size: 0 };
        }
        acc[item.type].count++;
        acc[item.type].total_size += item.size;
        return acc;
      }, {} as any) || {};

      setAnalytics({
        totalItems,
        totalSize,
        totalFavorites,
        totalFolders,
        mostUsedMedia,
        recentUploads,
        storageByType
      });

    } catch (error) {
      console.error('Error loading media analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <FileImage className="w-4 h-4 text-blue-500" />;
      case 'video': return <Video className="w-4 h-4 text-purple-500" />;
      default: return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image': return 'bg-blue-500';
      case 'video': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics available</h3>
        <p className="text-gray-600">Upload some media to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileImage className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{analytics.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold">{formatFileSize(analytics.totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Favorites</p>
                <p className="text-2xl font-bold">{analytics.totalFavorites}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Folders</p>
                <p className="text-2xl font-bold">{analytics.totalFolders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="storage">Storage Breakdown</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Most Used Media</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.mostUsedMedia.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No usage data available yet</p>
              ) : (
                <div className="space-y-4">
                  {analytics.mostUsedMedia.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.type === 'image' ? (
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {getFileIcon(item.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                        <p className="text-sm text-gray-500">Used {item.usage_count} times</p>
                      </div>
                      <Badge variant="secondary">{item.usage_count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Storage by Type</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.storageByType).map(([type, data]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(type)}
                        <span className="font-medium capitalize">{type}s</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{data.count} files</p>
                        <p className="text-xs text-gray-500">{formatFileSize(data.total_size)}</p>
                      </div>
                    </div>
                    <Progress 
                      value={(data.total_size / analytics.totalSize) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Recent Uploads</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.recentUploads.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No recent uploads</p>
              ) : (
                <div className="space-y-3">
                  {analytics.recentUploads.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(item.type)}
                        <div>
                          <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(item.size)} • {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {item.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

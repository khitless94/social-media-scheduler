import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from './ui/use-toast';
import { 
  Upload, 
  FolderPlus, 
  Search, 
  Grid, 
  List, 
  Trash2, 
  Edit, 
  Download,
  Eye,
  Heart,
  HeartOff,
  Folder,
  Image as ImageIcon,
  Video,
  Filter,
  TrendingUp,
  BarChart3,
  Users,
  Clock
} from 'lucide-react';
import { MediaAnalytics } from './MediaAnalytics';

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  size: number;
  folder_id?: string;
  tags: string[];
  description?: string;
  alt_text?: string;
  usage_count: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

interface MediaFolder {
  id: string;
  name: string;
  description?: string;
  parent_folder_id?: string;
  created_at: string;
  updated_at: string;
}

export function MediaLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    if (user) {
      loadMediaLibrary();
      loadFolders();
    }
  }, [user]);

  const loadMediaLibrary = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMediaItems(data || []);
    } catch (error) {
      console.error('Error loading media library:', error);
      toast({
        title: "Error loading media",
        description: "Failed to load your media library. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('media_folders')
        .select('*')
        .order('name');

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  // Filter media items
  const filteredMedia = mediaItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFolder = selectedFolder ? item.folder_id === selectedFolder : true;
    const matchesType = filterType === 'all' || item.type === filterType;
    
    return matchesSearch && matchesFolder && matchesType;
  });

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    setUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        // Validate file type
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        if (!isImage && !isVideo) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported image or video file.`,
            variant: "destructive",
          });
          continue;
        }

        // Upload to storage
        const fileName = `${user.id}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media-library')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media-library')
          .getPublicUrl(fileName);

        // Save to database
        const { error: dbError } = await supabase
          .from('media_library')
          .insert({
            user_id: user.id,
            name: file.name,
            url: publicUrl,
            type: isImage ? 'image' : 'video',
            size: file.size,
            folder_id: selectedFolder,
          });

        if (dbError) throw dbError;
      }

      toast({
        title: "Upload successful",
        description: `${files.length} file(s) uploaded successfully.`,
      });

      loadMediaLibrary();
      setShowUploadDialog(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (item: MediaItem) => {
    try {
      const { error } = await supabase
        .from('media_library')
        .update({ is_favorite: !item.is_favorite })
        .eq('id', item.id);

      if (error) throw error;
      
      setMediaItems(prev => prev.map(media => 
        media.id === item.id ? { ...media, is_favorite: !media.is_favorite } : media
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Create new folder
  const createFolder = async () => {
    if (!newFolderName.trim() || !user) return;

    setCreatingFolder(true);
    try {
      const { error } = await supabase
        .from('media_folders')
        .insert({
          user_id: user.id,
          name: newFolderName.trim(),
          description: newFolderDescription.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Folder created",
        description: `Folder "${newFolderName}" has been created.`,
      });

      setNewFolderName('');
      setNewFolderDescription('');
      setShowCreateFolder(false);
      loadFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Create failed",
        description: "Failed to create folder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingFolder(false);
    }
  };

  // Delete folder
  const deleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Are you sure you want to delete the folder "${folderName}"? This will also delete all media files in this folder.`)) {
      return;
    }

    setDeletingFolder(folderId);
    try {
      // First, get all media items in this folder
      const { data: mediaInFolder, error: mediaError } = await supabase
        .from('media_library')
        .select('*')
        .eq('folder_id', folderId);

      if (mediaError) throw mediaError;

      // Delete all media files from storage
      if (mediaInFolder && mediaInFolder.length > 0) {
        const filesToDelete = mediaInFolder.map(item => {
          const fileName = item.url.split('/').pop();
          return `${user?.id}/${fileName}`;
        }).filter(Boolean);

        if (filesToDelete.length > 0) {
          await supabase.storage
            .from('media-library')
            .remove(filesToDelete);
        }

        // Delete media records from database
        const { error: deleteMediaError } = await supabase
          .from('media_library')
          .delete()
          .eq('folder_id', folderId);

        if (deleteMediaError) throw deleteMediaError;
      }

      // Delete the folder
      const { error: folderError } = await supabase
        .from('media_folders')
        .delete()
        .eq('id', folderId);

      if (folderError) throw folderError;

      toast({
        title: "Folder deleted",
        description: `Folder "${folderName}" and all its contents have been deleted.`,
      });

      // Refresh data
      loadFolders();
      loadMediaLibrary();

      // If we were viewing this folder, go back to all media
      if (selectedFolder === folderId) {
        setSelectedFolder(null);
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete folder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingFolder(null);
    }
  };

  // Delete media item
  const deleteMediaItem = async (item: MediaItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      // Delete from storage
      const fileName = item.url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('media-library')
          .remove([`${user?.id}/${fileName}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from('media_library')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      setMediaItems(prev => prev.filter(media => media.id !== item.id));
      toast({
        title: "Media deleted",
        description: `${item.name} has been deleted.`,
      });
    } catch (error) {
      console.error('Error deleting media:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete media item.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading media library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
              <p className="text-gray-600">Manage your images and videos</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateFolder(true)}
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </Button>

              <Button
                onClick={() => setShowUploadDialog(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Media
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6">
        {/* Tabs for Library and Analytics */}
        <Tabs defaultValue="library" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Media Library</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <MediaAnalytics />
          </TabsContent>

          <TabsContent value="library">
            {/* Filters and Search */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All
            </Button>
            <Button
              variant={filterType === 'image' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('image')}
            >
              <ImageIcon className="w-4 h-4 mr-1" />
              Images
            </Button>
            <Button
              variant={filterType === 'video' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('video')}
            >
              <Video className="w-4 h-4 mr-1" />
              Videos
            </Button>
          </div>

          <div className="flex items-center space-x-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Folders Section */}
        {folders.length > 0 && selectedFolder === null && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Folder className="w-5 h-5 mr-2" />
                Folders ({folders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {folders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onClick={() => setSelectedFolder(folder.id)}
                    onDelete={() => deleteFolder(folder.id, folder.name)}
                    isDeleting={deletingFolder === folder.id}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Breadcrumb for folder navigation */}
        {selectedFolder && (
          <div className="mb-4 flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFolder(null)}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back to All Media
            </Button>
            <span className="text-gray-500">/</span>
            <span className="font-medium">
              {folders.find(f => f.id === selectedFolder)?.name || 'Unknown Folder'}
            </span>
          </div>
        )}

        {/* Media Grid/List */}
        {filteredMedia.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'No media matches your search.' : 'Upload your first image or video to get started.'}
            </p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Media
            </Button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            : "space-y-4"
          }>
            {filteredMedia.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                viewMode={viewMode}
                onToggleFavorite={() => toggleFavorite(item)}
                onDelete={() => deleteMediaItem(item)}
                onView={() => setSelectedMedia(item)}
              />
            ))}
          </div>
        )}
          </TabsContent>
        </Tabs>

        {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: JPG, PNG, GIF, WebP, SVG, MP4, MOV, AVI, WebM, MKV
              </p>
            </div>
            {uploading && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Uploading...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Folder Name *
              </label>
              <Input
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                disabled={creatingFolder}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Description (Optional)
              </label>
              <Input
                placeholder="Enter folder description"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                disabled={creatingFolder}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                  setNewFolderDescription('');
                }}
                disabled={creatingFolder}
              >
                Cancel
              </Button>
              <Button
                onClick={createFolder}
                disabled={!newFolderName.trim() || creatingFolder}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {creatingFolder ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Create Folder
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Preview Dialog */}
      {selectedMedia && (
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedMedia.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center">
                {selectedMedia.type === 'image' ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.alt_text || selectedMedia.name}
                    className="max-w-full max-h-96 object-contain rounded-lg"
                  />
                ) : (
                  <video
                    src={selectedMedia.url}
                    controls
                    className="max-w-full max-h-96 rounded-lg"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Type:</strong> {selectedMedia.type}
                </div>
                <div>
                  <strong>Size:</strong> {formatFileSize(selectedMedia.size)}
                </div>
                <div>
                  <strong>Usage:</strong> {selectedMedia.usage_count} times
                </div>
                <div>
                  <strong>Created:</strong> {new Date(selectedMedia.created_at).toLocaleDateString()}
                </div>
              </div>
              {selectedMedia.description && (
                <div>
                  <strong>Description:</strong> {selectedMedia.description}
                </div>
              )}
              {selectedMedia.tags.length > 0 && (
                <div>
                  <strong>Tags:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedMedia.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </div>
  );
}

// Media Card Component
interface MediaCardProps {
  item: MediaItem;
  viewMode: 'grid' | 'list';
  onToggleFavorite: () => void;
  onDelete: () => void;
  onView: () => void;
}

function MediaCard({ item, viewMode, onToggleFavorite, onDelete, onView }: MediaCardProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {item.type === 'image' ? (
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Video className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
              <p className="text-sm text-gray-500">
                {item.type} • {formatFileSize(item.size)} • {new Date(item.created_at).toLocaleDateString()}
              </p>
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                  {item.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">+{item.tags.length - 3}</Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={onToggleFavorite}>
                {item.is_favorite ? (
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                ) : (
                  <HeartOff className="w-4 h-4" />
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={onView}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardContent className="p-0">
        <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
          {item.type === 'image' ? (
            <img
              src={item.url}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
              <Button variant="secondary" size="sm" onClick={onView}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="sm" onClick={onToggleFavorite}>
                {item.is_favorite ? (
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                ) : (
                  <HeartOff className="w-4 h-4" />
                )}
              </Button>
              <Button variant="secondary" size="sm" onClick={onDelete}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>

          {/* Favorite indicator */}
          {item.is_favorite && (
            <div className="absolute top-2 right-2">
              <Heart className="w-5 h-5 text-red-500 fill-current" />
            </div>
          )}
        </div>
        
        <div className="p-3">
          <h3 className="font-medium text-gray-900 truncate text-sm">{item.name}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {formatFileSize(item.size)} • {new Date(item.created_at).toLocaleDateString()}
          </p>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
              {item.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">+{item.tags.length - 2}</Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Folder Card Component
interface FolderCardProps {
  folder: MediaFolder;
  onClick: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function FolderCard({ folder, onClick, onDelete, isDeleting }: FolderCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="group relative rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-blue-300">
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={isDeleting}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg disabled:opacity-50"
        title="Delete folder"
      >
        {isDeleting ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
        ) : (
          <Trash2 className="w-3 h-3" />
        )}
      </button>

      <div
        className="cursor-pointer"
        onClick={onClick}
      >
        <div className="aspect-square rounded-t-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <Folder className="w-12 h-12 text-blue-600 group-hover:text-blue-700 transition-colors" />
        </div>

        <div className="p-3">
          <h3 className="font-medium text-gray-900 truncate text-sm">{folder.name}</h3>
          {folder.description && (
            <p className="text-xs text-gray-500 mt-1 truncate">{folder.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Created {formatDate(folder.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

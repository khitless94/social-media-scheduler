import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Trash2, 
  Download, 
  Edit3, 
  Eye, 
  FolderPlus,
  Tag,
  Calendar,
  FileImage,
  Video,
  File,
  MoreVertical,
  X,
  Check,
  Star,
  Copy,
  Share2,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { MediaAnalytics } from '@/components/MediaAnalytics';

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'document';
  size: number;
  created_at: string;
  updated_at: string;
  folder_id?: string;
  tags: string[];
  description?: string;
  alt_text?: string;
  usage_count: number;
  is_favorite: boolean;
}

interface MediaFolder {
  id: string;
  name: string;
  created_at: string;
  item_count: number;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export function MediaLibrary() {
  const { user } = useAuth();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'usage'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Debug state changes
  useEffect(() => {
    console.log('🔄 [MediaLibrary] showUploadDialog changed:', showUploadDialog);
  }, [showUploadDialog]);

  useEffect(() => {
    console.log('🔄 [MediaLibrary] showCreateFolder changed:', showCreateFolder);
  }, [showCreateFolder]);

  // Load media items and folders
  const loadMediaLibrary = useCallback(async () => {
    if (!user) return;

    console.log('📁 [MediaLibrary] Loading media library for user:', user.id);
    setIsLoading(true);
    try {
      // Load media items
      const { data: mediaData, error: mediaError } = await supabase
        .from('media_library')
        .select('*')
        .eq('user_id', user.id)
        .order(sortBy === 'date' ? 'created_at' : sortBy, { ascending: sortOrder === 'asc' });

      if (mediaError) throw mediaError;

      // Load folders
      const { data: folderData, error: folderError } = await supabase
        .from('media_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (folderError) throw folderError;

      console.log('📁 [MediaLibrary] Loaded:', {
        mediaItems: mediaData?.length || 0,
        folders: folderData?.length || 0
      });

      setMediaItems(mediaData || []);
      setFolders(folderData || []);
    } catch (error) {
      console.error('❌ [MediaLibrary] Error loading media library:', error);
      toast({
        title: "Error loading media",
        description: "Failed to load your media library",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, sortBy, sortOrder]);

  useEffect(() => {
    loadMediaLibrary();
  }, [loadMediaLibrary]);

  // File upload with drag and drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) return;

    const newUploads: UploadProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadProgress(prev => [...prev, ...newUploads]);

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      try {
        // Validate file
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error('File size must be less than 10MB');
        }

        // Create unique filename
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Upload to Supabase Storage with user folder structure
        const userFilePath = `${user.id}/${fileName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media-library')
          .upload(userFilePath, file, {
            onUploadProgress: (progress) => {
              const percentage = (progress.loaded / progress.total) * 100;
              setUploadProgress(prev =>
                prev.map(upload =>
                  upload.file === file
                    ? { ...upload, progress: percentage }
                    : upload
                )
              );
            }
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media-library')
          .getPublicUrl(userFilePath);

        // Save to database
        const { error: dbError } = await supabase
          .from('media_library')
          .insert({
            user_id: user.id,
            name: file.name,
            url: publicUrl,
            type: file.type.startsWith('image/') ? 'image' : 
                  file.type.startsWith('video/') ? 'video' : 'document',
            size: file.size,
            folder_id: selectedFolder !== 'all' ? selectedFolder : null,
            tags: [],
            usage_count: 0,
            is_favorite: false
          });

        if (dbError) throw dbError;

        // Update progress to completed
        setUploadProgress(prev => 
          prev.map(upload => 
            upload.file === file 
              ? { ...upload, progress: 100, status: 'completed' as const }
              : upload
          )
        );

        toast({
          title: "Upload successful",
          description: `${file.name} has been uploaded to your media library`,
        });

      } catch (error: any) {
        console.error('Upload error:', error);
        setUploadProgress(prev => 
          prev.map(upload => 
            upload.file === file 
              ? { ...upload, status: 'error' as const, error: error.message }
              : upload
          )
        );

        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}: ${error.message}`,
          variant: "destructive",
        });
      }
    }

    // Reload media library after uploads complete
    setTimeout(() => {
      loadMediaLibrary();
      setUploadProgress([]);
      // Keep upload dialog open until user closes it manually
    }, 1000);
  }, [user, selectedFolder, loadMediaLibrary]);

  // Create new folder
  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;

    try {
      const { error } = await supabase
        .from('media_folders')
        .insert({
          user_id: user.id,
          name: newFolderName.trim(),
          description: `Folder created on ${new Date().toLocaleDateString()}`
        });

      if (error) throw error;

      toast({
        title: "Folder created!",
        description: `"${newFolderName}" has been created successfully.`,
      });

      setNewFolderName('');
      setShowCreateFolder(false);
      loadMediaLibrary();
    } catch (error: any) {
      console.error('Folder creation error:', error);
      toast({
        title: "Error creating folder",
        description: error.message || "Failed to create folder",
        variant: "destructive",
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  // Filter media items
  const filteredItems = mediaItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFolder = selectedFolder === 'all' || item.folder_id === selectedFolder;
    const matchesType = selectedType === 'all' || item.type === selectedType;
    
    return matchesSearch && matchesFolder && matchesType;
  });

  // Handle item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAllItems = () => {
    setSelectedItems(filteredItems.map(item => item.id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  // Bulk operations
  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) return;

    try {
      const { error } = await supabase
        .from('media_library')
        .delete()
        .in('id', selectedItems);

      if (error) throw error;

      toast({
        title: "Items deleted",
        description: `${selectedItems.length} items have been deleted`,
      });

      setSelectedItems([]);
      loadMediaLibrary();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete selected items",
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

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <FileImage className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
            <p className="text-gray-600 mt-1">Manage your images, videos, and documents</p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Debug Info */}
            <div className="text-xs text-gray-500 mr-4">
              Upload: {showUploadDialog ? 'Open' : 'Closed'} |
              Folder: {showCreateFolder ? 'Open' : 'Closed'}
            </div>

            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🗂️ [MediaLibrary] New Folder button clicked (native button)');
                setShowCreateFolder(true);
              }}
              type="button"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </button>

            <button
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📤 [MediaLibrary] Upload Media button clicked (native button)');
                setShowUploadDialog(true);
              }}
              type="button"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Media
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileImage className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold">{mediaItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Storage Used</p>
                  <p className="text-2xl font-bold">
                    {formatFileSize(mediaItems.reduce((total, item) => total + item.size, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Favorites</p>
                  <p className="text-2xl font-bold">
                    {mediaItems.filter(item => item.is_favorite).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FolderPlus className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Folders</p>
                  <p className="text-2xl font-bold">{folders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-3">
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Folders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Folders</SelectItem>
                    {folders.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name} ({folder.item_count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="usage">Usage</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>

                <Separator orientation="vertical" className="h-6" />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Selection Controls */}
            {selectedItems.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                  <Button variant="destructive" size="sm" onClick={deleteSelectedItems}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {uploadProgress.map((upload, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{upload.file.name}</span>
                    <span className={cn(
                      upload.status === 'completed' && 'text-green-600',
                      upload.status === 'error' && 'text-red-600'
                    )}>
                      {upload.status === 'uploading' && `${Math.round(upload.progress)}%`}
                      {upload.status === 'completed' && 'Completed'}
                      {upload.status === 'error' && 'Failed'}
                    </span>
                  </div>
                  <Progress value={upload.progress} className="h-2" />
                  {upload.error && (
                    <p className="text-xs text-red-600">{upload.error}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Analytics Tab */}
        <Tabs defaultValue="library" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Media Library</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <MediaAnalytics />
          </TabsContent>

          <TabsContent value="library">
            {/* Media Grid/List */}
            <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'Try adjusting your search or filters' : 'Upload your first media file to get started'}
                </p>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Media
                </Button>
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
                  : 'space-y-2'
              )}>
                {filteredItems.map((item) => (
                  <MediaItemCard
                    key={item.id}
                    item={item}
                    viewMode={viewMode}
                    isSelected={selectedItems.includes(item.id)}
                    onSelect={() => toggleItemSelection(item.id)}
                    onView={() => setSelectedMedia(item)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>

        {/* Create Folder Dialog */}
        <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="folderName">Folder Name</Label>
                <Input
                  id="folderName"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      createFolder();
                    }
                  }}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={createFolder}
                  disabled={!newFolderName.trim()}
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create Folder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Media</DialogTitle>
            </DialogHeader>

            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </h3>
              <p className="text-gray-600 mb-4">
                or click to browse your computer
              </p>
              <p className="text-sm text-gray-500">
                Supports: Images (PNG, JPG, GIF), Videos (MP4, MOV), Documents (PDF)
                <br />
                Maximum file size: 10MB
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Media Preview Dialog */}
        {selectedMedia && (
          <MediaPreviewDialog
            media={selectedMedia}
            onClose={() => setSelectedMedia(null)}
            onUpdate={loadMediaLibrary}
          />
        )}
      </div>
    </div>
  );
}

// Media Item Card Component
interface MediaItemCardProps {
  item: MediaItem;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
}

function MediaItemCard({ item, viewMode, isSelected, onSelect, onView }: MediaItemCardProps) {
  if (viewMode === 'list') {
    return (
      <div className={cn(
        "flex items-center space-x-4 p-3 rounded-lg border transition-colors",
        isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
      )}>
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
        
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
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{formatFileSize(item.size)}</span>
            <span>{new Date(item.created_at).toLocaleDateString()}</span>
            <span>Used {item.usage_count} times</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {item.is_favorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
          {item.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="w-4 h-4 mr-2" />
              Copy URL
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className={cn(
      "group relative rounded-lg border transition-all duration-200 hover:shadow-md",
      isSelected ? "ring-2 ring-blue-500 border-blue-200" : "border-gray-200"
    )}>
      <div className="aspect-square rounded-t-lg overflow-hidden bg-gray-100">
        {item.type === 'image' ? (
          <img 
            src={item.url} 
            alt={item.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {getFileIcon(item.type)}
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2">
            <Button size="sm" variant="secondary" onClick={onView}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="secondary">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Selection Checkbox */}
        <div className="absolute top-2 left-2">
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={onSelect}
            className="bg-white border-white shadow-sm"
          />
        </div>

        {/* Favorite Star */}
        {item.is_favorite && (
          <div className="absolute top-2 right-2">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-medium text-sm text-gray-900 truncate mb-1">{item.name}</h3>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatFileSize(item.size)}</span>
          <span>{item.usage_count} uses</span>
        </div>
        
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {item.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{item.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Media Preview Dialog Component
interface MediaPreviewDialogProps {
  media: MediaItem;
  onClose: () => void;
  onUpdate: () => void;
}

function MediaPreviewDialog({ media, onClose, onUpdate }: MediaPreviewDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: media.name,
    description: media.description || '',
    alt_text: media.alt_text || '',
    tags: media.tags.join(', ')
  });

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('media_library')
        .update({
          name: editData.name,
          description: editData.description,
          alt_text: editData.alt_text,
          tags: editData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
        .eq('id', media.id);

      if (error) throw error;

      toast({
        title: "Media updated",
        description: "Your changes have been saved",
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Update failed",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  const toggleFavorite = async () => {
    try {
      const { error } = await supabase
        .from('media_library')
        .update({ is_favorite: !media.is_favorite })
        .eq('id', media.id);

      if (error) throw error;

      toast({
        title: media.is_favorite ? "Removed from favorites" : "Added to favorites",
      });

      onUpdate();
    } catch (error) {
      console.error('Favorite toggle error:', error);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(media.url);
    toast({
      title: "URL copied",
      description: "Media URL has been copied to clipboard",
    });
  };

  const downloadMedia = () => {
    const link = document.createElement('a');
    link.href = media.url;
    link.download = media.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate">{media.name}</DialogTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={toggleFavorite}>
                <Star className={cn(
                  "w-4 h-4",
                  media.is_favorite ? "text-yellow-500 fill-current" : "text-gray-400"
                )} />
              </Button>
              <Button variant="outline" size="sm" onClick={copyUrl}>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={downloadMedia}>
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Media Preview */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              {media.type === 'image' ? (
                <img 
                  src={media.url} 
                  alt={media.name} 
                  className="w-full h-full object-contain" 
                />
              ) : media.type === 'video' ? (
                <video 
                  src={media.url} 
                  controls 
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <File className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Media Info */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="capitalize">{media.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span>{formatFileSize(media.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{new Date(media.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Usage:</span>
                <span>{media.usage_count} times</span>
              </div>
            </div>
          </div>

          {/* Media Details */}
          <div className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add a description..."
                  />
                </div>

                <div>
                  <Label htmlFor="alt_text">Alt Text</Label>
                  <Input
                    id="alt_text"
                    value={editData.alt_text}
                    onChange={(e) => setEditData(prev => ({ ...prev, alt_text: e.target.value }))}
                    placeholder="Describe this image for accessibility..."
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={editData.tags}
                    onChange={(e) => setEditData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="tag1, tag2, tag3..."
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleSave}>
                    <Check className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {media.description || 'No description provided'}
                  </p>
                </div>

                <div>
                  <Label>Alt Text</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {media.alt_text || 'No alt text provided'}
                  </p>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {media.tags.length > 0 ? (
                      media.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600">No tags</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>URL</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input value={media.url} readOnly className="text-xs" />
                    <Button variant="outline" size="sm" onClick={copyUrl}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(type: string) {
  switch (type) {
    case 'image': return <FileImage className="w-8 h-8 text-blue-500" />;
    case 'video': return <Video className="w-8 h-8 text-purple-500" />;
    default: return <File className="w-8 h-8 text-gray-500" />;
  }
}

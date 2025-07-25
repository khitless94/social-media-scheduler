import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Grid3X3, 
  List, 
  FileImage, 
  Video, 
  File, 
  Check, 
  X,
  Upload,
  Star,
  Calendar,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  size: number;
  created_at: string;
  tags: string[];
  is_favorite: boolean;
  usage_count: number;
}

interface MediaSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
  allowMultiple?: boolean;
  acceptedTypes?: ('image' | 'video')[];
  title?: string;
}

export function MediaSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  allowMultiple = false, 
  acceptedTypes = ['image', 'video'],
  title = "Select Media"
}: MediaSelectorProps) {
  const { user } = useAuth();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'usage'>('date');
  const [isLoading, setIsLoading] = useState(false);

  // Load media items
  const loadMediaItems = async () => {
    if (!user || !isOpen) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('media_library')
        .select('*')
        .eq('user_id', user.id);

      // Filter by accepted types
      if (acceptedTypes.length < 2) {
        query = query.in('type', acceptedTypes);
      }

      const { data, error } = await query
        .order(sortBy === 'date' ? 'created_at' : sortBy, { ascending: false });

      if (error) throw error;
      setMediaItems(data || []);
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMediaItems();
  }, [user, isOpen, sortBy, acceptedTypes]);

  // Filter media items
  const filteredItems = mediaItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || item.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Handle item selection
  const toggleItemSelection = (item: MediaItem) => {
    if (allowMultiple) {
      setSelectedItems(prev => {
        const isSelected = prev.find(selected => selected.id === item.id);
        if (isSelected) {
          return prev.filter(selected => selected.id !== item.id);
        } else {
          return [...prev, item];
        }
      });
    } else {
      setSelectedItems([item]);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedItems.length > 0) {
      if (allowMultiple) {
        selectedItems.forEach(item => onSelect(item));
      } else {
        onSelect(selectedItems[0]);
      }
      setSelectedItems([]);
      onClose();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex items-center space-x-2">
              {selectedItems.length > 0 && (
                <Badge variant="secondary">
                  {selectedItems.length} selected
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[70vh]">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4 p-4 border-b">
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
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {acceptedTypes.includes('image') && <SelectItem value="image">Images</SelectItem>}
                  {acceptedTypes.includes('video') && <SelectItem value="video">Videos</SelectItem>}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="usage">Usage</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Media Grid/List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
                <p className="text-gray-600">
                  {searchQuery ? 'Try adjusting your search or filters' : 'Upload media files to get started'}
                </p>
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
                    isSelected={selectedItems.some(selected => selected.id === item.id)}
                    onSelect={() => toggleItemSelection(item)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} available
              {selectedItems.length > 0 && (
                <span className="ml-2">
                  • {selectedItems.length} selected
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmSelection}
                disabled={selectedItems.length === 0}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {allowMultiple ? `Select ${selectedItems.length} Item${selectedItems.length !== 1 ? 's' : ''}` : 'Select'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Media Item Card Component
interface MediaItemCardProps {
  item: MediaItem;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
}

function MediaItemCard({ item, viewMode, isSelected, onSelect }: MediaItemCardProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <FileImage className="w-8 h-8 text-blue-500" />;
      case 'video': return <Video className="w-8 h-8 text-purple-500" />;
      default: return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  if (viewMode === 'list') {
    return (
      <div 
        className={cn(
          "flex items-center space-x-4 p-3 rounded-lg border transition-all duration-200 cursor-pointer",
          isSelected ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500" : "hover:bg-gray-50 border-gray-200"
        )}
        onClick={onSelect}
      >
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
          {item.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {isSelected && (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group relative rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md",
        isSelected ? "ring-2 ring-blue-500 border-blue-200" : "border-gray-200"
      )}
      onClick={onSelect}
    >
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
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        {/* Favorite Star */}
        {item.is_favorite && (
          <div className="absolute top-2 left-2">
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

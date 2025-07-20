import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Info, AlertTriangle, Trash2, Tag } from 'lucide-react';
import { FaReddit } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SubredditData {
  id: string;
  name: string;
  flairs: string[];
}

interface SubredditManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubredditManagementModal: React.FC<SubredditManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subreddits, setSubreddits] = useState<SubredditData[]>([]);
  const [newSubreddit, setNewSubreddit] = useState('');
  const [newFlairs, setNewFlairs] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadSubreddits();
    }
  }, [isOpen, user]);

  const loadSubreddits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_subreddits')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setSubreddits(data || []);
    } catch (error) {
      console.error('Error loading subreddits:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subreddits',
        variant: 'destructive'
      });
    }
  };

  const addSubreddit = async () => {
    if (!user || !newSubreddit.trim()) return;

    // Clean subreddit name (remove r/ if present)
    const cleanName = newSubreddit.replace(/^r\//, '').trim();
    
    // Parse flairs
    const flairList = newFlairs
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    if (flairList.length === 0) {
      toast({
        title: 'Flairs Required',
        description: 'Please add at least one flair for proper Reddit posting',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_subreddits')
        .insert({
          user_id: user.id,
          name: cleanName,
          flairs: flairList
        })
        .select()
        .single();

      if (error) throw error;

      setSubreddits(prev => [...prev, data]);
      setNewSubreddit('');
      setNewFlairs('');
      
      toast({
        title: 'Success',
        description: `Added r/${cleanName} with ${flairList.length} flair(s)`
      });
    } catch (error: any) {
      console.error('Error adding subreddit:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add subreddit',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const removeSubreddit = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_subreddits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSubreddits(prev => prev.filter(s => s.id !== id));
      
      toast({
        title: 'Success',
        description: 'Subreddit removed'
      });
    } catch (error: any) {
      console.error('Error removing subreddit:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove subreddit',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
              <FaReddit className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              Manage Subreddits
            </DialogTitle>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">
                  These subreddits will be available when scheduling Reddit posts. 
                  Each subreddit must have flairs to ensure proper posting.
                </p>
              </div>
            </div>
          </div>

          {/* Warning Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Note:</p>
                <p>
                  Flair functionality requires Reddit API setup. Currently, flairs are collected 
                  but not applied to posts. This will be implemented in a future update.
                </p>
              </div>
            </div>
          </div>

          {/* Add New Subreddit */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add New Subreddit</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subreddit Name
                </label>
                <Input
                  placeholder="e.g., webdev, programming, react"
                  value={newSubreddit}
                  onChange={(e) => setNewSubreddit(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter without "r/" prefix
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Flairs for this Subreddit
                </label>
                <Input
                  placeholder="e.g., Discussion, Question, Tutorial"
                  value={newFlairs}
                  onChange={(e) => setNewFlairs(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple flairs with commas
                </p>
              </div>

              <Button
                onClick={addSubreddit}
                disabled={loading || !newSubreddit.trim() || !newFlairs.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Subreddit with Flairs
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              Each subreddit must have at least one flair for proper Reddit posting.
            </p>
          </div>

          {/* Current Subreddits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Your Subreddits ({subreddits.length})
            </h3>

            {subreddits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaReddit className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No subreddits added yet</p>
                <p className="text-sm">Add your first subreddit above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subreddits.map((subreddit) => (
                  <div
                    key={subreddit.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <FaReddit className="w-4 h-4 text-orange-500" />
                          <span className="font-medium text-gray-900">
                            r/{subreddit.name}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {subreddit.flairs.map((flair, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-200"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {flair}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubreddit(subreddit.id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubredditManagementModal;

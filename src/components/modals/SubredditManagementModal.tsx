import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Info, Users } from 'lucide-react';
import { FaReddit } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [subreddits, setSubreddits] = useState<string[]>(['testingground4bots']);
  const [defaultSubreddit, setDefaultSubreddit] = useState<string>('testingground4bots');
  const [newSubreddit, setNewSubreddit] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Popular subreddits for suggestions
  const popularSubreddits = [
    'testingground4bots',
    'test',
    'SandBoxTest',
    'u_YourUsername', // User profile posts
    'announcements',
    'technology',
    'programming',
    'webdev',
    'startups',
    'entrepreneur'
  ];

  useEffect(() => {
    if (isOpen && user) {
      loadSubredditPreferences();
    }
  }, [isOpen, user]);

  const loadSubredditPreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('📖 [SubredditModal] Loading subreddit preferences for user:', user.id);

      // Try localStorage first (primary storage for now)
      const localData = localStorage.getItem(`reddit_subreddits_${user.id}`);

      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          setSubreddits(parsed.subreddits || ['testingground4bots']);
          setDefaultSubreddit(parsed.defaultSubreddit || 'testingground4bots');
          console.log('📖 [SubredditModal] ✅ Loaded from localStorage:', parsed);
          return; // Successfully loaded from localStorage
        } catch (parseError) {
          console.error('📖 [SubredditModal] localStorage parse error:', parseError);
        }
      }

      // If localStorage failed or no data, try database as fallback
      console.log('📖 [SubredditModal] No localStorage data, trying database...');

      try {
        // Check session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.warn('📖 [SubredditModal] No valid session, using defaults');
          setSubreddits(['testingground4bots']);
          setDefaultSubreddit('testingground4bots');
          return;
        }

        const { data, error } = await supabase
          .from('user_preferences')
          .select('reddit_subreddits, default_reddit_subreddit')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('📖 [SubredditModal] Database query result:', { data, error });

        if (data && !error && data.reddit_subreddits) {
          // Successfully loaded from database
          const userSubreddits = Array.isArray(data.reddit_subreddits) ? data.reddit_subreddits : [];
          setSubreddits(userSubreddits.length > 0 ? userSubreddits : ['testingground4bots']);
          setDefaultSubreddit(data.default_reddit_subreddit || 'testingground4bots');
          console.log('📖 [SubredditModal] ✅ Loaded from database:', { userSubreddits, defaultSubreddit: data.default_reddit_subreddit });

          // Also save to localStorage for future use
          localStorage.setItem(`reddit_subreddits_${user.id}`, JSON.stringify({
            subreddits: userSubreddits.length > 0 ? userSubreddits : ['testingground4bots'],
            defaultSubreddit: data.default_reddit_subreddit || 'testingground4bots',
            updated_at: new Date().toISOString()
          }));
        } else {
          // No data found anywhere, use defaults
          console.log('📖 [SubredditModal] No data found anywhere, using defaults');
          setSubreddits(['testingground4bots']);
          setDefaultSubreddit('testingground4bots');
        }
      } catch (dbError) {
        console.error('📖 [SubredditModal] Database error:', dbError);
        // Use defaults on database error
        setSubreddits(['testingground4bots']);
        setDefaultSubreddit('testingground4bots');
      }
    } catch (error) {
      console.error('📖 [SubredditModal] Load error:', error);
      // Use defaults on any error
      setSubreddits(['testingground4bots']);
      setDefaultSubreddit('testingground4bots');
    } finally {
      setLoading(false);
    }
  };

  const saveSubredditPreferences = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to save subreddit preferences",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      console.log('💾 [SubredditModal] Attempting to save subreddit preferences...');
      console.log('💾 [SubredditModal] User ID:', user.id);
      console.log('💾 [SubredditModal] Subreddits:', subreddits);
      console.log('💾 [SubredditModal] Default:', defaultSubreddit);

      // Check current session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('💾 [SubredditModal] Session invalid:', sessionError);
        throw new Error('Authentication session expired. Please sign out and sign in again.');
      }

      console.log('💾 [SubredditModal] Session valid, proceeding with save...');

      // Save to localStorage immediately (primary storage for now)
      localStorage.setItem(`reddit_subreddits_${user.id}`, JSON.stringify({
        subreddits,
        defaultSubreddit,
        updated_at: new Date().toISOString()
      }));

      console.log('💾 [SubredditModal] ✅ Saved to localStorage successfully');

      // Try database as secondary storage (optional)
      try {
        const { data: existingData, error: checkError } = await supabase
          .from('user_preferences')
          .select('id, user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!checkError) {
          let saveResult;

          if (existingData) {
            // Record exists, try UPDATE
            saveResult = await supabase
              .from('user_preferences')
              .update({
                reddit_subreddits: subreddits,
                default_reddit_subreddit: defaultSubreddit,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              .select();
          } else {
            // No record exists, try INSERT
            saveResult = await supabase
              .from('user_preferences')
              .insert({
                user_id: user.id,
                reddit_subreddits: subreddits,
                default_reddit_subreddit: defaultSubreddit,
                email_notifications: true,
                push_notifications: false,
                marketing_notifications: true,
                security_notifications: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select();
          }

          if (!saveResult.error) {
            console.log('💾 [SubredditModal] ✅ Database backup successful');
          } else {
            console.warn('💾 [SubredditModal] Database backup failed, but localStorage succeeded');
          }
        }
      } catch (dbError) {
        console.warn('💾 [SubredditModal] Database backup failed, but localStorage succeeded:', dbError);
      }

      toast({
        title: "Success",
        description: "Subreddit preferences saved successfully"
      });

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('subredditPreferencesUpdated'));

    } catch (error: any) {
      console.error('💾 [SubredditModal] Save error:', error);

      if (error.message?.includes('Authentication') || error.message?.includes('session')) {
        toast({
          title: "Authentication Error",
          description: "Please sign out and sign in again, then try saving.",
          variant: "destructive"
        });
      } else {
        // Try localStorage as final fallback
        try {
          localStorage.setItem(`reddit_subreddits_${user.id}`, JSON.stringify({
            subreddits,
            defaultSubreddit,
            updated_at: new Date().toISOString()
          }));

          toast({
            title: "Saved Locally",
            description: "Preferences saved locally due to database error",
            variant: "default"
          });
        } catch (localError) {
          toast({
            title: "Error",
            description: "Failed to save subreddit preferences",
            variant: "destructive"
          });
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const addSubreddit = () => {
    if (!newSubreddit.trim()) return;

    const cleanSubreddit = newSubreddit.trim().replace(/^r\//, ''); // Remove r/ prefix if present

    if (subreddits.includes(cleanSubreddit)) {
      toast({
        title: "Already Added",
        description: `r/${cleanSubreddit} is already in your list`,
        variant: "destructive"
      });
      return;
    }

    setSubreddits([...subreddits, cleanSubreddit]);
    setNewSubreddit('');
  };

  const removeSubreddit = (subredditToRemove: string) => {
    setSubreddits(subreddits.filter(sub => sub !== subredditToRemove));

    // If we're removing the default subreddit, reset to testingground4bots
    if (defaultSubreddit === subredditToRemove) {
      setDefaultSubreddit('testingground4bots');
    }
  };

  const addPopularSubreddit = (subreddit: string) => {
    if (!subreddits.includes(subreddit)) {
      setSubreddits([...subreddits, subreddit]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addSubreddit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              Reddit Subreddit Management
            </DialogTitle>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading preferences...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">
                    Manage your preferred subreddits for posting. These will be available when creating Reddit posts.
                  </p>
                </div>
              </div>
            </div>

            {/* Add New Subreddit */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Add Subreddit</label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">r/</span>
                  <Input
                    placeholder="subreddit name"
                    value={newSubreddit}
                    onChange={(e) => setNewSubreddit(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-8"
                  />
                </div>
                <Button onClick={addSubreddit} disabled={!newSubreddit.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Popular Subreddits */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Quick Add (Popular Subreddits)</label>
              <div className="flex flex-wrap gap-2">
                {popularSubreddits
                  .filter(sub => !subreddits.includes(sub))
                  .map((subreddit) => (
                    <Button
                      key={subreddit}
                      variant="outline"
                      size="sm"
                      onClick={() => addPopularSubreddit(subreddit)}
                      className="text-xs"
                    >
                      r/{subreddit}
                    </Button>
                  ))}
              </div>
            </div>

            {/* Current Subreddits */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Your Subreddits ({subreddits.length})</label>
              {subreddits.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No subreddits added yet. Add some above!</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {subreddits.map((subreddit) => (
                    <Badge key={subreddit} variant="secondary" className="flex items-center space-x-1">
                      <span>r/{subreddit}</span>
                      <button
                        onClick={() => removeSubreddit(subreddit)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Default Subreddit Selection */}
            {subreddits.length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Default Subreddit</label>
                <Select value={defaultSubreddit} onValueChange={setDefaultSubreddit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select default subreddit" />
                  </SelectTrigger>
                  <SelectContent>
                    {subreddits.map((subreddit) => (
                      <SelectItem key={subreddit} value={subreddit}>
                        r/{subreddit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">This will be pre-selected when creating Reddit posts</p>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                onClick={saveSubredditPreferences}
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubredditManagementModal;

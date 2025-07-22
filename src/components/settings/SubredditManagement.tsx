import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, X, Settings, Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SubredditManagementProps {
  onSubredditsChange?: (subreddits: string[], defaultSubreddit: string) => void;
}

const SubredditManagement: React.FC<SubredditManagementProps> = ({ onSubredditsChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subreddits, setSubreddits] = useState<string[]>([]);
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

  // Load user's subreddit preferences
  useEffect(() => {
    if (user) {
      loadSubredditPreferences();
    }
  }, [user]);

  const loadSubredditPreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('reddit_subreddits, default_reddit_subreddit')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        const userSubreddits = Array.isArray(data.reddit_subreddits) ? data.reddit_subreddits : [];
        setSubreddits(userSubreddits.length > 0 ? userSubreddits : ['test']);
        setDefaultSubreddit(data.default_reddit_subreddit || 'test');
      } else if (error && error.code !== 'PGRST116') {
        console.error('Error loading subreddit preferences:', error);
        // Use defaults
        setSubreddits(['test']);
        setDefaultSubreddit('test');
      } else {
        // No data found, use defaults
        setSubreddits(['test']);
        setDefaultSubreddit('test');
      }
    } catch (error) {
      console.error('Error loading subreddit preferences:', error);
      // Use defaults
      setSubreddits(['test']);
      setDefaultSubreddit('test');
    } finally {
      setLoading(false);
    }
  };

  const saveSubredditPreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          reddit_subreddits: subreddits,
          default_reddit_subreddit: defaultSubreddit,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving subreddit preferences:', error);
        throw error;
      }

      // Call callback if provided
      if (onSubredditsChange) {
        onSubredditsChange(subreddits, defaultSubreddit);
      }

      toast({
        title: "Success",
        description: "Subreddit preferences saved successfully"
      });

    } catch (error: any) {
      console.error('Error saving subreddit preferences:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save subreddit preferences",
        variant: "destructive"
      });
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
    <Card className="bg-white border border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Users className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Reddit Subreddits</h3>
            <p className="text-sm text-gray-600">Manage your preferred subreddits for posting</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading preferences...</p>
          </div>
        ) : (
          <div className="space-y-6">
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
      </div>
    </Card>
  );
};

export default SubredditManagement;

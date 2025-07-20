import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, CheckCircle, AlertCircle, MoreVertical, Trash2, Settings } from 'lucide-react';
import { FaInstagram, FaFacebook, FaLinkedin, FaTwitter, FaReddit } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface SocialAccount {
  id: string;
  platform: string;
  platform_username: string;
  platform_user_id: string;
  is_active: boolean;
  created_at: string;
  token_expires_at?: string;
}

interface MultipleAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'reddit' | null;
  onConnectNew: () => void;
}

const MultipleAccountsModal: React.FC<MultipleAccountsModalProps> = ({
  isOpen,
  onClose,
  platform,
  onConnectNew
}) => {
  // All hooks must be called at the top level, before any early returns
  const { user } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const platformConfig = {
    instagram: {
      name: 'Instagram',
      icon: FaInstagram,
      color: 'from-pink-500 to-purple-600',
      bgColor: 'bg-gradient-to-r from-pink-50 to-purple-50',
      textColor: 'text-pink-700'
    },
    facebook: {
      name: 'Facebook',
      icon: FaFacebook,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-gradient-to-r from-blue-50 to-blue-50',
      textColor: 'text-blue-700'
    },
    linkedin: {
      name: 'LinkedIn',
      icon: FaLinkedin,
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-gradient-to-r from-blue-50 to-blue-50',
      textColor: 'text-blue-700'
    },
    twitter: {
      name: 'X (Twitter)',
      icon: FaTwitter,
      color: 'from-gray-800 to-black',
      bgColor: 'bg-gradient-to-r from-gray-50 to-gray-50',
      textColor: 'text-gray-700'
    },
    reddit: {
      name: 'Reddit',
      icon: FaReddit,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-gradient-to-r from-orange-50 to-red-50',
      textColor: 'text-orange-700'
    }
  };

  // Define all functions before early return
  const loadAccounts = async () => {
    if (!user || !platform) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAccounts(data || []);
    } catch (error: any) {
      console.error('Error loading accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load accounts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // All hooks must be called before any early returns
  useEffect(() => {
    if (isOpen && user && platform) {
      loadAccounts();
    }
  }, [isOpen, user, platform]);

  // Safety check for platform and config - AFTER all hooks
  if (!platform || !platformConfig[platform]) {
    return null;
  }

  const config = platformConfig[platform];
  const Icon = config.icon;

  const toggleAccountStatus = async (accountId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('social_accounts')
        .update({ is_active: !currentStatus })
        .eq('id', accountId);

      if (error) throw error;

      setAccounts(prev => 
        prev.map(acc => 
          acc.id === accountId 
            ? { ...acc, is_active: !currentStatus }
            : acc
        )
      );

      toast({
        title: 'Success',
        description: `Account ${!currentStatus ? 'activated' : 'deactivated'}`
      });
    } catch (error: any) {
      console.error('Error toggling account status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update account status',
        variant: 'destructive'
      });
    }
  };

  const removeAccount = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      
      toast({
        title: 'Success',
        description: 'Account removed'
      });
    } catch (error: any) {
      console.error('Error removing account:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove account',
        variant: 'destructive'
      });
    }
  };

  const isTokenExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${config.color} flex items-center justify-center shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              {config.name} Accounts
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
          {/* Add New Account Button */}
          <div className={`${config.bgColor} border border-gray-200 rounded-lg p-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Connect Another {config.name} Account</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Manage multiple {config.name} accounts from one dashboard
                </p>
              </div>
              <Button
                onClick={onConnectNew}
                className={`bg-gradient-to-r ${config.color} hover:opacity-90 text-white`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Connect Another {config.name}
              </Button>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Connected Accounts ({accounts.length})
              </h3>
              {accounts.length > 0 && (
                <Badge variant="secondary" className={config.textColor}>
                  {accounts.filter(acc => acc.is_active).length} active
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading accounts...</p>
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Icon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No {config.name} accounts connected</p>
                <p className="text-sm">Connect your first account above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => {
                  const expired = isTokenExpired(account.token_expires_at);
                  
                  return (
                    <div
                      key={account.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${config.color} flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                @{account.platform_username || account.platform_user_id}
                              </span>
                              {account.is_active ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  Inactive
                                </Badge>
                              )}
                              {expired && (
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Expired
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              Connected {new Date(account.created_at).toLocaleDateString()}
                              {account.token_expires_at && (
                                <span className="ml-2">
                                  • Expires {new Date(account.token_expires_at).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => toggleAccountStatus(account.id, account.is_active)}
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              {account.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => removeAccount(account.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MultipleAccountsModal;

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';

interface ConnectionData {
  platform: string;
  hasOAuthCredentials: boolean;
  hasSocialTokens: boolean;
  isExpired: boolean;
  expiresAt?: string;
  lastError?: string;
}

export function SocialMediaDiagnostic() {
  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadConnectionData();
    }
  }, [user]);

  const loadConnectionData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const platforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'reddit'];
      const connectionData: ConnectionData[] = [];

      for (const platform of platforms) {
        try {
          // Check OAuth credentials
          const { data: oauthData, error: oauthError } = await supabase
            .from('oauth_credentials')
            .select('access_token, refresh_token, expires_at')
            .eq('user_id', user.id)
            .eq('platform', platform)
            .single();

          // Check social tokens
          const { data: socialData, error: socialError } = await supabase
            .from('social_tokens')
            .select('access_token, expires_at')
            .eq('user_id', user.id)
            .eq('platform', platform)
            .single();

          const hasOAuth = !oauthError && !!oauthData?.access_token;
          const hasSocial = !socialError && !!socialData?.access_token;
          
          let isExpired = false;
          let expiresAt = undefined;
          
          if (hasOAuth && oauthData.expires_at) {
            expiresAt = oauthData.expires_at;
            isExpired = new Date(oauthData.expires_at) < new Date();
          } else if (hasSocial && socialData.expires_at) {
            expiresAt = socialData.expires_at;
            isExpired = new Date(socialData.expires_at) < new Date();
          }

          connectionData.push({
            platform,
            hasOAuthCredentials: hasOAuth,
            hasSocialTokens: hasSocial,
            isExpired,
            expiresAt,
            lastError: oauthError?.message || socialError?.message
          });

        } catch (error: any) {
          connectionData.push({
            platform,
            hasOAuthCredentials: false,
            hasSocialTokens: false,
            isExpired: false,
            lastError: error.message
          });
        }
      }

      setConnections(connectionData);
    } catch (error: any) {
      console.error('Error loading connection data:', error);
      toast({
        title: "Error",
        description: "Failed to load connection data: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testSocialMediaAPI = async (platform: string) => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch('https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: `Test post from Social Media Scheduler - ${new Date().toLocaleString()}`,
          platforms: [platform],
          test_mode: true // Add this to prevent actual posting
        })
      });

      const responseData = await response.json();
      
      const result = {
        platform,
        success: response.ok && responseData.success,
        status: response.status,
        response: responseData,
        timestamp: new Date().toLocaleString()
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      
      return result;
    } catch (error: any) {
      const result = {
        platform,
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleString()
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
      return result;
    }
  };

  const getConnectionStatus = (conn: ConnectionData) => {
    if (!conn.hasOAuthCredentials && !conn.hasSocialTokens) {
      return { status: 'disconnected', color: 'bg-red-100 text-red-800', icon: XCircle };
    }
    if (conn.isExpired) {
      return { status: 'expired', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    }
    return { status: 'connected', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const connectPlatform = (platform: string) => {
    const authUrl = `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback?platform=${platform}&user_id=${user?.id}`;
    window.open(authUrl, '_blank', 'width=600,height=600');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🔍 Social Media Connection Diagnostic
        </h1>
        <p className="text-gray-600">
          Check why posts aren't being posted to social media
        </p>
      </div>

      {/* Connection Status */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Platform Connections</h3>
          <Button onClick={loadConnectionData} disabled={isLoading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((conn) => {
            const { status, color, icon: Icon } = getConnectionStatus(conn);
            
            return (
              <div key={conn.platform} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium capitalize">{conn.platform}</h4>
                  <Badge className={color}>
                    <Icon className="h-3 w-3 mr-1" />
                    {status}
                  </Badge>
                </div>
                
                <div className="text-xs text-gray-600 space-y-1">
                  <div>OAuth: {conn.hasOAuthCredentials ? '✅' : '❌'}</div>
                  <div>Social Tokens: {conn.hasSocialTokens ? '✅' : '❌'}</div>
                  {conn.expiresAt && (
                    <div>Expires: {new Date(conn.expiresAt).toLocaleString()}</div>
                  )}
                  {conn.lastError && (
                    <div className="text-red-600">Error: {conn.lastError}</div>
                  )}
                </div>
                
                <div className="mt-3 space-y-2">
                  {status === 'disconnected' && (
                    <Button 
                      onClick={() => connectPlatform(conn.platform)} 
                      size="sm" 
                      className="w-full"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Connect
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => testSocialMediaAPI(conn.platform)} 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                  >
                    Test API
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">API Test Results</h3>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{result.platform}</span>
                    <Badge className={result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">{result.timestamp}</span>
                </div>
                
                <div className="text-xs text-gray-600">
                  {result.status && <div>Status: {result.status}</div>}
                  {result.error && <div className="text-red-600">Error: {result.error}</div>}
                  {result.response && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">Response Details</summary>
                      <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto">
                        {JSON.stringify(result.response, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">
          🔧 How to Fix Social Media Posting
        </h3>
        <div className="text-sm text-blue-700 space-y-2">
          <div><strong>1. Connect Platforms:</strong> Click "Connect" for any disconnected platforms</div>
          <div><strong>2. Test APIs:</strong> Use "Test API" to verify each platform works</div>
          <div><strong>3. Check Tokens:</strong> Expired tokens need reconnection</div>
          <div><strong>4. Verify Permissions:</strong> Make sure OAuth apps have posting permissions</div>
          <div><strong>5. Check Logs:</strong> Look at API test results for specific errors</div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={() => window.open('/social-connections', '_blank')}>
            Manage Connections
          </Button>
          <Button onClick={() => window.open('/social-monitor', '_blank')} variant="outline">
            View Monitor
          </Button>
          <Button onClick={() => window.open('/test-scheduling', '_blank')} variant="outline">
            Test Scheduling
          </Button>
        </div>
      </Card>
    </div>
  );
}

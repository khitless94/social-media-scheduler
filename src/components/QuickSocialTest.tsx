import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Send, ExternalLink, CheckCircle, XCircle } from 'lucide-react';

export function QuickSocialTest() {
  const [content, setContent] = useState('Test post from Social Media Scheduler! 🚀');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitter']);
  const [isPosting, setIsPosting] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const platforms = [
    { id: 'twitter', name: 'Twitter', color: 'bg-blue-100 text-blue-800' },
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-100 text-blue-800' },
    { id: 'facebook', name: 'Facebook', color: 'bg-blue-100 text-blue-800' },
    { id: 'instagram', name: 'Instagram', color: 'bg-pink-100 text-pink-800' },
    { id: 'reddit', name: 'Reddit', color: 'bg-orange-100 text-orange-800' }
  ];

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const testDirectPosting = async () => {
    if (!user || selectedPlatforms.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one platform",
        variant: "destructive"
      });
      return;
    }

    setIsPosting(true);
    const testResults: any[] = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      for (const platform of selectedPlatforms) {
        try {
          const response = await fetch('https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-social', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              content: content + ` (Test at ${new Date().toLocaleTimeString()})`,
              platforms: [platform]
            })
          });

          const responseData = await response.json();
          
          const result = {
            platform,
            success: response.ok && responseData.success,
            status: response.status,
            message: responseData.message || responseData.error || 'Unknown response',
            details: responseData,
            timestamp: new Date().toLocaleString()
          };

          testResults.push(result);
          
          if (result.success) {
            toast({
              title: `✅ ${platform} Success`,
              description: "Post was successfully published!",
            });
          } else {
            toast({
              title: `❌ ${platform} Failed`,
              description: result.message,
              variant: "destructive"
            });
          }

        } catch (error: any) {
          const result = {
            platform,
            success: false,
            error: error.message,
            timestamp: new Date().toLocaleString()
          };
          
          testResults.push(result);
          
          toast({
            title: `❌ ${platform} Error`,
            description: error.message,
            variant: "destructive"
          });
        }
      }

      setResults(prev => [...testResults, ...prev]);

    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsPosting(false);
    }
  };

  const connectPlatform = (platform: string) => {
    const authUrl = `https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/oauth-callback?platform=${platform}&user_id=${user?.id}`;
    window.open(authUrl, '_blank', 'width=600,height=600');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🧪 Quick Social Media Test
        </h1>
        <p className="text-gray-600">
          Test posting directly to social media platforms
        </p>
      </div>

      {/* Test Form */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Test Post</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your test post content..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Platforms
            </label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <Badge
                  key={platform.id}
                  className={`cursor-pointer transition-all ${
                    selectedPlatforms.includes(platform.id)
                      ? platform.color
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => togglePlatform(platform.id)}
                >
                  {platform.name}
                  {selectedPlatforms.includes(platform.id) && ' ✓'}
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            onClick={testDirectPosting} 
            disabled={isPosting || selectedPlatforms.length === 0}
            className="w-full"
          >
            <Send className={`h-4 w-4 mr-2 ${isPosting ? 'animate-pulse' : ''}`} />
            {isPosting ? 'Posting...' : 'Test Post Now'}
          </Button>
        </div>
      </Card>

      {/* Platform Connections */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Platform Connections</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {platforms.map((platform) => (
            <div key={platform.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{platform.name}</span>
                <Badge className="bg-gray-100 text-gray-600">Unknown</Badge>
              </div>
              <Button 
                onClick={() => connectPlatform(platform.id)} 
                size="sm" 
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Connect/Reconnect
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Test Results */}
      {results.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Test Results</h3>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium capitalize">{result.platform}</span>
                    <Badge className={result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">{result.timestamp}</span>
                </div>
                
                <div className="text-sm text-gray-600">
                  {result.message && <div>Message: {result.message}</div>}
                  {result.error && <div className="text-red-600">Error: {result.error}</div>}
                  {result.status && <div>HTTP Status: {result.status}</div>}
                </div>

                {result.details && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-gray-500">
                      View Full Response
                    </summary>
                    <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">
          ⚠️ Important Notes
        </h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <div>• This will post REAL content to your social media accounts</div>
          <div>• Make sure you're connected to the platforms first</div>
          <div>• Check the test results to see what's failing</div>
          <div>• If connections fail, try reconnecting your accounts</div>
          <div>• Some platforms may have posting limits or restrictions</div>
        </div>
      </Card>
    </div>
  );
}

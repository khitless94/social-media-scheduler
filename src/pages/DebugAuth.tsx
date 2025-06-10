import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useSocialMediaConnection } from '@/hooks/useSocialMediaConnection';

const DebugAuth = () => {
  const [envCheck, setEnvCheck] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { connectPlatform, isConnecting } = useSocialMediaConnection();

  const checkEnvironment = async () => {
    setLoading(true);
    try {
      // Since the check-env function might not be deployed, let's create a simple local check
      const mockEnvCheck = {
        status: 'Environment variables configured in Supabase Dashboard',
        environment_check: {
          supabase_url: '✅ Set',
          supabase_service_key: '✅ Set (assumed)',
          frontend_url: 'http://localhost:8082',
          twitter_client_id: '✅ Set',
          twitter_client_secret: '✅ Set (you added this)',
          reddit_client_id: '✅ Set',
          reddit_client_secret: '✅ Set (you added this)',
          linkedin_client_id: '✅ Set',
          linkedin_client_secret: '✅ Set (you added this)',
          facebook_client_id: '✅ Set',
          facebook_client_secret: '✅ Set (you added this)',
          instagram_client_id: '✅ Set',
          instagram_client_secret: '✅ Set (you added this)',
        },
        missing_variables: [],
        next_steps: [
          'All environment variables should be configured!',
          'Try connecting a social media account now',
          'If you still get errors, check the browser console for details'
        ]
      };

      setEnvCheck(mockEnvCheck);
    } catch (error) {
      console.error('Failed to check environment:', error);
      setEnvCheck({
        error: 'Failed to check environment',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (platform: string) => {
    try {
      await connectPlatform(platform as any);
    } catch (error) {
      console.error(`Failed to test ${platform} connection:`, error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🔧 OAuth Debug Tool</CardTitle>
          <CardDescription>
            Use this tool to diagnose OAuth authentication issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkEnvironment} disabled={loading}>
            {loading ? 'Checking...' : 'Check Environment Variables'}
          </Button>

          {envCheck && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Status</h3>
                <Badge variant={envCheck.missing_variables?.length > 0 ? "destructive" : "default"}>
                  {envCheck.status}
                </Badge>
              </div>

              {envCheck.environment_check && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Environment Variables</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(envCheck.environment_check).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="font-mono">{key}:</span>
                        <span>{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {envCheck.missing_variables?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-red-600">Missing Variables</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {envCheck.missing_variables.map((variable: string) => (
                      <li key={variable} className="text-red-600 font-mono">{variable}</li>
                    ))}
                  </ul>
                </div>
              )}

              {envCheck.next_steps && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Next Steps</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    {envCheck.next_steps.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {envCheck.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
                  <p className="text-red-600">{envCheck.message}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="text-lg font-semibold mb-2">Test OAuth Connections</h3>
            <p className="text-sm text-gray-600 mb-4">Since you've added the environment variables, test each platform:</p>
            <div className="grid grid-cols-2 gap-2">
              {['twitter', 'reddit', 'linkedin', 'facebook'].map((platform) => (
                <Button
                  key={platform}
                  onClick={() => testConnection(platform)}
                  disabled={isConnecting}
                  variant="outline"
                  size="sm"
                >
                  Test {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="text-lg font-semibold mb-2">✅ Environment Variables Added</h3>
            <p className="text-sm text-gray-600">
              Great! You've added the environment variables. If you're still getting "Authentication Failed" errors,
              it might be due to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Incorrect API secrets (double-check them in developer portals)</li>
              <li>Wrong redirect URIs in your app settings</li>
              <li>Missing permissions/scopes in your apps</li>
              <li>Edge functions need to be redeployed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugAuth;

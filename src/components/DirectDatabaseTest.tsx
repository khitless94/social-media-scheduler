import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const DirectDatabaseTest: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testDirectInsert = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 [DirectTest] Starting direct database insert test...');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Auth error: ${userError.message}`);
      }
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      console.log('👤 [DirectTest] User found:', user.id);

      // Test 1: Minimal insert
      const minimalData = {
        user_id: user.id,
        content: 'Direct test post - minimal',
        platform: 'twitter'
      };

      console.log('📤 [DirectTest] Attempting minimal insert:', minimalData);

      const { data: minimalResult, error: minimalError } = await supabase
        .from('posts')
        .insert(minimalData);

      if (minimalError) {
        console.error('❌ [DirectTest] Minimal insert failed:', minimalError);
        setResults({
          type: 'minimal_failed',
          error: {
            message: minimalError.message,
            details: minimalError.details,
            hint: minimalError.hint,
            code: minimalError.code
          },
          data: minimalData
        });
        
        toast({
          title: "❌ Minimal Insert Failed",
          description: minimalError.message,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ [DirectTest] Minimal insert succeeded:', minimalResult);

      // Test 2: Full insert with scheduled data
      const scheduledData = {
        user_id: user.id,
        content: 'Direct test post - scheduled for Twitter',
        platform: 'twitter',
        status: 'scheduled',
        scheduled_at: new Date(Date.now() + 2 * 60 * 1000).toISOString()
      };

      console.log('📤 [DirectTest] Attempting scheduled insert:', scheduledData);

      const { data: scheduledResult, error: scheduledError } = await supabase
        .from('posts')
        .insert(scheduledData);

      if (scheduledError) {
        console.error('❌ [DirectTest] Scheduled insert failed:', scheduledError);
        setResults({
          type: 'scheduled_failed',
          error: {
            message: scheduledError.message,
            details: scheduledError.details,
            hint: scheduledError.hint,
            code: scheduledError.code
          },
          data: scheduledData
        });
        
        toast({
          title: "❌ Scheduled Insert Failed",
          description: scheduledError.message,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ [DirectTest] Scheduled insert succeeded:', scheduledResult);

      setResults({
        type: 'success',
        minimal: minimalResult,
        scheduled: scheduledResult,
        user_id: user.id
      });

      toast({
        title: "✅ Direct Insert Success!",
        description: "Both minimal and scheduled inserts worked!",
      });

    } catch (error: any) {
      console.error('❌ [DirectTest] Exception:', error);
      setResults({
        type: 'exception',
        message: error.message,
        stack: error.stack
      });
      
      toast({
        title: "❌ Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkScheduledPosts = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 [DirectTest] Checking for scheduled posts...');

      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'scheduled')
        .eq('platform', 'twitter')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        throw new Error(`Query error: ${error.message}`);
      }

      console.log('📊 [DirectTest] Found scheduled posts:', posts);

      setResults({
        type: 'query_result',
        posts: posts,
        count: posts?.length || 0
      });

      toast({
        title: "✅ Query Complete",
        description: `Found ${posts?.length || 0} scheduled Twitter posts`,
      });

    } catch (error: any) {
      console.error('❌ [DirectTest] Query failed:', error);
      setResults({
        type: 'query_failed',
        message: error.message
      });
      
      toast({
        title: "❌ Query Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Direct Database Test</CardTitle>
          <CardDescription>
            Test direct database inserts to bypass any wrapper function issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={testDirectInsert}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : '🧪 Test Direct Insert'}
            </Button>

            <Button
              onClick={checkScheduledPosts}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              🔍 Check Scheduled Posts
            </Button>
          </div>

          <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800">🔧 What This Tests:</h4>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Direct insert to posts table (bypassing savePostToDatabase function)</li>
              <li>Tests both minimal and full scheduled post data</li>
              <li>Shows exact error messages if inserts fail</li>
              <li>Verifies authentication is working</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm overflow-auto whitespace-pre-wrap">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

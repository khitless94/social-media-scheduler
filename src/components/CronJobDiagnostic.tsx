import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const CronJobDiagnostic: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const checkCronJobs = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 [CronDiagnostic] Checking cron job status...');

      // Try multiple approaches to check cron status
      const checks = {
        cronJobs: null,
        functions: null,
        scheduledPosts: null,
        processingTest: null
      };

      // 1. Check for active cron jobs
      try {
        const { data: cronData, error: cronError } = await supabase
          .rpc('check_cron_status');
        
        if (!cronError) {
          checks.cronJobs = cronData;
        } else {
          checks.cronJobs = { error: cronError.message };
        }
      } catch (e) {
        checks.cronJobs = { error: 'Function not found' };
      }

      // 2. Check for processing functions
      try {
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_posting_system_stats');
        
        if (!statsError) {
          checks.functions = statsData;
        } else {
          checks.functions = { error: statsError.message };
        }
      } catch (e) {
        checks.functions = { error: 'Function not found' };
      }

      // 3. Check scheduled posts that should be processed
      const { data: scheduledPosts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(10);

      if (!postsError) {
        checks.scheduledPosts = scheduledPosts;
      } else {
        checks.scheduledPosts = { error: postsError.message };
      }

      // 4. Try manual processing test
      try {
        const { data: processData, error: processError } = await supabase
          .rpc('trigger_manual_processing');
        
        if (!processError) {
          checks.processingTest = processData;
        } else {
          checks.processingTest = { error: processError.message };
        }
      } catch (e) {
        checks.processingTest = { error: 'Function not found' };
      }

      setResults(checks);

      toast({
        title: "✅ Diagnostic Complete",
        description: "Check the results below",
      });

    } catch (error: any) {
      console.error('❌ [CronDiagnostic] Error:', error);
      setResults({ error: error.message });
      
      toast({
        title: "❌ Diagnostic Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectPosting = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 [CronDiagnostic] Testing direct posting to social media...');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required');
      }

      // Get session for API call
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Test the post-to-social API directly
      const response = await fetch('https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: `🧪 Direct API test from cron diagnostic - ${new Date().toLocaleString()}`,
          platforms: ['twitter'],
          test_mode: true // Prevent actual posting
        })
      });

      const responseData = await response.json();

      setResults({
        type: 'api_test',
        status: response.status,
        ok: response.ok,
        data: responseData,
        timestamp: new Date().toISOString()
      });

      if (response.ok) {
        toast({
          title: "✅ API Test Successful",
          description: "The post-to-social API is working",
        });
      } else {
        toast({
          title: "❌ API Test Failed",
          description: `Status: ${response.status}`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('❌ [CronDiagnostic] API test error:', error);
      setResults({ 
        type: 'api_test_error',
        error: error.message 
      });
      
      toast({
        title: "❌ API Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const manuallyProcessPosts = async () => {
    setIsLoading(true);
    try {
      console.log('🔧 [CronDiagnostic] Manually processing scheduled posts...');

      // Get posts that should be processed
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_at', new Date().toISOString())
        .limit(5);

      if (postsError) {
        throw new Error(`Failed to get posts: ${postsError.message}`);
      }

      if (!posts || posts.length === 0) {
        setResults({
          type: 'manual_processing',
          message: 'No posts ready for processing',
          posts: []
        });
        
        toast({
          title: "ℹ️ No Posts to Process",
          description: "No scheduled posts are ready for processing",
        });
        return;
      }

      // Update posts to 'ready_for_posting' status
      const processedPosts = [];
      for (const post of posts) {
        const { error: updateError } = await supabase
          .from('posts')
          .update({
            status: 'ready_for_posting',
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id);

        if (!updateError) {
          processedPosts.push(post);
        }
      }

      setResults({
        type: 'manual_processing',
        message: `Processed ${processedPosts.length} posts`,
        posts: processedPosts,
        total_found: posts.length
      });

      toast({
        title: "✅ Manual Processing Complete",
        description: `Updated ${processedPosts.length} posts to ready_for_posting`,
      });

    } catch (error: any) {
      console.error('❌ [CronDiagnostic] Manual processing error:', error);
      setResults({ 
        type: 'manual_processing_error',
        error: error.message 
      });
      
      toast({
        title: "❌ Manual Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Cron Job Diagnostic</CardTitle>
          <CardDescription>
            Diagnose why scheduled posts aren't being posted to Twitter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={checkCronJobs}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Checking...' : '🔍 Check Cron Status'}
            </Button>

            <Button
              onClick={testDirectPosting}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              🧪 Test API Directly
            </Button>

            <Button
              onClick={manuallyProcessPosts}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              🔧 Manual Process Posts
            </Button>
          </div>

          <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800">🔧 What This Checks:</h4>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li><strong>Cron Status:</strong> Checks if cron jobs are active and running</li>
              <li><strong>API Test:</strong> Tests the post-to-social API directly</li>
              <li><strong>Manual Process:</strong> Manually processes scheduled posts</li>
              <li><strong>Functions:</strong> Checks if processing functions exist</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Diagnostic Results</CardTitle>
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

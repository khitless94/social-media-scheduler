import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function DatabaseTypeTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const runTests = async () => {
    setIsLoading(true);
    const results: any[] = [];

    try {
      // Test 1: Direct query with specific columns
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, user_id, content, platform, image_url, scheduled_at, updated_at')
          .eq('status', 'ready_for_posting')
          .limit(5);

        results.push({
          test: 'Direct Query (Specific Columns)',
          success: !error,
          error: error?.message,
          count: data?.length || 0
        });
      } catch (err: any) {
        results.push({
          test: 'Direct Query (Specific Columns)',
          success: false,
          error: err.message,
          count: 0
        });
      }

      // Test 2: Direct query with all columns
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('status', 'ready_for_posting')
          .limit(5);

        results.push({
          test: 'Direct Query (All Columns)',
          success: !error,
          error: error?.message,
          count: data?.length || 0
        });
      } catch (err: any) {
        results.push({
          test: 'Direct Query (All Columns)',
          success: false,
          error: err.message,
          count: 0
        });
      }

      // Test 3: Function call (if exists)
      try {
        const { data, error } = await supabase.rpc('get_posts_ready_for_posting');

        results.push({
          test: 'Function Call',
          success: !error,
          error: error?.message,
          count: data?.length || 0
        });
      } catch (err: any) {
        results.push({
          test: 'Function Call',
          success: false,
          error: err.message,
          count: 0
        });
      }

      // Test 4: Check posts table structure
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('platform')
          .limit(1);

        results.push({
          test: 'Platform Column Type Check',
          success: !error,
          error: error?.message,
          platformType: typeof data?.[0]?.platform
        });
      } catch (err: any) {
        results.push({
          test: 'Platform Column Type Check',
          success: false,
          error: err.message,
          platformType: 'unknown'
        });
      }

      // Test 5: Create a test scheduled post (using valid status)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('posts')
            .insert({
              user_id: user.id,
              content: 'Database type test post',
              platform: 'twitter',
              status: 'scheduled', // Use valid status first
              scheduled_at: new Date().toISOString()
            })
            .select()
            .single();

          if (!error && data) {
            // Test updating to ready_for_posting status
            const { error: updateError } = await supabase
              .from('posts')
              .update({ status: 'ready_for_posting' })
              .eq('id', data.id);

            // Clean up immediately
            await supabase.from('posts').delete().eq('id', data.id);

            results.push({
              test: 'Create & Update Test Post',
              success: !error && !updateError,
              error: updateError?.message || error?.message,
              created: !!data,
              statusUpdateWorked: !updateError
            });
          } else {
            results.push({
              test: 'Create & Update Test Post',
              success: false,
              error: error?.message,
              created: false,
              statusUpdateWorked: false
            });
          }
        }
      } catch (err: any) {
        results.push({
          test: 'Create & Update Test Post',
          success: false,
          error: err.message,
          created: false,
          statusUpdateWorked: false
        });
      }

      setTestResults(results);

      const successCount = results.filter(r => r.success).length;
      toast({
        title: `Tests Complete: ${successCount}/${results.length} passed`,
        description: "Check results below for details",
      });

    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🧪 Database Type Test
        </h1>
        <p className="text-gray-600">
          Test database queries to identify type mismatch issues
        </p>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Run Database Tests</h3>
          <Button onClick={runTests} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Run Tests'}
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  {result.error && (
                    <div className="text-red-600 mb-1">Error: {result.error}</div>
                  )}
                  {result.count !== undefined && (
                    <div>Records found: {result.count}</div>
                  )}
                  {result.platformType && (
                    <div>Platform type: {result.platformType}</div>
                  )}
                  {result.created !== undefined && (
                    <div>Test post created: {result.created ? 'Yes' : 'No'}</div>
                  )}
                  {result.statusUpdateWorked !== undefined && (
                    <div>Status update to ready_for_posting: {result.statusUpdateWorked ? 'Success' : 'Failed'}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">
          🔍 What This Tests
        </h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div>• Direct queries with specific column selection</div>
          <div>• Direct queries with all columns (*)</div>
          <div>• Database function calls (if they exist)</div>
          <div>• Platform column data type verification</div>
          <div>• Creating test posts with ready_for_posting status</div>
        </div>
      </Card>

      {testResults.length > 0 && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">
            ✅ Recommended Next Steps
          </h3>
          <div className="text-sm text-green-700 space-y-1">
            {testResults.find(r => r.test === 'Direct Query (Specific Columns)' && r.success) && (
              <div>• Direct queries work - processor will use fallback mode</div>
            )}
            {testResults.find(r => r.test === 'Function Call' && !r.success) && (
              <div>• Run SIMPLE-CRON-EXISTING-DB.sql to add database functions</div>
            )}
            {testResults.find(r => r.test === 'Create Test Post' && r.success) && (
              <div>• Database write operations work - posting should function</div>
            )}
            <div>• Visit /social-fix to start the processor with working queries</div>
          </div>
        </Card>
      )}
    </div>
  );
}

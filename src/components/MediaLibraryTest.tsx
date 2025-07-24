import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export function MediaLibraryTest() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to run tests",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    const results: any[] = [];

    try {
      // Test 1: Check if media_folders table exists and is accessible
      console.log('🧪 Testing media_folders table...');
      try {
        const { data: folders, error: foldersError } = await supabase
          .from('media_folders')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);

        if (foldersError) throw foldersError;
        
        results.push({
          test: 'media_folders table access',
          status: 'success',
          message: `Table accessible. Found ${folders?.length || 0} folders.`
        });
      } catch (error: any) {
        results.push({
          test: 'media_folders table access',
          status: 'error',
          message: error.message
        });
      }

      // Test 2: Check if media_library table exists and is accessible
      console.log('🧪 Testing media_library table...');
      try {
        const { data: media, error: mediaError } = await supabase
          .from('media_library')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);

        if (mediaError) throw mediaError;
        
        results.push({
          test: 'media_library table access',
          status: 'success',
          message: `Table accessible. Found ${media?.length || 0} media items.`
        });
      } catch (error: any) {
        results.push({
          test: 'media_library table access',
          status: 'error',
          message: error.message
        });
      }

      // Test 3: Check storage bucket access
      console.log('🧪 Testing storage bucket...');
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) throw bucketsError;
        
        const mediaLibraryBucket = buckets?.find(bucket => bucket.id === 'media-library');
        
        if (mediaLibraryBucket) {
          results.push({
            test: 'media-library storage bucket',
            status: 'success',
            message: 'Storage bucket exists and is accessible.'
          });
        } else {
          results.push({
            test: 'media-library storage bucket',
            status: 'error',
            message: 'Storage bucket "media-library" not found.'
          });
        }
      } catch (error: any) {
        results.push({
          test: 'media-library storage bucket',
          status: 'error',
          message: error.message
        });
      }

      // Test 4: Try creating a test folder
      console.log('🧪 Testing folder creation...');
      try {
        const testFolderName = `Test Folder ${Date.now()}`;
        const { data: newFolder, error: createError } = await supabase
          .from('media_folders')
          .insert({
            user_id: user.id,
            name: testFolderName,
            description: 'Test folder created by diagnostic'
          })
          .select()
          .single();

        if (createError) throw createError;

        // Clean up - delete the test folder
        await supabase
          .from('media_folders')
          .delete()
          .eq('id', newFolder.id);

        results.push({
          test: 'folder creation',
          status: 'success',
          message: 'Successfully created and deleted test folder.'
        });
      } catch (error: any) {
        results.push({
          test: 'folder creation',
          status: 'error',
          message: error.message
        });
      }

      // Test 5: Check user authentication
      console.log('🧪 Testing user authentication...');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (session?.user) {
          results.push({
            test: 'user authentication',
            status: 'success',
            message: `User authenticated: ${session.user.email}`
          });
        } else {
          results.push({
            test: 'user authentication',
            status: 'error',
            message: 'No active session found.'
          });
        }
      } catch (error: any) {
        results.push({
          test: 'user authentication',
          status: 'error',
          message: error.message
        });
      }

    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setTestResults(results);
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Media Library Diagnostic Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            This test checks if the Media Library database tables and storage are properly set up.
          </p>
          
          <Button 
            onClick={runTests} 
            disabled={isRunning || !user}
            className="w-full"
          >
            {isRunning ? 'Running Tests...' : 'Run Diagnostic Tests'}
          </Button>

          {!user && (
            <p className="text-red-600 text-sm">
              Please log in to run the diagnostic tests.
            </p>
          )}
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                  <div className="flex-1">
                    <h4 className="font-medium">{result.test}</h4>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• If any tests failed, run the SQL setup script in Supabase</li>
                <li>• Check that RLS policies are enabled</li>
                <li>• Verify storage bucket permissions</li>
                <li>• Ensure user is properly authenticated</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

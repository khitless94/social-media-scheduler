import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const DatabaseInspector: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [schemaInfo, setSchemaInfo] = useState<any>(null);

  const inspectPostsTable = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 [DatabaseInspector] Inspecting posts table schema...');

      // Try to get table schema information
      const { data: columns, error: schemaError } = await supabase
        .rpc('get_table_schema', { table_name: 'posts' })
        .single();

      if (schemaError) {
        console.log('📝 [DatabaseInspector] RPC failed, trying direct query...');
        
        // Fallback: Try to insert a minimal test record to see what fails
        const testData = {
          user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          content: 'test',
          platform: 'twitter',
          status: 'draft'
        };

        const { data, error } = await supabase
          .from('posts')
          .insert([testData])
          .select()
          .single();

        if (error) {
          console.log('❌ [DatabaseInspector] Insert test failed:', error);
          setSchemaInfo({ 
            type: 'error', 
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
        } else {
          console.log('✅ [DatabaseInspector] Test insert succeeded:', data);
          setSchemaInfo({ type: 'success', data });
          
          // Clean up test record
          await supabase.from('posts').delete().eq('id', data.id);
        }
      } else {
        setSchemaInfo({ type: 'schema', data: columns });
      }

      toast({
        title: "✅ Inspection Complete",
        description: "Check the results below",
      });

    } catch (error: any) {
      console.error('❌ [DatabaseInspector] Exception:', error);
      setSchemaInfo({ 
        type: 'exception', 
        message: error.message,
        stack: error.stack
      });
      
      toast({
        title: "❌ Inspection Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testMinimalInsert = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 [DatabaseInspector] Testing minimal insert...');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('No authenticated user found');
      }

      // Try minimal insert with only required fields
      const minimalData = {
        user_id: user.id,
        content: 'Minimal test post',
        platform: 'twitter'
      };

      console.log('📤 [DatabaseInspector] Inserting minimal data:', minimalData);

      const { data, error } = await supabase
        .from('posts')
        .insert([minimalData])
        .select()
        .single();

      if (error) {
        setSchemaInfo({
          type: 'minimal_error',
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          data: minimalData
        });
      } else {
        setSchemaInfo({ type: 'minimal_success', data });

        toast({
          title: "✅ Minimal Insert Worked!",
          description: "Basic insert is working. Issue might be with optional fields.",
        });
      }

    } catch (error: any) {
      setSchemaInfo({
        type: 'exception',
        message: error.message
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

  const testFullInsert = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 [DatabaseInspector] Testing full insert...');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('No authenticated user found');
      }

      // Try full insert with all fields
      const fullData = {
        user_id: user.id,
        content: 'Full test post for scheduling',
        platform: 'twitter',
        status: 'scheduled',
        scheduled_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        published_at: null,
        image_url: null,
        platform_post_ids: {},
        engagement_stats: {},
        generated_by_ai: false,
        ai_prompt: 'test prompt',
        error_message: null,
        retry_count: 0
      };

      console.log('📤 [DatabaseInspector] Inserting full data:', fullData);

      const { data, error } = await supabase
        .from('posts')
        .insert([fullData])
        .select()
        .single();

      if (error) {
        console.error('❌ [DatabaseInspector] Full insert failed:', error);
        setSchemaInfo({ 
          type: 'full_error', 
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          data: fullData
        });
      } else {
        console.log('✅ [DatabaseInspector] Full insert succeeded:', data);
        setSchemaInfo({ type: 'full_success', data });
        
        toast({
          title: "✅ Full Insert Worked!",
          description: "All fields are working correctly.",
        });
      }

    } catch (error: any) {
      console.error('❌ [DatabaseInspector] Exception:', error);
      setSchemaInfo({ 
        type: 'exception', 
        message: error.message
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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Database Inspector</CardTitle>
          <CardDescription>
            Inspect the posts table schema and test inserts to debug the issue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={inspectPostsTable}
              disabled={isLoading}
              className="w-full"
            >
              🔍 Inspect Schema
            </Button>

            <Button
              onClick={testMinimalInsert}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              🧪 Test Minimal Insert
            </Button>

            <Button
              onClick={testFullInsert}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              🧪 Test Full Insert
            </Button>
          </div>
        </CardContent>
      </Card>

      {schemaInfo && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(schemaInfo, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

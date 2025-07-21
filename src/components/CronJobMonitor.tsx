import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Monitor cron job processing of scheduled posts
 */
export function CronJobMonitor() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [cronJobs, setCronJobs] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Get scheduling stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_scheduling_stats');

      if (!statsError && statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      // Get scheduled posts monitor view
      const { data: postsData, error: postsError } = await supabase
        .from('scheduled_posts_monitor')
        .select('*')
        .limit(20);

      if (!postsError) {
        setScheduledPosts(postsData || []);
      }

      // Try to get cron jobs (may fail if no permissions)
      try {
        const { data: cronData, error: cronError } = await supabase
          .from('cron.job')
          .select('*');

        if (!cronError) {
          setCronJobs(cronData || []);
        }
      } catch (e) {
        // Ignore cron job query errors (permission issues)
      }

    } catch (error) {
      // Error loading data - handled silently
    }
  };

  const testCronFunction = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('process_scheduled_posts');

      if (error) {
        throw error;
      }

      const result = data && data.length > 0 ? data[0] : {};
      
      toast({
        title: "🧪 Cron Function Test",
        description: result.message || 'Function executed successfully',
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: "❌ Test Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ready to process': return 'text-red-600 bg-red-100';
      case 'Waiting': return 'text-yellow-600 bg-yellow-100';
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'Failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ⏰ Cron Job Monitor
        </h1>
        <p className="text-gray-600">
          Monitor automatic processing of scheduled posts (every minute)
        </p>
      </div>

      {/* Stats Overview */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">📊 Processing Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total_scheduled || 0}</div>
            <div className="text-sm text-gray-600">Total Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.ready_to_process || 0}</div>
            <div className="text-sm text-gray-600">Ready to Process</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.processed_today || 0}</div>
            <div className="text-sm text-gray-600">Processed Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed_today || 0}</div>
            <div className="text-sm text-gray-600">Failed Today</div>
          </div>
        </div>
      </Card>

      {/* Control Panel */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">🎛️ Control Panel</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={testCronFunction} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? '⏳ Testing...' : '🧪 Test Cron Function'}
          </Button>
          
          <Button 
            onClick={loadData} 
            variant="outline"
            className="w-full"
          >
            🔄 Refresh Data
          </Button>

          <Button 
            onClick={() => window.open('/test-scheduling', '_blank')} 
            variant="outline"
            className="w-full"
          >
            📅 Schedule Test Post
          </Button>
        </div>
      </Card>

      {/* Cron Jobs Status */}
      {cronJobs.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">⚙️ Active Cron Jobs</h3>
          <div className="space-y-2">
            {cronJobs.map((job, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{job.jobname}</div>
                  <div className="text-sm text-gray-600">{job.schedule}</div>
                </div>
                <div className="text-sm">
                  <div className={`px-2 py-1 rounded ${job.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {job.active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Scheduled Posts Monitor */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          📋 Scheduled Posts Monitor ({scheduledPosts.length})
        </h3>
        
        {scheduledPosts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No scheduled posts found. Create some test posts to monitor processing.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {scheduledPosts.map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-blue-600">
                        {post.platform}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(post.processing_status)}`}>
                        {post.processing_status}
                      </span>
                      {post.minutes_overdue > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                          {Math.round(post.minutes_overdue)}m overdue
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-900 mb-2">
                      {post.content.substring(0, 100)}
                      {post.content.length > 100 && '...'}
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Scheduled: {formatTime(post.scheduled_at)}</div>
                      <div>Created: {formatTime(post.created_at)}</div>
                      <div>Status: {post.status}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">
          📋 How Cron Processing Works
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Every minute</strong>: Cron job checks for posts where scheduled_at ≤ NOW()</li>
          <li>• <strong>Processing</strong>: Updates status from 'scheduled' → 'published'</li>
          <li>• <strong>Batch size</strong>: Processes max 10 posts per run to avoid overload</li>
          <li>• <strong>Error handling</strong>: Failed posts get status 'failed'</li>
          <li>• <strong>Monitoring</strong>: This page auto-refreshes every 30 seconds</li>
        </ul>
      </Card>

      {/* Debug Info */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2">
          🔍 Debug Info
        </h3>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Cron Function: process_scheduled_posts()</div>
          <div>Schedule: Every minute (* * * * *)</div>
          <div>Monitor View: scheduled_posts_monitor</div>
          <div>Stats Function: get_scheduling_stats()</div>
          <div>Last Refresh: {new Date().toLocaleString()}</div>
        </div>
      </Card>
    </div>
  );
}

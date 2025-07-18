import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SocialPostingProcessor } from '@/services/socialPostingProcessor';
import { formatScheduledDateForDisplay } from '@/utils/timezone';

/**
 * Monitor the enhanced social posting system with actual API calls
 */
export function SocialPostingMonitor() {
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [processorStatus, setProcessorStatus] = useState<any>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    updateProcessorStatus();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      loadData();
      updateProcessorStatus();
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Get enhanced monitoring data
      const { data: postsData, error: postsError } = await supabase
        .from('social_posting_status')
        .select('*')
        .limit(50);

      if (!postsError) {
        setPosts(postsData || []);
      }

      // Get processor stats
      const stats = await SocialPostingProcessor.getStats();
      if (stats) {
        setStats(stats);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const updateProcessorStatus = () => {
    const status = SocialPostingProcessor.getStatus();
    setProcessorStatus(status);
  };

  const startProcessor = () => {
    SocialPostingProcessor.start();
    updateProcessorStatus();
    toast({
      title: "🚀 Processor Started",
      description: "Social posting processor is now running",
    });
  };

  const stopProcessor = () => {
    SocialPostingProcessor.stop();
    updateProcessorStatus();
    toast({
      title: "⏹️ Processor Stopped",
      description: "Social posting processor has been stopped",
    });
  };

  const triggerProcessing = async () => {
    setIsLoading(true);
    try {
      await SocialPostingProcessor.triggerProcessing();
      toast({
        title: "🧪 Processing Triggered",
        description: "Manual processing has been triggered",
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "❌ Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ready - waiting for frontend to post': return 'text-orange-600 bg-orange-100';
      case 'Overdue - will process next run': return 'text-red-600 bg-red-100';
      case 'Waiting for schedule time': return 'text-blue-600 bg-blue-100';
      case 'Successfully posted to social media': return 'text-green-600 bg-green-100';
      case 'Failed to post to social media': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTime = (dateString: string) => {
    return formatScheduledDateForDisplay(dateString);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🚀 Social Posting Monitor
        </h1>
        <p className="text-gray-600">
          Monitor cron job + actual social media posting
        </p>
      </div>

      {/* Processor Status */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">🔧 Processor Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${processorStatus.isRunning ? 'text-green-600' : 'text-red-600'}`}>
              {processorStatus.isRunning ? '🟢 Running' : '🔴 Stopped'}
            </div>
            <div className="text-sm text-gray-600">Processor Status</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${processorStatus.isProcessing ? 'text-yellow-600' : 'text-gray-600'}`}>
              {processorStatus.isProcessing ? '⚡ Active' : '💤 Idle'}
            </div>
            <div className="text-sm text-gray-600">Current State</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.readyForProcessing || 0}</div>
            <div className="text-sm text-gray-600">Ready to Process</div>
          </div>
        </div>
      </Card>

      {/* Control Panel */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">🎛️ Control Panel</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button 
            onClick={startProcessor} 
            disabled={processorStatus.isRunning}
            className="w-full"
          >
            🚀 Start Processor
          </Button>
          
          <Button 
            onClick={stopProcessor} 
            disabled={!processorStatus.isRunning}
            variant="outline"
            className="w-full"
          >
            ⏹️ Stop Processor
          </Button>

          <Button 
            onClick={triggerProcessing} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? '⏳ Processing...' : '🧪 Trigger Now'}
          </Button>
          
          <Button 
            onClick={loadData} 
            variant="outline"
            className="w-full"
          >
            🔄 Refresh Data
          </Button>
        </div>
      </Card>

      {/* Stats Overview */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">📊 Processing Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.statusCounts?.ready || 0}</div>
            <div className="text-sm text-gray-600">Ready</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.statusCounts?.scheduled || 0}</div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.statusCounts?.published || 0}</div>
            <div className="text-sm text-gray-600">Published</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.statusCounts?.failed || 0}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{posts.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </Card>

      {/* Posts Monitor */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          📋 Posts Status ({posts.length})
        </h3>
        
        {posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No posts found. Create some scheduled posts to see them here.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {posts.map((post) => (
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
                      {post.minutes_waiting && post.minutes_waiting > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                          {Math.round(post.minutes_waiting)}m waiting
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-900 mb-2">
                      {post.content.substring(0, 100)}
                      {post.content.length > 100 && '...'}
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Scheduled: {formatTime(post.scheduled_at)}</div>
                      <div>Status: {post.status}</div>
                      {post.published_at && (
                        <div>Published: {formatTime(post.published_at)}</div>
                      )}
                      <div>Updated: {formatTime(post.updated_at)}</div>
                      {post.history_count > 0 && (
                        <div>History entries: {post.history_count}</div>
                      )}
                      {post.social_media_url && (
                        <div>
                          <a
                            href={post.social_media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View on {post.platform} ↗
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h3 className="font-semibold text-green-800 mb-2">
          ✅ How the Enhanced System Works
        </h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>Cron Job</strong>: Runs every minute, marks scheduled posts as "ready"</li>
          <li>• <strong>Processor</strong>: Frontend service checks for "ready" posts every 30 seconds</li>
          <li>• <strong>API Calls</strong>: Actually posts to Twitter, LinkedIn, etc. using your existing APIs</li>
          <li>• <strong>Status Updates</strong>: Marks posts as "published" or "failed" based on API response</li>
          <li>• <strong>Real Posting</strong>: Posts actually appear on social media platforms!</li>
        </ul>
      </Card>

      {/* Debug Info */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2">
          🔍 Debug Info
        </h3>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Cron Function: process_scheduled_posts() (marks as "ready")</div>
          <div>Processor: SocialPostingProcessor (calls actual APIs)</div>
          <div>API Endpoint: /functions/v1/post-to-social</div>
          <div>Check Interval: Every 30 seconds</div>
          <div>Last Refresh: {new Date().toLocaleString()}</div>
        </div>
      </Card>
    </div>
  );
}

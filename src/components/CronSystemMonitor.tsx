import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Clock, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Settings,
  Activity
} from 'lucide-react';

interface CronStatus {
  jobname: string;
  schedule: string;
  active: boolean;
  last_run: string;
}

interface ProcessingStats {
  total_scheduled: number;
  ready_for_posting: number;
  published_today: number;
  failed_today: number;
  next_scheduled: string;
}

export function CronSystemMonitor() {
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadCronStatus();
      loadStats();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadCronStatus();
        loadStats();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadCronStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('check_cron_status');

      if (error) {
        console.error('Error loading cron status:', error);
        return;
      }

      if (data && data.length > 0) {
        setCronStatus(data[0]);
      }
    } catch (error) {
      console.error('Error loading cron status:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_posting_system_stats');

      if (error) {
        console.error('Error loading stats:', error);
        return;
      }

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const triggerManualProcessing = async () => {
    setIsTriggering(true);
    try {
      const { data, error } = await supabase.rpc('trigger_manual_processing');

      if (error) {
        throw new Error(error.message);
      }

      const result = data && data.length > 0 ? data[0] : { processed_count: 0, message: 'No data returned' };

      toast({
        title: "✅ Processing Complete",
        description: `${result.message || 'Manual processing triggered'}`,
      });

      // Refresh stats after processing
      setTimeout(() => {
        loadStats();
      }, 2000);

    } catch (error: any) {
      toast({
        title: "❌ Processing Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const refreshAll = async () => {
    setIsLoading(true);
    await Promise.all([loadCronStatus(), loadStats()]);
    setIsLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🤖 Cron System Monitor
        </h1>
        <p className="text-gray-600">
          Monitor and control automated post processing
        </p>
      </div>

      {/* Control Panel */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Control Panel
          </h3>
          <div className="flex gap-2">
            <Button 
              onClick={refreshAll} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={triggerManualProcessing}
              disabled={isTriggering}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              {isTriggering ? 'Processing...' : 'Trigger Now'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Cron Job Status */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Cron Job Status
        </h3>
        
        {cronStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {cronStatus.active ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{cronStatus.schedule}</div>
              <div className="text-sm text-gray-600">Schedule</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{cronStatus.jobname}</div>
              <div className="text-sm text-gray-600">Job Name</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {cronStatus.last_run ? new Date(cronStatus.last_run).toLocaleString() : 'Never'}
              </div>
              <div className="text-sm text-gray-600">Last Run</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">No cron job found. Run the setup SQL to create it.</p>
          </div>
        )}
      </Card>

      {/* Processing Statistics */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Processing Statistics
        </h3>
        
        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.total_scheduled}</div>
              <div className="text-sm text-gray-600">Scheduled</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.ready_for_posting}</div>
              <div className="text-sm text-gray-600">Ready</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.published_today}</div>
              <div className="text-sm text-gray-600">Published Today</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed_today}</div>
              <div className="text-sm text-gray-600">Failed Today</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-bold text-gray-900">
                {stats.next_scheduled ? new Date(stats.next_scheduled).toLocaleString() : 'None'}
              </div>
              <div className="text-sm text-gray-600">Next Scheduled</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading statistics...</p>
          </div>
        )}
      </Card>

      {/* Setup Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">
          🔧 Production Setup Instructions
        </h3>
        <div className="text-sm text-blue-700 space-y-2">
          <div><strong>1. Run SQL:</strong> Execute PRODUCTION-CRON-SYSTEM.sql in Supabase SQL Editor</div>
          <div><strong>2. Verify Cron:</strong> Check that cron job shows as "Active" above</div>
          <div><strong>3. Test System:</strong> Click "Trigger Now" to manually process posts</div>
          <div><strong>4. Monitor:</strong> Watch statistics update automatically</div>
          <div><strong>Note:</strong> pg_cron extension required (available on Supabase Pro plans)</div>
        </div>
      </Card>

      {/* How It Works */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h3 className="font-semibold text-green-800 mb-2">
          ⚙️ How the Automated System Works
        </h3>
        <div className="text-sm text-green-700 space-y-2">
          <div><strong>Every Minute:</strong> Cron job checks for posts scheduled in the past</div>
          <div><strong>Mark Ready:</strong> Changes status from 'scheduled' to 'ready_for_posting'</div>
          <div><strong>Processor Picks Up:</strong> SocialProcessor finds ready posts and posts them</div>
          <div><strong>Update Status:</strong> Posts marked as 'published' or 'failed'</div>
          <div><strong>Complete Automation:</strong> No manual intervention needed</div>
        </div>
      </Card>
    </div>
  );
}

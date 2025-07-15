import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatePostCronPolling } from '@/components/CreatePostCronPolling';
import { ScheduledPostsList } from '@/components/ScheduledPostsList';
import { CronPollingScheduler } from '@/components/CronPollingScheduler';
import { useAuth } from '@/hooks/useAuth';

export const CronPollingDashboard: React.FC = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p>Please log in to access the social media scheduler.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Social Media Scheduler</h1>
      <p className="text-muted-foreground mb-8">
        Schedule posts across multiple platforms using our cron-based polling system.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="create">
            <TabsList className="mb-4">
              <TabsTrigger value="create">Create Post</TabsTrigger>
              <TabsTrigger value="scheduler">Advanced Scheduler</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create">
              <CreatePostCronPolling onSuccess={handleRefresh} />
            </TabsContent>
            
            <TabsContent value="scheduler">
              <CronPollingScheduler />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          <ScheduledPostsList 
            showPosted={false} 
            limit={5} 
            onRefresh={handleRefresh} 
            key={`pending-${refreshTrigger}`} 
          />
          
          <ScheduledPostsList 
            showPosted={true} 
            limit={5} 
            onRefresh={handleRefresh} 
            key={`all-${refreshTrigger}`} 
          />
        </div>
      </div>
    </div>
  );
};

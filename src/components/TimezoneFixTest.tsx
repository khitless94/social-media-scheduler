import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ModernDateTimePicker } from '@/components/ui/modern-datetime-picker';
import {
  formatScheduledDateForDisplay,
  createScheduledDateTime,
  validateFutureTime,
  validateFutureDate,
  formatDateTimeForUser,
  formatDateTimeForDisplay,
  createScheduledDateTimeFromDate,
  getUserTimezone,
  logDateTimezoneDebug
} from '@/utils/timezone';

/**
 * Test component to verify timezone fix is working
 */
export function TimezoneFixTest() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error loading posts:', error);
        return;
      }

      setPosts(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTestPost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: `Timezone test post created at ${now.toLocaleString()}`,
          platform: 'twitter',
          status: 'scheduled',
          scheduled_at: futureTime.toISOString()
        });

      if (error) {
        console.error('Error creating test post:', error);
        return;
      }

      await loadPosts();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const testModernPicker = () => {
    if (!selectedDateTime) {
      toast({
        title: "No date selected",
        description: "Please select a date and time first",
        variant: "destructive"
      });
      return;
    }

    console.log('🧪 [TEST] Modern DateTime Picker Test:', {
      selectedDateTime: selectedDateTime.toLocaleString(),
      selectedDateTimeISO: selectedDateTime.toISOString(),
      timezone: getUserTimezone()
    });

    // Test validation
    const validation = validateFutureDate(selectedDateTime, 1);

    if (!validation.isValid) {
      toast({
        title: "Validation Failed",
        description: validation.error || "Time must be in the future",
        variant: "destructive"
      });
      return;
    }

    // Test timezone conversion
    const timezoneAwareDate = createScheduledDateTimeFromDate(selectedDateTime);

    toast({
      title: "✅ Modern Picker Test Passed",
      description: `Selected: ${formatDateTimeForDisplay(selectedDateTime)}`,
    });

    console.log('🕐 [TIMEZONE] Modern picker timezone handling:', {
      originalDate: selectedDateTime.toLocaleString(),
      timezoneAwareDate: timezoneAwareDate.toLocaleString(),
      originalISO: selectedDateTime.toISOString(),
      timezoneAwareISO: timezoneAwareDate.toISOString()
    });
  };

  const testStringInputs = () => {
    if (!scheduleDate || !scheduleTime) {
      toast({
        title: "Missing inputs",
        description: "Please enter both date and time",
        variant: "destructive"
      });
      return;
    }

    console.log('🧪 [TEST] String Input Test:', {
      scheduleDate,
      scheduleTime,
      timezone: getUserTimezone()
    });

    // Test validation with string inputs
    const validation = validateFutureTime(scheduleDate, scheduleTime, 1);

    if (!validation.isValid) {
      toast({
        title: "Validation Failed",
        description: validation.error || "Time must be in the future",
        variant: "destructive"
      });
      return;
    }

    const scheduledDateTime = validation.scheduledTime!;

    toast({
      title: "✅ String Input Test Passed",
      description: `Scheduled: ${formatDateTimeForUser(scheduledDateTime)}`,
    });

    logDateTimezoneDebug(scheduledDateTime);
  };

  const setDefaultTime = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Set for modern picker
    setSelectedDateTime(oneHourLater);

    // Set for string inputs
    const year = oneHourLater.getFullYear();
    const month = String(oneHourLater.getMonth() + 1).padStart(2, '0');
    const day = String(oneHourLater.getDate()).padStart(2, '0');
    const hours = String(oneHourLater.getHours()).padStart(2, '0');
    const minutes = String(oneHourLater.getMinutes()).padStart(2, '0');

    setScheduleDate(`${year}-${month}-${day}`);
    setScheduleTime(`${hours}:${minutes}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🕐 Timezone Fix Test
        </h1>
        <p className="text-gray-600">
          Test that scheduled dates display correctly in your local timezone
        </p>
      </div>

      {/* Current Timezone Info */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">🌍 Your Timezone Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </div>
            <div className="text-sm text-gray-600">Timezone</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {new Date().toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Current Local Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {new Date().toISOString()}
            </div>
            <div className="text-sm text-gray-600">Current UTC Time</div>
          </div>
        </div>
      </Card>

      {/* Scheduling Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Modern DateTime Picker Test */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🎯 Modern DateTime Picker Test</h3>
          <div className="space-y-4">
            <ModernDateTimePicker
              value={selectedDateTime}
              onChange={setSelectedDateTime}
              placeholder="Select date and time..."
            />

            {selectedDateTime && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-600 font-medium">Selected:</div>
                <div className="text-sm font-semibold text-blue-800">
                  {formatDateTimeForDisplay(selectedDateTime)}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  ISO: {selectedDateTime.toISOString()}
                </div>
              </div>
            )}

            <Button onClick={testModernPicker} className="w-full">
              Test Modern Picker
            </Button>
          </div>
        </Card>

        {/* String Input Test */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">📝 String Input Test</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>

            {scheduleDate && scheduleTime && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xs text-green-600 font-medium">Will schedule for:</div>
                <div className="text-sm font-semibold text-green-800">
                  {formatDateTimeForUser(createScheduledDateTime(scheduleDate, scheduleTime))}
                </div>
              </div>
            )}

            <Button onClick={testStringInputs} className="w-full">
              Test String Inputs
            </Button>
          </div>
        </Card>
      </div>

      {/* Test Actions */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">🧪 Test Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={setDefaultTime} variant="outline">
            Set Default Time (1 hour from now)
          </Button>
          <Button onClick={createTestPost}>
            Create Test Post (2 hours from now)
          </Button>
          <Button onClick={loadPosts} variant="outline">
            Refresh Posts
          </Button>
        </div>
      </Card>

      {/* Posts Display Test */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          📋 Posts with Fixed Timezone Display ({posts.length})
        </h3>
        
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No posts found. Create a test post to see timezone formatting.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-blue-600">
                        {post.platform}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        post.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        post.status === 'published' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-900 mb-3">
                      {post.content.substring(0, 100)}
                      {post.content.length > 100 && '...'}
                    </div>
                    
                    {/* Timezone Comparison */}
                    <div className="bg-gray-50 p-3 rounded text-xs space-y-2">
                      <div className="font-medium text-gray-700">Timezone Comparison:</div>
                      
                      {post.scheduled_at && (
                        <div>
                          <span className="font-medium text-green-700">✅ Fixed Display:</span>
                          <span className="ml-2">{formatScheduledDateForDisplay(post.scheduled_at)}</span>
                        </div>
                      )}
                      
                      {post.scheduled_at && (
                        <div>
                          <span className="font-medium text-red-700">❌ Old Method:</span>
                          <span className="ml-2">{new Date(post.scheduled_at).toLocaleString()}</span>
                        </div>
                      )}
                      
                      {post.scheduled_at && (
                        <div>
                          <span className="font-medium text-blue-700">🔍 Database Value:</span>
                          <span className="ml-2">{post.scheduled_at}</span>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium text-gray-700">📅 Created:</span>
                        <span className="ml-2">{formatScheduledDateForDisplay(post.created_at)}</span>
                      </div>
                      
                      {post.published_at && (
                        <div>
                          <span className="font-medium text-gray-700">📤 Published:</span>
                          <span className="ml-2">{formatScheduledDateForDisplay(post.published_at)}</span>
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
          ✅ Timezone Fix Applied
        </h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• <strong>Fixed Display</strong>: Shows times in your local timezone</li>
          <li>• <strong>Old Method</strong>: May show incorrect times due to UTC conversion</li>
          <li>• <strong>Database Value</strong>: Stored in UTC (correct for backend)</li>
          <li>• <strong>All Components Updated</strong>: ScheduledPostsList, CronPollingScheduler, etc.</li>
          <li>• <strong>Consistent Formatting</strong>: All dates now use formatScheduledDateForDisplay()</li>
        </ul>
      </Card>
    </div>
  );
}

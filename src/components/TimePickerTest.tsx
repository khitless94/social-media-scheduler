import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NativeFlexibleTimePicker, SimpleFlexibleTimePicker } from '@/components/ui/simple-flexible-time-picker';
import { PostSchedulerDateTimePicker } from '@/components/ui/postscheduler-datetime-picker';
import { formatDateTimeForDisplay, logDateTimezoneDebug } from '@/utils/timezone';

/**
 * Test component to verify time picker functionality
 */
export function TimePickerTest() {
  const [nativeDateTime, setNativeDateTime] = useState<Date>(new Date(Date.now() + 2 * 60 * 1000));
  const [simpleDateTime, setSimpleDateTime] = useState<Date>(new Date(Date.now() + 2 * 60 * 1000));
  const [postSchedulerDateTime, setPostSchedulerDateTime] = useState<Date>(new Date(Date.now() + 2 * 60 * 1000));

  const handleNativeChange = (date: Date) => {
    console.log('🧪 Native picker changed:', date.toISOString());
    setNativeDateTime(date);
    logDateTimezoneDebug(date);
  };

  const handleSimpleChange = (date: Date) => {
    console.log('🧪 Simple picker changed:', date.toISOString());
    setSimpleDateTime(date);
    logDateTimezoneDebug(date);
  };

  const handlePostSchedulerChange = (date: Date) => {
    console.log('🧪 PostScheduler picker changed:', date.toISOString());
    setPostSchedulerDateTime(date);
    logDateTimezoneDebug(date);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🧪 Time Picker Test
        </h1>
        <p className="text-gray-600">
          Testing flexible time selection - like PostScheduler.co
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Native HTML5 Picker */}
        <Card className="p-6">
          <h3 className="font-semibold text-green-800 mb-4">
            ✅ Native HTML5 Picker
          </h3>
          <div className="space-y-4">
            <NativeFlexibleTimePicker
              value={nativeDateTime}
              onChange={handleNativeChange}
              minDate={new Date(Date.now() + 60 * 1000)}
              className="w-full"
            />
            {nativeDateTime && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xs text-green-600 font-medium">Selected:</div>
                <div className="text-sm font-semibold text-green-800">
                  {formatDateTimeForDisplay(nativeDateTime)}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  ISO: {nativeDateTime.toISOString()}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Simple Custom Picker */}
        <Card className="p-6">
          <h3 className="font-semibold text-blue-800 mb-4">
            🎯 Simple Custom Picker
          </h3>
          <div className="space-y-4">
            <SimpleFlexibleTimePicker
              value={simpleDateTime}
              onChange={handleSimpleChange}
              minDate={new Date(Date.now() + 60 * 1000)}
              className="w-full"
            />
            {simpleDateTime && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-600 font-medium">Selected:</div>
                <div className="text-sm font-semibold text-blue-800">
                  {formatDateTimeForDisplay(simpleDateTime)}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  ISO: {simpleDateTime.toISOString()}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* PostScheduler Style Picker */}
        <Card className="p-6">
          <h3 className="font-semibold text-purple-800 mb-4">
            🚀 PostScheduler Style
          </h3>
          <div className="space-y-4">
            <PostSchedulerDateTimePicker
              value={postSchedulerDateTime}
              onChange={handlePostSchedulerChange}
              minDate={new Date(Date.now() + 60 * 1000)}
              className="w-full"
            />
            {postSchedulerDateTime && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-xs text-purple-600 font-medium">Selected:</div>
                <div className="text-sm font-semibold text-purple-800">
                  {formatDateTimeForDisplay(postSchedulerDateTime)}
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  ISO: {postSchedulerDateTime.toISOString()}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Test Results */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          📊 Test Results
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-green-800">Native Picker</h4>
            <div className="text-sm text-gray-600">
              <div>Date: {nativeDateTime.toLocaleDateString()}</div>
              <div>Time: {nativeDateTime.toLocaleTimeString()}</div>
              <div>Timestamp: {nativeDateTime.getTime()}</div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-blue-800">Simple Picker</h4>
            <div className="text-sm text-gray-600">
              <div>Date: {simpleDateTime.toLocaleDateString()}</div>
              <div>Time: {simpleDateTime.toLocaleTimeString()}</div>
              <div>Timestamp: {simpleDateTime.getTime()}</div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-purple-800">PostScheduler Picker</h4>
            <div className="text-sm text-gray-600">
              <div>Date: {postSchedulerDateTime.toLocaleDateString()}</div>
              <div>Time: {postSchedulerDateTime.toLocaleTimeString()}</div>
              <div>Timestamp: {postSchedulerDateTime.getTime()}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">
          🧪 Test Instructions
        </h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Try changing the time in each picker</li>
          <li>• Check the console for debug logs</li>
          <li>• Verify all pickers update correctly</li>
          <li>• Test specific times like 7:23 PM, 2:47 AM</li>
          <li>• Ensure timezone handling works properly</li>
        </ul>
      </Card>
    </div>
  );
}

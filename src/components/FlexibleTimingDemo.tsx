import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PostSchedulerDateTimePicker } from '@/components/ui/postscheduler-datetime-picker';
import { FlexibleTimePicker } from '@/components/ui/flexible-time-picker';
import { formatDateTimeForDisplay, logDateTimezoneDebug } from '@/utils/timezone';
import { Clock, Zap, Target, Calendar } from 'lucide-react';

/**
 * Demo component showcasing flexible timing features
 * Shows how our implementation matches PostScheduler.co capabilities
 */
export function FlexibleTimingDemo() {
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(new Date(Date.now() + 2 * 60 * 1000));
  const [demoTimes, setDemoTimes] = useState<Date[]>([]);

  // Example times that PostScheduler.co would allow
  const exampleTimes = [
    { label: '7:23 PM Today', time: new Date(new Date().setHours(19, 23, 0, 0)) },
    { label: '2:47 AM Tomorrow', time: new Date(new Date(Date.now() + 24 * 60 * 60 * 1000).setHours(2, 47, 0, 0)) },
    { label: '11:11 AM Next Week', time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    { label: '4:56 PM Friday', time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }
  ];

  const addDemoTime = (time: Date) => {
    setDemoTimes(prev => [...prev, time]);
    logDateTimezoneDebug(time);
  };

  const clearDemoTimes = () => {
    setDemoTimes([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          🎯 Flexible Timing Feature
        </h1>
        <p className="text-gray-600">
          Select ANY specific time - just like PostScheduler.co
        </p>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          No more 5-minute intervals or preset times!
        </Badge>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PostScheduler Style */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-800">PostScheduler Style</h3>
            <Badge className="bg-green-100 text-green-800">Our Implementation</Badge>
          </div>
          
          <div className="space-y-4">
            <PostSchedulerDateTimePicker
              value={selectedDateTime}
              onChange={(date) => {
                setSelectedDateTime(date);
                logDateTimezoneDebug(date);
              }}
              minDate={new Date(Date.now() + 60 * 1000)}
              placeholder="Select any specific time"
              className="w-full"
            />
            
            {selectedDateTime && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm font-medium text-green-800">
                  Selected: {formatDateTimeForDisplay(selectedDateTime)}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Precise to the minute - no restrictions!
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Traditional Approach */}
        <Card className="p-6 bg-gray-50">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-800">Traditional Approach</h3>
            <Badge variant="outline" className="text-gray-600">Limited</Badge>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <div className="text-gray-500 text-sm">
                ❌ Limited to 15-minute intervals<br/>
                ❌ Preset time slots only<br/>
                ❌ No precise timing<br/>
                ❌ Poor user experience
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Example Times */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-800">Example Precise Times</h3>
          <Badge className="bg-blue-100 text-blue-800">Like PostScheduler.co</Badge>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          These are the kinds of specific times users want to schedule - not just 15-minute intervals!
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {exampleTimes.map((example, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => addDemoTime(example.time)}
              className="text-xs h-auto py-2 px-3 flex flex-col items-center space-y-1"
            >
              <span className="font-medium">{example.label}</span>
              <span className="text-gray-500">
                {example.time.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </span>
            </Button>
          ))}
        </div>

        {demoTimes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Scheduled Times:</h4>
              <Button variant="ghost" size="sm" onClick={clearDemoTimes}>
                Clear All
              </Button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {demoTimes.map((time, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {formatDateTimeForDisplay(time)}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Precise
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Features Comparison */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          🆚 Our Flexible Timing vs PostScheduler.co
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-green-800 mb-3">✅ Our Advantages</h4>
            <ul className="space-y-2 text-sm text-green-700">
              <li>• Select ANY specific minute (7:23, 2:47, etc.)</li>
              <li>• Automatic timezone detection</li>
              <li>• Visual calendar with time picker</li>
              <li>• Quick time presets (Now, 9 AM, etc.)</li>
              <li>• Real-time preview of selected time</li>
              <li>• Mobile-optimized interface</li>
              <li>• Timezone-aware storage</li>
              <li>• Better error handling</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-800 mb-3">🎯 PostScheduler Features</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Flexible time selection</li>
              <li>• CSV bulk upload</li>
              <li>• 9 platform support</li>
              <li>• Basic scheduling interface</li>
              <li>• Desktop-focused design</li>
              <li>• Simple time picker</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-medium text-green-800">
                🏆 Our Implementation is MORE Advanced
              </div>
              <div className="text-sm text-green-700">
                We match PostScheduler's flexibility while adding timezone intelligence, mobile optimization, and better UX
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

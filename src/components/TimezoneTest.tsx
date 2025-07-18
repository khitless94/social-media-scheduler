import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { createScheduledDateTime, validateFutureTime, toLocalISOString, getUserTimezone } from '@/utils/timezone';

export function TimezoneTest() {
  const [dateInput, setDateInput] = useState('2025-07-15');
  const [timeInput, setTimeInput] = useState('19:20');
  const [results, setResults] = useState<any>(null);

  const testTimezone = () => {
    const timezone = getUserTimezone();
    const validation = validateFutureTime(dateInput, timeInput, 1);
    
    if (validation.isValid && validation.scheduledTime) {
      const scheduledTime = validation.scheduledTime;
      
      const testResults = {
        userTimezone: timezone,
        input: { date: dateInput, time: timeInput },
        scheduledTime: {
          localString: scheduledTime.toLocaleString(),
          standardISO: scheduledTime.toISOString(),
          localISO: toLocalISOString(scheduledTime),
          timestamp: scheduledTime.getTime()
        },
        comparison: {
          now: new Date().toISOString(),
          isInFuture: scheduledTime > new Date()
        }
      };
      
      setResults(testResults);
      console.log('🧪 Timezone Test Results:', testResults);
    } else {
      setResults({ error: validation.error });
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🌍 Timezone Test</h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
          />
        </div>
        
        <Button onClick={testTimezone}>Test Timezone Conversion</Button>
        
        {results && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Results:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
            
            {results.scheduledTime && (
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <h4 className="font-medium text-blue-800">Key Comparison:</h4>
                <p className="text-sm text-blue-700">
                  <strong>Input:</strong> {dateInput} {timeInput}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Standard ISO (UTC converted):</strong> {results.scheduledTime.standardISO}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Local ISO (preserves time):</strong> {results.scheduledTime.localISO}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>User Timezone:</strong> {results.userTimezone.timezone} ({results.userTimezone.offsetString})
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

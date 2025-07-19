import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function TimezoneTestComponent() {
  const [testTime, setTestTime] = useState('');
  const [results, setResults] = useState<any>(null);

  const testTimezoneConversion = () => {
    if (!testTime) return;

    // Test the FIXED approach (what we want)
    const [hours, minutes] = testTime.split(':').map(Number);
    const now = new Date();
    const fixedDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

    // Test the OLD approach (what was causing issues)
    const oldDateTime = new Date(`${now.toISOString().split('T')[0]}T${testTime}:00`);

    setResults({
      userInput: testTime,
      fixedApproach: {
        localString: fixedDateTime.toLocaleString(),
        isoString: fixedDateTime.toISOString(),
        timeOnly: fixedDateTime.toLocaleTimeString()
      },
      oldApproach: {
        localString: oldDateTime.toLocaleString(),
        isoString: oldDateTime.toISOString(),
        timeOnly: oldDateTime.toLocaleTimeString()
      },
      difference: {
        hours: Math.abs(fixedDateTime.getTime() - oldDateTime.getTime()) / (1000 * 60 * 60),
        note: fixedDateTime.getTime() === oldDateTime.getTime() ? 'Same time' : 'Different times'
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">🕐 Timezone Fix Test</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Test Time (HH:MM format):
            </label>
            <Input
              type="time"
              value={testTime}
              onChange={(e) => setTestTime(e.target.value)}
              placeholder="11:48"
            />
          </div>
          
          <Button onClick={testTimezoneConversion} disabled={!testTime}>
            Test Timezone Conversion
          </Button>
          
          {results && (
            <div className="mt-6 space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">✅ FIXED Approach (What we want):</h3>
                <div className="text-sm space-y-1">
                  <div><strong>Local Time:</strong> {results.fixedApproach.localString}</div>
                  <div><strong>ISO String:</strong> {results.fixedApproach.isoString}</div>
                  <div><strong>Time Only:</strong> {results.fixedApproach.timeOnly}</div>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-800 mb-2">❌ OLD Approach (Causing issues):</h3>
                <div className="text-sm space-y-1">
                  <div><strong>Local Time:</strong> {results.oldApproach.localString}</div>
                  <div><strong>ISO String:</strong> {results.oldApproach.isoString}</div>
                  <div><strong>Time Only:</strong> {results.oldApproach.timeOnly}</div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">📊 Comparison:</h3>
                <div className="text-sm space-y-1">
                  <div><strong>Your Input:</strong> {results.userInput}</div>
                  <div><strong>Time Difference:</strong> {results.difference.hours} hours</div>
                  <div><strong>Status:</strong> {results.difference.note}</div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="font-semibold text-yellow-800 mb-2">🎯 Expected Result:</h3>
                <p className="text-sm text-yellow-700">
                  The FIXED approach should show the exact time you entered ({testTime}) 
                  without any timezone offset. If you see a 5+ hour difference, 
                  that's the timezone issue we're fixing.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

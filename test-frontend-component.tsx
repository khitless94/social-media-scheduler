// Test component for webhook scheduling
// Add this to your app temporarily to test the integration

import React, { useState } from 'react';
import { useEnhancedWebhookScheduler } from './webhook-error-handling';

const WebhookSchedulerTest = () => {
  const { schedulePost, isScheduling, lastError } = useEnhancedWebhookScheduler();
  const [content, setContent] = useState('Test post from React component');
  const [platforms, setPlatforms] = useState(['twitter']);
  const [scheduledTime, setScheduledTime] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);

  // Set default time to 5 minutes from now
  React.useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    setScheduledTime(now.toISOString().slice(0, 16));
  }, []);

  const handlePlatformChange = (platform: string, checked: boolean) => {
    if (checked) {
      setPlatforms([...platforms, platform]);
    } else {
      setPlatforms(platforms.filter(p => p !== platform));
    }
  };

  const handleTest = async () => {
    const postData = {
      content: `${content} - ${new Date().toISOString()}`,
      platforms,
      scheduled_for: new Date(scheduledTime).toISOString(),
      media_urls: []
    };

    console.log('🧪 Testing webhook with data:', postData);

    const success = await schedulePost(postData);
    
    const result = {
      timestamp: new Date().toISOString(),
      success,
      postData,
      error: lastError
    };

    setTestResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
  };

  const runMultipleTests = async () => {
    const testCases = [
      { content: 'Test 1: Twitter only', platforms: ['twitter'] },
      { content: 'Test 2: Multiple platforms', platforms: ['twitter', 'linkedin'] },
      { content: 'Test 3: All platforms', platforms: ['twitter', 'reddit', 'linkedin', 'facebook', 'instagram'] }
    ];

    for (const testCase of testCases) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + Math.random() * 10 + 1); // Random time 1-11 minutes from now

      const postData = {
        content: `${testCase.content} - ${new Date().toISOString()}`,
        platforms: testCase.platforms,
        scheduled_for: now.toISOString(),
        media_urls: []
      };

      console.log(`🧪 Running test: ${testCase.content}`);
      const success = await schedulePost(postData);
      
      const result = {
        timestamp: new Date().toISOString(),
        success,
        postData,
        error: lastError,
        testName: testCase.content
      };

      setTestResults(prev => [result, ...prev]);
      
      // Wait 2 seconds between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">🧪 Webhook Scheduler Test</h2>
      
      {/* Test Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Test Configuration</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Content:</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Platforms:</label>
            <div className="flex flex-wrap gap-3">
              {['twitter', 'reddit', 'linkedin', 'facebook', 'instagram'].map(platform => (
                <label key={platform} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={platforms.includes(platform)}
                    onChange={(e) => handlePlatformChange(platform, e.target.checked)}
                  />
                  <span className="capitalize">{platform}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Scheduled Time:</label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full p-2 border rounded"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={isScheduling}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {isScheduling ? '⏳ Testing...' : '🚀 Test Single'}
            </button>
            
            <button
              onClick={runMultipleTests}
              disabled={isScheduling}
              className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
            >
              {isScheduling ? '⏳ Running...' : '🔄 Run Multiple Tests'}
            </button>
          </div>
        </div>

        {/* Current Status */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Current Status</h3>
          
          <div className="mb-4">
            <div className={`p-3 rounded ${isScheduling ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              <strong>Status:</strong> {isScheduling ? '⏳ Processing...' : '✅ Ready'}
            </div>
          </div>

          {lastError && (
            <div className="mb-4">
              <div className="p-3 bg-red-100 rounded">
                <strong>Last Error:</strong>
                <div className="text-sm mt-1">
                  <div><strong>Type:</strong> {lastError.type}</div>
                  <div><strong>Message:</strong> {lastError.userMessage}</div>
                  <div><strong>Retryable:</strong> {lastError.retryable ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Results */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Test Results</h3>
        
        {testResults.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No tests run yet. Click "Test Single" or "Run Multiple Tests" to start.
          </div>
        ) : (
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded border-l-4 ${
                  result.success 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                      {result.success ? '✅' : '❌'}
                    </span>
                    <strong>{result.testName || 'Manual Test'}</strong>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="text-sm">
                  <div><strong>Content:</strong> {result.postData.content}</div>
                  <div><strong>Platforms:</strong> {result.postData.platforms.join(', ')}</div>
                  <div><strong>Scheduled:</strong> {new Date(result.postData.scheduled_for).toLocaleString()}</div>
                  
                  {result.error && (
                    <div className="mt-2 text-red-600">
                      <strong>Error:</strong> {result.error.userMessage}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebhookSchedulerTest;

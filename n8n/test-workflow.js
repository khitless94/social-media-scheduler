#!/usr/bin/env node

/**
 * Test Script for n8n Social Media Scheduler Workflow
 * 
 * This script tests the n8n webhook endpoint with various scenarios
 * Run with: node test-workflow.js
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  // Update this with your n8n instance URL
  n8nUrl: 'http://localhost:5678', // Change to your n8n URL
  webhookPath: '/webhook/schedule-post',
  
  // Test data
  testUserId: '12345678-1234-1234-1234-123456789abc',
  platforms: ['twitter', 'facebook', 'linkedin', 'reddit']
};

/**
 * Make HTTP request to n8n webhook
 */
function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.webhookPath, config.n8nUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test cases
 */
const testCases = [
  {
    name: 'Valid Twitter Post',
    data: {
      userId: config.testUserId,
      platform: 'twitter',
      content: 'Test tweet from n8n automation! 🚀 #testing #n8n',
      postId: 'test-twitter-' + Date.now()
    }
  },
  {
    name: 'Valid Facebook Post',
    data: {
      userId: config.testUserId,
      platform: 'facebook',
      content: 'Testing Facebook integration with n8n workflow. This is a longer post to test character limits and formatting.',
      postId: 'test-facebook-' + Date.now()
    }
  },
  {
    name: 'Valid LinkedIn Post',
    data: {
      userId: config.testUserId,
      platform: 'linkedin',
      content: 'Professional update: Testing LinkedIn integration with our automated social media scheduler built with n8n. Great for business content! 💼',
      postId: 'test-linkedin-' + Date.now()
    }
  },
  {
    name: 'Valid Reddit Post',
    data: {
      userId: config.testUserId,
      platform: 'reddit',
      content: 'Testing Reddit API integration with n8n. This post demonstrates automated content publishing to Reddit communities.',
      postId: 'test-reddit-' + Date.now()
    }
  },
  {
    name: 'Missing UserId',
    data: {
      platform: 'twitter',
      content: 'This should fail due to missing userId',
      postId: 'test-error-1'
    }
  },
  {
    name: 'Invalid Platform',
    data: {
      userId: config.testUserId,
      platform: 'invalid-platform',
      content: 'This should fail due to invalid platform',
      postId: 'test-error-2'
    }
  },
  {
    name: 'Missing Content',
    data: {
      userId: config.testUserId,
      platform: 'twitter',
      postId: 'test-error-3'
    }
  },
  {
    name: 'Non-existent User',
    data: {
      userId: '00000000-0000-0000-0000-000000000000',
      platform: 'twitter',
      content: 'This should fail due to non-existent user OAuth credentials',
      postId: 'test-error-4'
    }
  }
];

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting n8n Social Media Scheduler Tests');
  console.log('='.repeat(50));
  console.log(`Testing endpoint: ${config.n8nUrl}${config.webhookPath}`);
  console.log('='.repeat(50));
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📋 Test ${i + 1}: ${testCase.name}`);
    console.log('📤 Request:', JSON.stringify(testCase.data, null, 2));
    
    try {
      const response = await makeRequest(testCase.data);
      
      console.log(`📥 Response Status: ${response.statusCode}`);
      console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));
      
      // Determine if test passed based on expected behavior
      const shouldSucceed = !testCase.name.includes('Missing') && 
                           !testCase.name.includes('Invalid') && 
                           !testCase.name.includes('Non-existent');
      
      if (shouldSucceed && response.statusCode === 200 && response.data.success) {
        console.log('✅ Test PASSED');
        passedTests++;
      } else if (!shouldSucceed && (response.statusCode !== 200 || !response.data.success)) {
        console.log('✅ Test PASSED (Expected failure)');
        passedTests++;
      } else {
        console.log('❌ Test FAILED');
        failedTests++;
      }
      
    } catch (error) {
      console.log('❌ Test FAILED with error:', error.message);
      failedTests++;
    }
    
    // Add delay between requests
    if (i < testCases.length - 1) {
      console.log('⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Your n8n workflow is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check your n8n workflow configuration.');
  }
}

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  console.log('\n🔍 Testing Database Connection...');
  
  const testData = {
    userId: config.testUserId,
    platform: 'twitter',
    content: 'Database connection test',
    postId: 'db-test-' + Date.now()
  };
  
  try {
    const response = await makeRequest(testData);
    
    if (response.statusCode === 200) {
      console.log('✅ Database connection appears to be working');
    } else {
      console.log('❌ Database connection may have issues');
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.log('❌ Database connection test failed:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await testDatabaseConnection();
    await runTests();
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  makeRequest,
  testCases,
  runTests,
  config
};

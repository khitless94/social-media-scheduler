// Multi-user webhook testing script
// Run this in Node.js to test the webhook system with multiple users

const N8N_WEBHOOK_URL = 'https://k94.app.n8n.cloud/webhook/schedule-post';

// Test users (you'll need to create these in your database)
const testUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Test User 1',
    email: 'user1@test.com'
  },
  {
    id: '22222222-2222-2222-2222-222222222222', 
    name: 'Test User 2',
    email: 'user2@test.com'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Test User 3', 
    email: 'user3@test.com'
  }
];

// Test platforms
const platforms = ['twitter', 'reddit', 'linkedin', 'facebook', 'instagram'];

// Generate test post data
function generateTestPost(userId, userIndex) {
  const now = new Date();
  const scheduledTime = new Date(now.getTime() + (userIndex + 1) * 60000); // Stagger by minutes
  
  return {
    post_id: `test-post-${userId}-${Date.now()}`,
    user_id: userId,
    content: `Test post from User ${userIndex + 1} - ${new Date().toISOString()}`,
    platforms: [platforms[userIndex % platforms.length]], // Different platform per user
    scheduled_for: scheduledTime.toISOString(),
    action: 'schedule_post'
  };
}

// Send webhook request
async function sendWebhookRequest(postData) {
  try {
    console.log(`🚀 Sending webhook for user ${postData.user_id}...`);
    
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': postData.user_id
      },
      body: JSON.stringify(postData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success for user ${postData.user_id}:`, result);
      return { success: true, data: result };
    } else {
      console.log(`❌ Failed for user ${postData.user_id}:`, result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error(`💥 Error for user ${postData.user_id}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test concurrent webhook requests
async function testConcurrentWebhooks() {
  console.log('🧪 Testing concurrent webhook requests...\n');
  
  // Generate test posts for all users
  const testPosts = testUsers.map((user, index) => 
    generateTestPost(user.id, index)
  );
  
  console.log('📋 Test posts generated:');
  testPosts.forEach((post, index) => {
    console.log(`  ${index + 1}. User: ${testUsers[index].name}`);
    console.log(`     Platform: ${post.platforms[0]}`);
    console.log(`     Scheduled: ${post.scheduled_for}`);
    console.log(`     Content: ${post.content.substring(0, 50)}...`);
  });
  console.log('');
  
  // Send all requests concurrently
  console.log('🚀 Sending concurrent webhook requests...\n');
  const startTime = Date.now();
  
  const promises = testPosts.map(sendWebhookRequest);
  const results = await Promise.all(promises);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Analyze results
  console.log('\n📊 Test Results Summary:');
  console.log(`⏱️  Total execution time: ${duration}ms`);
  console.log(`📤 Total requests sent: ${results.length}`);
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success rate: ${(successful / results.length * 100).toFixed(1)}%`);
  
  // Show detailed results
  console.log('\n📋 Detailed Results:');
  results.forEach((result, index) => {
    const user = testUsers[index];
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${user.name} (${user.id})`);
    if (!result.success) {
      console.log(`      Error: ${JSON.stringify(result.error)}`);
    }
  });
  
  return results;
}

// Test user isolation
async function testUserIsolation() {
  console.log('\n🔒 Testing user isolation...\n');
  
  // Test 1: User A tries to schedule with User B's ID
  const userA = testUsers[0];
  const userB = testUsers[1];
  
  const maliciousPost = {
    post_id: `malicious-post-${Date.now()}`,
    user_id: userB.id, // User B's ID
    content: 'Malicious post attempt',
    platforms: ['twitter'],
    scheduled_for: new Date(Date.now() + 60000).toISOString(),
    action: 'schedule_post'
  };
  
  console.log(`🕵️ Attempting to send post as User B (${userB.id}) from User A context...`);
  
  const isolationResult = await sendWebhookRequest(maliciousPost);
  
  if (isolationResult.success) {
    console.log('⚠️  WARNING: User isolation may be compromised!');
  } else {
    console.log('✅ User isolation working correctly - request blocked');
  }
  
  return isolationResult;
}

// Test rate limiting
async function testRateLimit() {
  console.log('\n⚡ Testing rate limiting...\n');
  
  const user = testUsers[0];
  const requests = [];
  
  // Send 15 requests rapidly (should hit rate limit)
  for (let i = 0; i < 15; i++) {
    const post = generateTestPost(user.id, 0);
    post.content = `Rate limit test ${i + 1}`;
    requests.push(sendWebhookRequest(post));
  }
  
  const results = await Promise.all(requests);
  const successful = results.filter(r => r.success).length;
  const rateLimited = results.filter(r => !r.success && 
    JSON.stringify(r.error).includes('rate limit')).length;
  
  console.log(`📊 Rate limit test results:`);
  console.log(`  ✅ Successful: ${successful}`);
  console.log(`  ⚡ Rate limited: ${rateLimited}`);
  console.log(`  ❌ Other errors: ${results.length - successful - rateLimited}`);
  
  return results;
}

// Main test function
async function runAllTests() {
  console.log('🧪 Starting Multi-User Webhook Tests\n');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Concurrent webhooks
    await testConcurrentWebhooks();
    
    // Wait a bit between tests
    console.log('\n⏳ Waiting 5 seconds before next test...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test 2: User isolation
    await testUserIsolation();
    
    // Wait a bit between tests
    console.log('\n⏳ Waiting 5 seconds before next test...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test 3: Rate limiting
    await testRateLimit();
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 All tests completed!');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testConcurrentWebhooks,
  testUserIsolation,
  testRateLimit,
  runAllTests
};

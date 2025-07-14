// Direct webhook test - Test the n8n webhook directly
// Run this with: node test-webhook-direct.js

const N8N_WEBHOOK_URL = 'https://k94.app.n8n.cloud/webhook-test/schedule-post';

async function testWebhookDirect() {
  console.log('🧪 Testing n8n webhook directly...');
  
  const testPayload = {
    post_id: 'test-' + Date.now(),
    user_id: '11111111-1111-1111-1111-111111111111',
    content: 'Test post from direct webhook test',
    platforms: ['twitter'],
    scheduled_for: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
    media_urls: [],
    action: 'schedule_post'
  };
  
  console.log('📤 Sending payload:', testPayload);
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': testPayload.user_id,
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Webhook failed:', errorText);
      return false;
    }

    // Try to parse JSON, but handle empty responses
    const responseText = await response.text();
    console.log('📡 Response body:', responseText || '(empty)');

    if (responseText) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ Webhook success with JSON:', result);
      } catch (e) {
        console.log('✅ Webhook success (non-JSON response)');
      }
    } else {
      console.log('✅ Webhook success (empty response - this is normal for n8n)');
    }

    return true;
    
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    return false;
  }
}

// Run the test
testWebhookDirect().then(success => {
  if (success) {
    console.log('\n🎯 RESULT: Webhook is working! Your n8n should have received the trigger.');
  } else {
    console.log('\n❌ RESULT: Webhook failed. Check your n8n workflow.');
  }
  process.exit(success ? 0 : 1);
});

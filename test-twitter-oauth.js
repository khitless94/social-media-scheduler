// Test CORS and main function
const testImageUrl = "https://eqiuukwwpdiyncahrdny.supabase.co/storage/v1/object/public/user-images/d33d28ea-cc43-4dd0-b971-e896acf853e3/1749911525762.jpg";
const testTweetText = "🔥 Testing CORS fix and OAuth 1.0a! This should work now! 🚀";

async function testCORSAndFunction() {
  try {
    console.log("🧪 Testing CORS preflight...");

    // Test OPTIONS request first
    const optionsResponse = await fetch("https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-social", {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:8080",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,authorization"
      }
    });

    console.log("📡 OPTIONS Response status:", optionsResponse.status);
    console.log("📡 OPTIONS Response headers:", Object.fromEntries(optionsResponse.headers.entries()));

    if (optionsResponse.status !== 200) {
      console.log("❌ CORS preflight failed!");
      return;
    }

    console.log("✅ CORS preflight passed! Now testing actual POST...");

    const response = await fetch("https://eqiuukwwpdiyncahrdny.supabase.co/functions/v1/post-to-social", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MjY4NzQsImV4cCI6MjA2NTQwMjg3NH0.Ej8VWnBpb_tdnbNx-FuDHG2q2_FKjy2YgLuqQpHaKOE",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaXV1a3d3cGRpeW5jYWhyZG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MjY4NzQsImV4cCI6MjA2NTQwMjg3NH0.Ej8VWnBpb_tdnbNx-FuDHG2q2_FKjy2YgLuqQpHaKOE",
      },
      body: JSON.stringify({
        content: testTweetText,
        platforms: ["twitter"],
        image: testImageUrl
      })
    });

    console.log("📡 POST Response status:", response.status);
    console.log("📡 POST Response headers:", Object.fromEntries(response.headers.entries()));

    const data = await response.text();
    console.log("📡 Raw response:", data);

    try {
      const jsonData = JSON.parse(data);
      console.log("📡 Parsed response:", JSON.stringify(jsonData, null, 2));

      if (jsonData.results && jsonData.results.length > 0) {
        const twitterResult = jsonData.results.find(r => r.platform === 'twitter');
        if (twitterResult && twitterResult.success) {
          console.log("✅ SUCCESS! Twitter post worked!");
          console.log("🐦 Post ID:", twitterResult.postId);
          console.log("📝 Message:", twitterResult.message);
        } else {
          console.log("❌ Twitter FAILED:", twitterResult?.error);
        }
      } else {
        console.log("❌ FAILED:", jsonData.error);
      }
    } catch (parseError) {
      console.log("❌ Failed to parse JSON response:", parseError.message);
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testCORSAndFunction();

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    console.log('=== OPENAI API TEST ===');
    console.log('API Key exists:', !!openAIApiKey);
    console.log('API Key length:', openAIApiKey ? openAIApiKey.length : 0);
    console.log('API Key starts with sk-:', openAIApiKey ? openAIApiKey.startsWith('sk-') : false);
    
    if (!openAIApiKey || !openAIApiKey.startsWith('sk-')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid or missing OpenAI API key',
        details: {
          keyExists: !!openAIApiKey,
          keyLength: openAIApiKey ? openAIApiKey.length : 0,
          startsWithSk: openAIApiKey ? openAIApiKey.startsWith('sk-') : false
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Test OpenAI API with a simple request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "OpenAI API is working!" in exactly those words.' }
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    console.log('OpenAI API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('OpenAI response:', JSON.stringify(data, null, 2));
      
      const generatedText = data.choices?.[0]?.message?.content?.trim() || '';
      
      return new Response(JSON.stringify({
        success: true,
        message: 'OpenAI API is working correctly!',
        generatedText,
        apiKeyValid: true,
        responseStatus: response.status
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'OpenAI API request failed',
        status: response.status,
        statusText: response.statusText,
        errorResponse: errorText
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Test function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

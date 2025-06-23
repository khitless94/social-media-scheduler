import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { prompt, type = 'text', platforms, characterLimit, tone, contentType, maxLength, singlePost } = await req.json();

    if (type === 'text') {
      // Determine character limit and platform-specific settings
      const limit = maxLength || characterLimit || (platforms?.includes('twitter') ? 280 : 1000);
      const isTwitterIncluded = platforms?.includes('twitter');

      // Create platform-aware system prompt with strict instructions
      const toneInstruction = tone ? ` Use a ${tone} tone.` : '';
      const systemPrompt = `You are a social media expert. Create ONE single social media post ONLY.${toneInstruction} ${isTwitterIncluded ? `Keep it under 280 characters for Twitter.` : `Keep it under ${limit} characters.`} Return ONLY the post content - no instructions, no multiple options, no explanations, no "Here are some ideas", no numbered lists. Just the actual post text that can be published directly.`;

      // Generate text using OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: isTwitterIncluded ? 100 : 200,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('OpenAI response:', JSON.stringify(data, null, 2));

      let generatedText = '';
      if (data.choices && data.choices.length > 0) {
        generatedText = data.choices[0].message.content.trim();
      }

      if (!generatedText) {
        generatedText = 'Unable to generate content. Please try a different prompt.';
      }

      // Ensure content fits within the specified limit (strict for Twitter)
      if (limit && generatedText.length > limit) {
        if (isTwitterIncluded && limit <= 280) {
          // For Twitter, be very strict about character limit
          const truncated = generatedText.substring(0, 277);
          const lastSpace = truncated.lastIndexOf(' ');
          generatedText = (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "...";
        } else {
          // For other platforms, truncate by words
          const words = generatedText.split(' ');
          let truncated = '';
          for (const word of words) {
            if ((truncated + ' ' + word).length <= limit - 3) {
              truncated += (truncated ? ' ' : '') + word;
            } else {
              break;
            }
          }
          generatedText = truncated + "...";
        }
      }

      console.log(`Generated content length: ${generatedText.length}, limit: ${limit}`);

      return new Response(JSON.stringify({ generatedText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (type === 'image') {
      // Generate image using DALL-E
      try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            return new Response(JSON.stringify({ 
              imageUrl: data.data[0].url,
              type: 'generated'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (error) {
        console.error('DALL-E error:', error);
      }
      
      // Fallback: Generate description with GPT
      const imagePrompt = `Create a detailed description for an image that would accompany this social media post: ${prompt}. The description should be suitable for an AI image generator like DALL-E.`;
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that creates detailed image descriptions for AI image generators.' },
            { role: 'user', content: imagePrompt }
          ],
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      let imageDescription = 'Professional social media image';
      
      if (data.choices && data.choices.length > 0) {
        imageDescription = data.choices[0].message.content;
      }

      return new Response(JSON.stringify({ 
        imageDescription,
        type: 'description'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid type specified');

  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Add debugging for API key
console.log('OpenAI API Key available:', !!openAIApiKey);
if (!openAIApiKey) {
  console.error('OPENAI_API_KEY environment variable is not set');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

// Fallback content generation function
function generateFallbackContent(prompt: string, tone: string, platform: string, isTwitter: boolean, maxLength: number): string {
  const cleanPrompt = prompt.replace(/You are an expert.*?Create the post now:/s, '').trim();
  const basePrompt = cleanPrompt || 'Check out this amazing content!';

  // Expert-level content templates by platform and tone
  const templates = {
    linkedin: {
      professional: [
        `💡 Key insight: ${basePrompt}. In my experience, this approach consistently delivers results. What strategies have worked best for your team? #Leadership #Innovation`,
        `🎯 Industry update: ${basePrompt}. This trend is reshaping how we approach our work. I'd love to hear your perspective. #Industry #Growth`,
        `📈 Sharing a valuable lesson: ${basePrompt}. The data speaks for itself. What's your take on this? #DataDriven #Success`
      ],
      casual: [
        `Just had to share this: ${basePrompt}! 🙌 It's been such a learning experience. Anyone else dealing with something similar? #Learning #Community`,
        `Real talk: ${basePrompt}. Sometimes the best insights come from unexpected places. What's been your biggest surprise lately? #RealTalk #Insights`
      ],
      inspirational: [
        `✨ Remember: ${basePrompt}. Every challenge is an opportunity to grow stronger. What's inspiring you today? #Motivation #Growth`,
        `🚀 Daily reminder: ${basePrompt}. Success isn't just about the destination—it's about who you become along the way. #Success #Journey`
      ]
    },
    twitter: {
      professional: [
        `🔥 ${basePrompt} - game changer! Who else is seeing this trend? #Innovation`,
        `💡 Quick insight: ${basePrompt}. Thoughts? #Leadership`,
        `🎯 ${basePrompt} - this is the future. Agree? #Future`
      ],
      casual: [
        `Okay but seriously, ${basePrompt} 😅 Anyone else?`,
        `Just me or is ${basePrompt} actually amazing? 🤔`,
        `${basePrompt} and I'm here for it! 🙌`
      ],
      inspirational: [
        `✨ ${basePrompt} ✨ You've got this! 💪`,
        `🌟 Daily reminder: ${basePrompt} Keep pushing forward!`,
        `💫 ${basePrompt} - believe in yourself! 🚀`
      ]
    },
    facebook: {
      professional: [
        `Professional insight: ${basePrompt}. This has been a game-changer in our industry. What are your thoughts? 💼`,
        `Sharing something important: ${basePrompt}. Would love to hear your experiences with this! 📈`
      ],
      casual: [
        `Hey everyone! 👋 Just wanted to share: ${basePrompt}. It's been on my mind lately and thought you might find it interesting too!`,
        `So... ${basePrompt} 😊 What do you all think about this?`
      ],
      inspirational: [
        `🌟 Feeling inspired today: ${basePrompt}. Life has a way of teaching us exactly what we need to know. Hope this brightens your day too! ✨`,
        `💪 Just a reminder: ${basePrompt}. We're all capable of more than we realize. What's motivating you today?`
      ]
    }
  };

  // Get appropriate template
  const platformTemplates = templates[platform as keyof typeof templates] || templates.linkedin;
  const toneTemplates = platformTemplates[tone as keyof typeof platformTemplates] || platformTemplates.professional;

  if (toneTemplates && toneTemplates.length > 0) {
    const template = toneTemplates[Math.floor(Math.random() * toneTemplates.length)];

    // Ensure it fits within character limits
    if (template.length > maxLength) {
      return template.substring(0, maxLength - 3) + '...';
    }
    return template;
  }

  // Ultimate fallback
  return `${basePrompt} - what are your thoughts? 🤔`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, type = 'text', platforms, characterLimit, tone, contentType, maxLength, singlePost, expertMode, platform } = await req.json();

    if (type === 'text') {
      // Determine character limit and platform-specific settings
      const limit = maxLength || characterLimit || (platforms?.includes('twitter') ? 280 : 1000);
      const isTwitterIncluded = platforms?.includes('twitter') || platform === 'twitter';

      let systemPrompt;
      let userPrompt = prompt;

      // Check if this is an expert-mode request (already contains full expert prompt)
      if (expertMode && prompt.includes('You are an expert social media manager')) {
        // The prompt already contains the full expert instructions
        systemPrompt = `You are an expert AI assistant specialized in creating high-performing social media content. Follow the detailed instructions provided in the user prompt exactly. Return ONLY the final post content with no additional commentary.`;
        userPrompt = prompt;
      } else {
        // Create enhanced system prompt for regular requests
        const toneInstruction = tone ? ` Use a ${tone} tone.` : '';
        const platformContext = platform ? ` for ${platform.toUpperCase()}` : '';

        systemPrompt = `You are an expert social media manager and content strategist with 10+ years of experience creating viral, engaging content. You specialize in crafting posts that drive high engagement rates across all major platforms.

Your expertise includes:
- Understanding platform-specific algorithms and best practices
- Creating compelling hooks that stop the scroll
- Incorporating psychological triggers for engagement
- Using optimal hashtag strategies
- Crafting clear calls-to-action
- Balancing value and entertainment

${isTwitterIncluded ? `TWITTER-SPECIFIC REQUIREMENTS:
- ALWAYS include 2-3 relevant hashtags at the end of the post
- Use trending and niche-specific hashtags to maximize reach
- Keep total content under 280 characters INCLUDING hashtags
- Hashtags should be relevant to the topic and industry
- Examples: #SocialMedia #Marketing #Business #Tech #Innovation #Growth #Success #Tips #Strategy

` : ''}Create ONE single, high-performing social media post${platformContext}.${toneInstruction} ${isTwitterIncluded ? `Keep it under 280 characters INCLUDING hashtags for Twitter.` : `Keep it under ${limit} characters.`}

REQUIREMENTS:
- Start with an attention-grabbing hook
- Provide clear value or insight
- Include elements that encourage interaction
- Sound natural and authentic to the platform
- Use appropriate emojis and formatting
- Add relevant hashtags following platform conventions
- Include a subtle call-to-action
- Return ONLY the post content - no explanations or alternatives

The post should be ready to publish immediately and optimized for maximum engagement.`;
      }

      let generatedText = '';

      // Try OpenAI API if key is available
      if (openAIApiKey) {
        try {
          console.log('Attempting OpenAI API call...');

          // Generate text using OpenAI with enhanced parameters
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
                { role: 'user', content: userPrompt }
              ],
              max_tokens: isTwitterIncluded ? 150 : 300,
              temperature: 0.8,
              presence_penalty: 0.1,
              frequency_penalty: 0.1,
            }),
          });

          console.log('OpenAI API response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('OpenAI response data:', JSON.stringify(data, null, 2));

            if (data.choices && data.choices.length > 0) {
              generatedText = data.choices[0].message.content.trim();
              console.log('Generated text from OpenAI:', generatedText);
            }
          } else {
            const errorText = await response.text();
            console.error('OpenAI API error:', response.status, errorText);
          }
        } catch (openAIError) {
          console.error('OpenAI API call failed:', openAIError);
        }
      } else {
        console.log('No OpenAI API key available, using fallback generation');
      }

      // Fallback content generation if OpenAI fails or is unavailable
      if (!generatedText) {
        console.log('Using fallback content generation...');
        generatedText = generateFallbackContent(userPrompt, tone, platform, isTwitterIncluded, limit);
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
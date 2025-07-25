import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateCaption(
  description: string,
  platform: string,
  style: string,
  mood: string,
  includeHashtags: boolean,
  customHashtags: string,
  hasImage: boolean
) {
  const basePrompt = description || "Amazing content to share";
  
  // Platform-specific character limits and styles
  const platformLimits = {
    instagram: 2200,
    facebook: 63206,
    twitter: 280,
    linkedin: 3000,
    tiktok: 150,
    pinterest: 500
  };

  // Style templates
  const styleTemplates = {
    engaging: {
      instagram: [
        `${basePrompt} 🎯\n\nDouble tap if you agree! What's your take on this? 👇\n\n✨ Save this post for later and share with someone who needs to see it!`,
        `Here's something that caught my attention... 👀\n\n${basePrompt}\n\nWhat do you think? Drop your thoughts below! 💭`,
        `Plot twist: ${basePrompt} 🔄\n\nTag someone who needs to see this! Who comes to mind? 👥`
      ],
      facebook: [
        `${basePrompt}\n\nWhat's your experience with this? I'd love to hear your thoughts in the comments! 💬`,
        `Sharing this because it really resonated with me:\n\n${basePrompt}\n\nWhat do you think? React with your favorite emoji! 😊`,
        `${basePrompt}\n\nHave you experienced something similar? Share your story below! 👇`
      ],
      twitter: [
        `${basePrompt}\n\nThoughts? 🤔`,
        `Hot take: ${basePrompt}\n\nAgree or disagree? 🔥`,
        `${basePrompt}\n\nWho else thinks this? 🙋‍♀️`
      ],
      linkedin: [
        `${basePrompt}\n\nIn my experience, this perspective has proven valuable. What strategies have worked best for your team?\n\n#Leadership #Growth`,
        `Key insight: ${basePrompt}\n\nI'd love to hear your thoughts on this approach. What's been your experience?\n\n#Professional #Innovation`,
        `${basePrompt}\n\nThis resonates with many professionals I've spoken with. What's your take on this trend?\n\n#Industry #Networking`
      ]
    },
    storytelling: {
      instagram: [
        `Here's a story worth sharing... 📖\n\n${basePrompt}\n\nWhat's your story? I'd love to hear it in the comments! ✨`,
        `Once upon a time... 🌟\n\n${basePrompt}\n\nThe end. Just kidding! What happens next in your version? 😄`,
        `Chapter 1: ${basePrompt}\n\nEvery story has a beginning. What's yours? Share below! 👇`
      ],
      facebook: [
        `Let me tell you a story...\n\n${basePrompt}\n\nWhat's your story? I'd love to read it in the comments! 📚`,
        `${basePrompt}\n\nEvery picture tells a story. What story does this tell you? Share your interpretation! 🎭`,
        `Behind every moment is a story...\n\n${basePrompt}\n\nWhat stories are you creating today? 🌟`
      ]
    },
    educational: {
      instagram: [
        `💡 Did you know?\n\n${basePrompt}\n\nSave this post for later and share with someone who needs to learn this! 📚`,
        `Today I learned: ${basePrompt} 🎓\n\nWhat's something new you learned recently? Share below! 👇`,
        `Quick lesson: ${basePrompt} ⚡\n\nWhich part surprised you the most? Let me know! 🤔`
      ],
      linkedin: [
        `Key learning: ${basePrompt}\n\nThis insight has been valuable in my professional journey. What lessons have shaped your career?\n\n#Learning #Growth`,
        `Professional tip: ${basePrompt}\n\nI've found this approach effective in my work. What strategies work best for you?\n\n#Professional #Tips`
      ]
    },
    promotional: {
      instagram: [
        `🚀 Exciting news!\n\n${basePrompt}\n\nDon't miss out - check the link in bio for more details! ✨`,
        `Something amazing is happening... 🎉\n\n${basePrompt}\n\nSwipe for more details or check our stories! 👆`,
        `Limited time: ${basePrompt} ⏰\n\nTag a friend who needs to see this! Who comes to mind? 👥`
      ],
      facebook: [
        `🎉 Big announcement!\n\n${basePrompt}\n\nClick the link below to learn more and don't forget to share with friends! 🔗`,
        `${basePrompt}\n\nInterested? Comment below or send us a message for more information! 💬`
      ]
    },
    inspirational: {
      instagram: [
        `✨ Remember this:\n\n${basePrompt}\n\nYou've got this! Keep pushing forward! 💪\n\nTag someone who needs this reminder! 🌟`,
        `Daily reminder: ${basePrompt} 🌅\n\nWhat motivates you to keep going? Share your inspiration! 💫`,
        `${basePrompt} 🔥\n\nBelieve in yourself. You're capable of amazing things! ✨\n\nDouble tap if you needed this today! 💙`
      ],
      linkedin: [
        `Motivation Monday: ${basePrompt}\n\nWhat drives you in your professional journey? I'd love to hear what keeps you motivated!\n\n#Motivation #Success`,
        `${basePrompt}\n\nThis mindset has been transformative in my career. What beliefs drive your success?\n\n#Mindset #Growth`
      ]
    },
    humorous: {
      instagram: [
        `😄 When you realize...\n\n${basePrompt}\n\nTag someone who can relate! Who's the first person that comes to mind? 😂`,
        `Plot twist: ${basePrompt} 🤪\n\nAnyone else? Just me? Let me know in the comments! 😅`,
        `${basePrompt} 😂\n\nI can't be the only one who thinks this! Who else agrees? 🙋‍♀️`
      ],
      twitter: [
        `${basePrompt} 😂\n\nAnyone else? 🤷‍♀️`,
        `Me: ${basePrompt}\n\nAlso me: 🤡`,
        `${basePrompt}\n\nI said what I said 💅`
      ]
    }
  };

  // Get appropriate template
  const platformTemplates = styleTemplates[style as keyof typeof styleTemplates] || styleTemplates.engaging;
  const templates = platformTemplates[platform as keyof typeof platformTemplates] || platformTemplates.instagram || [];
  
  let caption = "";
  if (templates.length > 0) {
    caption = templates[Math.floor(Math.random() * templates.length)];
  } else {
    // Fallback caption
    caption = `${basePrompt}\n\nWhat do you think? Share your thoughts! 💭`;
  }

  // Apply mood adjustments
  const moodAdjustments = {
    excited: (text: string) => text + " 🚀🎉",
    professional: (text: string) => text.replace(/[🎯😄😂🤪💭👇]/g, "").replace(/!\s/g, ". "),
    mysterious: (text: string) => text.replace(/!/g, "...") + " 🔮",
    urgent: (text: string) => "⚡ URGENT: " + text + " ⏰",
    casual: (text: string) => text,
    positive: (text: string) => text
  };

  const moodAdjuster = moodAdjustments[mood as keyof typeof moodAdjustments];
  if (moodAdjuster) {
    caption = moodAdjuster(caption);
  }

  // Generate hashtags
  let hashtags: string[] = [];
  if (includeHashtags) {
    const hashtagSets = {
      instagram: ['#content', '#socialmedia', '#inspiration', '#motivation', '#lifestyle', '#instagood', '#photooftheday', '#love', '#beautiful', '#happy'],
      facebook: ['#community', '#sharing', '#connect', '#family', '#friends'],
      twitter: ['#content', '#social', '#trending', '#news', '#thoughts'],
      linkedin: ['#professional', '#business', '#networking', '#growth', '#career', '#leadership', '#innovation', '#success'],
      tiktok: ['#viral', '#trending', '#fyp', '#content', '#fun', '#creative'],
      pinterest: ['#inspiration', '#ideas', '#creative', '#lifestyle', '#design', '#diy']
    };

    const platformHashtags = hashtagSets[platform as keyof typeof hashtagSets] || hashtagSets.instagram;
    hashtags = platformHashtags.slice(0, 5);

    // Add custom hashtags if provided
    if (customHashtags) {
      const customTags = customHashtags.split(/[\s,]+/).filter(tag => tag.trim()).map(tag => 
        tag.startsWith('#') ? tag : `#${tag}`
      );
      hashtags = [...customTags, ...hashtags].slice(0, 10);
    }
  }

  // Ensure caption fits platform limits
  const limit = platformLimits[platform as keyof typeof platformLimits] || 2200;
  const hashtagText = hashtags.join(' ');
  const totalLength = caption.length + hashtagText.length + 2; // +2 for spacing

  if (totalLength > limit) {
    const availableSpace = limit - hashtagText.length - 2;
    caption = caption.substring(0, availableSpace - 3) + '...';
  }

  return {
    caption,
    hashtags
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      description, 
      platform = 'instagram', 
      style = 'engaging', 
      mood = 'positive',
      includeHashtags = true,
      customHashtags = '',
      hasImage = false
    } = await req.json();

    const result = generateCaption(
      description,
      platform,
      style,
      mood,
      includeHashtags,
      customHashtags,
      hasImage
    );

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Caption generation error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate caption',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

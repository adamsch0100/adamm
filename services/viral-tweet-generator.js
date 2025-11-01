import OpenAI from 'openai';

class ViralTweetGenerator {
  constructor(supabase, openaiKey) {
    this.supabase = supabase;
    this.openai = new OpenAI({ apiKey: openaiKey });
  }

  buildSystemPrompt() {
    return `You are a viral Twitter content strategist with expertise in:
- Copywriting psychology (hooks, curiosity gaps, social proof)
- Twitter algorithm mechanics (engagement triggers, reply bait)
- Proven content frameworks (thread starters, one-liners, listicles)
- Niche-specific language and pain points

Your job: Generate tweets that get saves, replies, and retweets.

Key Principles:
1. HOOK FIRST: Start with curiosity, controversy, or bold claims
2. VALUE: Every tweet teaches, entertains, or inspires
3. CLARITY: Simple words, short sentences, easy scanning
4. EMOTION: Tap into desires (wealth, status, freedom) or fears (FOMO, failure)
5. CTA: End with a question, tag, or call-to-action

Avoid:
- Generic platitudes ("mindset is everything")
- Vague advice without specifics
- Overused phrases ("unpopular opinion", "let that sink in")
- Corporate speak or jargon`;
  }

  buildUserPrompt(niche, count, style, targetAudience) {
    return `Generate ${count} viral-worthy tweets for the "${niche}" niche.

TARGET AUDIENCE: ${targetAudience || 'Aspiring entrepreneurs looking to make money online'}

CONTENT STYLE: ${style || 'Educational with bold hooks, mix of tactical tips and mindset shifts'}

CONTENT MIX:
- 40% Tactical tips (specific, actionable advice)
- 30% Mindset/motivation (perspective shifts, tough truths)
- 20% Personal stories (relatable struggles, wins)
- 10% Engagement bait (questions, polls, hot takes)

FORMATTING:
- Vary lengths: one-liners, short threads (2-3 tweets), listicles
- Use line breaks for readability
- Include emojis sparingly (1-2 max)
- Some tweets should have a clear CTA (reply, save, follow)

QUALITY BARS:
- Each tweet must pass the "would I stop scrolling?" test
- Must provide clear value or entertainment
- Must sound human, not robotic
- Must be platform-native (no Instagram hashtag spam)

OUTPUT FORMAT:
Return ONLY a JSON object with a "tweets" array:
{
  "tweets": [
    {
      "text": "The actual tweet text here...",
      "hook_type": "curiosity|controversy|social_proof|urgency",
      "engagement_tactic": "question|story|tip|hot_take",
      "predicted_performance": 7-10 score
    }
  ]
}

Generate NOW:`;
  }

  async generateViralTweets(userId, niche, count = 50, options = {}) {
    try {
      console.log(`Generating ${count} viral tweets for niche: "${niche}"...`);
      
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(
        niche,
        count,
        options.style,
        options.targetAudience
      );

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.9, // High creativity
        max_tokens: 4000,
        response_format: { type: 'json_object' } // Force JSON
      });

      const generatedContent = response.choices[0].message.content;
      const parsedData = JSON.parse(generatedContent);
      const tweets = parsedData.tweets || [];

      console.log(`GPT-4 generated ${tweets.length} tweets`);

      // Save to database
      const savedTweets = [];
      for (const tweet of tweets) {
        const { data, error } = await this.supabase
          .from('twitter_rewrites')
          .insert({
            user_id: userId,
            original_tweet_id: null, // No original - pure AI generation
            rewritten_text: tweet.text,
            variation_style: `${tweet.hook_type} - ${tweet.engagement_tactic}`,
            quality_score: tweet.predicted_performance || 8,
            used: false,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error) {
          savedTweets.push(data);
        } else {
          console.error('Error saving tweet:', error);
        }
      }

      console.log(`Successfully generated and saved ${savedTweets.length} tweets`);

      return {
        success: true,
        generated: savedTweets.length,
        tweets: savedTweets
      };

    } catch (error) {
      console.error('AI generation error:', error);
      throw new Error(`Failed to generate tweets: ${error.message}`);
    }
  }
}

export default ViralTweetGenerator;





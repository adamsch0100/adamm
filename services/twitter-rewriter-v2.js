/**
 * Twitter AI Rewriter Service v2
 * Generates 500 tweet variations from scraped viral tweets
 */

import OpenAI from 'openai';

class TwitterRewriterService {
  constructor(supabase, openaiKey) {
    this.supabase = supabase;
    this.openai = new OpenAI({ apiKey: openaiKey });
  }

  /**
   * Generate tweet variations from scraped tweets
   * @param {string} userId - User ID
   * @param {number} targetCount - How many variations to generate (default: 500)
   * @returns {Promise<{generated: number, variations: Array}>}
   */
  async generateVariations(userId, targetCount = 500) {
    try {
      // Get scraped tweets
      const { data: scrapedTweets, error } = await this.supabase
        .from('twitter_scraped_tweets')
        .select('*')
        .eq('user_id', userId)
        .order('engagement_count', { ascending: false })
        .limit(50); // Use top 50 viral tweets

      if (error) throw error;

      if (!scrapedTweets || scrapedTweets.length === 0) {
        throw new Error('No scraped tweets found. Please scrape tweets first.');
      }

      console.log(`Generating ${targetCount} variations from ${scrapedTweets.length} source tweets...`);

      const generatedVariations = [];
      const variationsPerTweet = Math.ceil(targetCount / scrapedTweets.length);

      // Process in batches to avoid rate limits
      const batchSize = 5;
      for (let i = 0; i < scrapedTweets.length; i += batchSize) {
        const batch = scrapedTweets.slice(i, i + batchSize);
        
        const batchPromises = batch.map(tweet => 
          this.generateVariationsForTweet(userId, tweet, variationsPerTweet)
        );

        const batchResults = await Promise.all(batchPromises);
        generatedVariations.push(...batchResults.flat());

        // Rate limiting: wait 1 second between batches
        if (i + batchSize < scrapedTweets.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`Generated ${generatedVariations.length}/${targetCount} variations...`);
      }

      return {
        generated: generatedVariations.length,
        variations: generatedVariations.slice(0, targetCount)
      };

    } catch (error) {
      console.error('Twitter rewriter error:', error);
      throw new Error(`Failed to generate variations: ${error.message}`);
    }
  }

  /**
   * Generate variations for a single tweet
   * @private
   */
  async generateVariationsForTweet(userId, sourceTweet, count) {
    const variations = [];

    try {
      const prompt = `You are a viral Twitter content creator in the "make money online" niche.

Original viral tweet (${sourceTweet.engagement_count} engagements):
"${sourceTweet.tweet_text}"

Generate ${count} unique tweet variations based on this. Each variation should:
- Keep the core message but change the hook
- Use different writing styles (casual, professional, hype, storytelling)
- Include strong CTAs like "Comment 'PDF'", "DM me", "Reply with your biggest question"
- Be 200-280 characters
- Feel authentic and human
- NOT be spammy or salesy

Return ONLY the tweet variations, one per line, no numbering or extra text.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a viral Twitter content expert. Generate high-converting tweets in the "make money online" niche.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9, // High creativity
        max_tokens: 2000
      });

      const generatedText = completion.choices[0].message.content.trim();
      const tweetLines = generatedText.split('\n').filter(line => line.trim().length > 0);

      // Save each variation to database
      for (const tweetText of tweetLines) {
        const cleanText = tweetText.replace(/^\d+\.\s*/, '').trim(); // Remove numbering if present

        if (cleanText.length < 50) continue; // Skip too short

        const { data, error } = await this.supabase
          .from('twitter_rewrites')
          .insert({
            user_id: userId,
            original_tweet_id: sourceTweet.id,
            rewritten_text: cleanText,
            variation_style: this.detectStyle(cleanText),
            used: false
          })
          .select()
          .single();

        if (!error && data) {
          variations.push(data);
        }
      }

    } catch (error) {
      console.error(`Error generating variations for tweet ${sourceTweet.id}:`, error);
    }

    return variations;
  }

  /**
   * Detect the style of a tweet variation
   * @private
   */
  detectStyle(text) {
    const lower = text.toLowerCase();
    
    if (lower.includes('imagine') || lower.includes('picture this') || lower.includes('story')) {
      return 'storytelling';
    } else if (lower.includes('🔥') || lower.includes('💰') || lower.includes('🚀')) {
      return 'hype';
    } else if (lower.match(/\d+%|\$\d+|x\d+/)) {
      return 'data-driven';
    } else if (lower.includes('question') || lower.includes('?')) {
      return 'question';
    } else {
      return 'casual';
    }
  }

  /**
   * Get unused tweet variations for posting
   * @param {string} userId - User ID
   * @param {number} limit - Max variations to return
   * @returns {Promise<Array>}
   */
  async getUnusedVariations(userId, limit = 100) {
    const { data, error } = await this.supabase
      .from('twitter_rewrites')
      .select('*')
      .eq('user_id', userId)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Mark a variation as used (posted)
   * @param {number} variationId - Variation ID
   */
  async markAsUsed(variationId) {
    const { error } = await this.supabase
      .from('twitter_rewrites')
      .update({
        used: true,
        posted_at: new Date().toISOString()
      })
      .eq('id', variationId);

    if (error) throw error;
  }

  /**
   * Get stats on generated variations
   * @param {string} userId - User ID
   */
  async getStats(userId) {
    const { data, error } = await this.supabase
      .from('twitter_rewrites')
      .select('used')
      .eq('user_id', userId);

    if (error) throw error;

    const total = data.length;
    const used = data.filter(v => v.used).length;
    const unused = total - used;

    return {
      total,
      used,
      unused,
      percentageUsed: total > 0 ? Math.round((used / total) * 100) : 0
    };
  }
}

export default TwitterRewriterService;










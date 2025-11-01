import OpenAI from 'openai';

class ContentExpander {
  constructor(supabase, openaiKey) {
    this.supabase = supabase;
    this.openai = new OpenAI({ apiKey: openaiKey });
  }

  async expandToThread(tweetId, userId) {
    try {
      console.log(`Expanding tweet ${tweetId} to thread...`);

      // Get original tweet
      const { data: tweet, error } = await this.supabase
        .from('twitter_rewrites')
        .select('*')
        .eq('id', tweetId)
        .single();

      if (error || !tweet) {
        throw new Error('Tweet not found');
      }

      // Generate 5-7 tweet thread
      const prompt = `Expand this tweet into a 5-7 tweet thread:
    
Original: "${tweet.rewritten_text}"

Thread structure:
1. Hook tweet (keep the original hook)
2-6. Detailed breakdown with examples, stories, specific tactics, or data
7. Strong CTA or conclusion

Rules:
- Each tweet must be under 280 characters
- Use clear, concise language
- Include specific, actionable insights
- Make each tweet valuable on its own
- Use line breaks and emojis for readability
- The thread should flow naturally

Return as a JSON object with a "tweets" array of strings.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000,
      });

      const result = JSON.parse(response.choices[0].message.content);
      const thread = result.tweets || result.thread || [];

      if (!Array.isArray(thread) || thread.length === 0) {
        throw new Error('Invalid thread format from AI');
      }

      console.log(`Generated thread with ${thread.length} tweets`);

      // Save thread tweets
      const insertedTweets = [];
      for (let i = 0; i < thread.length; i++) {
        const { data: inserted, error: insertError } = await this.supabase
          .from('twitter_rewrites')
          .insert({
            user_id: userId,
            rewritten_text: thread[i],
            variation_style: `thread_${i + 1}_of_${thread.length}`,
            quality_score: 8,
            parent_tweet_id: tweetId,
            content_type: 'thread',
            used: false,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!insertError && inserted) {
          insertedTweets.push(inserted);
        }
      }

      console.log(`Saved ${insertedTweets.length} thread tweets to database`);

      return { 
        success: true, 
        thread_length: insertedTweets.length,
        tweets: insertedTweets
      };

    } catch (error) {
      console.error('Error expanding to thread:', error);
      throw new Error(`Failed to expand tweet to thread: ${error.message}`);
    }
  }

  async expandToCarousel(tweetId, userId) {
    try {
      console.log(`Expanding tweet ${tweetId} to carousel...`);

      // Get original tweet
      const { data: tweet, error } = await this.supabase
        .from('twitter_rewrites')
        .select('*')
        .eq('id', tweetId)
        .single();

      if (error || !tweet) {
        throw new Error('Tweet not found');
      }

      // Generate 10-slide carousel
      const prompt = `Expand this tweet into a 10-slide carousel:
    
Original: "${tweet.rewritten_text}"

Carousel structure:
Slide 1: Eye-catching title slide
Slides 2-9: One key insight per slide with supporting detail
Slide 10: Summary + CTA

Format each slide as:
Title: [Bold headline]
Body: [2-3 lines of supporting text]

Rules:
- Each slide title should be 3-8 words, punchy and clear
- Body text should be concise (2-3 short sentences max)
- Use specific examples and data where possible
- Make each slide visually distinct
- End with a strong call-to-action

Return as a JSON object with a "slides" array. Each slide should have "title" and "body" fields.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2500,
      });

      const result = JSON.parse(response.choices[0].message.content);
      const slides = result.slides || result.carousel || [];

      if (!Array.isArray(slides) || slides.length === 0) {
        throw new Error('Invalid carousel format from AI');
      }

      console.log(`Generated carousel with ${slides.length} slides`);

      // Save carousel as a single entry with JSON data
      const carouselData = {
        slides: slides.map((slide, idx) => ({
          slide_number: idx + 1,
          title: slide.title,
          body: slide.body
        }))
      };

      const { data: inserted, error: insertError } = await this.supabase
        .from('twitter_rewrites')
        .insert({
          user_id: userId,
          rewritten_text: JSON.stringify(carouselData),
          variation_style: `carousel_${slides.length}_slides`,
          quality_score: 8,
          parent_tweet_id: tweetId,
          content_type: 'carousel',
          used: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`);
      }

      console.log(`Saved carousel to database`);

      return { 
        success: true, 
        slides_count: slides.length,
        carousel: inserted,
        slides: slides
      };

    } catch (error) {
      console.error('Error expanding to carousel:', error);
      throw new Error(`Failed to expand tweet to carousel: ${error.message}`);
    }
  }

  async expandToVideo(tweetId, userId) {
    try {
      console.log(`Expanding tweet ${tweetId} to video script...`);

      // Get original tweet
      const { data: tweet, error } = await this.supabase
        .from('twitter_rewrites')
        .select('*')
        .eq('id', tweetId)
        .single();

      if (error || !tweet) {
        throw new Error('Tweet not found');
      }

      // Generate 60-second video script
      const prompt = `Create a 60-second video script based on this tweet:
    
Original: "${tweet.rewritten_text}"

Video script structure:
0-5s: Hook (attention-grabbing opening)
5-15s: Problem (what pain point are we addressing?)
15-45s: Solution (3-4 key points with examples)
45-55s: Benefit (transformation/result)
55-60s: CTA (call to action)

Format:
Return a JSON object with:
- "title": Video title (5-8 words)
- "hook": Opening line
- "script": Full script with timestamps
- "visuals": Array of visual suggestions for each section
- "cta": Final call to action

Rules:
- Write in spoken language, not written
- Keep sentences short and punchy
- Include specific examples
- Make it engaging and fast-paced
- Total script should be ~150-180 words (60 seconds at speaking pace)`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000,
      });

      const videoScript = JSON.parse(response.choices[0].message.content);

      console.log(`Generated video script: "${videoScript.title}"`);

      // Save video script
      const { data: inserted, error: insertError } = await this.supabase
        .from('twitter_rewrites')
        .insert({
          user_id: userId,
          rewritten_text: JSON.stringify(videoScript),
          variation_style: 'video_60s',
          quality_score: 8,
          parent_tweet_id: tweetId,
          content_type: 'video',
          used: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`);
      }

      console.log(`Saved video script to database`);

      return { 
        success: true, 
        video: inserted,
        script: videoScript
      };

    } catch (error) {
      console.error('Error expanding to video:', error);
      throw new Error(`Failed to expand tweet to video: ${error.message}`);
    }
  }
}

export default ContentExpander;





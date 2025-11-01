import { createClient } from '@supabase/supabase-js';

/**
 * Carousel Creator Service
 * Generate X/Twitter carousels (3-4 image posts) with AI
 */
class CarouselCreatorService {
  constructor(supabase, openaiApiKey) {
    this.supabase = supabase;
    this.openaiApiKey = openaiApiKey;
  }

  /**
   * Create carousel from topic
   */
  async createCarousel(userId, options = {}) {
    const {
      topic,
      title,
      slideCount = 4,
      templateStyle = 'default',
      includeHook = true,
      includeCTA = true,
      ctaText = 'Follow for more'
    } = options;

    if (!topic) {
      throw new Error('Topic is required');
    }

    console.log(`Creating ${slideCount}-slide carousel about: ${topic}`);

    try {
      // Generate carousel content with AI
      const content = await this.generateCarouselContent(topic, slideCount, includeHook, includeCTA);

      // Generate images for each slide
      const slides = await this.generateSlideImages(content.slides, templateStyle);

      // Store carousel
      const { data, error } = await this.supabase
        .from('twitter_carousels')
        .insert({
          user_id: userId,
          title: title || `${topic} Carousel`,
          slides: slides,
          hook: content.hook,
          cta: ctaText,
          template_style: templateStyle
        })
        .select()
        .single();

      if (error) throw error;

      return {
        carouselId: data.id,
        slides: slides.length,
        carousel: data
      };

    } catch (error) {
      console.error('Carousel creation error:', error);
      throw error;
    }
  }

  /**
   * Generate carousel content with AI
   */
  async generateCarouselContent(topic, slideCount, includeHook, includeCTA) {
    // In production, use OpenAI to generate content
    // For now, create placeholder structure

    const slides = [];

    // Slide 1: Hook (if enabled)
    if (includeHook) {
      slides.push({
        order: 1,
        type: 'hook',
        text: this.generateHook(topic),
        imagePrompt: `Eye-catching design about ${topic}, minimal text, professional`
      });
    }

    // Middle slides: Content/advice
    const contentSlideCount = slideCount - (includeHook ? 1 : 0) - (includeCTA ? 1 : 0);
    for (let i = 0; i < contentSlideCount; i++) {
      slides.push({
        order: slides.length + 1,
        type: 'content',
        text: `Key point ${i + 1} about ${topic}`,
        imagePrompt: `Clean design with point ${i + 1} about ${topic}`
      });
    }

    // Last slide: CTA (if enabled)
    if (includeCTA) {
      slides.push({
        order: slides.length + 1,
        type: 'cta',
        text: 'Want to learn more?',
        imagePrompt: `Call-to-action design, follow button, engaging`
      });
    }

    return {
      hook: includeHook ? slides[0].text : null,
      slides
    };
  }

  /**
   * Generate hook for first slide
   */
  generateHook(topic) {
    const hooks = [
      `The truth about ${topic} that nobody tells you`,
      `Here's what I learned about ${topic} the hard way`,
      `${topic}: Everything you need to know`,
      `Stop making these ${topic} mistakes`,
      `The complete ${topic} guide (thread)`
    ];

    return hooks[Math.floor(Math.random() * hooks.length)];
  }

  /**
   * Generate slide images
   * In production, use DALL-E or Midjourney
   */
  async generateSlideImages(slides, templateStyle) {
    const generatedSlides = [];

    for (const slide of slides) {
      // In production, generate actual images with AI
      // For now, create placeholder
      generatedSlides.push({
        order: slide.order,
        type: slide.type,
        text: slide.text,
        image_url: `https://placeholder.com/800x800?text=${encodeURIComponent(slide.text)}`,
        template_style: templateStyle
      });

      // Small delay to avoid rate limits
      await this.sleep(500);
    }

    return generatedSlides;
  }

  /**
   * Get user's carousels
   */
  async getCarousels(userId, limit = 50) {
    const { data, error } = await this.supabase
      .from('twitter_carousels')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  }

  /**
   * Get carousel by ID
   */
  async getCarousel(carouselId) {
    const { data, error } = await this.supabase
      .from('twitter_carousels')
      .select('*')
      .eq('id', carouselId)
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Update carousel
   */
  async updateCarousel(carouselId, updates) {
    const { data, error } = await this.supabase
      .from('twitter_carousels')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', carouselId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Delete carousel
   */
  async deleteCarousel(carouselId) {
    const { error } = await this.supabase
      .from('twitter_carousels')
      .delete()
      .eq('id', carouselId);

    if (error) throw error;

    return { success: true };
  }

  /**
   * Post carousel to accounts
   * Converts carousel to thread format for Twitter
   */
  async postCarousel(userId, carouselId, accountIds) {
    const carousel = await this.getCarousel(carouselId);

    if (!carousel) {
      throw new Error('Carousel not found');
    }

    // Create thread tweets from slides
    const threadTweets = carousel.slides.map(slide => ({
      text: slide.text,
      image_url: slide.image_url,
      order: slide.order
    }));

    // Add to posting queue for each account
    const queueItems = [];
    for (const accountId of accountIds) {
      queueItems.push({
        user_id: userId,
        social_account_id: accountId,
        content_type: 'post',
        content_data: {
          thread: threadTweets,
          carousel_id: carouselId
        },
        priority: 6,
        status: 'pending'
      });
    }

    const { error } = await this.supabase
      .from('posting_queue')
      .insert(queueItems);

    if (error) throw error;

    // Update carousel stats
    await this.supabase
      .from('twitter_carousels')
      .update({
        total_posts: carousel.total_posts + accountIds.length
      })
      .eq('id', carouselId);

    return {
      queued: accountIds.length,
      accounts: accountIds
    };
  }

  /**
   * Helper: Sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default CarouselCreatorService;



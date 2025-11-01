import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

/**
 * Ebook Generator Service
 * Generates 200-page ebooks using AI in 30-40 minutes
 */
class EbookGeneratorService {
  constructor(supabase, openaiApiKey) {
    this.supabase = supabase;
    this.openaiApiKey = openaiApiKey;
  }

  /**
   * Generate complete ebook
   */
  async generateEbook(userId, options = {}) {
    const {
      topic,
      title,
      targetAudience = 'general',
      tone = 'professional',
      pageCount = 200,
      chapters = 10,
      generateCover = true
    } = options;

    if (!topic) {
      throw new Error('Topic is required');
    }

    console.log(`Generating ${pageCount}-page ebook: "${title || topic}"`);

    try {
      // Step 1: Generate outline
      const outline = await this.generateOutline(topic, chapters, targetAudience);

      // Step 2: Generate content for each chapter
      const content = await this.generateContent(outline, tone);

      // Step 3: Generate cover image
      let coverUrl = null;
      if (generateCover) {
        coverUrl = await this.generateCoverImage(title || topic);
      }

      // Step 4: Create PDF
      const pdfUrl = await this.createPDF(title || topic, content, coverUrl);

      // Step 5: Store in database
      const { data: product, error } = await this.supabase
        .from('digital_products')
        .insert({
          user_id: userId,
          title: title || topic,
          description: `Complete ${pageCount}-page guide on ${topic}`,
          product_type: 'ebook',
          content: {
            outline,
            chapters: content.chapters,
            page_count: pageCount,
            word_count: content.word_count
          },
          file_url: pdfUrl,
          cover_image_url: coverUrl,
          price_usd: 27.00 // Default price
        })
        .select()
        .single();

      if (error) throw error;

      return {
        productId: product.id,
        title: product.title,
        pages: pageCount,
        chapters: chapters,
        pdfUrl,
        coverUrl,
        product
      };

    } catch (error) {
      console.error('Ebook generation error:', error);
      throw error;
    }
  }

  /**
   * Generate ebook outline
   */
  async generateOutline(topic, chapterCount, audience) {
    console.log(`Generating outline: ${chapterCount} chapters about ${topic}`);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an expert ebook author creating comprehensive, actionable guides.`
            },
            {
              role: 'user',
              content: `Create a detailed ebook outline about "${topic}" for ${audience} audience.

Requirements:
- ${chapterCount} chapters
- Each chapter should have 5-7 sections
- Include introduction and conclusion
- Focus on actionable advice
- Make it comprehensive and valuable

Return as JSON:
{
  "introduction": "...",
  "chapters": [
    {
      "number": 1,
      "title": "...",
      "sections": ["...", "..."]
    }
  ],
  "conclusion": "..."
}`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      
      // Parse JSON response
      try {
        return JSON.parse(content);
      } catch {
        // Fallback structure
        return this.generateFallbackOutline(topic, chapterCount);
      }

    } catch (error) {
      console.error('Outline generation error:', error);
      return this.generateFallbackOutline(topic, chapterCount);
    }
  }

  /**
   * Generate fallback outline
   */
  generateFallbackOutline(topic, chapterCount) {
    const chapters = [];
    for (let i = 1; i <= chapterCount; i++) {
      chapters.push({
        number: i,
        title: `Chapter ${i}: ${topic} - Part ${i}`,
        sections: [
          `Introduction to Chapter ${i}`,
          `Key Concepts`,
          `Practical Examples`,
          `Common Mistakes`,
          `Action Steps`,
          `Chapter Summary`
        ]
      });
    }

    return {
      introduction: `Welcome to this comprehensive guide on ${topic}.`,
      chapters,
      conclusion: `Thank you for reading. Start implementing these strategies today!`
    };
  }

  /**
   * Generate content for all chapters
   */
  async generateContent(outline, tone) {
    const chapters = [];
    let totalWords = 0;

    console.log(`Generating content for ${outline.chapters.length} chapters...`);

    for (const chapterOutline of outline.chapters) {
      console.log(`Generating Chapter ${chapterOutline.number}: ${chapterOutline.title}`);

      const chapterContent = await this.generateChapter(chapterOutline, tone);
      
      chapters.push({
        number: chapterOutline.number,
        title: chapterOutline.title,
        content: chapterContent,
        word_count: chapterContent.split(' ').length
      });

      totalWords += chapterContent.split(' ').length;

      // Small delay to avoid rate limits
      await this.sleep(2000);
    }

    return {
      introduction: outline.introduction,
      chapters,
      conclusion: outline.conclusion,
      word_count: totalWords
    };
  }

  /**
   * Generate single chapter content
   */
  async generateChapter(chapterOutline, tone) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are writing a chapter for an ebook. Tone: ${tone}. Write comprehensive, actionable content.`
            },
            {
              role: 'user',
              content: `Write Chapter ${chapterOutline.number}: "${chapterOutline.title}"

Sections to cover:
${chapterOutline.sections.map(s => `- ${s}`).join('\n')}

Requirements:
- 2000-3000 words
- Actionable advice
- Real examples
- Clear structure
- Engaging writing

Write the complete chapter now.`
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;

    } catch (error) {
      console.error('Chapter generation error:', error);
      
      // Fallback
      return `# ${chapterOutline.title}\n\n${chapterOutline.sections.map(s => 
        `## ${s}\n\nContent about ${s}...\n\n`
      ).join('')}`;
    }
  }

  /**
   * Generate cover image
   * In production: use DALL-E or Midjourney
   */
  async generateCoverImage(title) {
    // Placeholder - implement with DALL-E
    console.log(`Generating cover image for: ${title} (mock)`);
    
    return `https://storage.example.com/covers/${Date.now()}.jpg`;
  }

  /**
   * Create PDF from content
   * In production: use pdf-lib, PDFKit, or Puppeteer
   */
  async createPDF(title, content, coverUrl) {
    // Placeholder - implement with pdf-lib or Puppeteer
    console.log(`Creating PDF: ${title} (mock)`);
    console.log(`Chapters: ${content.chapters.length}, Words: ${content.word_count}`);

    return `https://storage.example.com/ebooks/${Date.now()}.pdf`;
  }

  /**
   * Get user's ebooks
   */
  async getUserEbooks(userId) {
    const { data, error } = await this.supabase
      .from('digital_products')
      .select('*')
      .eq('user_id', userId)
      .eq('product_type', 'ebook')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  }

  /**
   * Update ebook
   */
  async updateEbook(productId, updates) {
    const { data, error } = await this.supabase
      .from('digital_products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Helper: Sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default EbookGeneratorService;



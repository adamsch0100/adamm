import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

/**
 * Reddit Comment Generator Service
 * Generates human-like Reddit comments (no links to avoid detection)
 */
class RedditCommentGeneratorService {
  constructor(supabase, openaiApiKey) {
    this.supabase = supabase;
    this.openaiApiKey = openaiApiKey;
  }

  /**
   * Generate comment for thread
   */
  async generateComment(userId, threadId, options = {}) {
    const {
      tone = 'helpful',
      length = 'medium',
      includeLinks = false,
      variations = 3
    } = options;

    // Get thread details
    const { data: thread, error: threadError } = await this.supabase
      .from('reddit_target_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (threadError || !thread) {
      throw new Error('Thread not found');
    }

    console.log(`Generating ${variations} comments for thread: ${thread.thread_title}`);

    try {
      const comments = await this.generateWithAI(thread, tone, length, includeLinks, variations);

      // Store generated comments
      const stored = [];
      for (const comment of comments) {
        const { data, error } = await this.supabase
          .from('reddit_comments')
          .insert({
            user_id: userId,
            thread_id: threadId,
            comment_text: comment.text,
            position: 'top_level',
            posted: false
          })
          .select()
          .single();

        if (!error) {
          stored.push(data);
        }
      }

      return {
        generated: comments.length,
        stored: stored.length,
        comments: stored
      };

    } catch (error) {
      console.error('Comment generation error:', error);
      throw error;
    }
  }

  /**
   * Generate human-like comments with AI
   */
  async generateWithAI(thread, tone, length, includeLinks, count) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are generating authentic Reddit comments. Rules:
              - Sound like a real person (casual, conversational)
              - No marketing language
              - ${includeLinks ? 'Can include relevant links' : 'NO LINKS (to avoid spam detection)'}
              - Match Reddit's tone and culture
              - Use proper grammar but be casual
              - Can disagree or add different perspective
              - Include personal anecdotes when relevant
              - Use "I" and "you" naturally`
            },
            {
              role: 'user',
              content: `Generate ${count} unique Reddit comments for this thread:\n\nTitle: "${thread.thread_title}"\nSubreddit: r/${thread.subreddit}\nSentiment: ${thread.sentiment}\n\nTone: ${tone}\nLength: ${length}\n\nMake each comment unique and helpful.`
            }
          ],
          temperature: 0.8,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      const comments = content.split('\n\n').filter(c => c.trim());

      return comments.map((text, i) => ({
        text: this.cleanComment(text),
        variation: i + 1
      }));

    } catch (error) {
      console.error('OpenAI error:', error.message);
      
      // Fallback: generate simple comments
      return Array.from({ length: count }, (_, i) => ({
        text: this.generateSimpleComment(thread, i),
        variation: i + 1
      }));
    }
  }

  /**
   * Clean comment text
   */
  cleanComment(text) {
    return text
      .replace(/^\d+\.\s*/, '') // Remove numbering
      .replace(/^Comment \d+:\s*/i, '') // Remove "Comment N:"
      .replace(/^["']|["']$/g, '') // Remove quotes
      .trim();
  }

  /**
   * Generate simple fallback comment
   */
  generateSimpleComment(thread, index) {
    const templates = [
      `I've had experience with this. ${thread.thread_title} - it really depends on your specific situation.`,
      `This is interesting. I'd add that you should also consider the long-term implications.`,
      `I disagree slightly. In my experience, there's more to it than that.`,
      `Great point! I'd also mention that this varies depending on several factors.`,
      `Thanks for sharing. I've been looking into this myself and found some useful insights.`
    ];

    return templates[index % templates.length];
  }

  /**
   * Get draft comments for thread
   */
  async getDraftComments(userId, threadId) {
    const { data, error } = await this.supabase
      .from('reddit_comments')
      .select('*')
      .eq('user_id', userId)
      .eq('thread_id', threadId)
      .eq('posted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  }

  /**
   * Delete draft comment
   */
  async deleteDraft(commentId) {
    const { error } = await this.supabase
      .from('reddit_comments')
      .delete()
      .eq('id', commentId)
      .eq('posted', false);

    if (error) throw error;

    return { success: true };
  }

  /**
   * Helper: Sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default RedditCommentGeneratorService;



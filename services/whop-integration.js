import { createClient } from '@supabase/supabase-js';
import Whop from '@whop/sdk';

/**
 * Whop Integration Service
 * Handles digital product sales via Whop platform
 * Uses official Whop SDK: https://docs.whop.com/apps/api/getting-started
 */
class WhopIntegrationService {
  constructor(supabase, whopApiKey, whopAppId, whopCompanyId) {
    this.supabase = supabase;
    this.whopCompanyId = whopCompanyId;
    
    // Initialize official Whop SDK
    this.client = new Whop({
      appID: whopAppId,
      apiKey: whopApiKey
    });
  }

  /**
   * Create product on Whop
   * NOTE: Products are typically created via Whop Dashboard
   * This generates a payment link for an existing product
   */
  async createWhopProduct(userId, productId) {
    // Get product from database
    const { data: product, error } = await this.supabase
      .from('digital_products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', userId)
      .single();

    if (error || !product) {
      throw new Error('Product not found');
    }

    console.log(`Creating Whop payment link: ${product.title}`);

    try {
      // In Whop, you typically create products via Dashboard, then use Plans/Prices
      // For digital products, create a one-time payment plan
      // Reference: https://docs.whop.com/apps/api/plans
      
      const planData = {
        company_id: this.whopCompanyId,
        name: product.title,
        description: product.description,
        price: Math.round(product.price_usd * 100), // Convert to cents
        currency: 'usd',
        billing_period: 'one_time',
        visibility: 'visible'
      };

      // Create plan via SDK
      const plan = await this.client.plans.create(planData);

      // Update product with Whop plan ID
      await this.supabase
        .from('digital_products')
        .update({
          stripe_product_id: plan.id, // Store plan ID (reuse field)
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      // Generate checkout URL
      const checkoutUrl = `https://whop.com/${this.whopCompanyId.replace('biz_', '')}?pass=${plan.id}`;

      return {
        whopPlanId: plan.id,
        checkoutUrl,
        plan
      };

    } catch (error) {
      console.error('Whop plan creation error:', error.message);
      throw new Error(error.message || 'Failed to create Whop plan');
    }
  }

  /**
   * Get checkout URL for product
   */
  async getCheckoutUrl(productId) {
    const { data: product } = await this.supabase
      .from('digital_products')
      .select('stripe_product_id')
      .eq('id', productId)
      .single();

    if (!product || !product.stripe_product_id) {
      throw new Error('Product not created on Whop yet');
    }

    return `https://whop.com/checkout/${product.stripe_product_id}`;
  }

  /**
   * Handle Whop purchase webhook
   * Reference: https://docs.whop.com/apps/api/payments
   */
  async handlePurchaseWebhook(webhookData) {
    console.log('Processing Whop purchase webhook');

    try {
      // Whop webhook structure
      // Event types: payment.succeeded, payment.failed, membership.created, etc.
      const { action, data } = webhookData;

      // Handle successful payment
      if (action === 'payment.succeeded' || action === 'membership.created') {
        const payment = data;

        // Extract payment information
        const {
          id: paymentId,
          amount,
          plan_id,
          user,
          metadata
        } = payment;

        // Find product in our database using plan_id
        const { data: product } = await this.supabase
          .from('digital_products')
          .select('*')
          .eq('stripe_product_id', plan_id)
          .single();

        if (!product) {
          console.warn(`Product not found for Whop plan ID: ${plan_id}`);
          return { success: true, productNotFound: true };
        }

        // Find lead if exists (via email or metadata)
        let leadId = metadata?.lead_id;
        if (!leadId && user?.email) {
          const { data: lead } = await this.supabase
            .from('leads')
            .select('id')
            .eq('user_id', product.user_id)
            .eq('metadata->>email', user.email)
            .single();

          leadId = lead?.id;
        }

        // Create sale record
        const { data: sale, error: saleError } = await this.supabase
          .from('product_sales')
          .insert({
            user_id: product.user_id,
            product_id: product.id,
            amount_usd: amount / 100,
            stripe_charge_id: paymentId, // Store Whop payment ID
            customer_email: user?.email,
            customer_name: user?.username || user?.name,
            lead_id: leadId
          })
          .select()
          .single();

        if (saleError) throw saleError;

        // Update product stats
        await this.supabase
          .from('digital_products')
          .update({
            total_sales: product.total_sales + 1,
            total_revenue: parseFloat(product.total_revenue) + (amount / 100)
          })
          .eq('id', product.id);

        // Mark lead as converted if applicable
        if (leadId) {
          await this.supabase
            .from('leads')
            .update({
              converted: true,
              converted_at: new Date().toISOString(),
              conversion_value: amount / 100,
              funnel_stage: 'converted'
            })
            .eq('id', leadId);
        }

        console.log(`✓ Processed Whop sale: $${amount / 100} for product ${product.title}`);

        return {
          success: true,
          saleId: sale.id,
          amount: amount / 100
        };
      }

      // Ignore other events
      console.log(`Ignoring event: ${action}`);
      return { success: true, ignored: true };

    } catch (error) {
      console.error('Webhook processing error:', error);
      throw error;
    }
  }

  /**
   * Verify Whop webhook signature
   */
  verifyWebhookSignature(payload, signature, secret) {
    // Whop uses HMAC SHA-256 for webhook verification
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    const digest = hmac.digest('hex');

    return digest === signature;
  }

  /**
   * Get Whop sales statistics from API
   * Reference: https://docs.whop.com/apps/api/payments
   */
  async getWhopSales(timeframe = '30days') {
    try {
      // Fetch payments from Whop API
      const paymentsPage = await this.client.payments.list({
        company_id: this.whopCompanyId,
        per_page: 100
      });

      const payments = paymentsPage.data;

      // Filter by timeframe if needed
      let filteredPayments = payments;
      if (timeframe !== 'all') {
        const date = new Date();
        if (timeframe === '7days') {
          date.setDate(date.getDate() - 7);
        } else if (timeframe === '30days') {
          date.setDate(date.getDate() - 30);
        }
        
        filteredPayments = payments.filter(p => 
          new Date(p.created_at) >= date
        );
      }

      return {
        total_sales: filteredPayments.length,
        total_revenue: filteredPayments.reduce((sum, p) => sum + (p.amount / 100), 0),
        payments: filteredPayments
      };

    } catch (error) {
      console.error('Failed to fetch Whop sales:', error);
      throw error;
    }
  }

  /**
   * Get local sales from database (for internal tracking)
   */
  async getLocalWhopSales(userId, timeframe = '30days') {
    let query = this.supabase
      .from('product_sales')
      .select('*')
      .eq('user_id', userId)
      .not('stripe_charge_id', 'is', null); // Has Whop payment ID

    // Apply timeframe
    if (timeframe !== 'all') {
      const date = new Date();
      if (timeframe === '7days') {
        date.setDate(date.getDate() - 7);
      } else if (timeframe === '30days') {
        date.setDate(date.getDate() - 30);
      }
      query = query.gte('purchased_at', date.toISOString());
    }

    const { data: sales, error } = await query;

    if (error) throw error;

    return {
      total_sales: sales.length,
      total_revenue: sales.reduce((sum, s) => sum + parseFloat(s.amount_usd), 0),
      sales
    };
  }
}

export default WhopIntegrationService;


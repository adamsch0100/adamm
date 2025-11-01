import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

/**
 * Stripe Product Manager Service
 * Auto-creates Stripe products and payment links for digital products
 */
class StripeProductManagerService {
  constructor(supabase, stripeSecretKey) {
    this.supabase = supabase;
    this.stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
  }

  /**
   * Create Stripe product and price for digital product
   */
  async createStripeProduct(userId, productId) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    // Get product
    const { data: product, error: productError } = await this.supabase
      .from('digital_products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', userId)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    console.log(`Creating Stripe product: ${product.title}`);

    try {
      // Create Stripe product
      const stripeProduct = await this.stripe.products.create({
        name: product.title,
        description: product.description,
        images: product.cover_image_url ? [product.cover_image_url] : [],
        metadata: {
          product_id: productId.toString(),
          user_id: userId,
          type: 'digital_product'
        }
      });

      // Create Stripe price
      const stripePrice = await this.stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(parseFloat(product.price_usd) * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          product_id: productId.toString()
        }
      });

      // Update product with Stripe IDs
      await this.supabase
        .from('digital_products')
        .update({
          stripe_product_id: stripeProduct.id,
          stripe_price_id: stripePrice.id
        })
        .eq('id', productId);

      return {
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id,
        product: stripeProduct
      };

    } catch (error) {
      console.error('Stripe product creation error:', error);
      throw error;
    }
  }

  /**
   * Create payment link
   */
  async createPaymentLink(userId, productId, bundleId = null) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    let priceId;
    let itemType;

    if (productId) {
      // Get product
      const { data: product, error } = await this.supabase
        .from('digital_products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', userId)
        .single();

      if (error || !product) {
        throw new Error('Product not found');
      }

      // Ensure Stripe product exists
      if (!product.stripe_price_id) {
        const result = await this.createStripeProduct(userId, productId);
        priceId = result.stripePriceId;
      } else {
        priceId = product.stripe_price_id;
      }

      itemType = 'product';

    } else if (bundleId) {
      // Get bundle
      const { data: bundle, error } = await this.supabase
        .from('product_bundles')
        .select('*')
        .eq('id', bundleId)
        .eq('user_id', userId)
        .single();

      if (error || !bundle) {
        throw new Error('Bundle not found');
      }

      // Create Stripe product for bundle if needed
      if (!bundle.stripe_price_id) {
        const stripeProduct = await this.stripe.products.create({
          name: bundle.name,
          description: bundle.description,
          metadata: {
            bundle_id: bundleId.toString(),
            user_id: userId,
            type: 'bundle'
          }
        });

        const stripePrice = await this.stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: Math.round(parseFloat(bundle.bundle_price_usd) * 100),
          currency: 'usd'
        });

        await this.supabase
          .from('product_bundles')
          .update({
            stripe_product_id: stripeProduct.id,
            stripe_price_id: stripePrice.id
          })
          .eq('id', bundleId);

        priceId = stripePrice.id;
      } else {
        priceId = bundle.stripe_price_id;
      }

      itemType = 'bundle';
    } else {
      throw new Error('Either productId or bundleId is required');
    }

    // Create Stripe payment link
    const paymentLink = await this.stripe.paymentLinks.create({
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: 'https://yourapp.com/thank-you'
        }
      },
      metadata: {
        user_id: userId,
        product_id: productId?.toString() || '',
        bundle_id: bundleId?.toString() || ''
      }
    });

    // Store payment link
    const { data: link, error: linkError } = await this.supabase
      .from('payment_links')
      .insert({
        user_id: userId,
        product_id: productId,
        bundle_id: bundleId,
        stripe_payment_link_url: paymentLink.url,
        short_url: null // Can implement URL shortener
      })
      .select()
      .single();

    if (linkError) throw linkError;

    return {
      linkId: link.id,
      paymentUrl: paymentLink.url,
      stripeId: paymentLink.id,
      link
    };
  }

  /**
   * Track sale
   */
  async trackSale(userId, saleData) {
    const {
      productId,
      bundleId,
      leadId,
      amount,
      stripeChargeId,
      stripePaymentIntentId,
      customerEmail,
      customerName,
      paymentLinkId
    } = saleData;

    // Create sale record
    const { data: sale, error } = await this.supabase
      .from('product_sales')
      .insert({
        user_id: userId,
        product_id: productId,
        bundle_id: bundleId,
        lead_id: leadId,
        amount_usd: amount,
        stripe_charge_id: stripeChargeId,
        stripe_payment_intent_id: stripePaymentIntentId,
        customer_email: customerEmail,
        customer_name: customerName,
        payment_link_id: paymentLinkId
      })
      .select()
      .single();

    if (error) throw error;

    // Update product/bundle sales count
    if (productId) {
      await this.supabase
        .from('digital_products')
        .update({
          total_sales: this.supabase.rpc('increment', { x: 1 }),
          total_revenue: this.supabase.rpc('increment', { x: amount })
        })
        .eq('id', productId);
    }

    if (bundleId) {
      await this.supabase
        .from('product_bundles')
        .update({
          total_sales: this.supabase.rpc('increment', { x: 1 }),
          total_revenue: this.supabase.rpc('increment', { x: amount })
        })
        .eq('id', bundleId);
    }

    // Update payment link stats
    if (paymentLinkId) {
      await this.supabase
        .from('payment_links')
        .update({
          total_sales: this.supabase.rpc('increment', { x: 1 }),
          revenue_usd: this.supabase.rpc('increment', { x: amount })
        })
        .eq('id', paymentLinkId);
    }

    // Mark lead as converted if applicable
    if (leadId) {
      await this.supabase
        .from('leads')
        .update({
          converted: true,
          converted_at: new Date().toISOString(),
          conversion_value: amount,
          funnel_stage: 'converted'
        })
        .eq('id', leadId);
    }

    return sale;
  }

  /**
   * Get sales statistics
   */
  async getSalesStats(userId, timeframe = '30days') {
    let query = this.supabase
      .from('product_sales')
      .select('*')
      .eq('user_id', userId);

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

    const stats = {
      total_sales: sales.length,
      total_revenue: sales.reduce((sum, s) => sum + parseFloat(s.amount_usd), 0),
      avg_sale_value: 0,
      sales_with_attribution: sales.filter(s => s.lead_id).length
    };

    if (stats.total_sales > 0) {
      stats.avg_sale_value = stats.total_revenue / stats.total_sales;
    }

    // Get top products
    const productSales = {};
    sales.forEach(sale => {
      const key = sale.product_id || `bundle_${sale.bundle_id}`;
      if (!productSales[key]) {
        productSales[key] = { count: 0, revenue: 0 };
      }
      productSales[key].count++;
      productSales[key].revenue += parseFloat(sale.amount_usd);
    });

    stats.top_products = Object.entries(productSales)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10);

    return stats;
  }
}

export default StripeProductManagerService;



import { createClient } from '@supabase/supabase-js';

/**
 * Product Bundler Service
 * Creates product bundles with discounted pricing
 */
class ProductBundlerService {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Create product bundle
   */
  async createBundle(userId, options = {}) {
    const {
      name,
      description,
      productIds,
      discountPercentage = 30
    } = options;

    if (!name) {
      throw new Error('Bundle name is required');
    }

    if (!productIds || productIds.length < 2) {
      throw new Error('At least 2 products are required for a bundle');
    }

    // Get products
    const { data: products, error: productsError } = await this.supabase
      .from('digital_products')
      .select('*')
      .in('id', productIds)
      .eq('user_id', userId);

    if (productsError) throw productsError;

    if (products.length !== productIds.length) {
      throw new Error('Some products not found');
    }

    // Calculate pricing
    const totalPrice = products.reduce((sum, p) => sum + parseFloat(p.price_usd), 0);
    const bundlePrice = totalPrice * (1 - discountPercentage / 100);

    console.log(`Creating bundle: ${name}`);
    console.log(`Products: ${products.length}, Total: $${totalPrice}, Bundle: $${bundlePrice} (${discountPercentage}% off)`);

    // Create bundle
    const { data: bundle, error: bundleError } = await this.supabase
      .from('product_bundles')
      .insert({
        user_id: userId,
        name,
        description: description || `Bundle of ${products.length} products`,
        product_ids: productIds,
        bundle_price_usd: bundlePrice.toFixed(2),
        discount_percentage: discountPercentage
      })
      .select()
      .single();

    if (bundleError) throw bundleError;

    return {
      bundleId: bundle.id,
      products: products.length,
      totalPrice,
      bundlePrice,
      savings: totalPrice - bundlePrice,
      bundle
    };
  }

  /**
   * Get user's bundles
   */
  async getUserBundles(userId) {
    const { data: bundles, error } = await this.supabase
      .from('product_bundles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch product details for each bundle
    const bundlesWithProducts = [];
    for (const bundle of bundles) {
      const { data: products } = await this.supabase
        .from('digital_products')
        .select('*')
        .in('id', bundle.product_ids);

      bundlesWithProducts.push({
        ...bundle,
        products: products || []
      });
    }

    return bundlesWithProducts;
  }

  /**
   * Update bundle
   */
  async updateBundle(bundleId, updates) {
    const { data, error } = await this.supabase
      .from('product_bundles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', bundleId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Delete bundle
   */
  async deleteBundle(bundleId) {
    // Delete associated payment links first
    await this.supabase
      .from('payment_links')
      .delete()
      .eq('bundle_id', bundleId);

    // Delete bundle
    const { error } = await this.supabase
      .from('product_bundles')
      .delete()
      .eq('id', bundleId);

    if (error) throw error;

    return { success: true };
  }

  /**
   * Get bundle sales statistics
   */
  async getBundleStats(bundleId) {
    const { data: sales, error } = await this.supabase
      .from('product_sales')
      .select('*')
      .eq('bundle_id', bundleId);

    if (error) throw error;

    const stats = {
      total_sales: sales.length,
      total_revenue: sales.reduce((sum, s) => sum + parseFloat(s.amount_usd), 0),
      avg_sale_value: 0,
      recent_sales: sales.slice(0, 10)
    };

    if (stats.total_sales > 0) {
      stats.avg_sale_value = stats.total_revenue / stats.total_sales;
    }

    return stats;
  }
}

export default ProductBundlerService;



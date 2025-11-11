export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'facebook' | 'linkedin' | 'twitter'

export type AccountStatus = 'creating' | 'active' | 'warming_up' | 'banned' | 'suspended' | 'pending_verification'

export type VerificationStatus = 'pending' | 'verified' | 'failed'

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'

export type SubscriptionPlan = 'starter' | 'growth' | 'pro' | 'enterprise' | 'ultra'

export type VideoGenerator = 'sora-2' | 'veo-3'

export type ContentPostStatus = 'generating' | 'ready' | 'posting' | 'posted' | 'failed'

export interface Profile {
  id: string
  email: string
  full_name?: string
  company_name?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status?: SubscriptionStatus
  subscription_plan?: SubscriptionPlan
  max_accounts: number
  account_usage: Record<Platform, number>
  features_enabled: {
    mass_posting: boolean
    lead_capture: boolean
    content_repurposing: boolean
    reddit_automation: boolean
    digital_products: boolean
  }
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface CloudPhone {
  id: number
  user_id: string
  name: string
  status: string
  morelogin_env_name?: string
  morelogin_env_status?: number
  adb_enabled: boolean
  adb_ip?: string
  adb_port?: string
  adb_password?: string
  proxy_id?: number
  country?: string
  timezone?: string
  language?: string
  created_at: string
  updated_at: string
}

export interface SocialAccount {
  id: number // bigint in database, but number in TypeScript
  user_id: string
  platform: Platform
  username?: string
  display_name?: string
  email?: string
  phone_number?: string
  password_encrypted?: string
  auth_data?: any // JSONB field for encrypted credentials
  status: AccountStatus
  verification_status?: 'unverified' | 'pending' | 'verified' | 'failed'
  upload_post_profile_key?: string
  upload_post_connected?: boolean
  cloud_phone_id?: number
  warmup_days?: number
  warmup_completed?: boolean
  daily_post_limit: number
  posts_today: number
  last_post_at?: string
  followers_count?: number
  following_count?: number
  posts_count?: number
  engagement_rate?: number
  bio_link?: string
  notes?: string
  profile_data?: any // JSONB field for additional profile data
  created_at: string
  updated_at: string
}

export interface Proxy {
  id: number
  user_id: string
  morelogin_proxy_id?: number
  name: string
  provider: string
  proxy_ip: string
  proxy_port: number
  username?: string
  password?: string
  country?: string
  status: string
  last_checked?: string
  created_at: string
}

export interface ContentPost {
  id: number // bigint in database
  user_id: string
  campaign_id?: string // UUID reference to campaigns table
  topic?: string
  content_data?: any // JSONB for content details
  target_platforms?: Platform[]
  status: ContentPostStatus
  total_views: number
  total_likes: number
  total_comments: number
  total_shares: number
  platform_metrics?: any // JSONB for detailed metrics
  created_at: string
  updated_at: string
}

export interface WarmupTemplate {
  id: number
  platform: Platform
  name: string
  description?: string
  actions: any[]
  daily_frequency?: number
  session_duration_min?: number
  session_duration_max?: number
  randomization_level?: 'low' | 'medium' | 'high'
  is_default: boolean
  ban_rate?: number
  created_at: string
}

export interface ActivityLog {
  id: number
  user_id: string
  cloud_phone_id?: number
  tiktok_account_id?: number
  activity_type: string
  description?: string
  metadata?: any
  created_at: string
}

export interface UsageTracking {
  id: number
  user_id: string
  resource_type: string
  resource_id?: string
  quantity: number
  cost_usd?: number
  billing_cycle?: string
  created_at: string
}

export interface UserApiKey {
  id: number
  user_id: string
  service: 'openai' | 'coinmarketcap' | 'upload-post'
  api_key_encrypted: string
  api_secret_encrypted?: string
  status: string
  last_verified?: string
  service_metadata?: any
  created_at: string
}

export interface OperatorSetting {
  id: number
  service: 'morelogin' | 'openai' | 'google' | 'coinmarketcap' | 'upload-post'
  status: string
  last_verified?: string
  created_at: string
  updated_at: string
}

// Campaign Types (Updated to match DB schema)
export type CampaignStatus =
  | 'creating'
  | 'generating_script'
  | 'generating_videos'
  | 'downloading'
  | 'pending_review'
  | 'approved'
  | 'posting'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface Campaign {
  id: string // UUID from database
  user_id: string
  name: string
  keywords?: string
  topics?: string
  platforms?: Platform[]
  content_json?: any
  status: CampaignStatus
  created_at: string
  updated_at: string
}

// Legacy campaign type for backward compatibility
export interface LegacyCampaign {
  id: number
  user_id: string
  name: string
  topic_source: 'auto' | 'manual'
  topic: string
  topic_metadata?: any
  video_count: number
  target_accounts: number[]
  target_platforms: Platform[]
  require_approval: boolean
  auto_post_on_approval: boolean
  script?: {
    hook: string
    facts: string[]
    cta: string
  }
  video_ids?: string[]
  captions?: string[]
  status: CampaignStatus
  progress: number
  current_step?: string
  error_message?: string
  videos_status?: VideoStatus[]
  posting_status?: PostingStatus[]
  reviewed_at?: string
  approved_video_count: number
  rejected_video_count: number
  created_at: string
  started_at?: string
  completed_at?: string
  total_posted: number
  total_failed: number
  results?: any
}

export interface VideoStatus {
  id: string
  status: 'queued' | 'in_progress' | 'completed' | 'failed'
  progress: number
  url?: string
  thumbnail?: string
  approved: boolean
  rejected: boolean
  index: number
}

export interface PostingStatus {
  account_id: number
  account_username: string
  platform: Platform
  video_index: number
  status: 'pending' | 'posting' | 'posted' | 'failed'
  posted_at?: string
  error?: string
}

export interface Analytics {
  id: string // UUID from database
  post_id: number
  campaign_id?: string
  platform: Platform
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  recorded_at: string
}

// Platform-specific metadata
export const PLATFORM_CONFIG: Record<Platform, {
  name: string
  icon: string
  color: string
  captionMaxLength: number
  supportsVideo: boolean
  supportsImage: boolean
}> = {
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    color: '#000000',
    captionMaxLength: 2200,
    supportsVideo: true,
    supportsImage: false
  },
  instagram: {
    name: 'Instagram',
    icon: '📸',
    color: '#E4405F',
    captionMaxLength: 2200,
    supportsVideo: true,
    supportsImage: true
  },
  youtube: {
    name: 'YouTube',
    icon: '▶️',
    color: '#FF0000',
    captionMaxLength: 5000,
    supportsVideo: true,
    supportsImage: false
  },
  facebook: {
    name: 'Facebook',
    icon: '👥',
    color: '#1877F2',
    captionMaxLength: 63206,
    supportsVideo: true,
    supportsImage: true
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    captionMaxLength: 3000,
    supportsVideo: true,
    supportsImage: true
  },
  twitter: {
    name: 'X (Twitter)',
    icon: '𝕏',
    color: '#000000',
    captionMaxLength: 280,
    supportsVideo: true,
    supportsImage: true
  }
}

// =============================================================================
// PHASE 1-6: NEW TYPES
// =============================================================================

// Phase 1: Queue & Health
export interface PostingQueueItem {
  id: number
  user_id: string
  social_account_id: number
  content_type: 'post' | 'comment' | 'reply' | 'dm'
  content_data: any
  scheduled_for: string
  priority: number
  status: 'pending' | 'processing' | 'posted' | 'failed' | 'rate_limited' | 'cancelled'
  attempts: number
  max_attempts: number
  error_message?: string
  posted_at?: string
  created_at: string
  updated_at: string
}

export interface AccountHealth {
  id: number
  social_account_id: number
  last_check: string
  status: 'healthy' | 'warning' | 'shadowban' | 'banned' | 'suspended'
  metrics: {
    avg_views?: number
    avg_likes?: number
    reach_decline_pct?: number
    engagement_drop_pct?: number
    follower_loss?: number
  }
  alerts: Array<{
    type: string
    severity: 'low' | 'medium' | 'high'
    message: string
    detected_at: string
  }>
  health_score: number
  auto_paused: boolean
  created_at: string
  updated_at: string
}

// Phase 2: Twitter Automation
export interface TwitterScrapedTweet {
  id: number
  user_id: string
  source_username: string
  original_tweet_id?: string
  original_text: string
  engagement_score: number
  tweet_url?: string
  scraped_at: string
  used_in_rewrite: boolean
}

export interface TwitterRewrite {
  id: number
  user_id: string
  original_tweet_id?: number
  rewritten_text: string
  variation_style: 'hook' | 'question' | 'story' | 'stats' | 'listicle'
  quality_score: number
  used: boolean
  posted_to_accounts: number[]
  created_at: string
}

export interface LeadTrigger {
  id: number
  user_id: string
  platform: Platform | 'reddit'
  trigger_keyword: string
  trigger_type: 'comment' | 'dm_keyword' | 'bio_click' | 'mention'
  response_action: 'auto_dm' | 'send_link' | 'add_to_funnel' | 'all'
  response_template?: string
  lead_magnet_url?: string
  require_follow: boolean
  require_like: boolean
  require_repost: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export interface Lead {
  id: number // bigint in database
  user_id: string
  campaign_id?: string // UUID reference to campaigns table
  email?: string
  lead_data?: any // JSONB for lead information
  source?: string
  status?: string
  captured_at: string
  created_at: string
  updated_at: string
}

export interface TwitterCarousel {
  id: number
  user_id: string
  title: string
  slides: Array<{
    image_url: string
    text: string
    order: number
  }>
  hook?: string
  cta?: string
  template_style: string
  total_posts: number
  total_engagements: number
  created_at: string
  updated_at: string
}

// Phase 3: Content Repurposing
export interface ContentRepurposingJob {
  id: number
  user_id: string
  source_type: 'youtube_video' | 'tweet' | 'tweet_thread' | 'images' | 'long_video'
  source_url?: string
  source_data?: any
  target_type: 'shorts' | 'tiktok_slideshow' | 'instagram_reel' | 'carousel' | 'video_clips'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  output_urls?: string[]
  output_data?: any
  processing_options?: any
  error_message?: string
  created_at: string
  completed_at?: string
}

// Phase 4: Reddit Automation
export interface RedditAccount {
  id: number
  user_id: string
  username: string
  password_encrypted: string
  karma: number
  account_age_days: number
  status: 'active' | 'shadowbanned' | 'suspended' | 'warming_up'
  proxy_id?: number
  last_activity?: string
  created_at: string
}

export interface RedditTargetThread {
  id: number
  user_id: string
  search_query: string
  thread_url: string
  thread_id?: string
  subreddit?: string
  thread_title?: string
  google_rank?: number
  upvotes: number
  comment_count: number
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed'
  target_priority: number
  discovered_at: string
  last_checked?: string
}

export interface RedditComment {
  id: number
  user_id: string
  thread_id: number
  reddit_account_id?: number
  comment_text: string
  comment_reddit_id?: string
  position: 'top_level' | 'reply'
  parent_comment_id?: string
  posted: boolean
  posted_at?: string
  upvotes_received: number
  survival_status: 'alive' | 'deleted' | 'removed' | 'unknown'
  last_check?: string
  created_at: string
}

// Phase 5: Digital Products
export interface DigitalProduct {
  id: number
  user_id: string
  title: string
  description?: string
  product_type: 'ebook' | 'course' | 'bundle' | 'guide' | 'template'
  content?: any
  file_url?: string
  cover_image_url?: string
  price_usd: number
  stripe_product_id?: string
  stripe_price_id?: string
  total_sales: number
  total_revenue: number
  created_at: string
  updated_at: string
}

export interface ProductBundle {
  id: number
  user_id: string
  name: string
  description?: string
  product_ids: number[]
  bundle_price_usd: number
  discount_percentage: number
  stripe_product_id?: string
  stripe_price_id?: string
  total_sales: number
  total_revenue: number
  created_at: string
  updated_at: string
}

export interface PaymentLink {
  id: number
  user_id: string
  product_id?: number
  bundle_id?: number
  stripe_payment_link_url: string
  short_url?: string
  total_clicks: number
  total_sales: number
  revenue_usd: number
  conversion_rate: number
  created_at: string
}

export interface ProductSale {
  id: number
  user_id: string
  product_id?: number
  bundle_id?: number
  lead_id?: number
  amount_usd: number
  stripe_charge_id?: string
  stripe_payment_intent_id?: string
  customer_email?: string
  customer_name?: string
  payment_link_id?: number
  purchased_at: string
}

// Phase 6: Funnel Tracking
export interface Funnel {
  id: number
  user_id: string
  name: string
  description?: string
  steps: Array<{
    stage: string
    action: string
    expected_conversion?: number
  }>
  conversion_goals?: any
  active: boolean
  created_at: string
  updated_at: string
}

export interface FunnelEvent {
  id: number
  funnel_id: number
  lead_id?: number
  event_type: 'view' | 'click' | 'bio_click' | 'dm_open' | 'link_click' | 'purchase' | 'custom'
  event_data: any
  event_value: number
  post_id?: number
  social_account_id?: number
  occurred_at: string
}

export interface BioLink {
  id: number
  user_id: string
  social_account_id?: number
  short_code: string
  destination_url: string
  title?: string
  funnel_id?: number
  total_clicks: number
  unique_visitors: number
  utm_params?: any
  active: boolean
  created_at: string
}



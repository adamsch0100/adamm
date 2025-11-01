import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Smartphone, Zap, TrendingUp, MessageSquare, BarChart3, Gamepad2, ArrowRight } from 'lucide-react'
import { EnterpriseModal } from '@/components/layout/EnterpriseModal'

export default function Home() {
  const features = [
    {
      icon: Smartphone,
      title: 'Multi-Platform Control',
      description: 'Manage accounts across TikTok, Instagram, YouTube, Facebook, LinkedIn, and X from one dashboard',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: Zap,
      title: 'Lightning-Fast Automation',
      description: 'Automate account creation, warmup, and content distribution with intelligent workflows',
      gradient: 'from-yellow-500 to-orange-600'
    },
    {
      icon: TrendingUp,
      title: 'AI-Powered Content',
      description: 'Generate unique videos with Sora 2 or Veo 3, optimized for each platform',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      icon: MessageSquare,
      title: 'Smart Warmup',
      description: 'Platform-specific warmup strategies that mimic real user behavior and prevent bans',
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      icon: BarChart3,
      title: 'Cross-Platform Analytics',
      description: 'Track views, engagement, and growth across all platforms in real-time',
      gradient: 'from-rose-500 to-red-600'
    },
    {
      icon: Gamepad2,
      title: 'Remote Device Control',
      description: 'View and control phone instances with screenshot viewer and click-to-tap functionality',
      gradient: 'from-indigo-500 to-purple-600'
    }
  ]

  const plans = [
    {
      name: 'Starter',
      price: '$29.99',
      period: '/month',
      description: 'Perfect for getting started',
      profiles: '5 profiles',
      videos: '50 videos/month',
      features: [
        'Basic automation',
        'Account warmup',
        'Single platform focus',
        'Email support',
        'Manual device control'
      ]
    },
    {
      name: 'Growth',
      price: '$79.99',
      period: '/month',
      description: 'Most popular choice',
      profiles: '25 profiles',
      videos: '200 videos/month',
      features: [
        'Everything in Starter',
        'Multi-platform posting',
        'Analytics dashboard',
        'Priority queue',
        'Priority support',
        'Custom workflows'
      ],
      popular: true
    },
    {
      name: 'Pro',
      price: '$199.99',
      period: '/month',
      description: 'For scaling operations',
      profiles: '75 profiles',
      videos: '500 videos/month',
      features: [
        'Everything in Growth',
        'API access',
        'Webhook integration',
        'White-label ready',
        'Dedicated support',
        'Custom SLA'
      ]
    }
  ]

  const platformGradients: Record<string, string> = {
    tiktok: 'from-black via-gray-900 to-gray-800',
    instagram: 'from-pink-600 via-purple-600 to-purple-700',
    youtube: 'from-red-600 via-red-500 to-orange-500',
    facebook: 'from-blue-700 via-blue-600 to-blue-500',
    linkedin: 'from-blue-600 via-blue-700 to-blue-800',
    twitter: 'from-gray-700 via-slate-600 to-gray-800'
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white overflow-hidden relative">
      {/* Animated background elements - MUCH MORE VIBRANT */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-72 h-72 bg-purple-600/25 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />
      </div>

      {/* Relative z-index for content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="text-3xl font-bold gradient-text">🚀 Social Automation</div>
          <nav className="space-x-4">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="btn-gradient">
                Get Started
              </Button>
            </Link>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 text-center space-y-8">
          <div className="space-y-6">
            <h1 className="text-7xl md:text-8xl font-black leading-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Automate Your Social Media
              <br />
              Across 6 Platforms
            </h1>
            <p className="text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Create accounts, warm them up naturally, and distribute AI-generated content to TikTok, Instagram, YouTube, Facebook, LinkedIn, and X — all from one powerful dashboard.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg" className="btn-gradient text-lg px-10 py-8 group">
                Start Free Trial
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button size="lg" variant="outline" className="btn-glass text-lg px-10 py-8">
                View Pricing
              </Button>
            </Link>
          </div>
        </section>

        {/* Platforms Section */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-5xl font-bold text-center mb-16">Supported Platforms</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'TikTok', icon: '🎵' },
              { name: 'Instagram', icon: '📸' },
              { name: 'YouTube', icon: '▶️' },
              { name: 'Facebook', icon: '👥' },
              { name: 'LinkedIn', icon: '💼' },
              { name: 'X/Twitter', icon: '𝕏' }
            ].map((platform, index) => (
              <Card 
                key={platform.name} 
                className={`platform-card bg-gradient-to-br ${platformGradients[platform.name.toLowerCase().split('/')[0]]}`}
              >
                <div className="text-6xl mb-3">{platform.icon}</div>
                <div className="font-bold text-center text-lg">{platform.name}</div>
              </Card>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-5xl font-bold text-center mb-16">Powerful Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="card-glass group hover:border-white/50">
                  <div className="p-8 space-y-4">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} text-white group-hover:scale-125 transition-transform shadow-lg`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">Simple, Transparent Pricing</h2>
            <p className="text-gray-300 text-xl">Choose the perfect plan for your needs. Upgrade anytime.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`card-glass group ${
                  plan.popular 
                    ? 'ring-4 ring-gradient-to-r ring-blue-500/50 md:scale-105 shadow-2xl shadow-blue-500/30' 
                    : ''
                }`}
              >
                <div className="p-8 space-y-8">
                  {plan.popular && (
                    <div className="inline-block bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <h3 className="text-3xl font-black text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-300 text-lg">{plan.description}</p>
                  </div>

                  <div>
                    <div className="text-6xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {plan.price}
                      <span className="text-2xl text-gray-300 font-normal">{plan.period}</span>
                    </div>
                    <div className="text-base text-gray-300 mt-4 space-y-1">
                      <div className="font-semibold">{plan.profiles}</div>
                      <div className="font-semibold">{plan.videos}</div>
                    </div>
                  </div>

                  <ul className="space-y-3 border-t border-white/10 pt-6">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                            <svg className="w-4 h-4 text-white font-black" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <span className="text-gray-200 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/signup">
                    <Button className={`w-full py-4 text-lg font-bold ${plan.popular ? 'btn-gradient shadow-lg shadow-blue-500/50' : 'btn-glass'}`}>
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-300 mb-4 text-lg">Need more flexibility?</p>
            <EnterpriseModal />
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="glass bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl p-16 text-center space-y-8 shadow-2xl">
            <h2 className="text-5xl font-black">Ready to Automate Your Growth?</h2>
            <p className="text-gray-200 text-xl max-w-2xl mx-auto">
              Join thousands of creators and businesses already using our platform to scale their social media presence.
            </p>
            <Link href="/signup">
              <Button className="btn-gradient text-xl px-10 py-6 shadow-2xl shadow-blue-500/50">
                Start Your Free Trial Today
                <ArrowRight className="ml-3" />
              </Button>
            </Link>
        </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-12 border-t border-white/10 text-center text-gray-400">
          <p>&copy; 2025 Social Automation Platform. All rights reserved.</p>
      </footer>
      </div>
    </div>
  )
}

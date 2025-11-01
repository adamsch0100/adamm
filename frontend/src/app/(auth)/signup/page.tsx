'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Check, Users, Video, Zap } from 'lucide-react'

type Plan = 'starter' | 'growth' | 'pro'

const PLANS = {
  starter: { 
    name: 'Starter', 
    price: 29.99, 
    priceId: 'price_starter',
    profiles: '5 profiles',
    videos: '50 videos/month',
    features: ['Basic automation', 'Account warmup', 'Single platform'],
    gradient: 'from-emerald-500 to-teal-600'
  },
  growth: { 
    name: 'Growth', 
    price: 79.99, 
    priceId: 'price_growth',
    profiles: '25 profiles',
    videos: '200 videos/month',
    features: ['Everything in Starter', 'Multi-platform', 'Analytics', 'Priority queue'],
    gradient: 'from-blue-500 to-purple-600'
  },
  pro: { 
    name: 'Pro', 
    price: 199.99, 
    priceId: 'price_pro',
    profiles: '75 profiles',
    videos: '500 videos/month',
    features: ['Everything in Growth', 'Custom workflows', 'API access', 'White-label'],
    gradient: 'from-purple-500 to-pink-600'
  }
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<Plan>('growth')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('User creation failed')
      }

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update the profile with the selected plan
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_plan: selectedPlan
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.warn('Profile update warning:', profileError)
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user.id,
          plan: selectedPlan,
          priceId: PLANS[selectedPlan].priceId
        })
      })

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      } else {
        toast.success('Account created! Redirecting...')
        router.push('/dashboard')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create account')
      toast.error('Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const currentPlan = PLANS[selectedPlan]

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Left Side - Plan Comparison Teaser */}
        <div className="hidden md:flex flex-col space-y-10">
          <div>
            <h1 className="text-6xl font-black mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Choose Your Plan
            </h1>
            <p className="text-2xl text-gray-200 leading-relaxed">
              Start automating your social media today. Upgrade anytime as you grow.
            </p>
          </div>

          <div className="space-y-4">
            {Object.entries(PLANS).map(([key, plan]) => (
              <div 
                key={key}
                onClick={() => setSelectedPlan(key as Plan)}
                className={`p-5 rounded-xl cursor-pointer transition-all duration-300 ${
                  selectedPlan === key
                    ? 'glass bg-white/12 border-blue-400/50 ring-2 ring-blue-400/30'
                    : 'glass hover:bg-white/12 hover:border-white/40'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-base text-gray-300 font-semibold">${plan.price}/month</p>
                  </div>
                  {selectedPlan === key && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-white font-bold" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="font-medium">{plan.profiles}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-400" />
                    <span className="font-medium">{plan.videos}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 glass rounded-xl">
            <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Current Plan Includes
            </h4>
            <ul className="space-y-3">
              {currentPlan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-gray-200">
                  <Check className="w-5 h-5 text-green-400 font-bold" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="w-full">
          <div className="card-glass">
            <CardHeader className="space-y-3 mb-8">
              <CardTitle className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Create Your Account
              </CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                Join thousands of creators automating their content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="bg-red-500/20 border-red-500/50">
                    <AlertDescription className="text-red-200 font-medium">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Plan selector - Mobile visible */}
                <div className="space-y-3 md:hidden">
                  <Label htmlFor="plan" className="label-glass text-base">
                    Select Plan
                  </Label>
                  <Select value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as Plan)}>
                    <SelectTrigger className="input-glass text-base py-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      {Object.entries(PLANS).map(([key, plan]) => (
                        <SelectItem key={key} value={key} className="text-white">
                          {plan.name} - ${plan.price}/month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="fullName" className="label-glass text-base">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                    className="input-glass text-base py-3"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="label-glass text-base">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="input-glass text-base py-3"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="label-glass text-base">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={loading}
                    className="input-glass text-base py-3"
                  />
                  <p className="text-sm text-gray-300 flex items-center gap-2 font-medium">
                    <Check className={`w-4 h-4 ${password.length >= 8 ? 'text-green-400' : 'text-gray-600'}`} />
                    At least 8 characters
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full btn-gradient text-lg py-4 mt-8 font-bold shadow-xl shadow-blue-500/30"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : `Continue to Payment ($${currentPlan.price}/mo)`}
                </Button>

                <p className="text-sm text-gray-300 text-center font-medium">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>

              <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-3">
                <p className="text-sm text-gray-300 font-medium">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-bold">
                    Sign in
                  </Link>
                </p>
                <Link href="/" className="text-sm text-gray-400 hover:text-blue-400 transition-colors block font-medium">
                  ← Back to home
                </Link>
              </div>
            </CardContent>
          </div>
        </div>
      </div>
    </div>
  )
}


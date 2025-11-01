'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Smartphone, TrendingUp, Zap } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success('Logged in successfully!')
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Failed to log in')
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding & Features */}
        <div className="hidden md:flex flex-col justify-center space-y-10">
          <div>
            <h1 className="text-6xl font-black mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-2xl text-gray-200 leading-relaxed">
              Continue your social media automation journey and manage all your platforms from one powerful dashboard.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Multi-Platform Control</h3>
                <p className="text-gray-300">Manage accounts across TikTok, Instagram, YouTube, and more</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Lightning Fast</h3>
                <p className="text-gray-300">Automate content distribution and engagement</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Real-time Analytics</h3>
                <p className="text-gray-300">Track performance across all your accounts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full">
          <div className="card-glass">
            <CardHeader className="space-y-3 mb-8">
              <CardTitle className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Sign In
              </CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-7">
                {error && (
                  <Alert variant="destructive" className="bg-red-500/20 border-red-500/50">
                    <AlertDescription className="text-red-200 font-medium">{error}</AlertDescription>
                  </Alert>
                )}

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
                    disabled={loading}
                    className="input-glass text-base py-3"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full btn-gradient text-lg py-4 font-bold shadow-xl shadow-blue-500/30"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/5 px-3 text-gray-400 font-semibold">New to the platform?</span>
                  </div>
                </div>

                <Link href="/signup">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full btn-glass text-base py-3 font-semibold"
                  >
                    Create Account
                  </Button>
                </Link>
              </form>

              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <Link href="/" className="text-sm text-gray-400 hover:text-blue-400 transition-colors font-medium">
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


'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { completeOAuth } from '@/lib/api/upload-post'
import { toast } from 'sonner'

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        setStatus('error')
        setError(errorParam)
        toast.error('OAuth authorization failed')
        return
      }

      if (!code || !state) {
        setStatus('error')
        setError('Missing authorization code or state')
        return
      }

      try {
        // Get Upload-post API key from storage
        const apiKeyResponse = await fetch('/api/api-keys')
        const { apiKeys } = await apiKeyResponse.json()
        const uploadPostKey = apiKeys?.find((k: any) => k.service === 'upload-post')

        if (!uploadPostKey) {
          throw new Error('Upload-post API key not configured')
        }

        // Complete OAuth flow
        const result = await completeOAuth(code, state, uploadPostKey.api_key_encrypted)

        setProfile(result.profile)
        setStatus('success')
        toast.success(`Successfully connected ${result.profile.platform} account!`)

        // Redirect to settings after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/settings?tab=api-keys')
        }, 2000)

      } catch (error: any) {
        console.error('OAuth callback error:', error)
        setStatus('error')
        setError(error.message || 'Failed to complete OAuth flow')
        toast.error('Failed to connect account')
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-center">
            {status === 'loading' && 'Connecting Account...'}
            {status === 'success' && 'Account Connected!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>
          <CardDescription className="text-gray-400 text-center">
            {status === 'loading' && 'Please wait while we complete the OAuth flow'}
            {status === 'success' && 'Your social media account has been connected successfully'}
            {status === 'error' && 'There was a problem connecting your account'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-gray-400 text-sm">Connecting your account...</p>
            </div>
          )}

          {status === 'success' && (
            <>
              <div className="flex flex-col items-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                {profile && (
                  <div className="text-center">
                    <p className="text-white font-medium">@{profile.username}</p>
                    <p className="text-gray-400 text-sm capitalize">{profile.platform}</p>
                  </div>
                )}
              </div>
              <Alert className="bg-green-500/10 border-green-500/50">
                <AlertDescription className="text-green-400 text-sm">
                  You can now post content to this account using the platform publisher.
                </AlertDescription>
              </Alert>
              <p className="text-gray-400 text-xs text-center">
                Redirecting to settings...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex flex-col items-center space-y-4">
                <XCircle className="h-12 w-12 text-red-500" />
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/dashboard/settings?tab=api-keys')}
                >
                  Back to Settings
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


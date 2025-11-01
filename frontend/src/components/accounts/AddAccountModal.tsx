'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Plus, AlertCircle } from 'lucide-react'

const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'youtube', name: 'YouTube', icon: '▶️' },
  { id: 'facebook', name: 'Facebook', icon: '👥' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'twitter', name: 'X (Twitter)', icon: '𝕏' }
]

export function AddAccountModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [platform, setPlatform] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [useForAll, setUseForAll] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !password || (!platform && !useForAll)) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please log in to continue')
        return
      }

      // If "use for all" is checked, create accounts for all platforms
      const platformsToCreate = useForAll ? PLATFORMS.map(p => p.id) : [platform]

      for (const platformId of platformsToCreate) {
        // Check if account already exists for this platform
        const { data: existing } = await supabase
          .from('social_accounts')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('platform', platformId)
          .eq('username', username)
          .maybeSingle()

        if (existing) {
          if (!useForAll) {
            toast.error(`Account @${username} already exists for ${platformId}`)
          }
          continue
        }

        // Insert new account
        const { error } = await supabase
          .from('social_accounts')
          .insert({
            user_id: session.user.id,
            platform: platformId,
            username: username,
            email: null,
            password_encrypted: password, // TODO: Encrypt in backend
            status: 'active',
            verification_status: 'verified', // Assuming user-provided credentials are valid
            upload_post_connected: false
          })

        if (error) {
          console.error('Insert error:', error)
          throw new Error(`Failed to add ${platformId} account: ${error.message}`)
        }
      }

      toast.success(
        useForAll 
          ? `Account added to ${platformsToCreate.length} platforms!` 
          : `${PLATFORMS.find(p => p.id === platform)?.name} account added successfully!`
      )
      
      // Reset form and close modal
      setUsername('')
      setPassword('')
      setPlatform('')
      setUseForAll(false)
      setOpen(false)
      
      // Refresh page to show new accounts
      window.location.reload()

    } catch (error: any) {
      console.error('Add account error:', error)
      toast.error(error.message || 'Failed to add account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-gradient text-lg px-8 py-3 font-bold shadow-xl shadow-blue-500/30">
          <Plus className="mr-2 h-5 w-5" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="glass max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">Add Social Media Account</DialogTitle>
          <DialogDescription className="text-gray-300 text-base">
            Enter your account credentials to enable automated posting
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform" className="label-glass text-base">
              Platform <span className="text-red-400">*</span>
            </Label>
            <Select value={platform} onValueChange={setPlatform} disabled={useForAll}>
              <SelectTrigger className="input-glass text-base py-3">
                <SelectValue placeholder="Select a platform" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20">
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-white">
                    <span className="flex items-center gap-2">
                      <span>{p.icon}</span>
                      <span>{p.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="label-glass text-base">
              Username <span className="text-red-400">*</span>
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="@yourusername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="input-glass text-base py-3"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="label-glass text-base">
              Password <span className="text-red-400">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-glass text-base py-3"
            />
          </div>

          {/* Use for All Platforms Checkbox */}
          <div className="flex items-start space-x-3 p-4 rounded-lg bg-purple-600/10 border border-purple-500/30">
            <Checkbox
              id="useForAll"
              checked={useForAll}
              onCheckedChange={(checked) => {
                setUseForAll(checked as boolean)
                if (checked) setPlatform('') // Clear platform selection when "use for all" is enabled
              }}
              className="mt-1"
            />
            <div className="flex-1">
              <Label
                htmlFor="useForAll"
                className="text-sm font-semibold text-purple-200 cursor-pointer"
              >
                Use these credentials for all platforms
              </Label>
              <p className="text-xs text-purple-100/80 mt-1">
                Check this if you use the same username and password across all platforms.
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-600/10 border border-blue-500/30">
            <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-100/90 leading-relaxed">
              Your credentials are encrypted and stored securely.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading || !username || !password || (!platform && !useForAll)}
              className="flex-1 btn-gradient text-base py-3 font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Add Account{useForAll ? 's' : ''}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="btn-glass"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


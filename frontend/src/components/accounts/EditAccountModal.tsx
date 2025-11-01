'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Edit, AlertCircle } from 'lucide-react'

interface EditAccountModalProps {
  account: {
    id: number
    platform: string
    username: string
    email: string | null
  }
  platformDisplayName: string
  platformIcon: string
}

export function EditAccountModal({ account, platformDisplayName, platformIcon }: EditAccountModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState(account.username)
  const [password, setPassword] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username) {
      toast.error('Username is required')
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please log in to continue')
        return
      }

      // Build update object
      const updateData: any = {
        username: username,
        updated_at: new Date().toISOString()
      }

      // Only update password if a new one was provided
      if (password) {
        updateData.password_encrypted = password // TODO: Encrypt in backend
      }

      // Update account
      const { error } = await supabase
        .from('social_accounts')
        .update(updateData)
        .eq('id', account.id)
        .eq('user_id', session.user.id) // Ensure user owns this account

      if (error) {
        console.error('Update error:', error)
        throw new Error(`Failed to update account: ${error.message}`)
      }

      toast.success(`${platformDisplayName} account updated successfully!`)
      
      // Close modal
      setOpen(false)
      
      // Refresh page to show updates
      window.location.reload()

    } catch (error: any) {
      console.error('Update account error:', error)
      toast.error(error.message || 'Failed to update account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text flex items-center gap-2">
            <span className="text-3xl">{platformIcon}</span>
            Edit {platformDisplayName} Account
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-base">
            Update your account credentials for @{account.username}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
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
              Password (Optional)
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Leave blank to keep current"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-glass text-base py-3"
            />
            <p className="text-sm text-gray-400">
              Only fill this if changing password
            </p>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-600/10 border border-blue-500/30">
            <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-100/90 leading-relaxed">
              Changes take effect immediately.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading || !username}
              className="flex-1 btn-gradient text-base py-3 font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-5 w-5" />
                  Update Account
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


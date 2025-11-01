'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Trash2, Pause, Play, Twitter } from 'lucide-react'

export default function AccountsPage() {
  const supabase = createClient()
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Add account form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAccount, setNewAccount] = useState({
    platform: 'both', // twitter, tiktok, or 'both'
    username: '',
    displayName: '',
    twitterProfileKey: '', // Upload-post Twitter profile key
    tiktokProfileKey: '', // Upload-post TikTok profile key
    whopLink: '' // Whop checkout link
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('http://localhost:3000/api/accounts', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error('Fetch accounts error:', error)
    }
  }

  const handleAddAccount = async () => {
    if (!newAccount.username.trim()) {
      toast.error('Username is required')
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('http://localhost:3000/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(newAccount)
      })

      if (response.ok) {
        toast.success('Account added successfully!')
        setShowAddForm(false)
        setNewAccount({ platform: 'both', username: '', displayName: '', twitterProfileKey: '', tiktokProfileKey: '', whopLink: '' })
        fetchAccounts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add account')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add account')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (accountId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`http://localhost:3000/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success(`Account ${newStatus === 'active' ? 'activated' : 'paused'}`)
        fetchAccounts()
      }
    } catch (error) {
      toast.error('Failed to update account')
    }
  }

  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`http://localhost:3000/api/accounts/${accountId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (response.ok) {
        toast.success('Account deleted')
        fetchAccounts()
      }
    } catch (error) {
      toast.error('Failed to delete account')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Social Accounts</h1>
          <p className="text-gray-400 mt-2">Manage accounts for multi-platform posting</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Add Account Form */}
      {showAddForm && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Add New Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-300">Platform</label>
              <select
                value={newAccount.platform}
                onChange={(e) => setNewAccount({...newAccount, platform: e.target.value})}
                className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 mt-1"
              >
                <option value="both">Both Twitter & TikTok</option>
                <option value="twitter">Twitter/X Only</option>
                <option value="tiktok">TikTok Only</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-300">Username *</label>
              <Input
                placeholder="@username (without @)"
                value={newAccount.username}
                onChange={(e) => setNewAccount({...newAccount, username: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">Display Name</label>
              <Input
                placeholder="Your Name"
                value={newAccount.displayName}
                onChange={(e) => setNewAccount({...newAccount, displayName: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white mt-1"
              />
            </div>

            {(newAccount.platform === 'both' || newAccount.platform === 'twitter') && (
              <div>
                <label className="text-sm text-gray-300">Twitter Upload-post Profile Key *</label>
                <Input
                  placeholder="tw_abc123xyz (from upload-post.com)"
                  value={newAccount.twitterProfileKey}
                  onChange={(e) => setNewAccount({...newAccount, twitterProfileKey: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from upload-post.com dashboard → Connected Accounts
                </p>
              </div>
            )}

            {(newAccount.platform === 'both' || newAccount.platform === 'tiktok') && (
              <div>
                <label className="text-sm text-gray-300">TikTok Upload-post Profile Key *</label>
                <Input
                  placeholder="tt_abc123xyz (from upload-post.com)"
                  value={newAccount.tiktokProfileKey}
                  onChange={(e) => setNewAccount({...newAccount, tiktokProfileKey: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from upload-post.com dashboard → Connected Accounts
                </p>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-300">Whop Checkout Link *</label>
              <Input
                placeholder="https://whop.com/your-product"
                value={newAccount.whopLink}
                onChange={(e) => setNewAccount({...newAccount, whopLink: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Whop product checkout URL (put this in your bio!)
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddAccount} disabled={loading}>
                {loading ? 'Adding...' : 'Add Account'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account: any) => (
          <Card key={account.id} className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Twitter className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{account.display_name || account.username}</h3>
                    <p className="text-sm text-gray-400">@{account.username}</p>
                  </div>
                </div>
                <Badge className={account.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}>
                  {account.status}
                </Badge>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Posts Today:</span>
                  <span className="text-white">{account.posts_today}/{account.daily_post_limit}</span>
                </div>
                {account.bio_link && (
                  <div className="text-gray-400">
                    <span>Bio: </span>
                    <a href={account.bio_link} target="_blank" className="text-blue-400 hover:underline truncate block">
                      {account.bio_link}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStatus(account.id, account.status)}
                  className="flex-1"
                >
                  {account.status === 'active' ? (
                    <><Pause className="h-3 w-3 mr-1" /> Pause</>
                  ) : (
                    <><Play className="h-3 w-3 mr-1" /> Activate</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteAccount(account.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {accounts.length === 0 && !showAddForm && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="text-center py-12">
            <Twitter className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No accounts added yet</p>
            <Button onClick={() => setShowAddForm(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Account
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

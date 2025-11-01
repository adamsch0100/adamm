'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EditAccountModal } from '@/components/accounts/EditAccountModal'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface Account {
  id: number
  platform: string
  username: string
  email: string | null
  status: string
  created_at: string
}

interface PlatformConfig {
  icon: string
  gradient: string
  displayName: string
}

interface AccountsListProps {
  accounts: Account[]
  platformConfig: Record<string, PlatformConfig>
}

export function AccountsList({ accounts, platformConfig }: AccountsListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const supabase = createClient()

  const handleDelete = async (accountId: number, platform: string, username: string) => {
    if (!confirm(`Are you sure you want to remove the ${platform} account @${username}?`)) {
      return
    }

    setDeletingId(accountId)
    try {
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', accountId)

      if (error) throw error

      toast.success('Account removed successfully')
      window.location.reload()

    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Failed to remove account')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-4 px-4 text-gray-300 font-semibold">Platform</th>
            <th className="text-left py-4 px-4 text-gray-300 font-semibold">Username</th>
            <th className="text-left py-4 px-4 text-gray-300 font-semibold">Email</th>
            <th className="text-left py-4 px-4 text-gray-300 font-semibold">Status</th>
            <th className="text-left py-4 px-4 text-gray-300 font-semibold">Added</th>
            <th className="text-right py-4 px-4 text-gray-300 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => {
            const config = platformConfig[account.platform]
            return (
              <tr key={account.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{config?.icon}</span>
                    <span className="text-white font-semibold">{config?.displayName || account.platform}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-gray-200 font-medium">@{account.username}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-gray-300 text-sm">{account.email || '-'}</span>
                </td>
                <td className="py-4 px-4">
                  <Badge className={
                    account.status === 'active' 
                      ? 'bg-green-600/30 text-green-300 border border-green-500/50'
                      : account.status === 'warming_up'
                      ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/50'
                      : 'bg-gray-600/30 text-gray-300 border border-gray-500/50'
                  }>
                    {account.status}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <span className="text-gray-400 text-sm">
                    {new Date(account.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <EditAccountModal
                      account={account}
                      platformDisplayName={config?.displayName || account.platform}
                      platformIcon={config?.icon || '📱'}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(account.id, account.platform, account.username)}
                      disabled={deletingId === account.id}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      {deletingId === account.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}


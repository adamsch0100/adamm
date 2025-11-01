'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3000'

interface OperatorKeyManagerProps {
  service?: string
  onSuccess?: () => void
}

const SERVICE_INFO: Record<string, { name: string; description: string; hasSecret: boolean; link?: string }> = {
  'morelogin': {
    name: 'MoreLogin',
    description: 'Cloud phone management & automation',
    hasSecret: true,
    link: 'https://www.morelogin.com'
  },
  'openai': {
    name: 'OpenAI',
    description: 'AI video generation (Sora 2)',
    hasSecret: false,
    link: 'https://platform.openai.com/api-keys'
  },
  'google': {
    name: 'Google',
    description: 'AI video generation (Veo 3)',
    hasSecret: true, // For Project ID
    link: 'https://console.cloud.google.com'
  },
  'upload-post': {
    name: 'Upload-post',
    description: 'Multi-platform content posting',
    hasSecret: false,
    link: 'https://upload-post.com/dashboard/api'
  },
  'coinmarketcap': {
    name: 'CoinMarketCap',
    description: 'Crypto trending topics',
    hasSecret: false,
    link: 'https://coinmarketcap.com/api/'
  }
}

export function OperatorKeyManager({ service: initialService, onSuccess }: OperatorKeyManagerProps) {
  const [open, setOpen] = useState(false)
  const [service, setService] = useState(initialService || '')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [loading, setLoading] = useState(false)

  const serviceInfo = service ? SERVICE_INFO[service] : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get auth token
      const { data: { session } } = await (await import('@/lib/supabase/client')).createClient().auth.getSession()
      
      if (!session) {
        toast.error('Please log in to continue')
        return
      }

      const response = await fetch(`${MCP_SERVER_URL}/api/operator-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          service,
          apiKey,
          apiSecret: serviceInfo?.hasSecret ? apiSecret : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save operator setting')
      }

      toast.success(`${serviceInfo?.name || service} API key configured successfully!`)
      setOpen(false)
      setService('')
      setApiKey('')
      setApiSecret('')
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error('Save operator setting error:', error)
      toast.error(error.message || 'Failed to save operator setting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {initialService ? (
          <Button variant="outline" size="sm">
            {SERVICE_INFO[initialService]?.name ? 'Update' : 'Configure'}
          </Button>
        ) : (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Platform API Key
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialService ? `Update ${SERVICE_INFO[initialService]?.name || 'Service'}` : 'Add Platform API Key'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure operator-level API keys for platform services
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!initialService && (
            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Select value={service} onValueChange={setService} required>
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_INFO).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {serviceInfo && (
                <p className="text-xs text-gray-400">{serviceInfo.description}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="apiKey">
              {service === 'morelogin' ? 'API ID' : 'API Key'}
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={service === 'morelogin' ? 'Enter API ID' : 'Enter API key'}
              required
              disabled={loading}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          {serviceInfo?.hasSecret && (
            <div className="space-y-2">
              <Label htmlFor="apiSecret">
                {service === 'morelogin' ? 'Secret Key' : service === 'google' ? 'Project ID' : 'API Secret'}
              </Label>
              <Input
                id="apiSecret"
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder={service === 'morelogin' ? 'Enter secret key' : service === 'google' ? 'Enter project ID' : 'Enter API secret'}
                disabled={loading}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          )}

          {serviceInfo?.link && (
            <p className="text-xs text-gray-400">
              Get your API key from{' '}
              <a href={serviceInfo.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                {serviceInfo.link}
              </a>
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !service || !apiKey}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}












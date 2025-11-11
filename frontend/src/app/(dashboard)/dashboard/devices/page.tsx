'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Smartphone, Power, PowerOff, Activity, HardDrive, Eye, Zap } from 'lucide-react'
import { DeviceViewer } from '@/components/devices/DeviceViewer'
import { toast } from 'sonner'

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([])
  const [selectedDevice, setSelectedDevice] = useState<any>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [warmupLoading, setWarmupLoading] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setDevices([])
        setLoading(false)
        return
      }

      // Fetch from Next.js API proxy
      const response = await fetch('/api/morelogin/instances')

      if (!response.ok) {
        throw new Error('Failed to fetch devices')
      }

      const data = await response.json()
      
      // Transform MoreLogin API format to our frontend format
      const transformedDevices = data.instances?.map((instance: any) => ({
        id: instance.id,
        name: instance.envRemark || instance.envName,
        morelogin_env_name: instance.envName,
        country: instance.proxy?.countryCode || 'Unknown',
        status: instance.envStatus === 1 ? 'running' : 'stopped',
        adb_enabled: instance.enableAdb,
        adb_ip: instance.adbInfo?.host || null,
        adb_port: instance.adbInfo?.port || null,
        proxy_id: instance.proxyId !== '0' ? instance.proxyId : null,
        proxy_status: instance.proxy ? 'connected' : 'disconnected',
        proxy_country: instance.proxy?.countryCode || null,
        proxy_city: instance.proxy?.city || null,
        created_at: instance.createDate
      })) || []
      
      setDevices(transformedDevices)
    } catch (error) {
      console.error('Error fetching devices:', error)
      toast.error('Failed to load devices')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDevice = (device: any) => {
    setSelectedDevice(device)
    setViewerOpen(true)
  }

  const handleCreateDevice = async () => {
    setCreating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!session || !user) {
        toast.error('Please log in to continue')
        return
      }

      toast.info('Creating MoreLogin device...')

      const response = await fetch('/api/morelogin/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          name: `Device ${devices.length + 1}`,
          country: 'us',
          skuId: 10002, // Android 12 - try 10004, 10005, 10006 for Android 15
          autoProxy: true // Auto-assign available proxy
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create device')
        }

      toast.success('Device created successfully!')
      await fetchDevices()

    } catch (error: any) {
      console.error('Create device error:', error)
      toast.error(error.message || 'Failed to create device')
    } finally {
      setCreating(false)
    }
  }

  const handleRunWarmup = async (deviceId: number) => {
    setWarmupLoading(deviceId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please log in to continue')
        return
      }

      // Get first TikTok account for this user
      const { data: account } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('platform', 'tiktok')
        .limit(1)
        .maybeSingle()

      if (!account) {
        toast.error('Please add a TikTok account first in the Accounts page')
        return
      }

      toast.info('Starting warmup session... Open the device viewer to watch!')

      // Call warmup endpoint
      const response = await fetch('/api/warmup/execute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cloudPhoneId: deviceId,
          platform: 'tiktok',
          accountId: account.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run warmup')
      }

      toast.success(`Warmup completed! Performed ${data.warmup.actionsPerformed} actions`)

    } catch (error: any) {
      console.error('Warmup error:', error)
      toast.error(error.message || 'Failed to run warmup')
    } finally {
      setWarmupLoading(null)
    }
  }

  const stats = {
    totalDevices: devices.length,
    runningDevices: devices.filter(d => d.status === 'running').length,
    stoppedDevices: devices.filter(d => d.status === 'stopped').length,
    adbEnabled: devices.filter(d => d.adb_enabled).length
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Devices</h1>
          <p className="text-gray-400">
            Manage your virtual phone instances
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateDevice} disabled={creating}>
          {creating ? 'Creating...' : '+ Create Device'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Devices
            </CardTitle>
            <Smartphone className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalDevices}</div>
            <p className="text-xs text-gray-400">MoreLogin instances</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Running
            </CardTitle>
            <Power className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.runningDevices}</div>
            <p className="text-xs text-gray-400">Active now</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Stopped
            </CardTitle>
            <PowerOff className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.stoppedDevices}</div>
            <p className="text-xs text-gray-400">Idle</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              ADB Enabled
            </CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.adbEnabled}</div>
            <p className="text-xs text-gray-400">Automation ready</p>
          </CardContent>
        </Card>
      </div>

      {/* Devices List */}
      <div className="grid gap-4">
        {loading ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="py-12 text-center text-gray-400">
              <p>Loading devices...</p>
            </CardContent>
          </Card>
        ) : devices.length > 0 ? (
          devices.map((device) => (
            <Card key={device.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gray-700 rounded-lg">
                      <Smartphone className="h-8 w-8 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg">
                        {device.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {device.country || 'Unknown'} • {device.morelogin_env_name || `Device #${device.id}`}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge
                          variant={device.status === 'running' ? 'default' : 'secondary'}
                          className={
                            device.status === 'running'
                              ? 'bg-green-600'
                              : device.status === 'starting'
                              ? 'bg-yellow-600'
                              : 'bg-gray-600'
                          }
                        >
                          {device.status}
                        </Badge>
                        {device.adb_enabled && (
                          <Badge variant="outline" className="border-purple-500 text-purple-400">
                            ADB Ready
                          </Badge>
                        )}
                        {device.proxy_id && (
                          <Badge variant="outline" className="border-blue-500 text-blue-400">
                            Proxy Assigned
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    {device.adb_enabled && device.adb_ip && (
                      <div className="text-sm text-gray-400">
                        <code className="bg-gray-700 px-2 py-1 rounded text-xs">
                          {device.adb_ip}:{device.adb_port}
                        </code>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {device.status === 'stopped' ? (
                        <Button size="sm" variant="outline" className="text-green-500 border-green-500">
                          <Power className="h-4 w-4 mr-2" />
                          Power On
                        </Button>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-blue-500 border-blue-500"
                            onClick={() => handleViewDevice(device)}
                            disabled={!device.adb_enabled}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            className="btn-gradient"
                            onClick={() => handleRunWarmup(device.id)}
                            disabled={!device.adb_enabled || warmupLoading === device.id}
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            {warmupLoading === device.id ? 'Running...' : 'Run Warmup'}
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-500 border-red-500">
                            <PowerOff className="h-4 w-4 mr-2" />
                            Power Off
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline">
                        <HardDrive className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="py-12 text-center text-gray-400">
              <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No devices yet</p>
              <p className="text-sm mt-2">Create your first MoreLogin device to get started!</p>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={handleCreateDevice} disabled={creating}>
                {creating ? 'Creating...' : 'Create Device'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Device Viewer Modal */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl h-[90vh] bg-transparent border-0 p-0">
          {selectedDevice && (
            <DeviceViewer
              device={selectedDevice}
              onClose={() => setViewerOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

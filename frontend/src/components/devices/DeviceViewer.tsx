'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Power, PowerOff, RefreshCw, Maximize2, X } from 'lucide-react'
import { toast } from 'sonner'

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3000'

interface DeviceViewerProps {
  device: {
    id: number
    name: string
    status: string
    adb_enabled: boolean
    adb_ip?: string
    adb_port?: string
    adb_password?: string
  }
  onClose?: () => void
}

export function DeviceViewer({ device, onClose }: DeviceViewerProps) {
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(2000) // 2 seconds
  const [clickCoords, setClickCoords] = useState<{x: number, y: number} | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Capture screenshot
  const captureScreenshot = async () => {
    if (!device.adb_enabled || !device.adb_ip) {
      toast.error('ADB not enabled for this device')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch(`${MCP_SERVER_URL}/api/morelogin/screenshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adbIp: device.adb_ip,
          adbPort: device.adb_port,
          adbPassword: device.adb_password
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to capture screenshot')
      }

      const data = await response.json()
      
      if (data.success && data.screenshot) {
        // Screenshot is base64 encoded
        setScreenshot(`data:image/png;base64,${data.screenshot}`)
      }
    } catch (error: any) {
      console.error('Screenshot error:', error)
      if (autoRefresh) {
        // Don't show error toast during auto-refresh to avoid spam
        console.log('Screenshot failed, will retry...')
      } else {
        toast.error('Failed to capture screenshot')
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle click on screenshot to send tap command
  const handleScreenshotClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) * (1080 / rect.width)) // Scale to device resolution
    const y = Math.floor((e.clientY - rect.top) * (1920 / rect.height))

    setClickCoords({ x, y })

    try {
      const response = await fetch(`${MCP_SERVER_URL}/api/tiktok/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'tap',
          adbIp: device.adb_ip,
          adbPort: device.adb_port,
          adbPassword: device.adb_password,
          x,
          y
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send tap command')
      }

      toast.success(`Tapped at (${x}, ${y})`)

      // Clear click indicator after a moment
      setTimeout(() => setClickCoords(null), 500)

      // Refresh screenshot after tap
      setTimeout(() => captureScreenshot(), 1000)

    } catch (error: any) {
      toast.error('Failed to send tap command')
      setClickCoords(null)
    }
  }

  // Power on device
  const handlePowerOn = async () => {
    try {
      const response = await fetch(`${MCP_SERVER_URL}/api/morelogin/poweron`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cloud_phone_id: device.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to power on device')
      }

      toast.success('Device powering on...')
      
      // Wait for boot, then start capturing
      setTimeout(() => {
        setAutoRefresh(true)
        captureScreenshot()
      }, 30000) // 30 seconds boot time

    } catch (error: any) {
      toast.error('Failed to power on device')
    }
  }

  // Power off device
  const handlePowerOff = async () => {
    try {
      const response = await fetch(`${MCP_SERVER_URL}/api/morelogin/poweroff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cloud_phone_id: device.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to power off device')
      }

      toast.success('Device powered off')
      setAutoRefresh(false)
      setScreenshot(null)

    } catch (error: any) {
      toast.error('Failed to power off device')
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && device.adb_enabled) {
      // Initial capture
      captureScreenshot()

      // Set up interval
      intervalRef.current = setInterval(() => {
        captureScreenshot()
      }, refreshInterval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, refreshInterval, device.adb_enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <Card className="bg-gray-800 border-gray-700 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-white">{device.name}</CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant={device.status === 'running' ? 'default' : 'secondary'}>
              {device.status}
            </Badge>
            {device.adb_enabled && (
              <Badge variant="outline" className="border-purple-500 text-purple-400">
                ADB Ready
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {device.status === 'stopped' ? (
            <Button size="sm" variant="outline" onClick={handlePowerOn}>
              <Power className="h-4 w-4 mr-1" />
              Power On
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={handlePowerOff}>
              <PowerOff className="h-4 w-4 mr-1" />
              Power Off
            </Button>
          )}
          {onClose && (
            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 items-center">
            <Button
              size="sm"
              variant={autoRefresh ? 'default' : 'outline'}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-blue-600' : ''}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto' : 'Manual'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={captureScreenshot}
              disabled={loading || autoRefresh}
            >
              Refresh
            </Button>
            <select
              className="bg-gray-700 border-gray-600 text-white text-sm rounded px-2 py-1"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              disabled={!autoRefresh}
            >
              <option value={1000}>1s</option>
              <option value={2000}>2s</option>
              <option value={3000}>3s</option>
              <option value={5000}>5s</option>
            </select>
          </div>
          <div className="text-xs text-gray-400">
            Click on screen to tap
          </div>
        </div>

        {/* Screenshot Display */}
        <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden relative flex items-center justify-center">
          {screenshot ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                ref={imageRef}
                src={screenshot}
                alt="Device screenshot"
                className="max-w-full max-h-full object-contain cursor-crosshair"
                onClick={handleScreenshotClick}
              />
              {clickCoords && (
                <div
                  className="absolute w-8 h-8 rounded-full border-4 border-blue-500 bg-blue-500/20 pointer-events-none"
                  style={{
                    left: `${(clickCoords.x / 1080) * 100}%`,
                    top: `${(clickCoords.y / 1920) * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 p-8">
              {loading ? (
                <div className="space-y-2">
                  <RefreshCw className="h-12 w-12 animate-spin mx-auto" />
                  <p>Capturing screenshot...</p>
                </div>
              ) : device.status !== 'running' ? (
                <div className="space-y-2">
                  <PowerOff className="h-12 w-12 mx-auto opacity-50" />
                  <p>Device is powered off</p>
                  <Button onClick={handlePowerOn} variant="outline">
                    Power On Device
                  </Button>
                </div>
              ) : !device.adb_enabled ? (
                <div className="space-y-2">
                  <p>ADB not enabled</p>
                  <p className="text-xs">Enable ADB in device settings</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>No screenshot available</p>
                  <Button onClick={captureScreenshot} variant="outline">
                    Capture Screenshot
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Device Info */}
        {device.adb_enabled && device.adb_ip && (
          <div className="mt-4 text-xs text-gray-400 flex justify-between">
            <span>
              ADB: {device.adb_ip}:{device.adb_port}
            </span>
            <span className={loading ? 'text-blue-400' : ''}>
              {loading ? 'Refreshing...' : autoRefresh ? `Auto-refresh: ${refreshInterval / 1000}s` : 'Manual mode'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}














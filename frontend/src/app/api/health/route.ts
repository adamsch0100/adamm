import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { performanceMonitor } from '@/lib/performance'

export async function GET() {
  const startTime = Date.now()

  try {
    // Check Supabase connection
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single()

    const dbStatus = error ? 'error' : 'healthy'
    const dbResponseTime = Date.now() - startTime

    // System information
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    }

    // Environment check
    const envStatus = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      encryptionKey: !!process.env.ENCRYPTION_KEY
    }

    const performanceSummary = performanceMonitor.getSummary()

    const healthStatus = {
      status: dbStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      services: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
          lastChecked: new Date().toISOString()
        },
        environment: {
          status: Object.values(envStatus).every(Boolean) ? 'healthy' : 'warning',
          checks: envStatus
        }
      },
      system: systemInfo,
      performance: performanceSummary || {
        averagePageLoadTime: 0,
        averageApiResponseTime: 0,
        totalErrors: 0,
        memoryUsage: process.memoryUsage()
      }
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503

    return NextResponse.json(healthStatus, { status: statusCode })

  } catch (error: any) {
    console.error('Health check failed:', error)

    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: { status: 'error' },
        environment: { status: 'unknown' }
      }
    }

    return NextResponse.json(errorResponse, { status: 503 })
  }
}

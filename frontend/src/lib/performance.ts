// Performance monitoring utilities

export interface PerformanceMetrics {
  timestamp: string
  pageLoadTime?: number
  apiResponseTime?: number
  memoryUsage: NodeJS.MemoryUsage
  activeConnections?: number
  errorCount?: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private errorCount = 0

  constructor() {
    // Track unhandled errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', () => {
        this.errorCount++
      })

      window.addEventListener('unhandledrejection', () => {
        this.errorCount++
      })
    }
  }

  recordApiCall(responseTime: number) {
    this.recordMetric({
      timestamp: new Date().toISOString(),
      apiResponseTime: responseTime,
      memoryUsage: process.memoryUsage(),
      errorCount: this.errorCount
    })
  }

  recordPageLoad(loadTime: number) {
    this.recordMetric({
      timestamp: new Date().toISOString(),
      pageLoadTime: loadTime,
      memoryUsage: process.memoryUsage(),
      errorCount: this.errorCount
    })
  }

  private recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric)

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }

    // Log critical performance issues
    if (metric.pageLoadTime && metric.pageLoadTime > 3000) {
      console.warn(`Slow page load: ${metric.pageLoadTime}ms`)
    }

    if (metric.apiResponseTime && metric.apiResponseTime > 2000) {
      console.warn(`Slow API response: ${metric.apiResponseTime}ms`)
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  getSummary() {
    if (this.metrics.length === 0) return null

    const recent = this.metrics.slice(-10) // Last 10 metrics

    return {
      averagePageLoadTime: recent
        .filter(m => m.pageLoadTime)
        .reduce((sum, m) => sum + (m.pageLoadTime || 0), 0) /
        recent.filter(m => m.pageLoadTime).length || 0,

      averageApiResponseTime: recent
        .filter(m => m.apiResponseTime)
        .reduce((sum, m) => sum + (m.apiResponseTime || 0), 0) /
        recent.filter(m => m.apiResponseTime).length || 0,

      totalErrors: this.errorCount,
      memoryUsage: process.memoryUsage()
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()

// API response time middleware
export function withPerformanceMonitoring(handler: any) {
  return async (...args: any[]) => {
    const startTime = Date.now()

    try {
      const result = await handler(...args)
      const responseTime = Date.now() - startTime

      performanceMonitor.recordApiCall(responseTime)

      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      performanceMonitor.recordApiCall(responseTime)
      throw error
    }
  }
}

// Client-side performance tracking
export function trackPageLoad() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    window.addEventListener('load', () => {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
      performanceMonitor.recordPageLoad(loadTime)
    })
  }
}

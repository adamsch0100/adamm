'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard,
  Smartphone,
  Users,
  BarChart3,
  Settings,
  Video,
  Sparkles,
  Clock,
  Twitter,
  Package,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Flame
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: Sparkles },
  { name: 'Account Warmup', href: '/dashboard/warmup', icon: Flame, important: true },
  { name: 'Queue', href: '/dashboard/queue', icon: Clock },
  { name: 'Devices', href: '/dashboard/devices', icon: Smartphone },
  { name: 'Accounts', href: '/dashboard/accounts', icon: Users },
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const platforms = [
  { name: 'TikTok', icon: '🎵', color: 'text-gray-300' },
  { name: 'Instagram', icon: '📸', color: 'text-pink-400' },
  { name: 'YouTube', icon: '▶️', color: 'text-red-500' },
  { name: 'Facebook', icon: '👥', color: 'text-blue-500' },
  { name: 'LinkedIn', icon: '💼', color: 'text-blue-600' },
  { name: 'X/Twitter', icon: '𝕏', color: 'text-gray-400' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-gray-800 border-r border-gray-700 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-4 py-5 border-b border-gray-700">
          <Link href="/dashboard" className="text-xl font-bold text-white">
            🚀 Social Automation
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const isImportant = item.important
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? isImportant
                      ? 'bg-orange-900 text-white border-2 border-orange-500'
                      : 'bg-gray-900 text-white'
                    : isImportant
                    ? 'bg-orange-900/50 text-white hover:bg-orange-900 border border-orange-600'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Platforms */}
        <div className="p-4 border-t border-gray-700">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Platforms
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="flex flex-col items-center p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                title={platform.name}
              >
                <span className="text-xl">{platform.icon}</span>
                <span className="text-xs text-gray-400 mt-1">{platform.name.split('/')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


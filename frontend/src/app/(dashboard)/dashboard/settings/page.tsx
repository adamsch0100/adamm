import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Key, CreditCard, User, Bell, Shield, Lock, AlertCircle, Zap } from 'lucide-react'
import { OperatorKeyManager } from '@/components/settings/OperatorKeyManager'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  const isAdmin = profile?.is_admin || false

  // Fetch operator settings if admin
  let operatorSettings: Array<{ service: string; status: string; last_verified?: string; created_at: string }> = []
  if (isAdmin) {
    const { data } = await supabase
      .from('operator_settings')
      .select('service, status, last_verified, created_at')
      .order('service')
    operatorSettings = data || []
  }

  const operatorServices = ['morelogin', 'openai', 'google', 'upload-post', 'coinmarketcap']
  const configuredOperatorServices = new Set(operatorSettings.map(k => k.service))

  const serviceDescriptions: Record<string, { description: string; color: string }> = {
    morelogin: { description: 'Cloud phone management & automation', color: 'text-blue-400' },
    openai: { description: 'AI video generation (Sora 2)', color: 'text-purple-400' },
    google: { description: 'AI video generation (Veo 3)', color: 'text-orange-400' },
    'upload-post': { description: 'Multi-platform content posting', color: 'text-green-400' },
    coinmarketcap: { description: 'Crypto trending topics', color: 'text-yellow-400' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400 text-lg">
          Manage your account, API keys, and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="glass rounded-lg p-1 w-full justify-start">
          <TabsTrigger 
            value="profile"
            className="data-[state=active]:glass data-[state=active]:shadow-lg rounded-md"
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="api-keys"
            className="data-[state=active]:glass data-[state=active]:shadow-lg rounded-md"
          >
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger 
            value="billing"
            className="data-[state=active]:glass data-[state=active]:shadow-lg rounded-md"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger 
            value="notifications"
            className="data-[state=active]:glass data-[state=active]:shadow-lg rounded-md"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6 space-y-4">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-white text-xl">Profile Information</CardTitle>
              <CardDescription className="text-gray-400">
                Update your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="label-glass">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input-glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="label-glass">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  defaultValue={profile?.full_name || ''}
                  className="input-glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="label-glass">
                  Company Name
                </Label>
                <Input
                  id="company"
                  type="text"
                  defaultValue={profile?.company_name || ''}
                  className="input-glass"
                />
              </div>
              <Button className="btn-gradient">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab - Admin Only */}
        {isAdmin && (
          <TabsContent value="api-keys" className="mt-6 space-y-4">
            <Card className="card-glass ring-2 ring-yellow-500/50 border-yellow-500/30">
              <CardHeader className="flex flex-row items-start justify-between pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <CardTitle className="text-white text-xl">Platform API Keys</CardTitle>
                  </div>
                  <CardDescription className="text-gray-400">
                    Manage operator-level API keys for platform services
                  </CardDescription>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  Admin
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {operatorServices.map((service) => {
                  const isConfigured = configuredOperatorServices.has(service)
                  const serviceInfo = serviceDescriptions[service]
                  
                  return (
                    <div 
                      key={service} 
                      className={`p-4 rounded-lg transition-all duration-300 ${
                        isConfigured 
                          ? 'bg-gradient-to-r from-green-600/10 to-green-500/10 border border-green-500/20' 
                          : 'bg-gradient-to-r from-gray-700/30 to-gray-600/30 border border-gray-600/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white capitalize">
                              {service.replace('-', ' ')}
                            </h3>
                            {isConfigured && (
                              <Shield className="h-4 w-4 text-green-400" />
                            )}
                          </div>
                          <div className={`text-sm ${serviceInfo.color}`}>
                            {serviceInfo.description}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isConfigured && (
                            <Badge className="bg-green-600/30 text-green-300 border border-green-500/50">
                              Configured
                            </Badge>
                          )}
                          <OperatorKeyManager service={service} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
            
            <Card className="bg-yellow-500/10 border-yellow-500/30 card-glass">
              <CardContent className="pt-6 flex gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-200/90">
                    <strong>Admin Notice:</strong> These API keys are used platform-wide for all users. Changes affect the entire system. Users do not manage their own API keys.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        {!isAdmin && (
          <TabsContent value="api-keys" className="mt-6">
            <Card className="card-glass">
              <CardContent className="py-16 px-6">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10 text-blue-400">
                    <Lock className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">No API Keys Required</h3>
                    <p className="text-gray-400 max-w-sm mx-auto">
                      All platform services are managed by the system. You don't need to configure any API keys.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Billing Tab */}
        <TabsContent value="billing" className="mt-6 space-y-4">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-white text-xl">Subscription</CardTitle>
              <CardDescription className="text-gray-400">
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-white text-lg">
                      {profile?.subscription_plan?.charAt(0).toUpperCase() + profile?.subscription_plan?.slice(1)} Plan
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Status: <Badge className={
                        profile?.subscription_status === 'active' 
                          ? 'bg-green-600/30 text-green-300 border border-green-500/50' 
                          : 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/50'
                      }>
                        {profile?.subscription_status}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="btn-glass">
                    Manage Subscription
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-gray-700/30 to-gray-600/30 border border-gray-600/30">
                <h3 className="font-semibold text-white mb-4">Usage This Month</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-2 rounded bg-gray-700/20">
                    <span className="text-gray-300">Videos Generated</span>
                    <span className="font-semibold text-white">0 / Unlimited</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-gray-700/20">
                    <span className="text-gray-300">SMS Verifications</span>
                    <span className="font-semibold text-white">0</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-gray-700/20">
                    <span className="text-gray-300">Proxy Bandwidth</span>
                    <span className="font-semibold text-white">0 GB</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6 space-y-4">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-white text-xl">Notification Preferences</CardTitle>
              <CardDescription className="text-gray-400">
                Choose what you want to be notified about
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10 text-blue-400">
                  <Bell className="h-8 w-8 opacity-50" />
                </div>
                <p className="text-gray-400">Notification settings coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ContentUploader } from '@/components/content/ContentUploader'
import { Video, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function ContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's content posts
  const { data: posts } = await supabase
    .from('content_posts')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch user's Upload-post API key
  const { data: apiKeyData } = await supabase
    .from('user_api_keys')
    .select('api_key_encrypted')
    .eq('user_id', user?.id)
    .eq('service', 'upload-post')
    .single()

  const stats = {
    totalPosts: posts?.length || 0,
    totalViews: posts?.reduce((sum, post) => sum + (post.total_views || 0), 0) || 0,
    totalLikes: posts?.reduce((sum, post) => sum + (post.total_likes || 0), 0) || 0,
    pendingPosts: posts?.filter(p => p.status === 'posting' || p.status === 'generating').length || 0
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-black text-white mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Content
        </h1>
        <p className="text-gray-300 text-xl">
          Create and publish content across multiple platforms
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Posts
            </CardTitle>
            <Video className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalPosts}</div>
            <p className="text-xs text-gray-400">Across all platforms</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Views
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-gray-400">Combined reach</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Likes
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalLikes.toLocaleString()}</div>
            <p className="text-xs text-gray-400">Total engagement</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.pendingPosts}</div>
            <p className="text-xs text-gray-400">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Uploader */}
      <ContentUploader />

      {/* Recent Posts */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Posts</CardTitle>
          <CardDescription className="text-gray-400">
            Your latest content across all platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-4 bg-gray-750 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    {post.thumbnail_url ? (
                      <img
                        src={post.thumbnail_url}
                        alt="Post thumbnail"
                        className="w-16 h-16 rounded object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-700 rounded flex items-center justify-center">
                        <Video className="h-8 w-8 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-white">
                        {post.topic || 'Untitled Post'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {post.caption?.substring(0, 60)}...
                      </div>
                      <div className="flex gap-2 mt-2">
                        {post.target_platforms?.map((platform: string) => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      {post.total_views?.toLocaleString() || 0} views
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                    <Badge
                      variant={post.status === 'posted' ? 'default' : 'secondary'}
                      className="mt-2"
                    >
                      {post.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No content posts yet</p>
              <p className="text-sm mt-2">Generate your first video to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}




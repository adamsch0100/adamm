'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  Video, Image, Youtube, Scissors,
  Sparkles, Upload, Loader2
} from 'lucide-react'

export default function RepurposePage() {
  const [loading, setLoading] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [images, setImages] = useState<string[]>([])
  const supabase = createClient()

  const handleYoutubeSplit = async () => {
    if (!youtubeUrl) {
      toast.error('Enter a YouTube URL')
      return
    }

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('http://localhost:3000/api/repurpose/youtube-split', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          youtubeUrl,
          options: {
            clipDuration: 30,
            maxClips: 10,
            autoCaption: true
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Created ${result.clips} Shorts!`)
        setYoutubeUrl('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to split video')
      }

    } catch (error: any) {
      toast.error(error.message || 'Failed to split video')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSlideshow = async () => {
    if (images.length === 0) {
      toast.error('Add at least one image')
      return
    }

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('http://localhost:3000/api/repurpose/slideshow-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          images,
          options: {
            template: 'viral',
            duration: 3
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Slideshow created!')
        setImages([])
      }

    } catch (error: any) {
      toast.error(error.message || 'Failed to create slideshow')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Scissors className="h-8 w-8" />
          Content Repurposing
        </h1>
        <p className="text-gray-400 mt-2">
          Maximize content value: YouTube → Shorts, Images → Slideshows
        </p>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="youtube" className="space-y-6">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="youtube">YouTube → Shorts</TabsTrigger>
          <TabsTrigger value="slideshow">Slideshow Creator</TabsTrigger>
        </TabsList>

        {/* YouTube Splitter */}
        <TabsContent value="youtube" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-500" />
                YouTube to Shorts Converter
              </CardTitle>
              <CardDescription>
                Split long videos into 10 viral Shorts (15-60s each)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">
                  YouTube URL
                </label>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <Button onClick={handleYoutubeSplit} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Scissors className="mr-2 h-4 w-4" />
                    Split Into Shorts
                  </>
                )}
              </Button>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-400 mb-2">How It Works:</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• AI analyzes video for engaging moments</li>
                  <li>• Extracts 10 best clips (30s each)</li>
                  <li>• Adds captions automatically</li>
                  <li>• Formats for YouTube Shorts (9:16)</li>
                  <li>• Ready to post to all accounts</li>
                </ul>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <h4 className="text-sm font-medium text-purple-400 mb-2">Case Study:</h4>
                <p className="text-xs text-gray-400">
                  Panna AI generated <strong>11.7M views in 12 days</strong> and made 
                  <strong> $16,700 in ad revenue</strong> by repurposing long videos into Shorts.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Slideshow Creator */}
        <TabsContent value="slideshow" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Image className="h-5 w-5" />
                TikTok Slideshow Creator
              </CardTitle>
              <CardDescription>
                Convert images into viral TikTok-style slideshow videos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">
                  Image URLs (one per line)
                </label>
                <textarea
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
                  value={images.join('\n')}
                  onChange={(e) => setImages(e.target.value.split('\n').filter(Boolean))}
                  rows={5}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-3"
                />
              </div>

              <Button onClick={handleCreateSlideshow} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Slideshow Video
                  </>
                )}
              </Button>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-400 mb-2">Case Study:</h4>
                <p className="text-xs text-gray-400">
                  0adspend increased conversions by <strong>400%</strong> using slideshow posts.
                  Made <strong>$24k/month</strong> with this format on TikTok.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}



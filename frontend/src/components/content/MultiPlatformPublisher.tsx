'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Platform, PLATFORM_CONFIG } from '@/types'
import { postToMultiplePlatforms } from '@/lib/api/upload-post'

interface MultiPlatformPublisherProps {
  videoUrl: string
  videoId: string
  uploadPostApiKey?: string
}

export function MultiPlatformPublisher({ videoUrl, videoId, uploadPostApiKey }: MultiPlatformPublisherProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])
  const [captions, setCaptions] = useState<Record<string, string>>({})
  const [posting, setPosting] = useState(false)

  const platforms: Platform[] = ['tiktok', 'instagram', 'youtube', 'facebook', 'linkedin', 'twitter']

  const togglePlatform = (platform: Platform) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform))
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform])
      // Set default caption if not set
      if (!captions[platform]) {
        setCaptions({ ...captions, [platform]: captions['default'] || '' })
      }
    }
  }

  const updateCaption = (platform: string, text: string) => {
    setCaptions({ ...captions, [platform]: text })
  }

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform')
      return
    }

    if (!uploadPostApiKey) {
      toast.error('Upload-post API key not configured. Please add it in Settings.')
      return
    }

    setPosting(true)

    try {
      const result = await postToMultiplePlatforms({
        videoUrl,
        platforms: selectedPlatforms,
        captions: selectedPlatforms.reduce((acc, platform) => {
          acc[platform] = captions[platform] || captions.default || ''
          return acc
        }, {} as Record<string, string>),
        uploadPostApiKey
      })

      toast.success(`Successfully posted to ${selectedPlatforms.length} platform(s)!`)
      console.log('Post result:', result)

    } catch (error: any) {
      toast.error(error.message || 'Failed to post content')
      console.error('Posting error:', error)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Select Platforms</CardTitle>
          <CardDescription className="text-gray-400">
            Choose which platforms to publish this content to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {platforms.map((platform) => {
              const config = PLATFORM_CONFIG[platform]
              const isSelected = selectedPlatforms.includes(platform)
              
              return (
                <Card
                  key={platform}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 border-2 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-750 hover:border-gray-600'
                  }`}
                  onClick={() => togglePlatform(platform)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{config.icon}</div>
                    <div className="font-semibold text-white">{config.name}</div>
                    {isSelected && (
                      <Badge className="mt-2 bg-blue-600 text-white">Selected</Badge>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedPlatforms.length > 0 && (
        <>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Platform-Specific Captions</CardTitle>
              <CardDescription className="text-gray-400">
                Customize captions for each platform (or use default for all)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Default Caption */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Default Caption (all platforms)
                </label>
                <Textarea
                  value={captions['default'] || ''}
                  onChange={(e) => updateCaption('default', e.target.value)}
                  placeholder="Enter a default caption for all platforms..."
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>

              <Separator className="bg-gray-700" />

              {/* Platform-Specific Captions */}
              {selectedPlatforms.map((platform) => {
                const config = PLATFORM_CONFIG[platform]
                const caption = captions[platform] || captions['default'] || ''
                const remaining = config.captionMaxLength - caption.length

                return (
                  <div key={platform}>
                    <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-2">
                      <span>{config.icon}</span>
                      <span>{config.name} Caption</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {remaining} characters remaining
                      </span>
                    </label>
                    <Textarea
                      value={captions[platform] || ''}
                      onChange={(e) => updateCaption(platform, e.target.value)}
                      placeholder={`Caption for ${config.name} (optional - uses default if empty)`}
                      className="bg-gray-700 border-gray-600 text-white"
                      rows={2}
                      maxLength={config.captionMaxLength}
                    />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <div className="text-gray-400">
              Publishing to <span className="font-bold text-white">{selectedPlatforms.length}</span> platform(s)
            </div>
            <Button
              onClick={handlePublish}
              size="lg"
              disabled={posting || selectedPlatforms.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {posting ? 'Publishing...' : `Publish to ${selectedPlatforms.length} Platform(s)`}
            </Button>
          </div>
        </>
      )}

      {!uploadPostApiKey && (
        <Card className="bg-yellow-500/10 border-yellow-500/50">
          <CardContent className="pt-6">
            <p className="text-yellow-500 text-sm">
              ⚠️ Upload-post API key not configured. Please add your API key in Settings to enable multi-platform posting.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


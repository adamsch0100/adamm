'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Upload, Video, Image as ImageIcon, CheckCircle2 } from 'lucide-react'

const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'from-gray-700 to-gray-600' },
  { id: 'instagram', name: 'Instagram', icon: '📸', color: 'from-pink-600 to-rose-500' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', color: 'from-red-600 to-orange-500' },
  { id: 'facebook', name: 'Facebook', icon: '👥', color: 'from-blue-600 to-blue-500' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'from-blue-700 to-blue-600' },
  { id: 'twitter', name: 'X (Twitter)', icon: '𝕏', color: 'from-gray-600 to-slate-500' }
]

interface ContentUploaderProps {
  onSuccess?: () => void
}

export function ContentUploader({ onSuccess }: ContentUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const supabase = createClient()

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const handleUpload = async () => {
    if (!title || !videoUrl || selectedPlatforms.length === 0) {
      toast.error('Please fill in all required fields and select at least one platform')
      return
    }

    setUploading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please log in to continue')
        return
      }

      // Upload video via Upload-Post
      const response = await fetch('http://localhost:3000/api/upload-post/upload-video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          video_url: videoUrl,
          title,
          description,
          platforms: selectedPlatforms
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload video')
      }

      toast.success('Video uploaded successfully!')
      
      // Reset form
      setTitle('')
      setDescription('')
      setVideoUrl('')
      setSelectedPlatforms([])

      // Call success callback
      if (onSuccess) onSuccess()

    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload video')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
          <Upload className="h-6 w-6 text-blue-400" />
          Upload Content
        </CardTitle>
        <CardDescription className="text-gray-300 text-base">
          Upload and publish your video across multiple social platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Video URL */}
        <div className="space-y-3">
          <Label htmlFor="videoUrl" className="label-glass text-base">
            Video URL <span className="text-red-400">*</span>
          </Label>
          <Input
            id="videoUrl"
            type="url"
            placeholder="https://example.com/video.mp4"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="input-glass text-base py-3"
          />
          <p className="text-sm text-gray-400">
            Provide a direct URL to your video file (MP4 format recommended)
          </p>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <Label htmlFor="title" className="label-glass text-base">
            Title <span className="text-red-400">*</span>
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="Amazing video title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-glass text-base py-3"
            maxLength={100}
          />
          <p className="text-sm text-gray-400">
            {title.length}/100 characters
          </p>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <Label htmlFor="description" className="label-glass text-base">
            Description (Optional)
          </Label>
          <Textarea
            id="description"
            placeholder="Describe your video..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-glass text-base resize-none"
            rows={4}
            maxLength={2000}
          />
          <p className="text-sm text-gray-400">
            {description.length}/2000 characters
          </p>
        </div>

        {/* Platform Selection */}
        <div className="space-y-4">
          <Label className="label-glass text-base">
            Select Platforms <span className="text-red-400">*</span>
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PLATFORMS.map((platform) => (
              <div 
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                className={`p-4 rounded-xl bg-gradient-to-br ${platform.color} cursor-pointer transition-all duration-300 ${
                  selectedPlatforms.includes(platform.id)
                    ? 'ring-2 ring-green-400 shadow-xl scale-105'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <div className="text-center space-y-2">
                  <span className="text-4xl block">{platform.icon}</span>
                  <span className="text-sm text-white font-semibold block">{platform.name}</span>
                  {selectedPlatforms.includes(platform.id) && (
                    <CheckCircle2 className="h-5 w-5 text-green-400 mx-auto" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400">
            {selectedPlatforms.length === 0 
              ? 'Click to select platforms'
              : `${selectedPlatforms.length} platform(s) selected`
            }
          </p>
        </div>

        {/* Upload Button */}
        <div className="pt-4 border-t border-white/10">
          <Button
            onClick={handleUpload}
            disabled={uploading || !title || !videoUrl || selectedPlatforms.length === 0}
            className="w-full btn-gradient text-lg py-4 font-bold shadow-xl shadow-blue-500/30"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Uploading to {selectedPlatforms.length} platform(s)...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Upload & Publish
              </>
            )}
          </Button>
        </div>

        {/* Info Note */}
        <div className="p-4 rounded-lg bg-blue-600/10 border border-blue-500/30">
          <p className="text-sm text-blue-100/80 leading-relaxed">
            💡 <strong>Tip:</strong> Make sure you've added your social accounts on the{' '}
            <a href="/dashboard/accounts" className="text-blue-400 underline hover:text-blue-300">
              Accounts page
            </a>{' '}
            before uploading content. Your video will be posted to all selected platforms automatically.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}


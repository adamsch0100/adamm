'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { 
  Package, BookOpen, DollarSign, Link as LinkIcon,
  TrendingUp, Loader2, ExternalLink, Sparkles
} from 'lucide-react'

export default function ProductsPage() {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [salesStats, setSalesStats] = useState<any>(null)
  const supabase = createClient()

  // Ebook generator state
  const [topic, setTopic] = useState('')
  const [title, setTitle] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Fetch products
      const productsRes = await fetch('http://localhost:3000/api/products', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.products || [])
      }

      // Fetch sales stats
      const statsRes = await fetch('http://localhost:3000/api/products/sales', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      if (statsRes.ok) {
        setSalesStats(await statsRes.json())
      }

    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  const handleGenerateEbook = async () => {
    if (!topic) {
      toast.error('Enter a topic for the ebook')
      return
    }

    setGenerating(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('http://localhost:3000/api/products/ebook/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          topic,
          title: title || undefined,
          pageCount: 200,
          chapters: 10,
          generateCover: true
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Ebook "${result.title}" generated!`)
        setTopic('')
        setTitle('')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Generation failed')
      }

    } catch (error: any) {
      toast.error(error.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleCreatePaymentLink = async (productId: number) => {
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('http://localhost:3000/api/products/payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ productId })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Payment link created!')
        navigator.clipboard.writeText(result.paymentUrl)
        toast.success('Link copied to clipboard!')
      }

    } catch (error: any) {
      toast.error(error.message || 'Failed to create payment link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Package className="h-8 w-8" />
          Digital Products
        </h1>
        <p className="text-gray-400 mt-2">
          Generate AI ebooks, create bundles, and sell with payment links
        </p>
      </div>

      {/* Stats */}
      {salesStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{salesStats.total_sales || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                ${salesStats.total_revenue?.toFixed(2) || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Avg Sale Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                ${salesStats.avg_sale_value?.toFixed(2) || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ebook Generator */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            AI Ebook Generator
          </CardTitle>
          <CardDescription>
            Generate 200-page ebook in 30-40 minutes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Topic</label>
            <Input
              placeholder="e.g., Crypto Trading for Beginners"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Title (optional)</label>
            <Input
              placeholder="e.g., The Complete Crypto Trading Guide"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <Button 
            onClick={handleGenerateEbook} 
            disabled={generating || !topic}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating (30-40 min)...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate 200-Page Ebook
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500">
            AI will generate 10 chapters, 200 pages, plus cover image. Exports as PDF.
          </p>
        </CardContent>
      </Card>

      {/* Products Library */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Your Products</CardTitle>
          <CardDescription>
            {products.length} digital product{products.length !== 1 && 's'} created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-600 mb-4" />
              <p>No products yet. Generate an ebook above to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product: any) => (
                <div key={product.id} className="p-4 bg-gray-700/50 rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-white">{product.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{product.description}</p>
                    </div>
                    <Badge>{product.product_type}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-400">
                      <div className="flex gap-4">
                        <span>${product.price_usd}</span>
                        <span>•</span>
                        <span>{product.total_sales} sales</span>
                        <span>•</span>
                        <span>${product.total_revenue?.toFixed(2)} revenue</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {product.file_url && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(product.file_url, '_blank')}
                        className="flex-1"
                      >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        View PDF
                      </Button>
                    )}
                    <Button 
                      size="sm"
                      onClick={() => handleCreatePaymentLink(product.id)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <LinkIcon className="mr-2 h-3 w-3" />
                      Payment Link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



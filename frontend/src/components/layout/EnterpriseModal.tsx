'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Check, Zap, Users, Headphones, Shield } from 'lucide-react'

export function EnterpriseModal() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [inquiry, setInquiry] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission (typically sends to backend/email service)
    console.log({ email, company, inquiry })
    setSubmitted(true)
    setTimeout(() => {
      setOpen(false)
      setSubmitted(false)
      setEmail('')
      setCompany('')
      setInquiry('')
    }, 2000)
  }

  return (
    <>
      <Button variant="outline" className="btn-glass" onClick={() => setOpen(true)}>
        View Enterprise Options
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl gradient-text">Enterprise Plan</DialogTitle>
            <DialogDescription className="text-gray-300 text-base">
              Scale unlimited across all platforms with dedicated support
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Enterprise Features */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Everything includes:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: Users, label: '225+ profiles', desc: 'Manage unlimited accounts' },
                  { icon: Zap, label: 'Unlimited videos', desc: 'Generate as much content as needed' },
                  { icon: Shield, label: 'API access', desc: 'Full programmatic integration' },
                  { icon: Headphones, label: 'Dedicated support', desc: '24/7 priority assistance' },
                ].map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div key={index} className="flex gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20">
                      <Icon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-white text-sm">{feature.label}</div>
                        <div className="text-xs text-gray-400">{feature.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Pricing Note */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-200">
                <strong>Custom Pricing:</strong> Enterprise plans are customized based on your scale and requirements. Contact our sales team for a personalized quote.
              </p>
            </div>

            {/* Contact Form */}
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="label-glass">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
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
                    placeholder="Your company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                    className="input-glass"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inquiry" className="label-glass">
                    Tell us about your needs (optional)
                  </Label>
                  <Textarea
                    id="inquiry"
                    placeholder="Describe your use case, scale, and specific requirements..."
                    value={inquiry}
                    onChange={(e) => setInquiry(e.target.value)}
                    className="input-glass resize-none"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 btn-gradient"
                  >
                    Contact Sales
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="btn-glass"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600/20 text-green-400">
                  <Check className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Request Submitted!</h4>
                  <p className="text-gray-400 text-sm">
                    Our sales team will contact you shortly to discuss your enterprise needs.
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}














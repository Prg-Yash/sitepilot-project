'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import BlurText from '@/components/ui/BlurText'
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { forgetPassword } from '@/lib/auth-client'

function ForgotPasswordContent() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setError('')
    setLoading(true)

    try {
      const redirectTo = `${window.location.origin}/reset-password`
      await forgetPassword({
        email,
        redirectTo,
      })
      setSubmitted(true)
    } catch (err) {
      console.error('Password reset request error:', err)
      setError(err.message || 'Failed to send password reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0b1411] via-[#0f211d] to-[#0c1a16] font-sans relative overflow-hidden text-white">
      {/* Faint grid overlay */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Left Side - Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo & Back button */}
          <div className="mb-10 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5 w-6">
                <span className="w-5 h-[3px] bg-[#d3ff4a] rounded-full" />
                <span className="w-6 h-[3px] bg-[#00e5ff] rounded-full" />
                <span className="w-4 h-[3px] bg-white rounded-full" />
              </div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">SitePilot</h1>
            </Link>

            <Link
              href="/signin"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>

          {!submitted ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <BlurText
                  text="Forgot Password"
                  delay={50}
                  className="text-4xl sm:text-5xl font-black text-white mb-3 uppercase tracking-tighter"
                  animateBy="words"
                />
                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                  Enter the email address associated with your account, and we will send you a link to reset your password.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm text-gray-300 mb-2 font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="w-full px-4 py-3 pl-11 bg-[#0b1411]/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#d3ff4a] focus:ring-2 focus:ring-[#d3ff4a]/20 transition-all font-medium"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3.5 bg-[#d3ff4a] text-[#0a1512] font-black uppercase tracking-wider text-xs rounded-full hover:bg-[#c0eb3f] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-[0_0_20px_rgba(211,255,74,0.15)] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success confirmation state */
            <div className="bg-[#0f211d]/90 border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-[#d3ff4a]/10 border border-[#d3ff4a]/30 text-[#d3ff4a] flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                Check Your Inbox
              </h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                If an account exists for <strong className="text-white font-bold">{email}</strong>, you will receive an email with instructions to reset your password.
              </p>

              <div className="space-y-3">
                <Link
                  href="/signin"
                  className="w-full inline-flex items-center justify-center py-3 px-6 bg-[#d3ff4a] text-[#0a1512] text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#c0eb3f] transition-all shadow-md"
                >
                  Return to Sign In
                </Link>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="w-full py-2.5 text-xs font-bold text-gray-400 hover:text-white transition-colors block"
                >
                  Didn't receive an email? Try again
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Remember your password?{' '}
              <Link href="/signin" className="text-[#d3ff4a] hover:text-[#c0eb3f] font-bold transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Feature Showcase */}
      <div className="hidden lg:flex w-1/2 p-12 items-center justify-center relative">
        <div className="max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#d3ff4a] text-xs font-bold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-[#d3ff4a] animate-pulse"></span>
            Account Security
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight uppercase leading-tight mb-4">
            Fast, secure, & reliable website creation
          </h2>
          <p className="text-gray-400 text-base leading-relaxed mb-8">
            Access multi-tenant websites, visual builder workspaces, and AI generation with protected session isolation.
          </p>

          <div className="bg-[#0b1411]/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Encrypted Credentials</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Password reset links use cryptographic verification tokens that expire automatically after 1 hour.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0b1411]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#d3ff4a]" />
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  )
}

'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BlurText from '@/components/ui/BlurText'
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { resetPassword } from '@/lib/auth-client'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const errorParam = searchParams.get('error')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(errorParam ? 'Your reset link is invalid or has expired.' : '')
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    let timer
    if (success && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    } else if (success && countdown === 0) {
      router.push('/signin')
    }
    return () => clearTimeout(timer)
  }, [success, countdown, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Missing password reset token. Please request a new link.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords are identical.')
      return
    }

    setLoading(true)

    try {
      await resetPassword({
        newPassword: password,
        token: token,
      })
      setSuccess(true)
    } catch (err) {
      console.error('Password reset error:', err)
      setError(err.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  // Token missing state
  if (!token && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b1411] via-[#0f211d] to-[#0c1a16] px-6 text-white">
        <div className="max-w-md w-full bg-[#0f211d]/90 border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
            Invalid Reset Link
          </h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            This password reset link is invalid or missing a security token. Please request a new password reset link.
          </p>
          <Link
            href="/forgot-password"
            className="w-full inline-flex items-center justify-center py-3.5 px-6 bg-[#d3ff4a] text-[#0a1512] text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#c0eb3f] transition-all shadow-md"
          >
            Request New Link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0b1411] via-[#0f211d] to-[#0c1a16] font-sans relative overflow-hidden text-white">
      {/* Faint grid overlay */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Left Side - Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
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
              className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
            >
              Back to Sign In
            </Link>
          </div>

          {!success ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <BlurText
                  text="New Password"
                  delay={50}
                  className="text-4xl sm:text-5xl font-black text-white mb-3 uppercase tracking-tighter"
                  animateBy="words"
                />
                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                  Enter your new password below. Make sure it is at least 8 characters long.
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
                {/* New Password */}
                <div>
                  <label htmlFor="password" className="block text-sm text-gray-300 mb-2 font-medium">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      className="w-full px-4 py-3 pl-11 pr-11 bg-[#0b1411]/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#d3ff4a] focus:ring-2 focus:ring-[#d3ff4a]/20 transition-all font-medium"
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm text-gray-300 mb-2 font-medium">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      className="w-full px-4 py-3 pl-11 pr-11 bg-[#0b1411]/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#d3ff4a] focus:ring-2 focus:ring-[#d3ff4a]/20 transition-all font-medium"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className="w-full py-3.5 bg-[#d3ff4a] text-[#0a1512] font-black uppercase tracking-wider text-xs rounded-full hover:bg-[#c0eb3f] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-[0_0_20px_rgba(211,255,74,0.15)] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success confirmation */
            <div className="bg-[#0f211d]/90 border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-[#d3ff4a]/10 border border-[#d3ff4a]/30 text-[#d3ff4a] flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                Password Reset!
              </h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Your password has been successfully updated. You can now sign in with your new credentials.
              </p>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 mb-6 text-xs text-gray-300 font-medium">
                Redirecting to sign in in <strong className="text-[#d3ff4a]">{countdown}s</strong>...
              </div>

              <Link
                href="/signin"
                className="w-full inline-flex items-center justify-center py-3.5 px-6 bg-[#d3ff4a] text-[#0a1512] text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#c0eb3f] transition-all shadow-md gap-1.5"
              >
                Sign In Now <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Feature Showcase */}
      <div className="hidden lg:flex w-1/2 p-12 items-center justify-center relative">
        <div className="max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#d3ff4a] text-xs font-bold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-[#d3ff4a]"></span>
            Multi-Tenant Security
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight uppercase leading-tight mb-4">
            Protecting your websites and workspaces
          </h2>
          <p className="text-gray-400 text-base leading-relaxed mb-8">
            All passwords are encrypted with industry-standard hashing algorithms ensuring complete credential isolation.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0b1411]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#d3ff4a]" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

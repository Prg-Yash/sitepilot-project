import { createAuthClient } from "better-auth/react"
import { twoFactorClient } from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect: () => {
        window.location.href = "/2fa"
      },
    }),
    passkeyClient(),
  ]
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  user,
  session,
} = authClient

export const forgetPassword = async ({ email, redirectTo }) => {
  try {
    if (typeof authClient.forgetPassword === 'function') {
      return await authClient.forgetPassword({ email, redirectTo })
    }
  } catch (e) {
    // Fallback to direct API
  }
  const res = await fetch('/api/auth/forget-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, redirectTo }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to send reset link')
  }
  return data
}

export const resetPassword = async ({ newPassword, token }) => {
  try {
    if (typeof authClient.resetPassword === 'function') {
      return await authClient.resetPassword({ newPassword, token })
    }
  } catch (e) {
    // Fallback to direct API
  }
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword, token }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to reset password')
  }
  return data
}

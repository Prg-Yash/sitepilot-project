import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import prisma from "./prisma.js"
import { nextCookies } from "better-auth/next-js"
import { sendVerificationEmail, sendResetPasswordEmail, sendWelcomeEmail, sendDeleteAccountVerificationEmail } from "./email.js"
import { twoFactor, openAPI } from "better-auth/plugins"
import { passkey } from "@better-auth/passkey"

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "1LG7Ao3N7VQ3wwIA0PWg57J0qeC6bMDB",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, url, newEmail }) => {
        await sendVerificationEmail({
          to: newEmail,
          verificationUrl: url
        })
      }
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        await sendDeleteAccountVerificationEmail({ user, url })
      }
    }
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
    sendResetPassword: async ({ user, url }) => {
      try {
        await sendResetPasswordEmail({
          to: user.email,
          resetPasswordUrl: url
        })
      } catch (err) {
        console.warn('Error sending reset password email:', err?.message || err)
      }
    }
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: false,
    sendVerificationEmail: async ({ user, url }) => {
      try {
        await sendVerificationEmail({
          to: user.email,
          verificationUrl: url
        })
      } catch (err) {
        console.warn('Error sending verification email:', err?.message || err)
      }
    }
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              emailVerified: true
            }
          }
        }
      }
    }
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [nextCookies(), twoFactor(), openAPI(), passkey()],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  advanced: {
    generateId: () => {
      return crypto.randomUUID()
    }
  }
})

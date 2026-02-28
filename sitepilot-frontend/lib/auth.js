import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import prisma from "./prisma.js"
import { nextCookies } from "better-auth/next-js"
import { sendVerificationEmail, sendResetPasswordEmail, sendWelcomeEmail, sendDeleteAccountVerificationEmail } from "./email.js"
import { twoFactor, openAPI } from "better-auth/plugins"
import { passkey } from "@better-auth/passkey"

export const auth = betterAuth({
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
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({
        to: user.email,
        resetPasswordUrl: url
      })
    }
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        to: user.email,
        verificationUrl: url
      })
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

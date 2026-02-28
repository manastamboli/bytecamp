import nodemailer from 'nodemailer'

let _transporter = null

function getTransporter() {
  if (_transporter) return _transporter

  const user = process.env.GMAIL_ADDRESS || process.env.EMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD

  if (!user || !pass) {
    console.warn('Email credentials not configured. Email sending will be skipped.')
    return null
  }

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })

  return _transporter
}

function getFromAddress() {
  return process.env.GMAIL_ADDRESS || process.env.EMAIL_USER
}

export async function sendInvitationEmail({ to, tenantName, role, acceptUrl, declineUrl }) {
  const transporter = getTransporter()
  if (!transporter) return false

  const mailOptions = {
    from: getFromAddress(),
    to,
    subject: `Invitation to join ${tenantName} on DevAlly`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 8px 10px 0; font-weight: bold; font-size: 14px; }
            .accept-btn { background-color: #3b82f6; color: #ffffff; }
            .decline-btn { background-color: #e5e7eb; color: #374151; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>You've been invited to join ${tenantName}</h2>
            <p>You have been invited to join the workspace <strong>${tenantName}</strong> as a <strong>${role}</strong>.</p>
            <p>Would you like to accept this invitation?</p>
            <div>
              <a href="${acceptUrl}" class="button accept-btn">Accept Invitation</a>
              <a href="${declineUrl}" class="button decline-btn">Decline</a>
            </div>
            <div class="footer">
              <p>This invitation will expire in 7 days.</p>
              <p>If you don't want to join this workspace, you can click Decline or simply ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Invitation email sent to ${to}`)
    return true
  } catch (error) {
    console.error('Error sending invitation email:', error)
    return false
  }
}

export async function sendVerificationEmail({ to, verificationUrl }) {
  const transporter = getTransporter()
  if (!transporter) throw new Error('Email not configured')

  const mailOptions = {
    from: getFromAddress(),
    to,
    subject: 'Verify Your Email Address',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #007bff;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all;">${verificationUrl}</p>
            <div class="footer">
              <p>If you didn't create an account, you can safely ignore this email.</p>
              <p>This link will expire in 24 hours.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Verification email sent to ${to}`)
  } catch (error) {
    console.error('Error sending verification email:', error)
    throw error
  }
}

export async function sendWelcomeEmail({ to, name }) {
  const transporter = getTransporter()
  if (!transporter) return

  const mailOptions = {
    from: getFromAddress(),
    to,
    subject: 'Welcome to DevAlly!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #28a745;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome to DevAlly, ${name || 'there'}!</h2>
            <p>We're excited to have you on board. Get started by creating your first website:</p>
            <a href="${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/dashboard" class="button">Go to Dashboard</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Welcome email sent to ${to}`)
  } catch (error) {
    console.error('Error sending welcome email:', error)
  }
}

export async function sendResetPasswordEmail({ to, resetPasswordUrl }) {
  const transporter = getTransporter()
  if (!transporter) throw new Error('Email not configured')

  const mailOptions = {
    from: getFromAddress(),
    to,
    subject: 'Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #dc3545;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetPasswordUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all;">${resetPasswordUrl}</p>
            <div class="footer">
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
              <p>This link will expire in 1 hour.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Password reset email sent to ${to}`)
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw error
  }
}

export async function sendDeleteAccountVerificationEmail({ user, url }) {
  const transporter = getTransporter()
  if (!transporter) throw new Error('Email not configured')

  const mailOptions = {
    from: getFromAddress(),
    to: user.email,
    subject: 'Confirm Account Deletion',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #dc3545;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Confirm Account Deletion</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>We received a request to delete your account. This action is permanent and cannot be undone.</p>
            <p>If you're sure you want to proceed, click the button below:</p>
            <a href="${url}" class="button">Confirm Deletion</a>
            <div class="footer">
              <p>If you didn't request this, please ignore this email and your account will remain active.</p>
              <p>This link will expire in 1 hour.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Delete account verification email sent to ${user.email}`)
  } catch (error) {
    console.error('Error sending delete account email:', error)
    throw error
  }
}

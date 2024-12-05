const { Resend } = require('resend')

/**
 * Email service using Resend
 * 
 * Why use Resend?
 * - Modern API design
 * - High deliverability
 * - Built-in analytics
 * - Simple implementation
 */
const resend = new Resend(process.env.RESEND_API_KEY)

const EmailService = {
  async sendPasswordReset(email, resetToken) {
    const resetLink = `https://vinylvibe.live/reset-password?token=${resetToken}`

    try {
      await resend.emails.send({
        from: 'VinylVibe <noreply@vinylvibe.live>',
        to: email,
        subject: 'Reset Your VinylVibe Password',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the link below to proceed:</p>
          <a href="${resetLink}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      })
    } catch (error) {
      console.error('Email send error:', error)
      throw new Error('Failed to send password reset email')
    }
  }
}

module.exports = EmailService 
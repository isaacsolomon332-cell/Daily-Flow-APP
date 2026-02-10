const { getMailgunInstance, isMailgunConfigured } = require('../config/mailgun');

class EmailService {
  constructor() {
    this.mailgunEnabled = false;
    this.initialize();
  }
  
  async initialize() {
    try {
      const mg = getMailgunInstance();
      this.mailgunEnabled = isMailgunConfigured();
      console.log(`📧 Mailgun Email Service: ${this.mailgunEnabled ? 'ENABLED' : 'DISABLED'}`);
    } catch (error) {
      this.mailgunEnabled = false;
      console.warn('⚠️ Email service disabled:', error.message);
    }
  }
  
  async sendPasswordReset(email, token, username) {
    console.log(`📧 Attempting to send password reset to: ${email}`);
    
    if (!this.mailgunEnabled) {
      console.warn(`⚠️ Email service disabled. Reset token for ${email}: ${token}`);
      console.log(`🔗 Reset URL: ${process.env.FRONTEND_URL}/reset-password?token=${token}`);
      return { success: false, message: 'Email service disabled', token: token };
    }
    
    try {
      const mg = getMailgunInstance();
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - DailyFlow</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #f9fafb;">
            <div style="background-color: #4f46e5; color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0;">DailyFlow</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Your Yearly/Daily Planner</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
              <p>Hello ${username},</p>
              <p>We received a request to reset your password for your DailyFlow account.</p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${resetLink}" 
                   style="background-color: #4f46e5; color: white; padding: 14px 28px; 
                          text-decoration: none; border-radius: 6px; font-weight: bold; 
                          display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                This link expires in 15 minutes and can only be used once.
              </p>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; 
                          padding: 16px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Security Notice:</strong> If you didn't request this, please ignore this email. 
                  Never share your password or this link with anyone.
                </p>
              </div>
              
              <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
                <p style="margin: 5px 0;">© ${new Date().getFullYear()} DailyFlow. All rights reserved.</p>
                <p style="margin: 5px 0;">This is an automated message, please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const textContent = `Password Reset Request - DailyFlow

Hello ${username},

We received a request to reset your password for your DailyFlow account.

Reset Link: ${resetLink}

This link expires in 15 minutes and can only be used once.

Security Notice: If you didn't request this, please ignore this email. 
Never share your password or this link with anyone.

© ${new Date().getFullYear()} DailyFlow. All rights reserved.
This is an automated message, please do not reply.`;
      
      const data = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to: [email],
        subject: 'Reset Your DailyFlow Password',
        html: htmlContent,
        text: textContent,
      };
      
      console.log(`📤 Sending email via Mailgun to: ${email}`);
      console.log(`📧 Using domain: ${process.env.MAILGUN_DOMAIN}`);
      
      const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, data);
      console.log(`✅ Password reset email sent to ${email}`);
      console.log(`📨 Message ID: ${result.id}`);
      
      return { 
        success: true, 
        message: 'Email sent successfully'
      };
      
    } catch (error) {
      console.error(`❌ Error sending email to ${email}:`, error.message);
      
      // Still log token for development
      console.log(`🔑 Reset token generated for ${email}: ${token}`);
      console.log(`🔗 Reset URL for testing: ${process.env.FRONTEND_URL}/reset-password?token=${token}`);
      
      return { 
        success: false, 
        message: 'Email sending failed, but token generated',
        token: token,
        error: error.message 
      };
    }
  }
  
  async sendWelcomeEmail(email, username) {
    console.log(`📧 Attempting to send welcome email to: ${email}`);
    
    if (!this.mailgunEnabled) {
      console.log(`⚠️ Email service disabled. Would send welcome to: ${email}`);
      return { success: false, message: 'Email service disabled' };
    }
    
    try {
      const mg = getMailgunInstance();
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #4f46e5; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">Welcome to DailyFlow!</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Your Yearly/Daily Planner</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937;">Hello ${username}!</h2>
            <p>Your account has been successfully created. 🎉</p>
            
            <div style="background-color: #e0e7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #4f46e5; margin-top: 0;">Get Started:</h3>
              <ul style="color: #374151;">
                <li>Plan your year with yearly goals</li>
                <li>Break down into daily tasks</li>
                <li>Track your progress</li>
                <li>Stay organized and productive</li>
              </ul>
            </div>
            
            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}" 
                 style="background-color: #4f46e5; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; font-weight: bold; 
                        display: inline-block;">
                Start Planning Now
              </a>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
              <p style="margin: 5px 0;">© ${new Date().getFullYear()} DailyFlow. All rights reserved.</p>
              <p style="margin: 5px 0;">This is an automated message, please do not reply.</p>
            </div>
          </div>
        </div>
      `;
      
      const data = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to: [email],
        subject: `Welcome to DailyFlow, ${username}!`,
        html: htmlContent,
      };
      
      console.log(`📤 Sending welcome email via Mailgun to: ${email}`);
      
      const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, data);
      console.log(`✅ Welcome email sent to ${email}`);
      console.log(`📨 Message ID: ${result.id}`);
      
      return { 
        success: true, 
        message: 'Welcome email sent successfully'
      };
      
    } catch (error) {
      console.error(`❌ Error sending welcome email to ${email}:`, error.message);
      return { 
        success: false, 
        message: 'Welcome email failed to send',
        error: error.message 
      };
    }
  }
  
  isEnabled() {
    return this.mailgunEnabled;
  }
}

module.exports = new EmailService();
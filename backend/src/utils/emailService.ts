/**
 * Email service using Nodemailer with SendGrid transport
 * 
 * This service handles email sending in production environments
 * using SendGrid's SMTP service.
 */
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Create a transporter using SendGrid
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'apikey', // For SendGrid, user is always 'apikey'
    pass: process.env.SMTP_PASSWORD || '', // SendGrid API Key from environment variables
  },
});

// Default sender address
const DEFAULT_FROM = process.env.EMAIL_DEFAULT_FROM || 'noreply@example.com';

/**
 * Send an email using Nodemailer with SendGrid
 * @param {EmailOptions} options - Email options
 * @returns {Promise<boolean>} - Success status
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    // Set default from address if not provided
    const from = options.from || DEFAULT_FROM;
    
    // Configure email data
    const mailOptions = {
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}; 
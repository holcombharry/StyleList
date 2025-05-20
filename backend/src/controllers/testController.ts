import { Request, Response } from 'express';
import { sendEmail } from '../utils/emailService';

/**
 * Test email functionality
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} - Express response
 */
export const testEmail = async (req: Request, res: Response): Promise<Response> => {
  const { to, subject, text, html } = req.body;
  
  if (!to || !subject || !text) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields: to, subject, text' 
    });
  }
  
  try {
    const success = await sendEmail({
      to,
      subject,
      text,
      html
    });
    
    if (success) {
      return res.status(200).json({ 
        success: true, 
        message: 'Test email sent successfully' 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send test email' 
      });
    }
  } catch (error: unknown) {
    console.error('Test email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return res.status(500).json({ 
      success: false, 
      message: 'Error sending test email',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}; 
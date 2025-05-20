import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authMiddleware';
import crypto from 'crypto';
import { sendEmail } from '../utils/emailService';
import axios from 'axios';
import { verifyIdToken } from 'apple-signin-auth';

// JWT secret key – must be provided via environment variable. Fallbacks are NOT allowed in production.
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set. Set JWT_SECRET before starting the server.');
}

const JWT_EXPIRES_IN = '30d';
const RESET_TOKEN_EXPIRES = 60 * 60 * 1000; // 1 hour

// Create JWT token
const createToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// Register a new user
export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Basic input sanitization & validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    const passwordPolicy = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Valid name is required' });
    }

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    if (!password || !passwordPolicy.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and include letters and numbers' });
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedName = name.trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use',
      });
    }

    // Create new user
    const user = await User.create({
      name: sanitizedName,
      email: sanitizedEmail,
      password,
    });

    // Return success without token (user needs to log in)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const sanitizedEmail = email.toLowerCase().trim();

    // Find user and include password for comparison
    const user = await User.findOne({ email: sanitizedEmail }).select('+password');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Create JWT token
    const token = createToken(user._id instanceof mongoose.Types.ObjectId ? user._id.toString() : String(user._id));

    // Return user without password and token
    const userWithoutPassword = {
      id: user._id instanceof mongoose.Types.ObjectId ? user._id.toString() : String(user._id),
      name: user.name,
      email: user.email,
    };

    res.status(200).json({
      success: true,
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
    });
  }
};

// Forgot password - Generates a 6-digit reset code
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required',
      });
    }

    const sanitizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      // For security reasons, don't tell the client that the user doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If a user with that email exists, a password reset code will be sent',
      });
    }

    // Generate a random 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // App name from environment variable
    const appName = process.env.APP_NAME
    
    // Hash the code before saving to the database
    const hashedCode = crypto
      .createHash('sha256')
      .update(resetCode)
      .digest('hex');

    // Code expires in 15 minutes
    const RESET_CODE_EXPIRES = 15 * 60 * 1000; // 15 minutes

    // Save the hashed code and expiration time to the user document
    user.resetCode = hashedCode;
    user.resetCodeExpire = new Date(Date.now() + RESET_CODE_EXPIRES);
    user.resetCodeVerified = false;
    
    // Clear any old reset tokens
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    // Read email template
    const fs = require('fs');
    const path = require('path');
    const templatePath = path.join(__dirname, '..', 'utils', 'emailTemplates', 'passwordResetCode.html');
    
    let emailHtml;
    try {
      emailHtml = fs.readFileSync(templatePath, 'utf8');
      // Replace placeholders with actual values
      emailHtml = emailHtml
        .replace('{{resetCode}}', resetCode)
        .replace('{{appName}}', appName)
        .replace('{{year}}', new Date().getFullYear().toString());
    } catch (err) {
      console.error('Error reading email template:', err);
      // Fallback to inline HTML if template can't be read
      emailHtml = `
        <h1>Password Reset Code</h1>
        <p>You requested a password reset.</p>
        <p>Your verification code is:</p>
        <h2 style="letter-spacing: 3px; font-size: 32px; text-align: center; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">${resetCode}</h2>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `;
    }

    // Send email with reset code
    const emailSent = await sendEmail({
      to: user.email,
      subject: 'Password Reset Code',
      text: `Your password reset code is: ${resetCode}. This code will expire in 15 minutes.`,
      html: emailHtml,
    });

    if (!emailSent) {
      user.resetCode = undefined;
      user.resetCodeExpire = undefined;
      user.resetCodeVerified = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent',
      });
    }

    res.status(200).json({
      success: true,
      message: 'If a user with that email exists, a password reset code will be sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing request',
    });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required',
      });
    }

    const passwordPolicy = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;

    if (!passwordPolicy.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include letters and numbers',
      });
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; purpose: string };
      
      // Check if token was created for password reset
      if (decoded.purpose !== 'password-reset') {
        return res.status(400).json({
          success: false,
          message: 'Invalid token purpose',
        });
      }

      const userId = decoded.userId;

      // Hash the token to compare with the one stored in the database
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with the hashed token and valid expiration
      const user = await User.findOne({
        _id: userId,
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
      }).select('+password');

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired token',
        });
      }

      // Update the password
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      // Send confirmation email
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Successful',
        text: 'Your password has been reset successfully.',
        html: `
          <h1>Password Reset Successful</h1>
          <p>Your password has been reset successfully.</p>
          <p>If you didn't make this change, please contact support immediately.</p>
        `,
      });

      res.status(200).json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
    });
  }
};

// Get current user
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    // The user ID should be attached by auth middleware
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id instanceof mongoose.Types.ObjectId ? user._id.toString() : String(user._id),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
    });
  }
};

/**
 * Handle Google OAuth login
 * @route POST /api/auth/oauth/google
 */
export const googleOAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({
        success: false,
        message: 'ID token is required',
      });
      return;
    }

    // Verify the ID token with Google
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    const { email, name, picture } = response.data;

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = await User.create({
        email,
        name,
        profilePicture: picture,
        isEmailVerified: true, // Google emails are verified
        authProvider: 'google',
      });
    } else if (user.authProvider !== 'google') {
      // If user exists but with different auth provider, update their info
      user.name = name;
      user.profilePicture = picture;
      user.isEmailVerified = true;
      user.authProvider = 'google';
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during Google authentication',
    });
  }
};

/**
 * Handle Apple OAuth login
 * @route POST /api/auth/oauth/apple
 */
export const appleOAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, nonce } = req.body;

    if (!idToken) {
      res.status(400).json({
        success: false,
        message: 'ID token is required',
      });
      return;
    }

    if (!nonce) {
      res.status(400).json({
        success: false,
        message: 'Nonce is required',
      });
      return;
    }

    // Verify the ID token with Apple
    const payload = await verifyIdToken(idToken, {
      audience: process.env.APPLE_CLIENT_ID, // Your Apple client ID
      nonce, // Verify the nonce matches what was sent
    });

    const { email, sub: appleUserId } = payload;

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { email },
        { appleUserId }
      ]
    });

    if (!user) {
      // Create new user
      user = await User.create({
        email,
        appleUserId,
        isEmailVerified: true, // Apple emails are verified
        authProvider: 'apple',
        // Use email username as name if not provided
        name: email.split('@')[0],
      });
    } else if (user.authProvider !== 'apple') {
      // If user exists but with different auth provider, update their info
      user.appleUserId = appleUserId;
      user.isEmailVerified = true;
      user.authProvider = 'apple';
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Apple OAuth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during Apple authentication',
    });
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // The user ID should be attached by auth middleware
    const userId = req.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // In a real application, you might want to:
    // 1. Blacklist the token
    // 2. Clear any server-side sessions
    // 3. Remove device tokens for push notifications
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
    });
  }
};

/**
 * Check if email is already associated with a social provider
 * @route POST /api/auth/check-provider
 */
export const checkEmailProvider = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    const sanitizedEmail = email.toLowerCase().trim();

    // Find user with the given email
    const user = await User.findOne({ email: sanitizedEmail });

    // If no user found or user doesn't use a social provider, return null provider
    if (!user || !user.authProvider || user.authProvider === 'local') {
      res.status(200).json({
        success: true,
        provider: null,
      });
      return;
    }

    // If user exists and has a social provider, return the provider
    if (user.authProvider === 'google' || user.authProvider === 'apple') {
      res.status(200).json({
        success: true,
        provider: user.authProvider.charAt(0).toUpperCase() + user.authProvider.slice(1), // Capitalize first letter
      });
      return;
    }

    // Default response for any other case
    res.status(200).json({
      success: true,
      provider: null,
    });
  } catch (error) {
    console.error('Check email provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking email provider',
    });
  }
};

// Verify reset code
export const verifyResetCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and reset code are required',
      });
    }

    const sanitizedEmail = email.toLowerCase().trim();

    // Hash the provided code to compare with stored one
    const hashedCode = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');

    // Find user with matching email, code, and valid expiration
    const user = await User.findOne({
      email: sanitizedEmail,
      resetCode: hashedCode,
      resetCodeExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired code',
      });
    }

    // Mark code as verified
    user.resetCodeVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Reset code verified successfully',
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying reset code',
    });
  }
};

// Reset password with verified code
export const resetPasswordWithCode = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required',
      });
    }

    const passwordPolicy = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;

    if (!passwordPolicy.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include letters and numbers',
      });
    }

    const sanitizedEmail = email.toLowerCase().trim();

    // Find user with verified code
    const user = await User.findOne({
      email: sanitizedEmail,
      resetCodeVerified: true,
      resetCodeExpire: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification. Please request a new code.',
      });
    }

    // Update the password
    user.password = password;
    
    // Clear reset code fields
    user.resetCode = undefined;
    user.resetCodeExpire = undefined;
    user.resetCodeVerified = false;
    
    // Clear old token fields if they exist
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Successful',
      text: 'Your password has been reset successfully.',
      html: `
        <h1>Password Reset Successful</h1>
        <p>Your password has been reset successfully.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
    });
  }
}; 
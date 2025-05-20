import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { parsePhoneNumber, isPossiblePhoneNumber } from 'libphonenumber-js';

/**
 * Obfuscates a phone number, showing only the last 4 digits
 * @param phone - The phone number to obfuscate
 * @returns The obfuscated phone number or empty string if none provided
 */
const obfuscatePhoneNumber = (phone: string | undefined): string => {
  if (!phone) return '';
  
  try {
    // Parse the phone number if possible
    const phoneNumber = parsePhoneNumber(phone);
    
    if (phoneNumber) {
      // Get the national number (without country code)
      const nationalNumber = phoneNumber.nationalNumber;
      
      if (nationalNumber.length <= 4) {
        return nationalNumber; // Just return the number if it's 4 or fewer digits
      }
      
      // Replace all but last 4 digits with asterisks
      const lastFourDigits = nationalNumber.slice(-4);
      const asterisks = '*'.repeat(nationalNumber.length - 4);
      
      // Format with country code if available
      if (phoneNumber.countryCallingCode) {
        return `+${phoneNumber.countryCallingCode} ${asterisks}${lastFourDigits}`;
      }
      
      return `${asterisks}${lastFourDigits}`;
    }
    
    // Fallback to simple obfuscation if parsing fails
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length <= 4) {
      return digitsOnly;
    }
    
    const lastFourDigits = digitsOnly.slice(-4);
    const asterisks = '*'.repeat(digitsOnly.length - 4);
    
    return `${asterisks}${lastFourDigits}`;
  } catch (error) {
    // Fallback to simple obfuscation on error
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length <= 4) {
      return digitsOnly;
    }
    
    const lastFourDigits = digitsOnly.slice(-4);
    const asterisks = '*'.repeat(digitsOnly.length - 4);
    
    return `${asterisks}${lastFourDigits}`;
  }
};

/**
 * Validates a phone number using libphonenumber-js
 * @param phone - The phone number to validate
 * @returns Boolean indicating if the phone number is valid
 */
const isValidPhoneNumber = (phone: string): boolean => {
  if (!phone) return true; // Empty is valid (optional field)
  
  // Check if it contains asterisks (obfuscated number) - not valid for input
  if (phone.includes('*')) return false;
  
  // Use isPossiblePhoneNumber to check if valid (accepts multiple countries)
  return isPossiblePhoneNumber(phone);
};

// Get current user profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Return user data without sensitive information, obfuscate phone
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: obfuscatePhoneNumber(user.phone),
        profilePicture: user.profilePicture || '',
        emailUpdates: user.emailUpdates,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
    });
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { name, phone, emailUpdates } = req.body;

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Validate phone number if provided
    if (phone !== undefined) {
      if (phone && !isValidPhoneNumber(phone)) {
        res.status(400).json({
          success: false,
          message: 'Invalid phone number format. Please enter a valid phone number.',
        });
        return;
      }
      
      // Store the phone as is - it should already be in E.164 format from the frontend
      user.phone = phone;
    }

    // Update other user fields if provided
    if (name) user.name = name;
    if (emailUpdates !== undefined) user.emailUpdates = emailUpdates;

    // Save updated user
    await user.save();

    // Return updated user data with obfuscated phone
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: obfuscatePhoneNumber(user.phone),
        profilePicture: user.profilePicture || '',
        emailUpdates: user.emailUpdates,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
}; 
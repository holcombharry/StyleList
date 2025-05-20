import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import axios from 'axios';

/**
 * Register a device token for push notifications
 * @route POST /api/notifications/register-device
 */
export const registerDeviceToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { token } = req.body;

    // Validate input
    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Device token is required',
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Find user and update device tokens
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if token already exists to avoid duplicates
    if (!user.deviceTokens.includes(token)) {
      // Add new token to the array
      user.deviceTokens.push(token);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Device token registered successfully',
    });
  } catch (error) {
    console.error('Register device token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering device token',
    });
  }
};

/**
 * Unregister a device token (e.g., when user logs out from a device)
 * @route DELETE /api/notifications/unregister-device
 */
export const unregisterDeviceToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { token } = req.body;

    // Validate input
    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Device token is required',
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Find user and update device tokens
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Remove token from the array
    user.deviceTokens = user.deviceTokens.filter(t => t !== token);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Device token unregistered successfully',
    });
  } catch (error) {
    console.error('Unregister device token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unregistering device token',
    });
  }
};

/**
 * Send a push notification to a user's devices
 * @route POST /api/notifications/send
 */
export const sendNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { title, body, data } = req.body;

    console.log('Sending push notification from controller:', title, body, data);

    // Validate input
    if (!title || !body) {
      res.status(400).json({
        success: false,
        message: 'Title and body are required',
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Find user and get their device tokens
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (!user.deviceTokens.length) {
      res.status(400).json({
        success: false,
        message: 'No device tokens registered for this user',
      });
      return;
    }

    // Send notification to each device token
    const notifications = user.deviceTokens.map(token => {
      return axios.post('https://exp.host/--/api/v2/push/send', {
        to: token,
        sound: 'default',
        title,
        body,
        data,
      });
    });

    await Promise.all(notifications);

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notification',
    });
  }
}; 
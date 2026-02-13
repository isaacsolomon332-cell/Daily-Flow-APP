const User = require('../models/User');
const { generateToken } = require('../utils/tokenUtils');

const authController = {
  signup: async (req, res, next) => {
    try {
      const { fullName, email, username, phoneNumber, password } = req.body;
      
      // PHONE NUMBER VALIDATION - EXACTLY 11 DIGITS
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required',
          errors: [{ field: 'phoneNumber', message: 'Phone number is required' }]
        });
      }
      
      // Remove any non-digit characters
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // Check if exactly 11 digits
      if (cleanPhone.length !== 11) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be exactly 11 digits',
          errors: [{ field: 'phoneNumber', message: 'Phone number must be exactly 11 digits' }]
        });
      }
      
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User registration failed. Please check your information.'
        });
      }
      
      const user = new User({
        fullName,
        email,
        username,
        phoneNumber: cleanPhone, // Store the cleaned 11-digit number
        password
      });
      
      await user.save();
      
      const token = generateToken(user._id);
      
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });
      
      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          user: user.toJSON(),
          token
        }
      });
      
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'User registration failed. Please check your information.'
        });
      }
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: messages
        });
      }
      
      next(error);
    }
  },
  
  login: async (req, res, next) => {
    try {
      const { usernameOrEmail, password } = req.body;
      
      const user = await User.findOne({
        $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }]
      }).select('+password +loginAttempts +lockUntil');
      
      const genericError = {
        success: false,
        message: 'Invalid username/email or password'
      };
      
      if (!user) {
        return res.status(401).json(genericError);
      }
      
      if (user.isLocked) {
        const lockTime = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
        return res.status(423).json({
          success: false,
          message: `Account is locked. Please try again in ${lockTime} minutes.`
        });
      }
      
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        await user.incrementLoginAttempts();
        
        const updatedUser = await User.findById(user._id).select('+loginAttempts +lockUntil');
        if (updatedUser.isLocked) {
          return res.status(423).json({
            success: false,
            message: 'Too many failed attempts. Account locked for 15 minutes.'
          });
        }
        
        return res.status(401).json(genericError);
      }
      
      await user.resetLoginAttempts();
      
      user.lastLogin = new Date();
      await user.save();
      
      const token = generateToken(user._id);
      
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          token
        }
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  getProfile: async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: { user: user.toJSON() }
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  logout: async (req, res, next) => {
    try {
      res.clearCookie('token', {
        path: '/'
      });
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  checkAuth: async (req, res, next) => {
    try {
      res.status(200).json({
        success: true,
        data: { user: req.user.toJSON() }
      });
    } catch (error) {
      next(error);
    }
  },
  
  checkAvailability: async (req, res, next) => {
    try {
      const { email, username } = req.query;
      
      if (!email && !username) {
        return res.status(400).json({
          success: false,
          message: 'Provide either email or username to check'
        });
      }
      
      const query = {};
      if (email) query.email = email;
      if (username) query.username = username;
      
      const existingUser = await User.findOne(query);
      
      res.status(200).json({
        success: true,
        data: {
          available: !existingUser,
          emailExists: email && existingUser?.email === email,
          usernameExists: username && existingUser?.username === username
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
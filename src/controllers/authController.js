const User = require('../models/User');
const { generateToken } = require('../utils/tokenUtils');

const authController = {
 signup: async (req, res, next) => {
  try {
    const { fullName, email, username, phoneNumber, password } = req.body;
    
    console.log('Signup attempt:', { fullName, email, username, phoneNumber });
    
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return res.status(400).json({
        success: false,
        message: 'Email or username already taken'
      });
    }
    
    const user = new User({
      fullName,
      email,
      username,
      phoneNumber: phoneNumber || undefined,
      password
    });
    
    await user.save();
    console.log('User created successfully:', user._id);
    
    const token = generateToken(user._id);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
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
    console.error('SIGNUP ERROR DETAILS:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email or username already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during signup',
      error: error.message
    });
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
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');

class AuthService {
  async signup(userData) {
    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { username: userData.username }]
    });
    
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    const user = new User(userData);
    await user.save();
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    return {
      user: user.toJSON(),
      tokens: { accessToken, refreshToken }
    };
  }
  
  async login(usernameOrEmail, password) {
    const user = await User.findOne({
      $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }]
    }).select('+password +loginAttempts +lockUntil');
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    if (user.isLocked) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      throw new Error(`Account locked. Try again in ${lockTime} minutes`);
    }
    
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      const updatedUser = await User.findById(user._id).select('+loginAttempts +lockUntil');
      
      if (updatedUser.isLocked) {
        throw new Error('Too many failed attempts. Account locked for 15 minutes.');
      }
      
      throw new Error('Invalid credentials');
    }
    
    await user.resetLoginAttempts();
    user.lastLogin = new Date();
    await user.save();
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    return {
      user: user.toJSON(),
      tokens: { accessToken, refreshToken }
    };
  }
  
  async requestPasswordReset(email) {
    const user = await User.findOne({ email });
    return user; // Will be null if user doesn't exist (security)
  }
  
  async resetPassword(token, newPassword) {
    const user = await User.findOne({
      'resetTokens.token': token,
      'resetTokens.expiresAt': { $gt: new Date() },
      'resetTokens.used': false
    });
    
    if (!user) {
      throw new Error('Invalid or expired token');
    }
    
    await user.useResetToken(token);
    user.password = newPassword;
    await user.save();
    
    return user;
  }
  
  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    return user;
  }
}

module.exports = new AuthService();
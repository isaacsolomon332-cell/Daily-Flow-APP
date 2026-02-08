const { body, validationResult } = require('express-validator');
const { validatePassword, validateEmail, validatePhone } = require('../utils/validationUtils');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

const signupValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
    .custom(async (email) => {
      if (!validateEmail(email)) {
        throw new Error('Please provide a valid email address');
      }
      return true;
    }),
  
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('phoneNumber')
    .optional({ checkFalsy: true })
    .trim()
    .custom((phone) => {
      if (!validatePhone(phone)) {
        throw new Error('Please provide a valid phone number');
      }
      return true;
    }),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .custom((password) => {
      const error = validatePassword(password);
      if (error) throw new Error(error);
      return true;
    }),
  
  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

const loginValidation = [
  body('usernameOrEmail')
    .trim()
    .notEmpty().withMessage('Username or email is required'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

module.exports = {
  handleValidationErrors,
  signupValidation,
  loginValidation
};
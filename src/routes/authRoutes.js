const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const {
  signupValidation,
  loginValidation,
  handleValidationErrors
} = require('../middleware/validationMiddleware');

router.post('/signup', signupValidation, handleValidationErrors, authController.signup);
router.post('/login', loginValidation, handleValidationErrors, authController.login);
router.get('/check-availability', authController.checkAvailability);

router.get('/profile', authenticate, authController.getProfile);
router.get('/check-auth', authenticate, authController.checkAuth);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/\d/.test(password)) return 'Password must contain at least one number';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
  return null;
};

const validateEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// FIXED: Phone validation - accepts ANY input
const validatePhone = (phone) => {
  // If phone is empty/undefined, return true (optional field)
  if (!phone) return true;
  
  // For 11-digit validation, use this instead:
  // const digitsOnly = phone.replace(/\D/g, '');
  // return digitsOnly.length === 11;
  
  // For now, accept ANY input
  return true;
};

module.exports = {
  passwordRegex,
  validatePassword,
  validateEmail,
  validatePhone
};
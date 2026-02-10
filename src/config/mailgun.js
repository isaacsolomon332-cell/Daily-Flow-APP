const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);

let mg = null;

const initializeMailgun = () => {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.warn('⚠️ MAILGUN_API_KEY or MAILGUN_DOMAIN not configured. Email functionality will be limited.');
    return null;
  }
  
  try {
    mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
    });
    
    console.log('✅ Mailgun email service initialized');
    console.log(`📧 Using domain: ${process.env.MAILGUN_DOMAIN}`);
    return mg;
  } catch (error) {
    console.error('❌ Failed to initialize Mailgun:', error.message);
    return null;
  }
};

const getMailgunInstance = () => {
  if (!mg) {
    return initializeMailgun();
  }
  return mg;
};

const isMailgunConfigured = () => {
  return !!process.env.MAILGUN_API_KEY && !!process.env.MAILGUN_DOMAIN;
};

module.exports = {
  initializeMailgun,
  getMailgunInstance,
  isMailgunConfigured
};
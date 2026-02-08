const sgMail = require('@sendgrid/mail');

const initializeSendGrid = () => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('⚠️ SENDGRID_API_KEY is not configured. Email functionality will be limited.');
    return false;
  }
  
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid email service initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize SendGrid:', error.message);
    return false;
  }
};

const getSendGridInstance = () => {
  return sgMail;
};

const isSendGridConfigured = () => {
  return !!process.env.SENDGRID_API_KEY;
};

module.exports = {
  initializeSendGrid,
  getSendGridInstance,
  isSendGridConfigured
};
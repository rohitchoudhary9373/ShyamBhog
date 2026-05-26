const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create Transporter
const createTransporter = () => {
  // Use mailtrap/smtp env variables or fallback to a mock/console transporter
  const hasSMTPConfig =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (hasSMTPConfig) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Console Fallback in Local/Dev environments
  return {
    sendMail: async (options) => {
      logger.info(`[MOCK EMAIL SENT] to: ${options.to}`);
      logger.info(`Subject: ${options.subject}`);
      logger.info(`Body: ${options.text || 'HTML Content'}`);
      if (options.attachments) {
        logger.info(`Attachments count: ${options.attachments.length}`);
      }
      return { messageId: 'mock-id-' + Date.now() };
    },
  };
};

const transporter = createTransporter();

/**
 * Send an email.
 * @param {object} options - Mail options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML body
 * @param {array} [options.attachments] - Attachments list
 */
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Shyam Bhog Platform" <noreply@shyambhog.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${options.to}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sendEmail,
};

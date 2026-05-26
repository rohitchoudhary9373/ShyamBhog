const axios = require('axios');
const logger = require('./logger');

/**
 * Sends a WhatsApp notification.
 * If credentials/endpoints are set in env, it triggers them, else it logs a mock message.
 * @param {string} toMobile - Recipient mobile number (with country code, e.g., +91...)
 * @param {string} templateName - The name of the pre-approved WhatsApp template
 * @param {object} variables - Template dynamic variables object
 * @returns {Promise<boolean>} success status
 */
const sendWhatsApp = async (toMobile, templateName, variables = {}) => {
  const hasWhatsAppConfig = process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN;

  if (hasWhatsAppConfig) {
    try {
      const response = await axios.post(
        process.env.WHATSAPP_API_URL,
        {
          to: toMobile,
          template: templateName,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: Object.keys(variables).map((key) => ({
                type: 'text',
                text: String(variables[key]),
              })),
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      logger.info(`WhatsApp sent successfully to ${toMobile}: ${response.data?.message_id || 'OK'}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send WhatsApp notification to ${toMobile}: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  // Mock console log for local dev
  logger.info(`
📱 [MOCK WHATSAPP NOTIFICATION SEND]
To: ${toMobile}
Template: ${templateName}
Variables: ${JSON.stringify(variables, null, 2)}
  `);
  return true;
};

module.exports = {
  sendWhatsApp,
};

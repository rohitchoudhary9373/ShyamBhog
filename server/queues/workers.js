const { Worker } = require('bullmq');
const ArjeeOrder = require('../models/ArjeeOrder');
const Refund = require('../models/Refund');
const Setting = require('../models/Setting');
const SlotLock = require('../models/SlotLock');
const { generateInvoice } = require('../utils/invoiceGenerator');
const { uploadBuffer } = require('../utils/cloudinary');
const { sendEmail } = require('../utils/email');
const { sendWhatsApp } = require('../utils/whatsapp');
const { redisClient } = require('../utils/cache');
const logger = require('../utils/logger');

// Helper to convert PDF kit stream to Buffer
const streamToBuffer = (doc) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));
  });
};

/**
 * Main job processing engine (accessible directly by memory fallback OR BullMQ worker)
 */
const processJobDirectly = async (queueName, jobName, data) => {
  logger.info(`[Worker Engine] Processing Job '${jobName}' in Queue '${queueName}'`);

  try {
    switch (queueName) {
      case 'invoice':
        if (jobName === 'generate') {
          const order = await ArjeeOrder.findById(data.orderId);
          if (!order) throw new Error(`Invoice generation failed: Order ${data.orderId} not found`);

          const settings = await Setting.findOne({ adminId: order.adminId }) || {};
          
          // Generate PDF
          const doc = await generateInvoice(order, settings);
          // End the document stream so we can buffer it
          doc.end();
          const buffer = await streamToBuffer(doc);

          // Upload buffer to Cloudinary
          const uploadRes = await uploadBuffer(buffer, `invoices/${order.adminId}`);
          
          // Save URL to database
          order.invoiceUrl = uploadRes.secure_url;
          await order.save();
          logger.info(`Invoice PDF generated and uploaded to Cloudinary: ${order.invoiceUrl}`);
        }
        break;

      case 'email':
        if (jobName === 'sendConfirmation') {
          const order = await ArjeeOrder.findById(data.orderId).populate('userId');
          if (!order) throw new Error(`Confirmation email failed: Order ${data.orderId} not found`);

          const emailTo = order.userId?.email || order.whatsapp + '@shyambhog.com'; // fallback placeholder
          if (!emailTo || emailTo.includes('@shyambhog.com')) {
            logger.info(`No valid customer email found for Order ${order._id}, skipping email.`);
            return;
          }

          const settings = await Setting.findOne({ adminId: order.adminId }) || {};
          
          // Generate PDF buffer to attach on the fly
          const doc = await generateInvoice(order, settings);
          doc.end();
          const pdfBuffer = await streamToBuffer(doc);

          const brandName = settings.brandName || 'Shyam Bhog';
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #f97316;">Jai Shree Khatu Shyam Ji! 🙏</h2>
              <p>Dear <strong>${order.name}</strong>,</p>
              <p>Thank you for booking your devotional service with <strong>${brandName}</strong>.</p>
              <p>Your booking is confirmed! We have attached your payment receipt / invoice to this email.</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 8px; font-weight: bold;">Order ID:</td>
                  <td style="padding: 8px;">${order.invoiceNumber || order._id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Service Type:</td>
                  <td style="padding: 8px;">${order.serviceType}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 8px; font-weight: bold;">Total Price:</td>
                  <td style="padding: 8px;">INR ${order.totalPrice}</td>
                </tr>
              </table>
              <p>Our team will perform the ritual ceremonies with total faith and dedication. Live updates will be sent to your WhatsApp number.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 20px; margin-bottom: 20px;" />
              <p style="font-size: 11px; color: #94a3b8; text-align: center;">${settings.footerText || 'Made with श्रद्धा by Shyam Bhog Platform'}</p>
            </div>
          `;

          await sendEmail({
            to: emailTo,
            subject: `Booking Confirmed - Invoice #${order.invoiceNumber || order._id} - ${brandName}`,
            html: emailHtml,
            attachments: [
              {
                filename: `Invoice-${order.invoiceNumber || order._id}.pdf`,
                content: pdfBuffer,
              },
            ],
          });
        }

        if (jobName === 'sendRefund') {
          const refund = await Refund.findById(data.refundId).populate('orderId userId');
          if (!refund) throw new Error(`Refund email failed: Refund ${data.refundId} not found`);

          const emailTo = refund.userId?.email;
          if (!emailTo) return;

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #ef4444;">Refund Processed Successfully</h2>
              <p>Dear <strong>${refund.userId.name}</strong>,</p>
              <p>This is to confirm that a refund has been successfully processed for your booking order.</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 8px; font-weight: bold;">Refund Receipt No:</td>
                  <td style="padding: 8px;">${refund.receiptNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold;">Refunded Amount:</td>
                  <td style="padding: 8px;">INR ${refund.amount}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 8px; font-weight: bold;">Refund Method:</td>
                  <td style="padding: 8px; text-transform: uppercase;">${refund.refundMethod}</td>
                </tr>
              </table>
              <p>Refunds to wallets are credited immediately. Card/bank refunds can take 5-7 business days to reflect in your account.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 20px; margin-bottom: 20px;" />
            </div>
          `;

          await sendEmail({
            to: emailTo,
            subject: `Refund Processed - Receipt #${refund.receiptNumber}`,
            html: emailHtml,
          });
        }
        break;

      case 'whatsapp':
        if (jobName === 'sendConfirmation') {
          const order = await ArjeeOrder.findById(data.orderId);
          if (!order) return;
          
          await sendWhatsApp(order.whatsapp, 'booking_confirmation', {
            devotee_name: order.name,
            invoice_num: order.invoiceNumber || order._id.toString(),
            service: order.serviceType,
            amount: order.totalPrice
          });
        }
        if (jobName === 'sendRefund') {
          const refund = await Refund.findById(data.refundId).populate('userId');
          if (!refund || !refund.userId) return;

          await sendWhatsApp(refund.userId.mobile || refund.orderId?.whatsapp, 'refund_processed', {
            devotee_name: refund.userId.name,
            receipt_num: refund.receiptNumber,
            amount: refund.amount,
            method: refund.refundMethod
          });
        }
        break;

      case 'booking':
        if (jobName === 'cleanupLocks') {
          const result = await SlotLock.deleteMany({ expiresAt: { $lt: new Date() } });
          logger.info(`Cleaned up ${result.deletedCount} expired slot locks`);
        }
        if (jobName === 'recovery') {
          const paymentService = require('../services/paymentService');
          await paymentService.runTransactionRecovery();
        }
        break;

      default:
        logger.warn(`Unknown queue action: ${queueName}:${jobName}`);
    }
  } catch (error) {
    logger.error(`Error executing background task [${queueName}:${jobName}]: ${error.stack || error.message}`);
    throw error;
  }
};

// Initialize BullMQ background workers if Redis is available
const initWorkers = () => {
  if (!redisClient || redisClient.status !== 'ready') {
    logger.warn('Skipping Redis worker initialization: running in memory-fallback mode');
    return;
  }

  const queueNames = ['invoice', 'email', 'whatsapp', 'booking', 'refunds'];

  for (const name of queueNames) {
    new Worker(
      name,
      async (job) => {
        await processJobDirectly(name, job.name, job.data);
      },
      { connection: redisClient }
    );
    logger.info(`BullMQ background worker for queue '${name}' listening`);
  }
};

// Start workers
initWorkers();

module.exports = {
  processJobDirectly,
};

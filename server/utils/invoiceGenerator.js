const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const logger = require('./logger');

/**
 * Generates a branded, production-grade PDF invoice.
 * @param {object} order - ArjeeOrder document
 * @param {object|string} settings - Platform settings object or brandName string
 * @param {string} [footerTextParam] - Optional footer text (for compatibility)
 * @returns {Promise<PDFDocument>} PDF document stream
 */
async function generateInvoice(order, settings = {}, footerTextParam = '') {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  const brandName = typeof settings === 'string' ? settings : (settings.brandName || 'Shyam Bhog');
  const footerText = typeof footerTextParam === 'string' && footerTextParam ? footerTextParam : (settings.footerText || 'Made with श्रद्धा by Shyam Bhog Team');
  const companyAddress = settings.companyAddress || 'Shree Khatu Shyam Ji Dham, Rajasthan, India';
  const gstNumber = settings.gstNumber || '';

  const totalAmount = order.totalPrice || order.price || 0;
  const walletDeduction = order.walletDeduction || 0;
  const payableAmount = order.payableAmount !== undefined ? order.payableAmount : (totalAmount - walletDeduction);
  const taxAmount = order.taxAmount || 0;
  const basePrice = totalAmount - taxAmount;

  const titleFont = 'Helvetica-Bold';
  const normalFont = 'Helvetica';

  const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const invoiceNumber = order.invoiceNumber || `SB-${order._id.toString().slice(-6).toUpperCase()}`;

  // ── 1. GENERATE QR CODE ────────────────────────
  let qrCodeBuffer = null;
  try {
    const qrText = `Invoice: ${invoiceNumber}\nAmount: INR ${totalAmount}\nDevotee: ${order.name}\nWhatsApp: ${order.whatsapp}\nStatus: Completed`;
    qrCodeBuffer = await QRCode.toBuffer(qrText, { width: 90, margin: 1 });
  } catch (err) {
    logger.error(`Invoice QR Code Generation failed: ${err.message}`);
  }

  // ── 2. HEADER BLOCK ───────────────────────────
  // Primary brand color accent
  doc.rect(0, 0, doc.page.width, 15).fill('#f97316');

  // Brand Info
  doc.fillColor('#0f172a').font(titleFont).fontSize(26).text(brandName.toUpperCase(), 50, 40);
  doc.fillColor('#6b7280').font(normalFont).fontSize(9).text('Devotional Services Platform');
  doc.text(companyAddress, { width: 280 });
  if (gstNumber) {
    doc.text(`GSTIN: ${gstNumber}`);
  }

  // Document Title & Info (Aligned Right)
  doc.page.margins.right = 50;
  doc.fillColor('#0f172a').font(titleFont).fontSize(16).text('TAX INVOICE', 350, 40, { align: 'right' });
  doc.fillColor('#4b5563').font(normalFont).fontSize(9);
  doc.text(`Invoice No: ${invoiceNumber}`, { align: 'right' });
  doc.text(`Date: ${formattedDate}`, { align: 'right' });
  doc.text(`Payment Status: PAID`, { align: 'right' });

  // Draw horizontal line separator
  doc.moveTo(50, 130).lineTo(545, 130).stroke('#e5e7eb');

  // ── 3. BILLING INFORMATION ────────────────────
  doc.fillColor('#1e293b').font(titleFont).fontSize(10).text('BILLED TO (DEVOTEE):', 50, 150);
  doc.fillColor('#0f172a').font(titleFont).fontSize(12).text(order.name.toUpperCase());
  doc.fillColor('#4b5563').font(normalFont).fontSize(10).text(`WhatsApp: ${order.whatsapp}`);
  doc.text(`Service Type: ${order.serviceType || 'Ritual Service'}`);

  // Draw QR Code on the right
  if (qrCodeBuffer) {
    doc.image(qrCodeBuffer, 450, 140, { width: 85 });
  }

  // ── 4. ITEMS TABLE ─────────────────────────────
  const tableTop = 240;
  doc.font(titleFont).fontSize(9);

  // Table header background
  doc.rect(50, tableTop, 495, 22).fill('#1e293b');
  doc.fillColor('#ffffff');
  doc.text('SR.', 60, tableTop + 6, { width: 30 });
  doc.text('OFFERING / VARIANT', 90, tableTop + 6, { width: 200 });
  doc.text('QTY', 300, tableTop + 6, { width: 40, align: 'center' });
  doc.text('UNIT PRICE', 350, tableTop + 6, { width: 80, align: 'right' });
  doc.text('TOTAL PRICE', 440, tableTop + 6, { width: 95, align: 'right' });

  // Table rows
  doc.fillColor('#334155').font(normalFont).fontSize(9);
  let currentY = tableTop + 22;

  const items = order.items && order.items.length > 0
    ? order.items
    : [{ title: order.serviceType || 'Devotional Service', price: totalAmount, quantity: 1 }];

  let subtotal = 0;
  let totalItemsCount = 0;

  items.forEach((item, index) => {
    // Draw row background for alternating rows
    if (index % 2 === 1) {
      doc.rect(50, currentY, 495, 26).fill('#f8fafc');
      doc.fillColor('#334155');
    }
    
    doc.text(String(index + 1), 60, currentY + 8, { width: 30 });
    
    // Clean Devotee Name from the title if appended
    let cleanTitle = item.title ? item.title.replace(/\s*\([^)]*\)$/, '').trim() : 'Devotional Service';
    
    // Format slot date if present
    const slotStr = item.slot 
      ? ` (Date: ${new Date(item.slot).toLocaleDateString('en-IN')})`
      : '';
    
    doc.text(cleanTitle + slotStr, 90, currentY + 8, { width: 200, height: 20 });
    
    const qty = item.quantity || 1;
    const price = Number(item.price || 0);
    const rowTotal = price * qty;
    
    subtotal += rowTotal;
    totalItemsCount += qty;

    doc.text(String(qty), 300, currentY + 8, { width: 40, align: 'center' });
    doc.text(`INR ${price.toFixed(2)}`, 350, currentY + 8, { width: 80, align: 'right' });
    doc.text(`INR ${rowTotal.toFixed(2)}`, 440, currentY + 8, { width: 95, align: 'right' });
    
    currentY += 26;
  });

  // Table border bottom line
  doc.moveTo(50, currentY).lineTo(545, currentY).stroke('#94a3b8');

  // ── 5. TOTALS AND METRICS ──────────────────────
  let totalY = currentY + 15;
  doc.font(normalFont).fontSize(9).fillColor('#64748b');

  doc.text('Total Items:', 320, totalY);
  doc.font(titleFont).fillColor('#1e293b').text(String(totalItemsCount), 440, totalY, { align: 'right', width: 95 });

  totalY += 15;
  doc.font(normalFont).fillColor('#64748b').text('Subtotal:', 320, totalY);
  doc.font(titleFont).fillColor('#1e293b').text(`INR ${subtotal.toFixed(2)}`, 440, totalY, { align: 'right', width: 95 });

  totalY += 15;
  doc.font(titleFont).fillColor('#1e293b').text('Grand Total:', 320, totalY);
  doc.font(titleFont).fillColor('#1e293b').text(`INR ${subtotal.toFixed(2)}`, 440, totalY, { align: 'right', width: 95 });
  
  if (walletDeduction > 0) {
    totalY += 15;
    doc.font(normalFont).fillColor('#64748b').text('Paid via Wallet Balance:', 320, totalY);
    doc.font(titleFont).fillColor('#1e293b').text(`- INR ${walletDeduction.toFixed(2)}`, 440, totalY, { align: 'right', width: 95 });
    
    totalY += 15;
    doc.font(titleFont).fillColor('#0f172a').text('Net Gateway Payable:', 320, totalY);
    doc.fontSize(10).text(`INR ${payableAmount.toFixed(2)}`, 440, totalY, { align: 'right', width: 95 });
  }

  // ── 6. DEVOTEE MESSAGE / INSTRUCTIONS ─────────
  if (order.message) {
    const boxY = Math.max(totalY + 30, currentY + 70);
    doc.rect(50, boxY, 495, 45).fill('#fff7ed');
    doc.rect(50, boxY, 495, 45).stroke('#ffedd5');
    
    doc.fillColor('#c2410c').font(titleFont).fontSize(8).text('SPECIAL REQUEST / MESSAGE:', 60, boxY + 8);
    doc.fillColor('#431407').font(normalFont).fontSize(9).text(order.message, 60, boxY + 20, { width: 475 });
  }

  // ── 7. FOOTER SECTION ─────────────────────────
  const footerTop = doc.page.height - 85;
  doc.moveTo(50, footerTop).lineTo(545, footerTop).stroke('#e2e8f0');
  
  doc.font(normalFont).fontSize(8).fillColor('#94a3b8')
     .text(footerText, 50, footerTop + 10, { align: 'center' });
  doc.text('This is a secure platform generated transaction invoice. No signature required.', { align: 'center' });
  
  return doc;
}

module.exports = { generateInvoice };

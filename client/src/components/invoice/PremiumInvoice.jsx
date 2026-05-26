import React from 'react';
import InvoiceHeader from './InvoiceHeader';
import InvoiceTable from './InvoiceTable';
import InvoiceSummary from './InvoiceSummary';
import PaymentDetails from './PaymentDetails';
import { useSettings } from '../../context/SettingsContext';
import './PremiumInvoice.css';

export default function PremiumInvoice({ order }) {
  const { settings } = useSettings();

  if (!order) return null;

  return (
    <div className="premium-invoice-container">
      <InvoiceHeader order={order} settings={settings} />
      
      <div className="invoice-body">
        <div className="devotee-info-grid">
          <div>
            <div className="invoice-section-title">{order?.status === 'Refund_Receipt_Generated' ? 'Refunded To (Devotee)' : 'Billed To (Devotee)'}</div>
            <div className="info-label">Customer Name</div>
            <div className="info-value mb-4">{order?.name || order?.user?.name || 'Devotee'}</div>
            
            <div className="info-label">Mobile Number / WhatsApp</div>
            <div className="info-value mb-4">{order?.whatsapp || order?.user?.mobile || 'N/A'}</div>

            <div className="info-label">Booking Type</div>
            <div className="info-value">{order?.serviceType || order?.category || 'Booking'}</div>
          </div>
          
          <div>
            <div className="invoice-section-title">Invoice Details</div>
            <div className="info-label">Invoice Number</div>
            <div className="info-value mb-4" style={{ fontWeight: 700, color: '#16a34a' }}>
              {order?.invoiceNumber || 'N/A'}
            </div>

            <div className="info-label">Order Number</div>
            <div className="info-value mb-4" style={{ fontSize: '13px' }}>{order?._id}</div>

            <div className="info-label">Transaction ID</div>
            <div className="info-value mb-4" style={{ fontSize: '13px' }}>{order?.paymentId || 'N/A'}</div>

            <div className="info-label">Booking Date & Time</div>
            <div className="info-value mb-4">
              {order?.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
            </div>

            <div className="info-label">Payment Status</div>
            <div className="info-value mb-4">
              <span className={`payment-status-badge ${order?.status !== 'Pending' ? 'status-success' : 'status-pending'}`} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                {order?.status !== 'Pending' ? 'Paid' : 'Pending'}
              </span>
            </div>

            <div className="info-label">Lifecycle Status</div>
            <div className="info-value" style={{ color: order?.status === 'Confirmed' || order?.status === 'Completed' || order?.status === 'Invoice_Generated' ? '#16a34a' : (order?.status === 'Refund_Receipt_Generated' ? '#9333ea' : '#ea580c'), fontWeight: 'bold' }}>
              {order?.status?.replace(/_/g, ' ') || 'Pending'}
            </div>
          </div>
        </div>

        <InvoiceTable items={order?.items && order.items.length > 0 ? order.items : [{ title: order?.serviceType || 'Devotional Offering', price: order?.price || order?.totalPrice || 0, quantity: 1, slot: order?.slot }]} />

        <div className="invoice-footer-grid">
          <PaymentDetails order={order} />
          <InvoiceSummary order={order} />
        </div>

        <div className="invoice-footer-note">
          <div className="jai-shree-shyam">Jai Shree Shyam!</div>
          <p>Thank you for your devotional offerings. May blessings and peace be upon you.</p>
        </div>
      </div>
    </div>
  );
}

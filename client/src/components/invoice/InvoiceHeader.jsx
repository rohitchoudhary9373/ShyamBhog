import { formatDate } from '../../utils/invoiceFormatter';

export default function InvoiceHeader({ order, settings }) {
  return (
    <div className="invoice-header-bg">
      <div>
        <h1 className="invoice-title">{settings?.brandName || 'Shyam Bhog'}</h1>
        <p style={{ marginTop: '8px', opacity: 0.9, fontSize: '14px' }}>
          Devotional Offerings & Services
        </p>
      </div>
      <div className="invoice-meta">
        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0' }}>
           {order?.status === 'Refund_Receipt_Generated' ? 'REFUND RECEIPT' : 'PAYMENT RECEIPT'}
        </h2>
        <p style={{ margin: '0 0 4px 0' }}>
           <strong>{order?.status === 'Refund_Receipt_Generated' ? 'Ref No:' : 'No:'}</strong> {order?.invoiceNumber || order?._id.slice(-8).toUpperCase()}
        </p>
        <p style={{ margin: 0 }}><strong>Date:</strong> {formatDate(order?.createdAt)}</p>
      </div>
    </div>
  );
}

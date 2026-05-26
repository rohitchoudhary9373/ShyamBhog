export default function PaymentDetails({ order }) {
  const isPaid = order?.status !== 'Pending';
  const paymentStatus = isPaid ? 'Paid' : 'Pending';

  return (
    <div className="payment-details">
      <div className="invoice-section-title">Payment Information</div>
      <div className="payment-row">
        <span style={{ color: '#64748b' }}>Status</span>
        <span className={`payment-status-badge ${isPaid ? 'status-success' : 'status-pending'}`}>
          {paymentStatus}
        </span>
      </div>
      
      <div className="payment-row">
        <span style={{ color: '#64748b' }}>Method</span>
        <span style={{ fontWeight: 600 }}>{order?.paymentMethod || 'Razorpay'}</span>
      </div>
      
      {order?.paymentId && (
        <div className="payment-row">
          <span style={{ color: '#64748b' }}>Transaction ID</span>
          <span style={{ fontWeight: 600, fontSize: '13px' }}>{order.paymentId}</span>
        </div>
      )}
    </div>
  );
}

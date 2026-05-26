import { formatCurrency } from '../../utils/invoiceFormatter';

export default function InvoiceSummary({ order }) {
  const items = order?.items || [];
  const totalItemsCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  // Calculate raw subtotal from items to ensure accuracy
  const subtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

  return (
    <div className="summary-box">
      <div className="summary-row">
        <span>Total Items</span>
        <span>{totalItemsCount}</span>
      </div>
      <div className="summary-row">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      
      {order?.walletDeduction > 0 && (
        <div className="summary-row" style={{ color: '#16a34a' }}>
          <span>Wallet Deduction</span>
          <span>-{formatCurrency(order.walletDeduction)}</span>
        </div>
      )}

      <div className="summary-total">
        <span>Grand Total</span>
        <span>{formatCurrency(order?.totalPrice || order?.price || subtotal)}</span>
      </div>
    </div>
  );
}

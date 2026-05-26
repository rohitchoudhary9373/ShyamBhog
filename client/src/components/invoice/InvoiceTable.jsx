import { formatCurrency, cleanItemName } from '../../utils/invoiceFormatter';

export default function InvoiceTable({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="invoice-table-wrapper">
      <table className="invoice-table">
        <thead>
          <tr>
            <th style={{ width: '10%' }}>SR.</th>
            <th style={{ width: '45%' }}>OFFERING / VARIANT</th>
            <th style={{ width: '15%' }} className="align-right">QTY</th>
            <th style={{ width: '15%' }} className="align-right">UNIT PRICE</th>
            <th style={{ width: '15%' }} className="align-right">TOTAL PRICE</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const qty = item?.quantity || 1;
            const price = item?.price || 0;
            const itemTotal = price * qty;
            
            return (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    {cleanItemName(item?.title || item?.serviceName)}
                  </div>
                  {item?.slot && (
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Date: {new Date(item.slot).toLocaleDateString('en-IN')}
                    </div>
                  )}
                </td>
                <td className="align-right">{qty}</td>
                <td className="align-right">{formatCurrency(price)}</td>
                <td className="align-right" style={{ fontWeight: 700, color: '#0f172a' }}>
                  {formatCurrency(itemTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

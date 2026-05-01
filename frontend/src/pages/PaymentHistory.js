import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments/history')
      .then(r => setPayments(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusColors = {
    paid: { bg: '#ECFDF5', color: '#10B981', label: '✅ Paid' },
    created: { bg: '#FFF3CD', color: '#856404', label: '⏳ Pending' },
    failed: { bg: '#FEF2F2', color: '#EF4444', label: '❌ Failed' },
    refunded: { bg: '#EFF6FF', color: '#3B82F6', label: '↩️ Refunded' },
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>;

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 20 }}>Payment History</h2>

      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { icon: '💰', value: `₹${payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0).toLocaleString()}`, label: 'Total Paid' },
          { icon: '✅', value: payments.filter(p => p.status === 'paid').length, label: 'Successful' },
          { icon: '❌', value: payments.filter(p => p.status === 'failed').length, label: 'Failed' },
          { icon: '💳', value: payments.length, label: 'Total Transactions' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="icon">{s.icon}</div>
            <div className="value">{s.value}</div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </div>

      {payments.length === 0 ? (
        <div className="empty-state">
          <div className="icon">💳</div>
          <h3>No payments yet</h3>
          <p>Your payment history will appear here</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Service</th>
                <th>Provider</th>
                <th>Booking Ref</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => {
                const s = statusColors[p.status] || statusColors.created;
                return (
                  <tr key={p.id}>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(p.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.service_title}</td>
                    <td>{p.provider_name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{p.booking_ref}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{Number(p.amount).toLocaleString()}</td>
                    <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{p.payment_method || '—'}</td>
                    <td>
                      <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

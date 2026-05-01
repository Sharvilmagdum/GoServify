// ============================================================
// In your UserDashboard.js — make these changes:
// ============================================================

// 1. ADD import at top:
import { useNavigate } from 'react-router-dom';
import PaymentHistory from '../components/PaymentHistory';

// 2. ADD 'payments' tab to your tabs array:
const tabs = [
  { id: 'all', label: `All (${bookings.length})` },
  { id: 'pending', label: `Pending (${bookings.filter(b => b.status === 'pending').length})` },
  { id: 'accepted', label: 'Accepted' },
  { id: 'completed', label: 'Completed' },
  { id: 'payments', label: '💳 Payments' },   // ADD THIS
];

// 3. ADD payments tab content - add this BEFORE the closing of the component:
{activeTab === 'payments' && <PaymentHistory />}

// 4. ADD "Pay Now" button in booking cards.
// Find the booking card actions div and ADD this button:
{(b.status === 'accepted' || b.status === 'completed') && b.payment_status !== 'paid' && (
  <button
    className="btn btn-sm btn-primary"
    onClick={() => navigate(`/payment/${b.id}`)}
  >
    💳 Pay Now
  </button>
)}
{b.payment_status === 'paid' && (
  <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
    💳 Paid ✓
  </span>
)}

// 5. ADD payment_status to the booking info display:
<div>💳 {b.payment_status === 'paid' ? 'Paid' : 'Unpaid'}</div>

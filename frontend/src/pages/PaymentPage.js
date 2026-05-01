import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { bookingsAPI } from '../utils/api';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// Load Razorpay script dynamically
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    bookingsAPI.getById(bookingId)
      .then(r => setBooking(r.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handlePayment = async () => {
    setError('');
    setPaying(true);
    try {
      // Load Razorpay SDK
      const loaded = await loadRazorpay();
      if (!loaded) {
        setError('Failed to load payment gateway. Please check your internet connection.');
        setPaying(false);
        return;
      }

      // Create order on backend
      const orderRes = await api.post('/payments/create-order', { booking_id: parseInt(bookingId) });
      const { orderId, amount, currency, keyId, serviceName, userName, userEmail } = orderRes.data;

      // Razorpay options
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Servify',
        description: serviceName,
        order_id: orderId,
        prefill: {
          name: userName || user?.name,
          email: userEmail || user?.email,
          contact: user?.phone || '',
        },
        theme: { color: '#FF6B35' },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setError('Payment cancelled. You can try again.');
          }
        },
        handler: async (response) => {
          try {
            // Verify payment on backend
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: parseInt(bookingId),
            });
            setSuccess(true);
          } catch (err) {
            setError('Payment verification failed. Contact support if amount was deducted.');
          } finally {
            setPaying(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error.description}`);
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
      setPaying(false);
    }
  };

  if (loading) return <div><Navbar /><div className="loading-screen"><div className="spinner"></div></div></div>;

  if (success) {
    return (
      <div><Navbar />
        <div style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 420, background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 40, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>💳✅</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#10B981' }}>Payment Successful!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>₹{Number(booking?.total_price).toLocaleString()} paid for</p>
            <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 24 }}>{booking?.service_title}</p>
            <div style={{ background: '#ECFDF5', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#10B981', marginBottom: 24 }}>
              ✅ A payment confirmation email has been sent to {user?.email}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>View My Bookings</button>
              <button className="btn btn-secondary" onClick={() => navigate('/search')}>Browse More</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = booking?.payment_status === 'paid';

  return (
    <div>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')} style={{ marginBottom: 20 }}>← Back</button>

          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #FF6B35, #F7C59F)', padding: '24px 28px' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>Complete Payment</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'white' }}>
                ₹{Number(booking?.total_price).toLocaleString()}
              </div>
            </div>

            <div style={{ padding: 28 }}>
              {/* Booking details */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Booking Details</div>
                {[
                  ['Service', booking?.service_title],
                  ['Provider', booking?.provider_name],
                  ['Date', booking?.scheduled_date ? new Date(booking.scheduled_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : '-'],
                  ['Time', booking?.scheduled_time],
                  ['Ref', `#${booking?.booking_ref}`],
                  ['Status', booking?.status],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 16, fontWeight: 700 }}>
                  <span>Total Amount</span>
                  <span style={{ color: 'var(--primary)' }}>₹{Number(booking?.total_price).toLocaleString()}</span>
                </div>
              </div>

              {/* Already paid */}
              {isPaid && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#10B981', marginBottom: 16, textAlign: 'center', fontWeight: 600 }}>
                  ✅ This booking is already paid
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ background: '#FEF2F2', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #FECACA' }}>
                  {error}
                </div>
              )}

              {/* Pay button */}
              {!isPaid && (
                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', fontSize: 16, position: 'relative' }}
                  onClick={handlePayment}
                  disabled={paying || booking?.status === 'rejected' || booking?.status === 'cancelled'}
                >
                  {paying ? '⏳ Processing...' : `💳 Pay ₹${Number(booking?.total_price).toLocaleString()}`}
                </button>
              )}

              {/* Secure badges */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>🔒 256-bit SSL</span>
                <span>✅ Razorpay Secured</span>
                <span>🛡️ Safe Checkout</span>
              </div>

              {/* Payment methods */}
              <div style={{ marginTop: 16, padding: '12px', background: 'var(--bg)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Accepted Payment Methods</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>💳 Credit/Debit Card &nbsp;|&nbsp; 📱 UPI &nbsp;|&nbsp; 🏦 Net Banking &nbsp;|&nbsp; 💰 Wallets</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

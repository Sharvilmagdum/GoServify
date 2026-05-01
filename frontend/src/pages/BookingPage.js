import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { servicesAPI, bookingsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function BookingPage() {
  const { serviceId } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const [form, setForm] = useState({
    scheduled_date: minDate,
    scheduled_time: '10:00',
    address: user?.address || '',
    city: user?.city || '',
    notes: ''
  });

  useEffect(() => {
    servicesAPI.getById(serviceId)
      .then(r => setService(r.data))
      .catch(() => navigate('/search'))
      .finally(() => setLoading(false));
  }, [serviceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await bookingsAPI.create({
        service_id: parseInt(serviceId),
        ...form,
        lat: user?.lat,
        lng: user?.lng
      });
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div><Navbar /><div className="loading-screen"><div className="spinner"></div></div></div>;

  if (success) {
    return (
      <div>
        <Navbar />
        <div style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 440 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Booking Confirmed!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Your booking reference is</p>
            <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '12px 24px', borderRadius: 8, fontSize: 24, fontWeight: 800, letterSpacing: 2, marginBottom: 20, display: 'inline-block' }}>
              #{success.booking_ref}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
              We've sent a confirmation email to {user.email}. The provider will accept shortly.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>View My Bookings</button>
              <button className="btn btn-secondary" onClick={() => navigate('/search')}>Browse More</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const timeSlots = [];
  for (let h = 7; h <= 20; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 20) timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  return (
    <div>
      <Navbar />
      <div className="page-container" style={{ maxWidth: 780 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>← Back</button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Book Service</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Complete your booking for {service?.title}</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28 }}>
          <div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 20 }}>Schedule & Location</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input className="form-input" type="date" min={minDate} value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preferred Time *</label>
                    <select className="form-select" value={form.scheduled_time} onChange={e => setForm({ ...form, scheduled_time: e.target.value })} required>
                      {timeSlots.map(t => (
                        <option key={t} value={t}>{parseInt(t) < 12 ? t + ' AM' : t === '12:00' ? '12:00 PM' : `${(parseInt(t) - 12).toString().padStart(2, '0')}:${t.split(':')[1]} PM`}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Service Address *</label>
                  <input className="form-input" placeholder="Full address where service is needed" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input className="form-input" placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Special Instructions</label>
                  <textarea className="form-textarea" placeholder="Any specific requirements or notes for the provider..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
                </div>

                {error && <div style={{ background: '#FEF2F2', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
                  {submitting ? '⏳ Confirming...' : `Confirm Booking — ₹${Number(service?.price).toLocaleString()}`}
                </button>
              </form>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, position: 'sticky', top: 88 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 16 }}>Booking Summary</h3>
              <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>{service?.category_icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{service?.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>by {service?.provider_name}</div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: 'var(--text-muted)' }}>Service fee</span>
                <span style={{ fontWeight: 600 }}>₹{Number(service?.price).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)' }}>
                <span>Platform fee</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary)' }}>₹{Number(service?.price).toLocaleString()}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>Pay directly to provider after service</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

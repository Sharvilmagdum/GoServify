import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { StarInput } from '../components/Stars';
import { bookingsAPI, userAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const STATUS_MAP = {
  pending: { label: 'Pending', color: 'badge-pending', icon: '⏳' },
  accepted: { label: 'Accepted', color: 'badge-accepted', icon: '✅' },
  rejected: { label: 'Declined', color: 'badge-rejected', icon: '❌' },
  in_progress: { label: 'In Progress', color: 'badge-in_progress', icon: '🔧' },
  completed: { label: 'Completed', color: 'badge-completed', icon: '🌟' },
  cancelled: { label: 'Cancelled', color: 'badge-cancelled', icon: '🚫' }
};

export default function UserDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review_text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const load = async () => {
    try {
      const res = await bookingsAPI.getMyBookings();
      setBookings(res.data);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('booking_update', (data) => {
      setBookings(prev => prev.map(b => b.id === data.booking_id ? { ...b, status: data.status } : b));
    });
    return () => socket.off('booking_update');
  }, [socket]);

  const submitReview = async () => {
    setSubmittingReview(true);
    try {
      await bookingsAPI.submitReview(reviewModal.id, reviewForm);
      setReviewModal(null);
      load();
    } catch (e) {
      alert('Review already submitted or error occurred');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filtered = activeTab === 'all' ? bookings : bookings.filter(b => b.status === activeTab);

  const tabs = [
    { id: 'all', label: `All (${bookings.length})` },
    { id: 'pending', label: `Pending (${bookings.filter(b => b.status === 'pending').length})` },
    { id: 'accepted', label: 'Accepted' },
    { id: 'completed', label: 'Completed' }
  ];

  return (
    <div>
      <Navbar />
      <div className="page-container" style={{ maxWidth: 900 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, marginBottom: 4 }}>My Bookings</h1>
            <p style={{ color: 'var(--text-muted)' }}>Track all your service bookings</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/search')}>+ Book New Service</button>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            { icon: '📋', value: bookings.length, label: 'Total Bookings' },
            { icon: '✅', value: bookings.filter(b => b.status === 'completed').length, label: 'Completed' },
            { icon: '⏳', value: bookings.filter(b => b.status === 'pending').length, label: 'Pending' },
            { icon: '🌟', value: bookings.filter(b => b.my_rating).length, label: 'Reviews Given' }
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="icon">{s.icon}</div>
              <div className="value">{s.value}</div>
              <div className="label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
          {tabs.map(t => (
            <button key={t.id} className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <h3>No bookings yet</h3>
            <p>Browse services and book your first one!</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/search')}>Browse Services</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(b => {
              const status = STATUS_MAP[b.status] || STATUS_MAP.pending;
              return (
                <div key={b.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 28 }}>{b.category_icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{b.service_title}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>by {b.provider_name} · {b.provider_city}</div>
                      </div>
                    </div>
                    <span className={`badge ${status.color}`}>{status.icon} {status.label}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                    <div>📅 {new Date(b.scheduled_date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    <div>🕐 {b.scheduled_time}</div>
                    <div>💰 ₹{Number(b.total_price).toLocaleString()}</div>
                    <div style={{ gridColumn: '1/-1' }}>📍 {b.address}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ref: #{b.booking_ref}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {b.status === 'completed' && !b.my_rating && (
                        <button className="btn btn-sm btn-primary" onClick={() => setReviewModal(b)}>⭐ Rate Service</button>
                      )}
                      {b.my_rating && (
                        <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>✓ Rated {b.my_rating}★</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Rate Your Experience</div>
              <button className="modal-close" onClick={() => setReviewModal(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{reviewModal.service_title} by {reviewModal.provider_name}</p>
            <div className="form-group">
              <label className="form-label">Rating</label>
              <StarInput value={reviewForm.rating} onChange={r => setReviewForm({ ...reviewForm, rating: r })} />
            </div>
            <div className="form-group">
              <label className="form-label">Review (optional)</label>
              <textarea className="form-textarea" placeholder="Share your experience..." value={reviewForm.review_text} onChange={e => setReviewForm({ ...reviewForm, review_text: e.target.value })} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={submitReview} disabled={submittingReview}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

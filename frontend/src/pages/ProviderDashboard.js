import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { StarDisplay } from '../components/Stars';
import { providerAPI, servicesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

function ProviderSidebar({ active, setActive }) {
  const nav = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'bookings', icon: '📋', label: 'Bookings' },
    { id: 'services', icon: '🔧', label: 'My Services' },
    { id: 'reviews', icon: '⭐', label: 'Reviews' },
    { id: 'profile', icon: '👤', label: 'Profile' }
  ];
  return (
    <div className="sidebar">
      <div className="sidebar-nav">
        {nav.map(n => (
          <div key={n.id} className={`sidebar-link ${active === n.id ? 'active' : ''}`} onClick={() => setActive(n.id)}>
            <span className="sidebar-icon">{n.icon}</span>
            {n.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewTab({ profile }) {
  const stats = profile?.stats || {};
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 20 }}>Welcome back, {profile?.name?.split(' ')[0]}! 👋</h2>
      <div className="stats-grid">
        {[
          { icon: '💰', value: `₹${Number(stats.earnings || 0).toLocaleString()}`, label: 'Total Earnings' },
          { icon: '📋', value: stats.total_bookings || 0, label: 'Total Bookings' },
          { icon: '✅', value: stats.completed || 0, label: 'Completed' },
          { icon: '⏳', value: stats.pending || 0, label: 'Pending' },
          { icon: '⭐', value: Number(profile?.avg_rating || 0).toFixed(1), label: 'Avg Rating' },
          { icon: '💬', value: profile?.total_reviews || 0, label: 'Reviews' }
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="icon">{s.icon}</div>
            <div className="value">{s.value}</div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </div>
      {!profile?.is_verified && (
        <div style={{ background: '#FFF3CD', border: '1px solid #FFD700', borderRadius: 12, padding: '16px 20px', marginTop: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 24 }}>⏳</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Pending Verification</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Your account is being reviewed. Verification badge improves trust and bookings.</div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const { socket } = useSocket();

  const load = async () => {
    setLoading(true);
    try {
      const res = await providerAPI.getBookings(filter ? { status: filter } : {});
      setBookings(res.data);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_booking', load);
    return () => socket.off('new_booking', load);
  }, [socket]);

  const updateStatus = async (id, status) => {
    try {
      await providerAPI.updateBookingStatus(id, { status });
      load();
    } catch (e) { alert('Update failed'); }
  };

  const STATUS_COLORS = { pending: 'badge-pending', accepted: 'badge-accepted', rejected: 'badge-rejected', in_progress: 'badge-in_progress', completed: 'badge-completed' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Bookings</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {['pending', 'accepted', 'in_progress', 'completed', ''].map((s, i) => (
            <button key={i} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="spinner" style={{ margin: '40px auto' }}></div> : bookings.length === 0 ? (
        <div className="empty-state"><div className="icon">📋</div><h3>No bookings</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bookings.map(b => (
            <div key={b.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{b.service_title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Customer: {b.user_name} · {b.user_phone || 'No phone'}</div>
                </div>
                <span className={`badge ${STATUS_COLORS[b.status] || 'badge-pending'}`}>{b.status}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                <div>📅 {new Date(b.scheduled_date).toLocaleDateString('en-IN')}</div>
                <div>🕐 {b.scheduled_time}</div>
                <div>💰 ₹{Number(b.total_price).toLocaleString()}</div>
                <div style={{ gridColumn: '1/-1' }}>📍 {b.address}</div>
                {b.notes && <div style={{ gridColumn: '1/-1' }}>📝 {b.notes}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                {b.status === 'pending' && (
                  <>
                    <button className="btn btn-sm btn-success" onClick={() => updateStatus(b.id, 'accepted')}>✅ Accept</button>
                    <button className="btn btn-sm btn-danger" onClick={() => updateStatus(b.id, 'rejected')}>❌ Reject</button>
                  </>
                )}
                {b.status === 'accepted' && (
                  <button className="btn btn-sm btn-primary" onClick={() => updateStatus(b.id, 'in_progress')}>🔧 Start</button>
                )}
                {b.status === 'in_progress' && (
                  <button className="btn btn-sm btn-success" onClick={() => updateStatus(b.id, 'completed')}>🌟 Mark Complete</button>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>#{b.booking_ref}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ServicesTab() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category_id: '', title: '', description: '', price: '', price_type: 'fixed', duration_mins: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([providerAPI.getServices(), servicesAPI.getCategories()])
      .then(([s, c]) => { setServices(s.data); setCategories(c.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    try {
      await providerAPI.addService(form);
      const res = await providerAPI.getServices();
      setServices(res.data);
      setShowAdd(false);
      setForm({ category_id: '', title: '', description: '', price: '', price_type: 'fixed', duration_mins: '' });
    } catch (e) { alert('Failed to add service'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this service?')) return;
    await providerAPI.deleteService(id);
    setServices(s => s.filter(x => x.id !== id));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>My Services</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Service</button>
      </div>

      {showAdd && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Add New Service</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input className="form-input" type="number" placeholder="500" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Service Title *</label>
            <input className="form-input" placeholder="e.g. Deep Home Cleaning (2BHK)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Describe what's included in this service..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Price Type</label>
              <select className="form-select" value={form.price_type} onChange={e => setForm({ ...form, price_type: e.target.value })}>
                <option value="fixed">Fixed</option>
                <option value="hourly">Per Hour</option>
                <option value="negotiable">Negotiable</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <input className="form-input" type="number" placeholder="60" value={form.duration_mins} onChange={e => setForm({ ...form, duration_mins: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleAdd}>Add Service</button>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div className="spinner" style={{ margin: '40px auto' }}></div> : services.length === 0 ? (
        <div className="empty-state"><div className="icon">🔧</div><h3>No services yet</h3><p>Add your first service to start receiving bookings</p></div>
      ) : (
        <div className="services-grid">
          {services.map(s => (
            <div key={s.id} className="card card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>{s.category_icon} {s.category_name}</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{Number(s.price).toLocaleString()}</span>
              </div>
              <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>{s.title}</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{s.description?.slice(0, 80)}...</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Remove</button>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: s.is_active ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {s.is_active ? '● Active' : '● Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    providerAPI.getReviews().then(r => setReviews(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 20 }}>Customer Reviews</h2>
      {loading ? <div className="spinner" style={{ margin: '40px auto' }}></div> : reviews.length === 0 ? (
        <div className="empty-state"><div className="icon">⭐</div><h3>No reviews yet</h3><p>Complete bookings to receive reviews</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map(r => (
            <div key={r.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>{r.user_name}</div>
                <StarDisplay rating={r.rating} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{r.service_title}</div>
              {r.review_text && <p style={{ fontSize: 14 }}>{r.review_text}</p>}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{new Date(r.created_at).toLocaleDateString('en-IN')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileTab({ profile, onRefresh }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', bio: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm({ name: profile.name || '', phone: profile.phone || '', address: profile.address || '', city: profile.city || '', bio: profile.bio || '' });
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await providerAPI.updateProfile(form);
      onRefresh();
      alert('Profile updated!');
    } catch (e) { alert('Update failed'); } finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: 540 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 20 }}>Provider Profile</h2>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">City</label>
          <input className="form-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Locality / Area</label>
          <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Bio / About</label>
        <textarea className="form-textarea" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={4} placeholder="Describe your experience and skills..." />
      </div>
      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
    </div>
  );
}

export default function ProviderDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);

  const loadProfile = async () => {
    try {
      const res = await providerAPI.getProfile();
      setProfile(res.data);
    } catch (e) {}
  };

  useEffect(() => { loadProfile(); }, []);

  const TABS = {
    overview: <OverviewTab profile={profile} />,
    bookings: <BookingsTab />,
    services: <ServicesTab />,
    reviews: <ReviewsTab />,
    profile: <ProfileTab profile={profile} onRefresh={loadProfile} />
  };

  return (
    <div>
      <Navbar />
      <div className="dashboard-layout">
        <ProviderSidebar active={activeTab} setActive={setActiveTab} />
        <div className="dashboard-content">
          {TABS[activeTab]}
        </div>
      </div>
    </div>
  );
}

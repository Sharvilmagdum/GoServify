import { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import Navbar from '../components/Navbar';
import { adminAPI } from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

function AdminSidebar({ active, setActive }) {
  const nav = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'bookings', icon: '📋', label: 'Bookings' },
    { id: 'providers', icon: '🔧', label: 'Providers' },
    { id: 'users', icon: '👥', label: 'Users' }
  ];
  return (
    <div className="sidebar">
      <div style={{ padding: '0 2px', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Admin Panel</div>
      </div>
      <div className="sidebar-nav">
        {nav.map(n => (
          <div key={n.id} className={`sidebar-link ${active === n.id ? 'active' : ''}`} onClick={() => setActive(n.id)}>
            <span className="sidebar-icon">{n.icon}</span> {n.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardTab({ data }) {
  if (!data) return <div className="spinner" style={{ margin: '40px auto' }}></div>;

  const { bookings: b, users: u, providers: p, services: s, charts } = data;

  const revenueData = {
    labels: charts.monthly_revenue.map(r => r.month),
    datasets: [
      { label: 'Revenue (₹)', data: charts.monthly_revenue.map(r => r.revenue), backgroundColor: 'rgba(255,107,53,0.7)', borderRadius: 6 },
      { label: 'Bookings', data: charts.monthly_revenue.map(r => r.bookings), backgroundColor: 'rgba(247,197,159,0.7)', borderRadius: 6 }
    ]
  };

  const categoryData = {
    labels: charts.top_categories.map(c => `${c.icon} ${c.name}`),
    datasets: [{ data: charts.top_categories.map(c => c.booking_count), backgroundColor: ['#FF6B35', '#F7C59F', '#1A1A2E', '#10B981', '#3B82F6'], borderWidth: 0 }]
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 20 }}>Platform Overview</h2>
      <div className="stats-grid">
        {[
          { icon: '📋', value: b.total_bookings, label: 'Total Bookings', sub: `${b.today_bookings} today` },
          { icon: '💰', value: `₹${Number(b.total_revenue || 0).toLocaleString()}`, label: 'Total Revenue' },
          { icon: '👥', value: u.total_users, label: 'Users', sub: `+${u.new_this_week} this week` },
          { icon: '🔧', value: p.total_providers, label: 'Providers', sub: `${p.pending_verification} pending` },
          { icon: '✅', value: b.completed, label: 'Completed' },
          { icon: '⏳', value: b.pending, label: 'Pending' }
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="icon">{s.icon}</div>
            <div className="value">{s.value}</div>
            <div className="label">{s.label}</div>
            {s.sub && <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 2 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginTop: 24 }}>
        {charts.monthly_revenue.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 16 }}>Monthly Revenue & Bookings</h3>
            <Bar data={revenueData} options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }} />
          </div>
        )}
        {charts.top_categories.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 16 }}>Top Categories</h3>
            <Doughnut data={categoryData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        )}
      </div>

      {charts.top_cities.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginTop: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 16 }}>Top Cities by Bookings</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {charts.top_cities.map((c, i) => (
              <div key={i} style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 16px', fontSize: 14 }}>
                📍 {c.city || 'Unknown'}: <strong>{c.booking_count}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProvidersTab() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => adminAPI.getProviders().then(r => setProviders(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const verify = async (id) => { await adminAPI.verifyProvider(id); load(); };
  const toggle = async (id) => { await adminAPI.toggleProvider(id); load(); };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 20 }}>Service Providers ({providers.length})</h2>
      {loading ? <div className="spinner" style={{ margin: '40px auto' }}></div> : (
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>Provider</th><th>City</th><th>Services</th><th>Bookings</th><th>Rating</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {providers.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.email}</div>
                  </td>
                  <td>{p.city}</td>
                  <td>{p.service_count}</td>
                  <td>{p.total_bookings}</td>
                  <td>{Number(p.avg_rating) > 0 ? `⭐ ${Number(p.avg_rating).toFixed(1)}` : '-'}</td>
                  <td>
                    <span className={`badge ${p.is_verified ? 'badge-verified' : 'badge-unverified'}`}>
                      {p.is_verified ? '✓ Verified' : '⏳ Pending'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => verify(p.id)}>
                        {p.is_verified ? 'Unverify' : 'Verify'}
                      </button>
                      <button className={`btn btn-sm ${p.is_active ? 'btn-danger' : 'btn-success'}`} onClick={() => toggle(p.id)}>
                        {p.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => adminAPI.getUsers().then(r => setUsers(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const toggle = async (id) => { await adminAPI.toggleUser(id); load(); };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 20 }}>Customers ({users.length})</h2>
      {loading ? <div className="spinner" style={{ margin: '40px auto' }}></div> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>City</th><th>Phone</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.city}</td>
                  <td>{u.phone || '-'}</td>
                  <td>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  <td><span className={`badge ${u.is_active ? 'badge-completed' : 'badge-rejected'}`}>{u.is_active ? 'Active' : 'Suspended'}</span></td>
                  <td><button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`} onClick={() => toggle(u.id)}>{u.is_active ? 'Suspend' : 'Activate'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AllBookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    adminAPI.getBookings(filter ? { status: filter } : {}).then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, [filter]);

  const statusColors = { pending: 'badge-pending', accepted: 'badge-accepted', rejected: 'badge-rejected', in_progress: 'badge-in_progress', completed: 'badge-completed', cancelled: 'badge-cancelled' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>All Bookings ({bookings.length})</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'pending', 'completed', 'rejected'].map(s => (
            <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>{s || 'All'}</button>
          ))}
        </div>
      </div>
      {loading ? <div className="spinner" style={{ margin: '40px auto' }}></div> : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Ref</th><th>Service</th><th>Customer</th><th>Provider</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{b.booking_ref}</td>
                  <td>{b.category_name} · {b.service_title}</td>
                  <td>{b.user_name}</td>
                  <td>{b.provider_name}</td>
                  <td>{new Date(b.scheduled_date).toLocaleDateString('en-IN')}</td>
                  <td style={{ fontWeight: 600 }}>₹{Number(b.total_price).toLocaleString()}</td>
                  <td><span className={`badge ${statusColors[b.status] || 'badge-pending'}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashData, setDashData] = useState(null);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      adminAPI.getDashboard().then(r => setDashData(r.data)).catch(e => console.error(e));
    }
  }, [activeTab]);

  const TABS = {
    dashboard: <DashboardTab data={dashData} />,
    bookings: <AllBookingsTab />,
    providers: <ProvidersTab />,
    users: <UsersTab />
  };

  return (
    <div>
      <Navbar />
      <div className="dashboard-layout">
        <AdminSidebar active={activeTab} setActive={setActiveTab} />
        <div className="dashboard-content">{TABS[activeTab]}</div>
      </div>
    </div>
  );
}

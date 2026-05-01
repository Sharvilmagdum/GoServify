import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function LoginPage() {
  const [params] = useSearchParams();
  const [roleTab, setRoleTab] = useState(params.get('role') || 'user');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loginFn = roleTab === 'admin' ? authAPI.loginAdmin : roleTab === 'provider' ? authAPI.loginProvider : authAPI.loginUser;
      const res = await loginFn(form);
      login(res.data.token, res.data.user);
      if (roleTab === 'admin') navigate('/admin');
      else if (roleTab === 'provider') navigate('/provider');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'user', label: '👤 Customer' },
    { id: 'provider', label: '🔧 Provider' },
    { id: 'admin', label: '⚙️ Admin' }
  ];

  return (
    <div>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔧</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>Welcome back</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Sign in to your Servify account</p>
          </div>

          {/* Role tabs */}
          <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 4, marginBottom: 24, border: '1px solid var(--border)' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setRoleTab(t.id)}
                style={{ flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: roleTab === t.id ? 'white' : 'transparent', color: roleTab === t.id ? 'var(--primary)' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: roleTab === t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 28, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
              {error && <div style={{ background: '#FEF2F2', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #FECACA' }}>{error}</div>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
                {loading ? '⏳ Signing in...' : `Sign in as ${roleTab.charAt(0).toUpperCase() + roleTab.slice(1)}`}
              </button>
            </form>

            {roleTab !== 'admin' && (
              <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
                Don't have an account?{' '}
                <Link to={`/register?type=${roleTab}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  Sign up free
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

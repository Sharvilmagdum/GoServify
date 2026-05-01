import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const CITIES = ['Bangalore', 'Mumbai', 'Pune', 'Kolhapur', 'Hyderabad', 'Chennai', 'Delhi', 'Ahmedabad', 'Jaipur', 'Surat'];

export default function RegisterPage() {
  const [params] = useSearchParams();
  const [type, setType] = useState(params.get('type') || 'user');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '', city: '', bio: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.city) return setError('Please select your city');
    setLoading(true);
    try {
      const res = await (type === 'provider' ? authAPI.registerProvider(form) : authAPI.registerUser(form));
      login(res.data.token, res.data.user);
      navigate(type === 'provider' ? '/provider' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{type === 'provider' ? '🔧' : '👤'}</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>
              {type === 'provider' ? 'Join as a Provider' : 'Create Account'}
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
              {type === 'provider' ? 'Start earning from your skills' : 'Book local services instantly'}
            </p>
          </div>

          {/* Type toggle */}
          <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 4, marginBottom: 24, border: '1px solid var(--border)' }}>
            {[['user', '👤 Customer'], ['provider', '🔧 Service Provider']].map(([t, l]) => (
              <button key={t} onClick={() => setType(t)}
                style={{ flex: 1, padding: '10px 4px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: type === t ? 'white' : 'transparent', color: type === t ? 'var(--primary)' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: type === t ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
                {l}
              </button>
            ))}
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 28, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" name="name" placeholder="Rahul Sharma" value={form.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone {type === 'provider' ? '*' : ''}</label>
                  <input className="form-input" name="phone" placeholder="9876543210" value={form.phone} onChange={handleChange} required={type === 'provider'} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-input" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" name="password" type="password" placeholder="Minimum 6 characters" value={form.password} onChange={handleChange} required minLength={6} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <select className="form-select" name="city" value={form.city} onChange={handleChange} required>
                    <option value="">Select city</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Area / Locality *</label>
                  <input className="form-input" name="address" placeholder="e.g. Koramangala" value={form.address} onChange={handleChange} required />
                </div>
              </div>
              {type === 'provider' && (
                <div className="form-group">
                  <label className="form-label">About You / Skills</label>
                  <textarea className="form-textarea" name="bio" placeholder="Describe your expertise, years of experience, specializations..." value={form.bio} onChange={handleChange} rows={3} />
                </div>
              )}

              <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--primary)', marginBottom: 16, display: 'flex', gap: 8 }}>
                📍 Your address will be geocoded to match you with nearby {type === 'provider' ? 'customers' : 'providers'}.
              </div>

              {error && <div style={{ background: '#FEF2F2', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #FECACA' }}>{error}</div>}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? '⏳ Creating account...' : `Create ${type === 'provider' ? 'Provider' : 'Customer'} Account`}
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to={`/login?role=${type}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

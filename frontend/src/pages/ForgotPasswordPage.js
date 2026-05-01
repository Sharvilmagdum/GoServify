import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('user');
  const [status, setStatus] = useState(''); // 'loading' | 'sent' | 'error'
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('loading');
    try {
      await api.post('/auth/forgot-password', { email, userType });
      setStatus('sent');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
      setStatus('error');
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {status === 'sent' ? (
            // Success state
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 36, border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Check Your Email!</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                We sent a password reset link to <strong>{email}</strong>.<br/>
                Check your inbox and click the link to reset your password.
              </p>
              <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: 'var(--primary)', marginBottom: 20 }}>
                ⏰ The link expires in <strong>1 hour</strong>
              </div>
              <Link to="/login" className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>
                Back to Login
              </Link>
              <button
                style={{ marginTop: 12, background: 'none', color: 'var(--text-muted)', fontSize: 13, border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => { setStatus(''); setEmail(''); }}
              >
                Try a different email
              </button>
            </div>
          ) : (
            // Form state
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>🔐</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>Forgot Password?</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
                  No worries! Enter your email and we'll send you a reset link.
                </p>
              </div>

              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 28, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <form onSubmit={handleSubmit}>
                  {/* Account type tabs */}
                  <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 4, marginBottom: 20, border: '1px solid var(--border)' }}>
                    {[['user', '👤 Customer'], ['provider', '🔧 Provider']].map(([t, l]) => (
                      <button key={t} type="button" onClick={() => setUserType(t)}
                        style={{ flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: userType === t ? 'white' : 'transparent', color: userType === t ? 'var(--primary)' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: userType === t ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
                        {l}
                      </button>
                    ))}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div style={{ background: '#FEF2F2', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #FECACA' }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 4 }}
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? '⏳ Sending...' : '📧 Send Reset Link'}
                  </button>
                </form>

                <div style={{ marginTop: 20, textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
                  Remember your password?{' '}
                  <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

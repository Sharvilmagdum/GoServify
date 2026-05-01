import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const userType = searchParams.get('type') || 'user';

  const [tokenValid, setTokenValid] = useState(null); // null=checking, true, false
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState(''); // 'loading' | 'success' | 'error'
  const [error, setError] = useState('');

  // Verify token on load
  useEffect(() => {
    if (!token) { setTokenValid(false); return; }
    api.get(`/auth/verify-token/${token}`)
      .then(() => setTokenValid(true))
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');
    setStatus('loading');
    try {
      await api.post('/auth/reset-password', { token, password });
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Try again.');
      setStatus('error');
    }
  };

  // Strength indicator
  const getStrength = (p) => {
    if (!p) return { label: '', color: '', width: 0 };
    if (p.length < 6) return { label: 'Too short', color: '#EF4444', width: 20 };
    if (p.length < 8) return { label: 'Weak', color: '#F59E0B', width: 40 };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: 'Fair', color: '#F59E0B', width: 60 };
    if (!/[^A-Za-z0-9]/.test(p)) return { label: 'Good', color: '#10B981', width: 80 };
    return { label: 'Strong', color: '#10B981', width: 100 };
  };
  const strength = getStrength(password);

  // Token checking
  if (tokenValid === null) {
    return (
      <div><Navbar />
        <div className="loading-screen"><div className="spinner"></div></div>
      </div>
    );
  }

  // Invalid token
  if (tokenValid === false) {
    return (
      <div><Navbar />
        <div style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Link Expired</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
              This password reset link is invalid or has expired.<br/>Reset links are only valid for 1 hour.
            </p>
            <Link to="/forgot-password" className="btn btn-primary">Request New Link</Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div><Navbar />
        <div style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 400, background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 36, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Password Reset!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
              Your password has been changed successfully.<br/>Redirecting to login in 3 seconds...
            </p>
            <Link to="/login" className="btn btn-primary">Login Now</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🔑</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>Create New Password</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Choose a strong password for your {userType} account</p>
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 28, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <form onSubmit={handleSubmit}>
              {/* New password */}
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {/* Strength bar */}
                {password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${strength.width}%`, background: strength.color, borderRadius: 2, transition: 'all 0.3s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: strength.color, marginTop: 4, fontWeight: 600 }}>{strength.label}</div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  style={{ borderColor: confirmPassword && confirmPassword !== password ? 'var(--danger)' : undefined }}
                />
                {confirmPassword && confirmPassword !== password && (
                  <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>Passwords do not match</div>
                )}
              </div>

              {/* Password tips */}
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                💡 Use 8+ characters with uppercase, numbers, and symbols for a strong password
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #FECACA' }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={status === 'loading'}>
                {status === 'loading' ? '⏳ Resetting...' : '🔐 Reset Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

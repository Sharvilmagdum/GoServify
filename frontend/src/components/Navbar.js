import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { userAPI, providerAPI } from '../utils/api';
import logo from '../assets/goservify-logo.png';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifCount, setNotifCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchNotifs = async () => {
      try {
        const api = user.role === 'provider' ? providerAPI : userAPI;
        const res = await api.getNotifications();

        const unread = res.data.filter((n) => !n.is_read).length;
        setNotifCount(unread);
      } catch (e) {
        console.error('Failed to fetch notifications:', e);
      }
    };

    fetchNotifs();

    const interval = setInterval(fetchNotifs, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowMenu(false);
  };

  const isActive = (path) => {
    return (
      location.pathname === path ||
      location.pathname.startsWith(path + '/')
    );
  };

  return (
    <nav className="navbar">
      {/* LOGO */}
      <Link
        to="/"
        className="nav-logo"
        style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
        }}
      >
        <img
          src={logo}
          alt="Goservify Logo"
          style={{
            height: '65px',
            width: 'auto',
            objectFit: 'contain',
          }}
        />
      </Link>

      {/* NAVIGATION LINKS */}
      <div className="nav-links">
        <Link
          to="/search"
          className={`nav-link ${isActive('/search') ? 'active' : ''}`}
        >
          Browse Services
        </Link>

        {!user && (
          <>
            <Link
              to="/login"
              className={`nav-link ${isActive('/login') ? 'active' : ''}`}
            >
              Login
            </Link>

            <Link to="/register" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </>
        )}
      </div>

      {/* USER SECTION */}
      {user && (
        <div
          className="nav-user"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            position: 'relative',
          }}
        >
          {/* CITY */}
          {user.city && (
            <div className="nav-city">
              📍 {user.city}
            </div>
          )}

          {/* NOTIFICATIONS */}
          <div
            style={{
              position: 'relative',
              cursor: 'pointer',
              fontSize: '20px',
            }}
            onClick={() => {
              if (user.role === 'provider') navigate('/provider');
              else if (user.role === 'admin') navigate('/admin');
              else navigate('/dashboard');
            }}
            title="Notifications"
          >
            🔔

            {notifCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-8px',
                  background: 'var(--primary)',
                  color: 'white',
                  borderRadius: '50%',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 4px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </div>

          {/* USER AVATAR */}
          <div
            className="nav-avatar"
            onClick={() => setShowMenu(!showMenu)}
            title={user.name}
            style={{
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--primary)',
              color: 'white',
              fontWeight: '700',
              fontSize: '18px',
            }}
          >
            {user.name?.[0]?.toUpperCase()}
          </div>

          {/* DROPDOWN MENU */}
          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '10px',
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                minWidth: '220px',
                zIndex: 999,
                padding: '8px',
              }}
            >
              {/* USER INFO */}
              <div
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: '6px',
                }}
              >
                <div
                  style={{
                    fontWeight: '700',
                    fontSize: '14px',
                  }}
                >
                  {user.name}
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    textTransform: 'capitalize',
                  }}
                >
                  {user.role}
                  {user.city ? ` · ${user.city}` : ''}
                </div>
              </div>

              {/* USER ROLE BASED OPTIONS */}
              {user.role === 'user' && (
                <div
                  className="sidebar-link"
                  onClick={() => {
                    navigate('/dashboard');
                    setShowMenu(false);
                  }}
                >
                  📋 My Bookings
                </div>
              )}

              {user.role === 'provider' && (
                <div
                  className="sidebar-link"
                  onClick={() => {
                    navigate('/provider');
                    setShowMenu(false);
                  }}
                >
                  📊 Provider Dashboard
                </div>
              )}

              {user.role === 'admin' && (
                <div
                  className="sidebar-link"
                  onClick={() => {
                    navigate('/admin');
                    setShowMenu(false);
                  }}
                >
                  ⚙️ Admin Panel
                </div>
              )}

              {/* LOGOUT */}
              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  marginTop: '6px',
                  paddingTop: '6px',
                }}
              >
                <div
                  className="sidebar-link"
                  style={{
                    color: 'var(--danger)',
                    cursor: 'pointer',
                  }}
                  onClick={handleLogout}
                >
                  🚪 Logout
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
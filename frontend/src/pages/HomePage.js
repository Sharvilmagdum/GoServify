import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ServiceCard from '../components/ServiceCard';
import { servicesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, svcRes] = await Promise.all([
          servicesAPI.getCategories(),
          servicesAPI.search({ city: user?.city || '', lat: user?.lat, lng: user?.lng, radius: 10 })
        ]);
        setCategories(catRes.data);
        setFeaturedServices(svcRes.data.slice(0, 8));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div>
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-tag">🇮🇳 Trusted Local Services</div>
          <h1>Find <em>skilled</em> professionals near you</h1>
          <p>Book verified home services in Bangalore, Pune, Mumbai, Kolhapur and more — same day available.</p>
          <form onSubmit={handleSearch}>
            <div className="search-bar">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search for cleaning, plumbing, AC repair..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </div>
          </form>
          <div style={{ marginTop: 16, display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['🧹 Cleaning', '🔧 Plumbing', '⚡ Electrical', '❄️ AC Repair'].map(s => (
              <button key={s} onClick={() => navigate(`/search?q=${s.slice(3)}`)}
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', padding: '6px 14px', borderRadius: 20, fontSize: 13, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.2s' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div style={{ background: 'var(--secondary)', padding: '20px 24px', display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
        {[['500+', 'Verified Providers'], ['10K+', 'Happy Customers'], ['50K+', 'Services Done'], ['4.8★', 'Average Rating']].map(([n, l]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{n}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{l}</div>
          </div>
        ))}
      </div>

      <div className="page-container">
        {/* Categories */}
        <section className="section">
          <div className="section-title">Browse by Category</div>
          <p className="section-subtitle">What service do you need today?</p>
          <div className="categories-grid">
            {categories.map(cat => (
              <div key={cat.id} className="category-chip" onClick={() => navigate(`/search?category=${cat.id}`)}>
                <span className="icon">{cat.icon}</span>
                <span className="name">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Featured services */}
        <section className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <div className="section-title">
                {user?.city ? `Services in ${user.city}` : 'Featured Services'}
              </div>
              <p className="section-subtitle">
                {user?.lat ? 'Sorted by distance from your location' : 'Top-rated professionals near you'}
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/search')}>View All →</button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          ) : featuredServices.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <h3>No services found nearby</h3>
              <p>Be the first to offer services in your city!</p>
            </div>
          ) : (
            <div className="services-grid">
              {featuredServices.map(s => <ServiceCard key={s.id} service={s} />)}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="section">
          <div className="section-title" style={{ textAlign: 'center' }}>How Servify Works</div>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>Get quality services in 3 simple steps</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {[
              { icon: '🔍', title: 'Search & Discover', desc: 'Browse verified providers near you by category or keyword' },
              { icon: '📅', title: 'Book Instantly', desc: 'Pick a date and time that works. Confirm in seconds.' },
              { icon: '⭐', title: 'Get It Done', desc: 'Professional arrives at your door. Rate and review after.' }
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '32px 24px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{s.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        {!user && (
          <section style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', borderRadius: 'var(--radius-lg)', padding: '48px 32px', textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'white', marginBottom: 12 }}>
              Are you a service provider?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 24 }}>
              Join Servify and grow your business. Connect with thousands of customers in your city.
            </p>
            <button className="btn btn-lg" style={{ background: 'white', color: 'var(--primary)' }} onClick={() => navigate('/register?type=provider')}>
              Register as Provider →
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

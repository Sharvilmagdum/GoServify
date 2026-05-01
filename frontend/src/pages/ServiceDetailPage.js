import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { StarDisplay } from '../components/Stars';
import { servicesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    servicesAPI.getById(id)
      .then(r => setService(r.data))
      .catch(() => navigate('/search'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div><Navbar /><div className="loading-screen"><div className="spinner"></div></div></div>;
  if (!service) return null;

  const distance = service.distance;

  return (
    <div>
      <Navbar />
      <div className="page-container" style={{ maxWidth: 900 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>← Back</button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
          {/* Main content */}
          <div>
            {/* Service image/icon */}
            <div style={{ aspectRatio: '16/7', background: 'linear-gradient(135deg, var(--primary-light), var(--accent))', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, marginBottom: 24 }}>
              {service.category_icon}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                {service.category_icon} {service.category_name}
              </span>
              {service.is_verified && <span className="badge badge-verified">✓ Verified Provider</span>}
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{service.title}</h1>

            {Number(service.avg_rating) > 0 && (
              <div style={{ marginBottom: 16 }}>
                <StarDisplay rating={service.avg_rating} reviews={service.total_reviews} />
              </div>
            )}

            <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
              {service.description || 'Professional, reliable service delivered at your doorstep. Trusted by hundreds of customers in your area.'}
            </p>

            {/* Provider info */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 14 }}>About the Provider</h3>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
                  {service.provider_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{service.provider_name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>📍 {service.provider_city}</div>
                  {distance != null && (
                    <div style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                      {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`} from you
                    </div>
                  )}
                  {service.provider_bio && <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>{service.provider_bio}</p>}
                </div>
              </div>
            </div>

            {/* Reviews */}
            {service.reviews?.length > 0 && (
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 16 }}>Customer Reviews</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {service.reviews.map(r => (
                    <div key={r.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontWeight: 600 }}>{r.user_name}</div>
                        <StarDisplay rating={r.rating} />
                      </div>
                      {r.review_text && <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{r.review_text}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking sidebar */}
          <div>
            <div style={{ position: 'sticky', top: 88, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
                ₹{Number(service.price).toLocaleString()}
                {service.price_type === 'hourly' && <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 400 }}>/hour</span>}
              </div>
              {service.price_type === 'negotiable' && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Price negotiable</div>}
              {service.duration_mins && (
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>⏱ ~{service.duration_mins} minutes</div>
              )}

              <div className="divider" />

              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}>📍 {service.provider_city}</div>
                {Number(service.avg_rating) > 0 && <div>⭐ {Number(service.avg_rating).toFixed(1)} ({service.total_reviews} reviews)</div>}
              </div>

              {user?.role === 'user' ? (
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => navigate(`/book/${service.id}`)}>
                  Book Now
                </button>
              ) : !user ? (
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => navigate('/login')}>
                  Login to Book
                </button>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                  {user.role === 'provider' ? 'You are a service provider' : 'Contact Servify to book'}
                </div>
              )}

              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
                Free cancellation up to 24 hours before
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

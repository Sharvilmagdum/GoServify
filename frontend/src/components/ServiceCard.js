import { useNavigate } from 'react-router-dom';
import { StarDisplay } from './Stars';

export default function ServiceCard({ service }) {
  const navigate = useNavigate();

  return (
    <div className="card service-card" onClick={() => navigate(`/services/${service.id}`)}>
      <div className="service-card-image">
        {service.images && JSON.parse(service.images || '[]').length > 0 ? (
          <img src={JSON.parse(service.images)[0]} alt={service.title} />
        ) : (
          <span>{service.category_icon || '🔧'}</span>
        )}
        {service.distance != null && (
          <div className="service-card-distance">
            📍 {service.distance < 1
              ? `${Math.round(service.distance * 1000)}m`
              : `${service.distance.toFixed(1)}km`} away
          </div>
        )}
        {service.is_verified && (
          <div className="service-card-badge">✓ Verified</div>
        )}
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 20 }}>
            {service.category_icon} {service.category_name}
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>
            ₹{Number(service.price).toLocaleString()}
            {service.price_type === 'hourly' && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>/hr</span>}
          </span>
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>
          {service.title}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {service.description || 'Professional service at your doorstep.'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              {service.provider_name?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{service.provider_name}</span>
          </div>
          {Number(service.avg_rating) > 0 && (
            <StarDisplay rating={service.avg_rating} reviews={service.total_reviews} />
          )}
        </div>
        {service.provider_city && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            📍 {service.provider_city}
          </div>
        )}
      </div>
    </div>
  );
}

export function StarDisplay({ rating, reviews }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  return (
    <div className="flex-center gap-8">
      <div className="stars">
        {stars.map((filled, i) => (
          <span key={i} className={`star ${filled ? 'star-filled' : 'star-empty'}`}>★</span>
        ))}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{Number(rating).toFixed(1)}</span>
      {reviews !== undefined && <span className="rating-text">({reviews} reviews)</span>}
    </div>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="stars" style={{ gap: 4 }}>
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          className={`star ${n <= value ? 'star-filled' : 'star-empty'}`}
          style={{ fontSize: 28, cursor: 'pointer', transition: 'transform 0.1s' }}
          onClick={() => onChange(n)}
          onMouseEnter={e => e.target.style.transform = 'scale(1.2)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        >★</span>
      ))}
    </div>
  );
}

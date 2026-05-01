import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ServiceCard from '../components/ServiceCard';
import { servicesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CITIES = ['', 'Bangalore', 'Mumbai', 'Pune', 'Kolhapur', 'Hyderabad', 'Chennai', 'Delhi'];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState('');
  const [sort, setSort] = useState('distance');
  const { user } = useAuth();

  useEffect(() => {
    servicesAPI.getCategories().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.city) setCity(user.city);
  }, [user]);

  useEffect(() => {
    doSearch();
  }, [categoryId, city, sort]);

  const doSearch = async () => {
    setLoading(true);
    try {
      const params = { keyword, sort };
      if (categoryId) params.category_id = categoryId;
      if (city) params.city = city;
      if (user?.lat) { params.lat = user.lat; params.lng = user.lng; }
      const res = await servicesAPI.search(params);
      setServices(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordSearch = (e) => {
    e.preventDefault();
    doSearch();
  };

  return (
    <div>
      <Navbar />
      <div className="page-container">
        {/* Search header */}
        <div style={{ marginBottom: 24 }}>
          <form onSubmit={handleKeywordSearch}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Search services..."
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </div>
          </form>
          
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={city} onChange={e => setCity(e.target.value)}>
              <option value="">All Cities</option>
              {CITIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="distance">Sort: Nearest</option>
              <option value="rating">Sort: Top Rated</option>
              <option value="price">Sort: Lowest Price</option>
            </select>
            {categoryId && (
              <button className="btn btn-secondary btn-sm" onClick={() => setCategoryId('')}>✕ Clear category</button>
            )}
            <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {services.length} service{services.length !== 1 ? 's' : ''} found
              {user?.city && ` in ${user.city}`}
            </span>
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 20 }}>
          <button className={`btn btn-sm ${!categoryId ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCategoryId('')}>All</button>
          {categories.map(c => (
            <button key={c.id}
              className={`btn btn-sm ${categoryId == c.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCategoryId(c.id)}
              style={{ whiteSpace: 'nowrap' }}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {/* Location hint */}
        {user?.lat && (
          <div style={{ background: 'var(--primary-light)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            📍 Showing services within 5km of your location in {user.city}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
        ) : services.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <h3>No services found</h3>
            <p>Try different keywords or expand your search area</p>
          </div>
        ) : (
          <div className="services-grid">
            {services.map(s => <ServiceCard key={s.id} service={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../layouts/AdminLayout';
import config from '../../config';

const LocationManagement = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { restaurantName } = useParams();
  const { tier } = useAdmin();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchSisterRestaurants = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token');
        const res = await fetch(`${config.API_URL}/api/restaurants/owner/my`, {
          headers: { 'x-auth-token': token }
        });
        if (!res.ok) throw new Error('Failed to fetch sister restaurants');
        const data = await res.json();
        setLocations(data);
      } catch (err) {
        console.error('Error fetching sister restaurants:', err);
      } finally {
        setLoading(false);
      }
    };
    if (tier === 'Platinum' || tier === 'Premium') {
      fetchSisterRestaurants();
    }
  }, [restaurantName, tier]);

  const isPlatinumOrPremium = tier === 'Platinum' || tier === 'Premium';

  if (!isPlatinumOrPremium) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: '12px', marginTop: '40px' }}>
        <h2 style={{ color: 'var(--on-surface)' }}>🔒 Feature Locked</h2>
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: '20px' }}>
          Multiple Hub Management requires the <strong>Platinum</strong> or <strong>Premium</strong> plan.
        </p>
        <Link to={`/bulebet/${restaurantName}/admin/settings`} className="btn btn-primary">Upgrade Plan</Link>
      </div>
    );
  }

  return (
    <div className="location-management py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-3 fw-bold m-0">{t('admin_loc_title')}</h1>
        <button onClick={() => navigate(`/bulebet/${restaurantName}/admin/locations/add`)} className="btn btn-primary fw-bold px-4">{t('admin_loc_add')}</button>
      </div>

      {loading ? (
        <div className="py-5 text-center">
          <div className="spinner-border text-warning mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading sister restaurants...</p>
        </div>
      ) : (
        <div className="row g-4">
          {locations.map((loc) => {
            const isCurrent = loc.slug === restaurantName;
            return (
              <div key={loc._id} className="col-12 col-md-6 col-xl-4">
                <div className={`card h-100 border-0 shadow-sm rounded-4 ${isCurrent ? 'border border-2 border-warning' : ''}`}>
                  <div className="card-body p-4 position-relative">
                    <span className="badge bg-warning bg-opacity-10 text-warning position-absolute top-0 end-0 m-3 py-1 px-2 border border-warning border-opacity-25 rounded-3 fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
                      {(loc.subscriptionTier || 'Basic')} PLAN
                    </span>
                    
                    <div className="d-flex align-items-center gap-3 mb-3">
                      {loc.logoUrl ? (
                        <img src={loc.logoUrl} alt="Logo" className="rounded-circle object-fit-cover border" style={{ width: '48px', height: '48px' }} />
                      ) : (
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center fs-4" style={{ width: '48px', height: '48px' }}>🏢</div>
                      )}
                      <div>
                        <h3 className="h5 m-0 fw-bold">{loc.name}</h3>
                        <span className="small text-muted">slug: {loc.slug}</span>
                      </div>
                    </div>

                    <p className="card-text text-muted small mb-4" style={{ minHeight: '40px' }}>
                      {loc.description || 'No description provided.'}
                    </p>
                    
                    <div className="border-top pt-3 d-flex justify-content-between align-items-end mt-auto">
                      <div>
                        {loc.address && <div className="text-muted small mb-1">&#128205; {loc.address}</div>}
                        {loc.phone && <div className="text-muted small">&#128222; {loc.phone}</div>}
                      </div>
                      <div>
                        {isCurrent ? (
                          <span className="text-warning fw-bold small">&#9679; Active Hub</span>
                        ) : (
                          <button 
                            onClick={() => {
                              navigate(`/bulebet/${loc.slug}/admin`);
                              window.location.reload();
                            }}
                            className="btn btn-outline-secondary btn-sm fw-bold px-3 py-1"
                          >
                            Manage Hub &nearr;
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LocationManagement;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config';

const RegistrationPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cuisineType: 'fine-dining',
    menuLayout: 'image-left',
    location: '',
    logoBase64: null,
    subscriptionTier: 'Silver'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please try again.');
      setLoading(false);
      return;
    }

    try {
      // 1. Register the user (Admin role)
      const authResponse = await fetch(`${config.API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.ownerName,
          email: formData.email,
          password: formData.password,
          role: 'admin'
        }),
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(authData.msg || 'Registration failed');
      }

      // Store token
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));

      // 2. Create the Restaurant Profile
      const slug = formData.restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const restResponse = await fetch(`${config.API_URL}/api/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authData.token
        },
        body: JSON.stringify({
          name: formData.restaurantName,
          slug: slug,
          address: formData.location,
          phone: formData.phone,
          menuLayout: formData.menuLayout,
          logoUrl: formData.logoBase64,
          description: `A ${formData.cuisineType} restaurant.`,
          subscriptionTier: formData.subscriptionTier
        }),
      });

      if (!restResponse.ok) {
        const restData = await restResponse.json().catch(() => ({}));
        throw new Error(restData.msg || 'Failed to create restaurant profile.');
      }

      navigate(`/bulebet/${slug}/admin`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="py-5">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="card shadow-sm border-0" style={{ borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)' }}>
          <div className="card-body p-4 p-md-5">
            <h2 className="text-center mb-3">{t('reg_title')}</h2>
            <p className="text-center text-muted mb-4">
              {t('reg_subtitle')}
            </p>

            {error && (
              <div className="alert alert-danger text-center" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">{t('reg_rest_name')}</label>
                  <input
                    type="text"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    required
                    placeholder={t('reg_rest_name_ph')}
                    className="form-control p-3"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">{t('reg_owner_name')}</label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required
                    placeholder={t('reg_owner_name_ph')}
                    className="form-control p-3"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-bold">Restaurant Logo</label>
                  <div className="p-3 text-center bg-white" style={{ border: '1px dashed var(--platinum)', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                    {formData.logoBase64 ? (
                      <div>
                        <img src={formData.logoBase64} alt="Logo Preview" className="img-fluid mb-2" style={{ maxHeight: '80px', borderRadius: '4px' }} />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logoBase64: null })}
                          className="btn btn-sm btn-outline-danger d-block mx-auto"
                        >
                          Remove Logo
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="fs-3 mb-1">📸</div>
                        <div className="small text-muted">Click to upload logo</div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData({ ...formData, logoBase64: reader.result });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label fw-bold">Choose Subscription Plan</label>
                  <div className="row g-3">
                    {[
                      { id: 'Silver', price: 'Free', desc: 'Overview, Menu, Settings' },
                      { id: 'Gold', price: '$249/year', desc: 'Silver + Reservations, Menu, Settings' },
                      { id: 'Platinum', price: '$499/year', desc: 'Gold + Catering, Gallery, Sister Hubs' },
                      { id: 'Premium', price: '$999/year', desc: 'Platinum + Events, Feedback, & all features' },
                    ].map(plan => {
                      const isSelected = formData.subscriptionTier === plan.id;
                      return (
                        <div key={plan.id} className="col-12 col-sm-6 col-lg-3">
                          <div
                            onClick={() => setFormData(prev => ({ ...prev, subscriptionTier: plan.id }))}
                            className={`p-3 h-100 position-relative ${isSelected ? 'shadow-sm' : ''}`}
                            style={{
                              borderRadius: '10px',
                              border: isSelected ? '2px solid var(--gold)' : '2px solid var(--platinum)',
                              backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.06)' : 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {isSelected && (
                              <div className="position-absolute" style={{ top: '8px', right: '8px', fontSize: '14px' }}>✨</div>
                            )}
                            <div className="fw-bold mb-1" style={{ fontSize: '15px', color: 'var(--primary)' }}>{plan.id}</div>
                            <div className="fw-bold mb-2" style={{ fontSize: '13px', color: 'var(--gold)' }}>{plan.price}</div>
                            <div className="small text-muted" style={{ fontSize: '11px', lineHeight: '1.4' }}>{plan.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">{t('reg_email')}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder={t('reg_email_ph')}
                    className="form-control p-3"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="Enter phone number"
                    className="form-control p-3"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Choose a strong password"
                    className="form-control p-3"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Re-enter your password"
                    className="form-control p-3"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">{t('reg_cuisine')}</label>
                  <select
                    name="cuisineType"
                    value={formData.cuisineType}
                    onChange={handleChange}
                    className="form-select p-3"
                  >
                    <option value="fine-dining">{t('reg_cuisine_fine')}</option>
                    <option value="casual">{t('reg_cuisine_casual')}</option>
                    <option value="bistro">{t('reg_cuisine_bistro')}</option>
                    <option value="luxury">{t('reg_cuisine_luxury')}</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Menu Layout Style</label>
                  <select
                    name="menuLayout"
                    value={formData.menuLayout || 'image-left'}
                    onChange={handleChange}
                    className="form-select p-3"
                  >
                    <option value="image-left">Image Left (Classic List)</option>
                    <option value="image-right">Image Right (Modern List)</option>
                    <option value="image-top">Image Top (Card Grid)</option>
                    <option value="image-bottom">Image Bottom (Magazine Style)</option>
                    <option value="text-centered">Text Centered (No Images)</option>
                  </select>
                </div>

                <div className="col-12">
                  <div className="p-3 bg-light rounded border border-dashed">
                    <div className="small fw-bold text-muted mb-2 text-center text-uppercase">Live Preview</div>
                    <div className="bg-white p-3 rounded shadow-sm d-flex" style={{
                      flexDirection: formData.menuLayout === 'image-top' ? 'column' : formData.menuLayout === 'image-bottom' ? 'column-reverse' : formData.menuLayout === 'image-right' ? 'row-reverse' : 'row',
                      gap: '16px',
                      alignItems: formData.menuLayout.includes('image') && !formData.menuLayout.includes('top') && !formData.menuLayout.includes('bottom') ? 'center' : 'stretch',
                      textAlign: formData.menuLayout === 'text-centered' ? 'center' : 'left',
                      display: formData.menuLayout === 'text-centered' ? 'block' : 'flex'
                    }}>
                      {formData.menuLayout !== 'text-centered' && (
                        <div className="bg-secondary bg-opacity-25 rounded d-flex align-items-center justify-content-center flex-shrink-0" style={{
                          width: formData.menuLayout.includes('top') || formData.menuLayout.includes('bottom') ? '100%' : '80px',
                          height: formData.menuLayout.includes('top') || formData.menuLayout.includes('bottom') ? '120px' : '80px',
                        }}>
                          <span className="fs-4">🖼️</span>
                        </div>
                      )}
                      <div className="flex-grow-1">
                        <div className="fw-bold mb-1" style={{ fontSize: '14px', color: 'var(--primary)' }}>Sample Menu Item</div>
                        <div className="small text-muted mb-2">A delicious sample description of the food.</div>
                        <div className="fw-bold" style={{ color: 'var(--gold)', fontSize: '14px' }}>$24.00</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label fw-bold">{t('reg_location')}</label>
                  <div className="position-relative">
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      placeholder={t('reg_location_ph')}
                      className="form-control p-3 pe-5"
                    />
                    <div className="position-absolute text-primary" style={{ right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} title={t('reg_google_verify')}>
                      <i className="fa-solid fa-location-dot"></i>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2 mt-2 p-2 rounded" style={{ backgroundColor: '#e8f0fe', border: '1px solid #c2d7fa' }}>
                    <div className="text-primary"><i className="fa-solid fa-map-location-dot"></i></div>
                    <div className="small fw-medium" style={{ color: '#1967d2' }}>
                      {t('reg_google_connected')}
                    </div>
                  </div>
                </div>

                <div className="col-12 mt-4">
                  <button type="submit" disabled={loading} className="btn btn-primary w-100 p-3 fw-bold" style={{ opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Creating Account...' : t('reg_submit')}
                  </button>
                </div>
              </div>
            </form>

            <p className="text-center mt-4 small text-muted">
              {t('reg_already')} <Link to="/bulebet/login" style={{ color: 'var(--gold)', fontWeight: '600', textDecoration: 'none' }}>{t('reg_login')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;

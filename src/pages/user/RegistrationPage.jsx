import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const RegistrationPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    email: '',
    phone: '',
    cuisineType: 'fine-dining',
    location: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    console.log('Registering:', formData);
    navigate('/verify');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ padding: 'var(--spacing-xxl) 0' }}>
      <div className="container" style={{ maxWidth: '600px' }}>
        <div style={{
          backgroundColor: 'var(--surface)',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-2)',
          border: '1px solid var(--platinum)'
        }}>
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>{t('reg_title')}</h2>
          <p style={{ textAlign: 'center', color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-xl)' }}>
            {t('reg_subtitle')}
          </p>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>{t('reg_rest_name')}</label>
              <input 
                type="text" 
                name="restaurantName"
                value={formData.restaurantName}
                onChange={handleChange}
                required
                placeholder={t('reg_rest_name_ph')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--platinum)',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>{t('reg_owner_name')}</label>
              <input 
                type="text" 
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                required
                placeholder={t('reg_owner_name_ph')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--platinum)',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>{t('reg_email')}</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder={t('reg_email_ph')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--platinum)',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>{t('reg_cuisine')}</label>
              <select 
                name="cuisineType"
                value={formData.cuisineType}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--platinum)',
                  fontSize: '16px',
                  backgroundColor: 'white'
                }}
              >
                <option value="fine-dining">{t('reg_cuisine_fine')}</option>
                <option value="casual">{t('reg_cuisine_casual')}</option>
                <option value="bistro">{t('reg_cuisine_bistro')}</option>
                <option value="luxury">{t('reg_cuisine_luxury')}</option>
              </select>
            </div>

            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '14px' }}>{t('reg_location')}</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder={t('reg_location_ph')}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--platinum)',
                    fontSize: '16px'
                  }}
                />
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4285F4', cursor: 'pointer' }} title={t('reg_google_verify')}>
                  <i className="fa-solid fa-location-dot"></i>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '10px', backgroundColor: '#e8f0fe', borderRadius: '4px', border: '1px solid #c2d7fa' }}>
                <div style={{ fontSize: '16px', color: '#4285F4' }}><i className="fa-solid fa-map-location-dot"></i></div>
                <div style={{ fontSize: '12px', color: '#1967d2', fontWeight: '500' }}>
                  {t('reg_google_connected')}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '14px' }}>{t('reg_social')}</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(140px, 45vw, 250px), 1fr))', 
                gap: '12px' 
              }}>
                {[
                  { name: 'Instagram', icon: 'fa-brands fa-instagram', color: '#E1306C', url: 'https://instagram.com', key: 'ig' },
                  { name: 'Facebook', icon: 'fa-brands fa-facebook-f', color: '#1877F2', url: 'https://facebook.com', key: 'fb' },
                  { name: 'X', icon: 'fa-brands fa-x-twitter', color: '#000000', url: 'https://x.com', key: 'tw' },
                  { name: 'LinkedIn', icon: 'fa-brands fa-linkedin-in', color: '#0A66C2', url: 'https://linkedin.com', key: 'ln' },
                  { name: 'YouTube', icon: 'fa-brands fa-youtube', color: '#FF0000', url: 'https://youtube.com', key: 'yt' },
                  { name: 'TikTok', icon: 'fa-brands fa-tiktok', color: '#000000', url: 'https://tiktok.com', key: 'tk' },
                  { name: 'Pinterest', icon: 'fa-brands fa-pinterest-p', color: '#E60023', url: 'https://pinterest.com', key: 'pn' },
                  { name: 'WhatsApp', icon: 'fa-brands fa-whatsapp', color: '#25D366', url: 'https://whatsapp.com', key: 'wa' },
                  { name: 'Telegram', icon: 'fa-brands fa-telegram', color: '#24A1DE', url: 'https://telegram.org', key: 'tg' },
                  { name: 'Snapchat', icon: 'fa-brands fa-snapchat', color: '#FFFC00', url: 'https://snapchat.com', key: 'sc' }
                ].map((social) => (
                  <div key={social.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f9fafb', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--platinum)' }}>
                    <a 
                      href={social.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: social.color, textDecoration: 'none', display: 'flex', alignItems: 'center', transition: 'transform 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <i className={social.icon} style={{ fontSize: '18px' }} title={`BuleBet's ${social.name}`}></i>
                    </a>
                    <input 
                      type="text" 
                      placeholder={t('reg_social_ph').replace('{platform}', social.name)}
                      style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '13px' }} 
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '12px', border: '1px solid var(--platinum)' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--on-surface-variant)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('reg_connect_hub')}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { name: 'Instagram', icon: 'fa-brands fa-instagram', color: '#E1306C', url: 'https://instagram.com' },
                  { name: 'Facebook', icon: 'fa-brands fa-facebook-f', color: '#1877F2', url: 'https://facebook.com' },
                  { name: 'X', icon: 'fa-brands fa-x-twitter', color: '#000000', url: 'https://x.com' },
                  { name: 'LinkedIn', icon: 'fa-brands fa-linkedin-in', color: '#0A66C2', url: 'https://linkedin.com' },
                  { name: 'WhatsApp', icon: 'fa-brands fa-whatsapp', color: '#25D366', url: 'https://whatsapp.com' }
                ].map((social) => (
                  <a 
                    key={social.name} 
                    href={social.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: social.color,
                      fontSize: '20px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = social.color;
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = social.color;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <i className={social.icon}></i>
                  </a>
                ))}
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-md)' }}>
              {t('reg_submit')}
            </button>
          </form>
          
          <p style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)', fontSize: '14px', color: 'var(--on-surface-variant)' }}>
            {t('reg_already')} <Link to="/bulebet/login" style={{ color: 'var(--gold)', fontWeight: '600', textDecoration: 'none' }}>{t('reg_login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;

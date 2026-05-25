import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import config from '../config';

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const { restaurantName } = useParams();

  const isRestaurantPage =
    location.pathname.startsWith('/bulebet/') &&
    location.pathname !== '/bulebet/login' &&
    location.pathname !== '/bulebet/register';

  // Dynamic restaurant data
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    if (!isRestaurantPage || !restaurantName) return;
    const fetchRestaurant = async () => {
      try {
        const res = await fetch(`${config.API_URL}/api/restaurants/${restaurantName}`);
        if (res.ok) {
          const data = await res.json();
          setRestaurant(data);
        }
      } catch (err) {
        console.error('Footer: failed to fetch restaurant', err);
      }
    };
    fetchRestaurant();
  }, [restaurantName, isRestaurantPage]);

  const displayName = restaurant?.name || 'BuleBet';
  const displayPhone = restaurant?.phone || null;
  const displayAddress = restaurant?.address || null;
  const displayDescription = restaurant?.description || t('footer_tagline');

  const socialPlatforms = [
    { name: 'Instagram', icon: '📸', url: 'https://instagram.com', color: '#E1306C' },
    { name: 'Facebook', icon: '👤', url: 'https://facebook.com', color: '#1877F2' },
    { name: 'X', icon: '✖', url: 'https://x.com', color: '#000000' },
    { name: 'YouTube', icon: '▶', url: 'https://youtube.com', color: '#FF0000' },
    { name: 'WhatsApp', icon: '💬', url: 'https://whatsapp.com', color: '#25D366' },
    { name: 'TikTok', icon: '🎵', url: 'https://tiktok.com', color: '#000000' },
  ];

  return (
    <footer style={{
      backgroundColor: 'var(--primary)',
      color: 'white',
      padding: 'var(--spacing-xxl) 0 var(--spacing-xl) 0'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-xxl)',
          marginBottom: 'var(--spacing-xxl)'
        }} className="footer-grid">

          {/* Brand / Restaurant Info */}
          <div style={{ maxWidth: '300px' }}>
            {restaurant?.logoUrl && (
              <img src={restaurant.logoUrl} alt={displayName}
                style={{ height: '48px', objectFit: 'contain', marginBottom: '12px', borderRadius: '6px' }} />
            )}
            <h2 style={{ color: 'var(--gold)', letterSpacing: '0.15em', marginBottom: '10px', fontSize: '20px' }}>
              {displayName.toUpperCase()}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>
              {displayDescription}
            </p>

            {/* Contact details pulled from DB */}
            {(displayPhone || displayAddress) && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {displayPhone && (
                  <a href={`tel:${displayPhone}`} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📞 {displayPhone}
                  </a>
                )}
                {displayAddress && (
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📍 {displayAddress}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: 'var(--gold)', marginBottom: 'var(--spacing-lg)', fontSize: '13px', letterSpacing: '1px' }}>
              {t('footer_quick_links').toUpperCase()}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
              {[
                ...(isRestaurantPage ? [
                  { name: 'Our Menu', path: `/bulebet/${restaurantName}/menu` },
                  { name: 'Reservations', path: `/bulebet/${restaurantName}/reservations` },
                  { name: 'Catering', path: `/bulebet/${restaurantName}/catering` },
                  { name: 'Gallery', path: `/bulebet/${restaurantName}/gallery` },
                  { name: 'Contact Us', path: `/bulebet/${restaurantName}/contact` },
                ] : [
                  { name: t('footer_features'), path: '/#features' },
                  { name: t('footer_pricing'), path: '/#pricing' },
                  { name: t('nav_gallery'), path: '/gallery' },
                ])
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}
                    onMouseOver={e => e.target.style.color = 'var(--gold)'}
                    onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
                  >
                    › {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 style={{ color: 'var(--gold)', marginBottom: 'var(--spacing-lg)', fontSize: '13px', letterSpacing: '1px' }}>
              {t('footer_support').toUpperCase()}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
              {[
                { name: t('footer_help_center'), path: isRestaurantPage ? `/bulebet/${restaurantName}/contact` : '#' },
                { name: t('footer_privacy'), path: isRestaurantPage ? `/bulebet/${restaurantName}/privacy` : '/privacy' },
                { name: t('footer_terms'), path: isRestaurantPage ? `/bulebet/${restaurantName}/terms` : '/terms' },
                { name: t('footer_contact_us'), path: isRestaurantPage ? `/bulebet/${restaurantName}/contact` : '/contact-us' }
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}
                    onMouseOver={e => e.target.style.color = 'var(--gold)'}
                    onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
                  >
                    › {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social / Connect */}
          <div>
            <h4 style={{ color: 'var(--gold)', marginBottom: 'var(--spacing-lg)', fontSize: '13px', letterSpacing: '1px' }}>
              {t('footer_connect').toUpperCase()}
            </h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }} className="social-icon-grid">
              {socialPlatforms.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.name}
                  style={{
                    width: '38px',
                    height: '38px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    fontSize: '16px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    transition: 'all 0.25s ease'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.backgroundColor = social.color;
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = social.color;
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  }}
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* Newsletter / CTA */}
            <div style={{ marginTop: '24px' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginBottom: '10px' }}>
                Subscribe for updates & offers
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: 'white',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  style={{
                    padding: '9px 16px',
                    backgroundColor: 'var(--gold)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Join →
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 'var(--spacing-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }} className="footer-bottom">
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            © {currentYear} {displayName}. {t('footer_rights')}
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
              POWERED BY BULEBET PLATFORM
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr !important; text-align: center; }
          .footer-grid > div { max-width: 100% !important; }
          .social-icon-grid { justify-content: center; }
          .footer-bottom { flex-direction: column; text-align: center; }
        }
      `}</style>
    </footer>
  );
};

export default Footer;

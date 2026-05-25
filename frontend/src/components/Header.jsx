import React, { useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import config from '../config';

const Header = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurantName } = useParams(); // Removing default fallback to make it accurate
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [restaurant, setRestaurant] = useState(null);

  // Context-aware navigation links
  const isRestaurantPage = location.pathname.startsWith('/bulebet/') && location.pathname !== '/bulebet/login' && location.pathname !== '/register' && restaurantName;

  React.useEffect(() => {
    if (isRestaurantPage && restaurantName) {
      fetch(`${config.API_URL}/api/restaurants/${restaurantName}`)
        .then(res => res.json())
        .then(data => {
          if (!data.msg) {
            setRestaurant(data);
            document.title = `BuleBet | ${data.name}`;
          }
        })
        .catch(err => console.error("Header couldn't fetch restaurant", err));
    } else {
      document.title = "BuleBet | Premium Restaurant Management";
    }
  }, [isRestaurantPage, restaurantName]);
  
  const tierImportance = { Silver: 0, Gold: 1, Platinum: 2, Premium: 3 };
  const getTierImportance = (t) => tierImportance[t] !== undefined ? tierImportance[t] : 2; // Default to Platinum
  
  const currentTier = restaurant?.subscriptionTier === 'Basic' ? 'Silver' : (restaurant?.subscriptionTier || 'Platinum');
  const currentTierImp = getTierImportance(currentTier);

  const allNavLinks = [
    { name: t('nav_menu') || 'Menu', path: `/bulebet/${restaurantName}/menu`, originalName: 'Menu', minTier: 'Silver' },
    { name: t('nav_reservations') || 'Reservations', path: `/bulebet/${restaurantName}/reservations`, originalName: 'Reservations', minTier: 'Silver' },
    { name: t('nav_catering') || 'Catering', path: `/bulebet/${restaurantName}/catering`, originalName: 'Catering', minTier: 'Silver' },
    { name: 'Gallery', path: `/bulebet/${restaurantName}/gallery`, originalName: 'Gallery', minTier: 'Silver' },
    { name: 'Testimonials', path: `/bulebet/${restaurantName}/testimonials`, originalName: 'Testimonials', minTier: 'Silver' },
    { name: 'Feedback', path: `/bulebet/${restaurantName}/feedback`, originalName: 'Feedback', minTier: 'Silver' },
  ];

  const navLinks = allNavLinks.filter(link => currentTierImp >= getTierImportance(link.minTier));

  return (
    <header style={{
      backgroundColor: 'white',
      borderBottom: '1px solid var(--platinum)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div className="container" style={{
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <Link to={isRestaurantPage ? `/bulebet/${restaurantName}` : "/"} style={{ textDecoration: 'none', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isRestaurantPage && restaurant ? (
            <>
              {restaurant.logoUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={restaurant.logoUrl} alt={restaurant.name} style={{ height: '36px', borderRadius: '4px', objectFit: 'contain' }} />
                  <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--primary)', marginTop: '2px' }}>{restaurant.name.toUpperCase()}</div>
                </div>
              ) : (
                <div style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '0.05em' }}>{restaurant.name.toUpperCase()}</div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '0.1em' }}>BULEBET</div>
              <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--gold)' }} className="hide-on-mobile"></div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gold)' }} className="hide-on-mobile">PREMIUM DINING</div>
            </>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', gap: 'var(--spacing-xl)', alignItems: 'center' }} className="hide-on-mobile">
          {/* AI Search Engine */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '12px', color: '#9ca3af', fontSize: '14px' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search..." 
              style={{
                padding: '8px 12px 8px 32px',
                borderRadius: '20px',
                border: '1px solid var(--platinum)',
                fontSize: '14px',
                outline: 'none',
                width: '180px',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 2px rgba(212, 175, 55, 0.2)'; e.target.style.width = '220px'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--platinum)'; e.target.style.boxShadow = 'none'; e.target.style.width = '180px'; }}
            />
          </div>

          {isRestaurantPage ? (
            navLinks.map(link => (
              <div key={link.path} style={{ position: 'relative' }} className={link.originalName === 'Menu' ? 'menu-dropdown-container' : ''}>
                <Link 
                  to={link.path} 
                  style={{ textDecoration: 'none', color: 'var(--on-surface-variant)', fontSize: '14px', fontWeight: '600', transition: 'color 0.2s', padding: '10px 0' }}
                  onMouseOver={(e) => e.target.style.color = 'var(--gold)'}
                  onMouseOut={(e) => e.target.style.color = 'var(--on-surface-variant)'}
                >
                  {link.name}
                </Link>
                {link.originalName === 'Menu' && (
                  <div className="menu-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    backgroundColor: 'white',
                    boxShadow: 'var(--shadow-2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 0',
                    minWidth: '160px',
                    display: 'none', // Handled by CSS hover
                    flexDirection: 'column',
                    zIndex: 1001,
                    border: '1px solid var(--platinum)'
                  }}>
                    {[
                      { id: 'Our Signature', key: 'menu_signature' }, 
                      { id: 'Breakfast', key: 'menu_breakfast' }, 
                      { id: 'Lunch', key: 'menu_lunch' }, 
                      { id: 'Dinner', key: 'menu_dinner' }, 
                      { id: 'Beverages', key: 'menu_beverages' }, 
                      { id: 'Hot', key: 'menu_hot' }, 
                      { id: 'Cold', key: 'menu_cold' }, 
                      { id: 'All Items', key: 'menu_all' }
                    ].map(cat => (
                      <Link 
                        key={cat.id} 
                        to={`/bulebet/${restaurantName}/menu#${cat.id.toLowerCase().replace(' ', '-')}`}
                        style={{ padding: '8px 20px', color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '14px', transition: 'all 0.2s', display: 'block' }}
                        onMouseOver={(e) => { e.target.style.backgroundColor = '#f9fafb'; e.target.style.color = 'var(--gold)'; }}
                        onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--on-surface-variant)'; }}
                      >
                        {t(cat.key)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            // Global Nav Links for Landing/Registration Pages
            <div style={{ display: 'flex', gap: 'var(--spacing-xl)', alignItems: 'center' }}>
              <Link to="/" style={{ textDecoration: 'none', color: 'var(--on-surface-variant)', fontSize: '14px', fontWeight: '600' }}>Platform Home</Link>
              <Link to="/register" style={{ textDecoration: 'none', color: 'var(--gold)', fontSize: '14px', fontWeight: '600' }}>For Restaurants</Link>
            </div>
          )}
          
          <button 
            onClick={toggleLanguage}
            style={{
              background: 'transparent',
              border: '1px solid var(--platinum)',
              padding: '4px 8px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '12px',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span style={{ color: language === 'en' ? 'var(--gold)' : 'inherit' }}>EN</span> 
            | 
            <span style={{ color: language === 'am' ? 'var(--gold)' : 'inherit' }}>አማ</span>
          </button>

          <button onClick={() => navigate('/bulebet/login')} className="btn btn-primary" style={{ padding: '8px 24px', fontSize: '14px' }}>{t('nav_login')}</button>
        </nav>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '24px', 
            cursor: 'pointer', 
            display: 'none' 
          }}
          className="mobile-toggle-btn"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderBottom: '1px solid var(--platinum)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 999,
          boxShadow: 'var(--shadow-2)'
        }} className="mobile-menu-drawer">
          {isRestaurantPage ? (
            navLinks.map(link => (
              <Link 
                key={link.path} 
                to={link.path} 
                onClick={() => setIsMenuOpen(false)}
                style={{ textDecoration: 'none', color: 'var(--primary)', fontSize: '18px', fontWeight: '600', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}
              >
                {link.name}
              </Link>
            ))
          ) : (
            <>
              <Link to="/" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--primary)', fontSize: '18px', fontWeight: '600', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>Platform Home</Link>
              <Link to="/register" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--primary)', fontSize: '18px', fontWeight: '600', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>For Restaurants</Link>
            </>
          )}
          <button 
            onClick={() => { navigate('/bulebet/login'); setIsMenuOpen(false); }} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '16px' }}
          >
            {t('nav_login')}
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-toggle-btn {
            display: block !important;
          }
        }
        .menu-dropdown-container:hover .menu-dropdown {
          display: flex !important;
        }
      `}</style>
    </header>
  );
};

export default Header;

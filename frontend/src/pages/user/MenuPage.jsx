import React from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config';

const MenuDescription = ({ text }) => {
  const [expanded, setExpanded] = React.useState(false);
  if (!text) return null;
  const shouldTruncate = text.length > 100;
  
  return (
    <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', lineHeight: '1.6', marginBottom: '12px' }}>
      {(!shouldTruncate || expanded) ? text : `${text.substring(0, 100)}...`}
      {shouldTruncate && (
        <span 
          onClick={() => setExpanded(!expanded)} 
          style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '700', marginLeft: '8px', fontSize: '13px' }}
        >
          {expanded ? 'Show Less' : 'Read More'}
        </span>
      )}
    </p>
  );
};

const MenuPage = () => {
  const { t } = useLanguage();
  const { restaurantName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const displayName = restaurantName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  // Layout state will be set from DB
  
  // Dynamic filter based on URL hash (e.g., #beverages)
  const activeFilter = location.hash ? location.hash.replace('#', '').replace(/-/g, ' ').toLowerCase() : 'all items';

  const [menuCategories, setMenuCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [restaurantTier, setRestaurantTier] = React.useState('Platinum');
  const [globalImgPos, setGlobalImgPos] = React.useState('Left');

  React.useEffect(() => {
    let intervalId;

    const fetchMenu = async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true);
        // 1. Get restaurant
        const restRes = await fetch(`${config.API_URL}/api/restaurants/${restaurantName}`);
        if (!restRes.ok) throw new Error('Restaurant not found');
        const restaurant = await restRes.json();
        setRestaurantTier(restaurant.subscriptionTier === 'Basic' ? 'Silver' : (restaurant.subscriptionTier || 'Platinum'));
        
        let layoutMap = {
          'image-left': 'Left',
          'image-right': 'Right',
          'text-centered': 'Center'
        };
        setGlobalImgPos(layoutMap[restaurant.menuLayout] || 'Left');

        // 2. Get menu
        const menuRes = await fetch(`${config.API_URL}/api/menu/restaurant/${restaurant._id}`);
        if (!menuRes.ok) throw new Error('Failed to fetch menu');
        const menuData = await menuRes.json();

        // 3. Group by category
        const categoriesMap = {};
        menuData.forEach(item => {
          const catName = item.category || 'Mains';
          if (!categoriesMap[catName]) {
            categoriesMap[catName] = { name: catName, items: [] };
          }
          categoriesMap[catName].items.push({
            id: item._id,
            name: item.name,
            price: `$${item.price}`,
            description: item.description,
            ingredients: item.ingredients && item.ingredients.length > 0 ? item.ingredients : 'See description',
            contains: item.contains && item.contains.length > 0 ? item.contains : 'Ask server',
            visible: item.isAvailable,
            img: item.imageUrl || 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=400&q=80',
            timing: item.category // Using category as timing for now
          });
        });

        setMenuCategories(Object.values(categoriesMap));
      } catch (err) {
        console.error('Error fetching menu:', err);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    // Initial fetch
    fetchMenu();

    // Set up polling every 3 seconds to keep it "real-time" synced with the admin dashboard
    intervalId = setInterval(() => {
      fetchMenu(true);
    }, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [restaurantName]);

  return (
    <div className="menu-page" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Signature Section - Featured at Top of User Page */}
      {(restaurantTier !== 'Silver') && (activeFilter === 'all items' || activeFilter === 'our signature') && (
        <section id="signature" style={{ 
        padding: 'var(--spacing-xl) 0', 
        backgroundColor: 'var(--primary)', 
        color: 'white',
        textAlign: 'center',
        borderBottom: '4px solid var(--gold)'
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '300px', textAlign: 'left' }}>
              <h4 style={{ color: 'var(--gold)', letterSpacing: '0.2em', fontSize: '14px', marginBottom: '8px' }}>{t('menu_sig_label')}</h4>
              <h2 style={{ color: 'white', marginBottom: 'var(--spacing-md)' }}>{t('menu_sig_title')}</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>
                {t('menu_sig_desc')}
              </p>
            </div>
            {(() => {
              const allItems = menuCategories.flatMap(c => c.items).filter(i => i.visible);
              const customImgs = allItems.filter(i => i.img && !i.img.includes('unsplash.com')).map(i => i.img);
              const fallbackImgs = allItems.filter(i => i.img && i.img.includes('unsplash.com')).map(i => i.img);
              const images = [...customImgs, ...fallbackImgs];
              
              return (
                <div style={{ flex: '1', minWidth: '300px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div style={{ 
                    gridRow: 'span 2',
                    height: '300px', 
                    borderRadius: 'var(--radius-lg)', 
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {images[0] ? (
                      <img src={images[0]} alt="Signature Dish" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : <span style={{ fontSize: '64px' }}>🍽️</span>}
                  </div>
                  <div style={{ 
                    height: '142px', 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: 'var(--gold)',
                    overflow: 'hidden'
                  }}>
                    {images[1] ? (
                      <img src={images[1]} alt="Featured Dish" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : '🍷'}
                  </div>
                  <div style={{ 
                    height: '142px', 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: 'var(--gold)',
                    overflow: 'hidden'
                  }}>
                    {images[2] ? (
                      <img src={images[2]} alt="Featured Drink" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : '🕯️'}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>
      )}

      <div style={{ padding: 'var(--spacing-xl) 0' }}>
      <div className="container" style={{ maxWidth: globalImgPos === 'Center' ? '800px' : '1000px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h1 style={{ fontSize: 'clamp(32px, 8vw, 48px)', marginBottom: 'var(--spacing-md)', textTransform: 'capitalize' }}>
            {activeFilter === 'all items' ? t('menu_our_menu') : activeFilter}
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 'clamp(14px, 4vw, 18px)', padding: '0 20px', marginBottom: 'var(--spacing-lg)' }}>
            {activeFilter === 'all items' 
              ? t('menu_all_desc') 
              : t('menu_filter_desc').replace('{filter}', activeFilter)}
          </p>
          
          {/* Menu Category Dropdown Filter */}
          {restaurantTier !== 'Silver' && (
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <select 
              value={activeFilter}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all items') {
                  navigate(`/bulebet/${restaurantName}/menu#all-items`);
                } else {
                  navigate(`/bulebet/${restaurantName}/menu#${val.replace(/ /g, '-')}`);
                }
              }}
              style={{
                padding: '12px 40px 12px 20px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '30px',
                border: '2px solid var(--gold)',
                backgroundColor: 'white',
                color: 'var(--primary)',
                cursor: 'pointer',
                appearance: 'none',
                outline: 'none',
                boxShadow: 'var(--shadow-1)'
              }}
            >
              <option value="all items">{t('menu_all') || 'All Items'}</option>
              <option value="our signature">{t('menu_signature') || 'Our Signature'}</option>
              {menuCategories.map(cat => (
                <option key={cat.name} value={cat.name.toLowerCase()}>{cat.name}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '12px', color: 'var(--gold)' }}>▼</span>
          </div>
          )}
        </div>

        {menuCategories.map((category) => {
          let visibleItems = category.items.filter(item => item.visible);
          
          if (activeFilter !== 'all items' && activeFilter !== 'our signature') {
            if (category.name.toLowerCase() !== activeFilter) {
              return null;
            }
          } else if (activeFilter === 'our signature') {
             // In a real app we would filter by item.isSignature
             // For now we just return null because the signature section handles it,
             // or we could show all items. Let's hide the list if 'our signature' is selected
             // and just let the top section shine.
             return null;
          }

          if (visibleItems.length === 0) return null;

          return (
            <div key={category.name} style={{ marginBottom: 'var(--spacing-xxl)' }}>
              <h2 style={{ 
                textAlign: 'center', 
                borderBottom: '1px solid var(--platinum)', 
                paddingBottom: '12px',
                marginBottom: 'var(--spacing-xl)',
                color: 'var(--gold)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontSize: 'clamp(16px, 5vw, 20px)'
              }}>
                {category.name}
              </h2>
              
              <div style={{ display: 'grid', gap: 'clamp(24px, 5vw, 48px)' }}>
                {visibleItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="menu-item-row"
                    style={{ 
                      display: 'flex', 
                      flexDirection: globalImgPos === 'Center' ? 'column' : (globalImgPos === 'Right' ? 'row-reverse' : 'row'),
                      alignItems: globalImgPos === 'Center' ? 'center' : 'flex-start',
                      gap: 'clamp(16px, 4vw, 32px)',
                      textAlign: globalImgPos === 'Center' ? 'center' : 'left'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '0' }}>
                      <div style={{ display: 'flex', justifyContent: globalImgPos === 'Center' ? 'center' : 'space-between', alignItems: 'baseline', marginBottom: '8px', gap: '16px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: 'clamp(18px, 5vw, 24px)', margin: 0 }}>{item.name}</h3>
                        {globalImgPos !== 'Center' && <div style={{ fontWeight: '700', fontSize: 'clamp(16px, 4vw, 20px)', color: 'var(--primary)' }}>{item.price}</div>}
                      </div>
                      <MenuDescription text={item.description} />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em' }}>
                        <div><span style={{ color: 'var(--gold)' }}>{t('menu_ingredients')}</span> <span style={{ color: '#6b7280', fontWeight: '400' }}>
                          {Array.isArray(item.ingredients) 
                            ? item.ingredients.filter(i => i.checked).map(i => i.name).join(', ') 
                            : item.ingredients}
                        </span></div>
                        <div><span style={{ color: '#dc2626' }}>{t('menu_contains')}</span> <span style={{ color: '#6b7280', fontWeight: '400' }}>
                          {Array.isArray(item.contains)
                            ? item.contains.filter(i => i.checked).map(i => i.name).join(', ')
                            : item.contains}
                        </span></div>
                      </div>
                      
                      {globalImgPos === 'Center' && <div style={{ fontWeight: '700', fontSize: '20px', color: 'var(--primary)', marginTop: '12px' }}>{item.price}</div>}
                    </div>

                    <div style={{ 
                      width: '100%',
                      maxWidth: globalImgPos === 'Center' ? '600px' : '350px',
                      height: 'clamp(180px, 40vw, 240px)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-2)',
                      flexShrink: 0
                    }}>
                      <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Restaurant Contact Section */}
        <section style={{ 
          marginTop: 'var(--spacing-xxl)', 
          padding: 'clamp(20px, 5vw, 60px)', 
          backgroundColor: '#f9fafb', 
          borderRadius: '24px', 
          border: '1px solid var(--platinum)',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>{t('menu_inquiries')}</h2>
          <p style={{ color: '#6b7280', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px auto' }}>
            {t('menu_inquiries_desc').replace('{restaurant}', displayName)}
          </p>

          <form style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <input required type="text" placeholder={t('menu_name_ph')} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--platinum)', fontSize: '14px' }} />
            <input required type="email" placeholder={t('menu_email_ph')} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--platinum)', fontSize: '14px' }} />
            <div style={{ gridColumn: '1 / -1' }}>
              <textarea required rows="4" placeholder={t('menu_message_ph')} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid var(--platinum)', fontSize: '14px', fontFamily: 'inherit' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '16px' }}>{t('menu_send_msg')}</button>
            </div>
          </form>
        </section>
      </div>
    </div>

      <style>{`
        @media (max-width: 768px) {
          .menu-item-row {
            flex-direction: column !important;
            text-align: center !important;
          }
          .menu-item-row > div {
            min-width: 100% !important;
          }
          .menu-item-row div[style*="justifyContent"] {
            justify-content: center !important;
          }
          .menu-item-row img {
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MenuPage;

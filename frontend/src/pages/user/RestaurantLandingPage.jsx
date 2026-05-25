import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config';

const MenuDescription = ({ text }) => {
  const [expanded, setExpanded] = React.useState(false);
  if (!text) return null;
  const shouldTruncate = text.length > 100;
  
  return (
    <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', flex: 1 }}>
      {(!shouldTruncate || expanded) ? text : `${text.substring(0, 100)}...`}
      {shouldTruncate && (
        <span 
          onClick={(e) => { e.preventDefault(); setExpanded(!expanded); }} 
          style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '700', marginLeft: '8px', fontSize: '13px' }}
        >
          {expanded ? 'Show Less' : 'Read More'}
        </span>
      )}
    </p>
  );
};

const RestaurantLandingPage = () => {
  const { restaurantName } = useParams();
  const { t } = useLanguage();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [menuFilter, setMenuFilter] = useState('All');
  const [events, setEvents] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = window.innerWidth > 768 ? 1100 : window.innerWidth * 0.95;
      carouselRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${config.API_URL}/api/restaurants/${restaurantName}`);
        if (res.ok) {
          const data = await res.json();
          setRestaurant(data);
          
          if (data._id) {
            const [menuRes, eventRes, testimonialsRes] = await Promise.all([
              fetch(`${config.API_URL}/api/menu/restaurant/${data._id}`),
              fetch(`${config.API_URL}/api/events/restaurant/${data._id}`),
              fetch(`${config.API_URL}/api/testimonials/restaurant/${restaurantName}`)
            ]);

            if (menuRes.ok) {
              const menuData = await menuRes.json();
              setMenuItems(menuData.slice(0, 3)); // top 3 featured items
            }

            if (testimonialsRes.ok) {
              const testimonialsData = await testimonialsRes.json();
              setTestimonials(testimonialsData);
            }

            if (eventRes.ok) {
              const eventData = await eventRes.json();
              // Filter to active events only
              setEvents(eventData.filter(e => e.status !== 'Sold Out'));
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [restaurantName]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2>Restaurant Not Found</h2>
        <p>The restaurant "{restaurantName}" could not be located.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '20px' }}>Go Home</Link>
      </div>
    );
  }

  const displayName = restaurant.name || restaurantName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const TIER_LEVELS = { Silver: 0, Gold: 1, Platinum: 2, Premium: 3 };
  const currentTier = restaurant.subscriptionTier === 'Basic' ? 'Silver' : (restaurant.subscriptionTier || 'Platinum');
  const tierLevel = TIER_LEVELS[currentTier] || 0;

  const categories = ['All', ...Array.from(new Set(menuItems.map(i => i.category).filter(Boolean)))];
  const filteredMenu = menuFilter === 'All' ? menuItems : menuItems.filter(i => i.category === menuFilter);

  return (
    <div className="restaurant-landing">
      {/* Hero Section */}
      <section style={{
        height: '60vh',
        background: restaurant.bannerUrl 
          ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("${restaurant.bannerUrl}") center/cover no-repeat`
          : 'linear-gradient(135deg, var(--surface-dim), var(--surface))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: restaurant.bannerUrl ? 'white' : 'var(--on-surface)',
        position: 'relative'
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          {restaurant.logoUrl && (
            <img 
              src={restaurant.logoUrl} 
              alt={displayName} 
              style={{ 
                width: '100px', height: '100px', borderRadius: '50%', 
                objectFit: 'cover', border: '4px solid var(--gold)', 
                marginBottom: '20px', backgroundColor: 'white'
              }} 
            />
          )}
          <h1 style={{ fontSize: '48px', marginBottom: '16px', letterSpacing: '0.05em' }}>
            {displayName}
          </h1>
          {restaurant.description && (
            <p style={{ fontSize: '20px', maxWidth: '600px', margin: '0 auto', opacity: 0.9 }}>
              {restaurant.description}
            </p>
          )}
        </div>
      </section>

      {/* Featured Events Section */}
      {events.length > 0 && tierLevel >= TIER_LEVELS.Premium && (
        <section style={{ padding: 'var(--spacing-xxl) 0', backgroundColor: 'var(--surface)' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)', color: 'var(--primary)' }}>Upcoming Events</h2>
            {/* Custom scrollbar hiding style */}
            <style>{`
              .event-carousel::-webkit-scrollbar { display: none; }
              .event-carousel { -ms-overflow-style: none; scrollbar-width: none; }
              @media (max-width: 900px) {
                .stack-on-mobile { flex-direction: column !important; }
                .stack-on-mobile > div:nth-child(2) { min-height: 250px; } /* Adjust image height on mobile */
              }
            `}</style>
            
            <div className="event-carousel" ref={carouselRef} style={{ 
              display: 'flex', 
              overflowX: 'auto', 
              scrollSnapType: 'x mandatory',
              gap: 'var(--spacing-xl)',
              padding: 'var(--spacing-lg) 0 var(--spacing-md) 0',
              scrollPadding: '0 var(--spacing-md)',
              scrollbarWidth: 'none', // hide scrollbar for firefox
              msOverflowStyle: 'none'  // hide scrollbar for IE/Edge
            }}>
              <style>{`.event-carousel::-webkit-scrollbar { display: none; }`}</style>
              {events.map(event => (
                <div key={event._id} className="stack-on-mobile" style={{
                  flex: '0 0 95%',
                  maxWidth: '1100px',
                  scrollSnapAlign: 'center',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'stretch',
                  backgroundColor: 'white',
                  borderRadius: '32px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                  border: '1px solid var(--platinum)',
                  margin: '0 auto'
                }}>
                  {/* Left Side: Title & Info */}
                  <div style={{ flex: '1 1 300px', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'inline-block', backgroundColor: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', alignSelf: 'flex-start', marginBottom: '20px', letterSpacing: '1px' }}>
                      {event.category}
                    </div>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '36px', fontWeight: '900', lineHeight: '1.1', color: 'var(--on-surface)', letterSpacing: '-1px' }}>
                      {event.title}
                    </h3>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '16px', lineHeight: '1.7', marginBottom: '32px', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {event.description}
                    </p>
                    <div style={{ display: 'flex', gap: '32px', marginTop: 'auto' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Date</div>
                        <div style={{ fontWeight: '800', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><span>📅</span> {event.startDate || 'TBA'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Time</div>
                        <div style={{ fontWeight: '800', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><span>⏰</span> {event.startTime || 'TBD'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Center: Image */}
                  <div style={{ flex: '0 0 380px', position: 'relative', minHeight: '300px' }}>
                    {event.eventImage ? (
                      <img src={event.eventImage} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '64px' }}>🎟️</span>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Venue & Ticketing */}
                  <div style={{ flex: '1 1 300px', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'var(--surface-bright)' }}>
                    <div style={{ marginBottom: '40px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Venue</div>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--on-surface)', marginBottom: '8px', lineHeight: '1.2' }}>{event.restaurantNameField || restaurant.name}</div>
                      <div style={{ fontSize: '16px', color: 'var(--on-surface-variant)', fontWeight: '600' }}>{event.branchLocation || event.address || 'Contact for details'}</div>
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Ticketing</div>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--on-surface)', letterSpacing: '-1px' }}>
                        {event.isFree ? 'FREE ENTRY' : `${event.price} ${event.currency || 'ETB'}`}
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      <span style={{ 
                        padding: '12px 24px', 
                        backgroundColor: event.status === 'Active' ? 'var(--surface-dim)' : (event.status === 'Closed' ? '#fce8e6' : 'var(--platinum)'), 
                        color: event.status === 'Active' ? 'var(--primary)' : (event.status === 'Closed' ? 'var(--error)' : 'var(--on-surface-variant)'),
                        borderRadius: '20px', 
                        fontSize: '15px', 
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        display: 'inline-block'
                      }}>
                        {event.status} Status
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Carousel Navigation Arrows */}
            {events.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-md)', padding: '0 var(--spacing-md)' }}>
                <button 
                  onClick={() => scrollCarousel('left')}
                  style={{
                    width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'var(--shadow-1)', fontSize: '20px', transition: 'transform 0.2s, background-color 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.backgroundColor = 'var(--gold)' }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = 'var(--primary)' }}
                >
                  ←
                </button>
                <button 
                  onClick={() => scrollCarousel('right')}
                  style={{
                    width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'var(--shadow-1)', fontSize: '20px', transition: 'transform 0.2s, background-color 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.backgroundColor = 'var(--gold)' }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = 'var(--primary)' }}
                >
                  →
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Quick Links Section */}
      <section style={{ padding: 'var(--spacing-xxl) 0', backgroundColor: 'var(--surface)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>Welcome to {displayName}</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-lg)'
          }}>
            <Link to={`/bulebet/${restaurantName}/menu`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                padding: '30px', borderRadius: '12px', textAlign: 'center',
                backgroundColor: 'white', border: '1px solid var(--platinum)',
                boxShadow: 'var(--shadow-1)', transition: 'transform 0.2s', cursor: 'pointer'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>📜</div>
                <h3>View Menu</h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '8px' }}>
                  Explore our dishes and drinks.
                </p>
              </div>
            </Link>

            {tierLevel >= TIER_LEVELS.Gold && (
              <Link to={`/bulebet/${restaurantName}/reservations`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                padding: '30px', borderRadius: '12px', textAlign: 'center',
                backgroundColor: 'white', border: '1px solid var(--platinum)',
                boxShadow: 'var(--shadow-1)', transition: 'transform 0.2s', cursor: 'pointer'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>📅</div>
                <h3>Book a Table</h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '8px' }}>
                  Reserve your perfect dining experience.
                </p>
              </div>
            </Link>
            )}

            {tierLevel >= TIER_LEVELS.Platinum && (
              <Link to={`/bulebet/${restaurantName}/catering`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                padding: '30px', borderRadius: '12px', textAlign: 'center',
                backgroundColor: 'white', border: '1px solid var(--platinum)',
                boxShadow: 'var(--shadow-1)', transition: 'transform 0.2s', cursor: 'pointer'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>🥂</div>
                <h3>Catering & Events</h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '8px' }}>
                  Let us host your next celebration.
                </p>
              </div>
            </Link>
            )}

            {tierLevel >= TIER_LEVELS.Premium && (
              <Link to={`/bulebet/${restaurantName}/feedback`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                padding: '30px', borderRadius: '12px', textAlign: 'center',
                backgroundColor: 'white', border: '1px solid var(--platinum)',
                boxShadow: 'var(--shadow-1)', transition: 'transform 0.2s', cursor: 'pointer'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>⭐</div>
                <h3>Leave Feedback</h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '8px' }}>
                  Tell us about your experience!
                </p>
              </div>
            </Link>
            )}
          </div>
        </div>
      </section>

      {/* Featured Menu Section */}
      {menuItems.length > 0 && (
        <section style={{ padding: 'var(--spacing-xxl) 0', backgroundColor: 'var(--surface-dim)' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>Featured from our Menu</h2>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setMenuFilter(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid var(--primary)',
                    backgroundColor: menuFilter === cat ? 'var(--primary)' : 'transparent',
                    color: menuFilter === cat ? 'white' : 'var(--primary)',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--spacing-lg)'
            }}>
              {filteredMenu.map(item => (
                <div key={item._id} style={{
                  backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden',
                  boxShadow: 'var(--shadow-1)', border: '1px solid var(--platinum)',
                  display: 'flex', flexDirection: 'column'
                }}>
                  {item.imageUrl ? (
                    <div style={{ height: '200px', width: '100%' }}>
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ height: '140px', width: '100%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '40px' }}>🍽️</span>
                    </div>
                  )}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px' }}>{item.name}</h3>
                      <span style={{ fontWeight: '700', color: 'var(--gold)', marginLeft: '12px' }}>${item.price.toFixed(2)}</span>
                    </div>
                    {item.description && (
                      <MenuDescription text={item.description} />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
              <Link to={`/bulebet/${restaurantName}/menu`} className="btn btn-outline">See Full Menu</Link>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {testimonials.length > 0 && tierLevel >= TIER_LEVELS.Premium && (
        <section style={{ padding: 'var(--spacing-xxl) 0', backgroundColor: '#fdfbf7' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)', color: 'var(--primary)' }}>What Our Guests Say</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--spacing-lg)'
            }}>
              {testimonials.slice(0, 3).map((t, idx) => (
                <div key={t._id || idx} style={{
                  backgroundColor: 'white', padding: '30px', borderRadius: '12px',
                  boxShadow: 'var(--shadow-1)', border: '1px solid var(--platinum)',
                  display: 'flex', flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary)',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px', fontWeight: 'bold'
                    }}>
                      {t.name ? t.name.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px' }}>{t.name || 'Guest'}</h4>
                      {t.role && <span style={{ fontSize: '13px', color: '#6b7280' }}>{t.role}</span>}
                    </div>
                  </div>
                  <div style={{ color: 'var(--gold)', marginBottom: '12px', letterSpacing: '2px', fontSize: '14px' }}>
                    {'★'.repeat(t.rating)}{'☆'.repeat(5 - (t.rating || 5))}
                  </div>
                  <p style={{ margin: 0, fontSize: '15px', color: '#4b5563', fontStyle: 'italic', lineHeight: '1.6', flex: 1 }}>
                    "{t.text}"
                  </p>
                  {t.mediaUrl && (
                    <div style={{ marginTop: '20px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--platinum)' }}>
                      {t.mediaType === 'video' ? (
                        <video src={t.mediaUrl} controls style={{ width: '100%', display: 'block', maxHeight: '200px', backgroundColor: '#000' }} />
                      ) : (
                        <img src={t.mediaUrl} alt="Testimonial media" style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '200px' }} />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {testimonials.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
                <Link to={`/bulebet/${restaurantName}/testimonials`} className="btn btn-outline">Read All Reviews</Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Info Section */}
      <section style={{ padding: 'var(--spacing-xl) 0', backgroundColor: 'var(--surface)' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center', textAlign: 'center' }}>
          {restaurant.address && (
            <div>
              <h4 style={{ marginBottom: '8px', color: 'var(--primary)' }}>Location</h4>
              <p style={{ color: 'var(--on-surface-variant)' }}>{restaurant.address}</p>
            </div>
          )}
          {restaurant.phone && (
            <div>
              <h4 style={{ marginBottom: '8px', color: 'var(--primary)' }}>Contact</h4>
              <p style={{ color: 'var(--on-surface-variant)' }}>{restaurant.phone}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default RestaurantLandingPage;

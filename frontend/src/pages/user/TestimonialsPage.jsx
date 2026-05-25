import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config';

const TestimonialsPage = () => {
  const { t } = useLanguage();
  const { restaurantName } = useParams();

  // States
  const [restaurant, setRestaurant] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default platform testimonials if accessed globally or as fallback
  const fallbackTestimonials = [
    { name: 'Julianne Vance', text: 'BuleBet has completely transformed how we manage our high-profile catering events. The precision is unmatched.', rating: 5, date: 'May 1, 2026' },
    { name: 'Marcus Sterling', text: 'The digital concierge feel is exactly what our brand needed. Our customers love the seamless reservation experience.', rating: 5, date: 'May 5, 2026' },
    { name: 'Elena Rodriguez', text: 'A masterclass in digital hospitality. Every touchpoint feels premium and intentionally designed.', rating: 5, date: 'May 10, 2026' },
    { name: 'Thomas Wright', text: 'The catering hub makes it so easy to manage complex requests. Highly recommended for elite operators.', rating: 4, date: 'May 15, 2026' },
  ];

  useEffect(() => {
    if (!restaurantName) {
      // Global mode
      setTestimonials(fallbackTestimonials);
      setLoading(false);
      return;
    }

    const fetchRestaurantAndTestimonials = async () => {
      try {
        setLoading(true);
        // Fetch restaurant details
        const restRes = await fetch(`${config.API_URL}/api/restaurants/${restaurantName}`);
        if (!restRes.ok) throw new Error('Restaurant not found');
        const restData = await restRes.json();
        setRestaurant(restData);

        // Fetch approved testimonials
        const testRes = await fetch(`${config.API_URL}/api/testimonials/restaurant/${restaurantName}`);
        if (testRes.ok) {
          const testData = await testRes.json();
          setTestimonials(testData);
        } else {
          setTestimonials([]);
        }
      } catch (err) {
        console.error('Error fetching testimonials page data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantAndTestimonials();
  }, [restaurantName]);

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '4px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6b7280' }}>Loading testimonials...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // If restaurant is not premium tier and client somehow routes here
  if (restaurantName && restaurant && restaurant.subscriptionTier !== 'Premium') {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Testimonials Not Enabled</h2>
        <p style={{ color: '#6b7280', maxWidth: '500px', margin: '10px auto' }}>
          This restaurant does not support custom guest testimonials under its current subscription tier.
        </p>
        <Link to={`/bulebet/${restaurantName}`} className="btn btn-primary" style={{ marginTop: '20px' }}>Back to Home</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-xxl) 0', backgroundColor: '#f9fafb', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 'var(--spacing-xxl)' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.02em', margin: '0 0 10px' }}>
            {restaurant ? `${restaurant.name} Testimonials` : 'Partner Testimonials'}
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
            {restaurant 
              ? `Read reviews and culinary feedback left by our distinguished guests at ${restaurant.name}.`
              : 'Hear from the industry leaders who have elevated their business with BuleBet.'
            }
          </p>
        </header>

        {/* Testimonials List */}
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--platinum)', overflow: 'hidden' }}>
          {testimonials.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white' }}>
              <p style={{ color: 'var(--on-surface-variant)' }}>No testimonials available yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid var(--platinum)' }}>
                  <tr>
                    <th style={{ padding: '16px', fontSize: '13px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Customer</th>
                    <th style={{ padding: '16px', fontSize: '13px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Rating</th>
                    <th style={{ padding: '16px', fontSize: '13px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Testimonial</th>
                    <th style={{ padding: '16px', fontSize: '13px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Media</th>
                    <th style={{ padding: '16px', fontSize: '13px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map((t, idx) => (
                    <tr key={t._id || idx} style={{ borderBottom: '1px solid var(--platinum)', backgroundColor: 'white', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '16px', fontWeight: 'bold', flexShrink: 0
                          }}>
                            {t.name ? t.name.charAt(0).toUpperCase() : 'G'}
                          </div>
                          <div>
                            <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>{t.name || 'Guest'}</span>
                            {t.role && <span style={{ fontSize: '12px', color: '#6b7280' }}>{t.role}</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                        <div style={{ color: 'var(--gold)', letterSpacing: '1px', fontSize: '14px' }}>
                          {'★'.repeat(t.rating)}{'☆'.repeat(5 - (t.rating || 5))}
                        </div>
                      </td>
                      <td style={{ padding: '16px', maxWidth: '400px', verticalAlign: 'top' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', fontStyle: 'italic', lineHeight: '1.6' }}>
                          "{t.text}"
                        </p>
                      </td>
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        {t.mediaUrl ? (
                          <div style={{ width: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--platinum)' }}>
                            {t.mediaType === 'video' ? (
                              <video src={t.mediaUrl} controls style={{ width: '100%', display: 'block', backgroundColor: '#000' }} />
                            ) : (
                              <img src={t.mediaUrl} alt="Media" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                            )}
                          </div>
                        ) : <span style={{ color: '#9ca3af', fontSize: '13px' }}>-</span>}
                      </td>
                      <td style={{ padding: '16px', whiteSpace: 'nowrap', verticalAlign: 'top', color: '#9ca3af', fontSize: '13px' }}>
                        {t.date ? new Date(t.date).toLocaleDateString() : t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          .stack-on-mobile {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TestimonialsPage;

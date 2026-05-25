import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import config from '../../config';

const CateringPage = () => {
  const { restaurantName } = useParams();
  const slug = restaurantName || window.location.pathname.split('/')[2] || '';
  const [restaurant, setRestaurant] = useState(null);

  // Menu state
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [menuFilter, setMenuFilter] = useState('All');
  const [showMenuSection, setShowMenuSection] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    eventType: 'corporate',
    guestCount: '25',
    date: '',
    location: '',
    name: '',
    email: '',
    phone: '',
    details: ''
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchMenu = async () => {
      try {
        setMenuLoading(true);

        // Step 1: resolve slug → restaurant document
        const restRes = await fetch(`${config.API_URL}/api/restaurants/${slug}`);
        if (!restRes.ok) throw new Error('Restaurant not found');
        const restaurantData = await restRes.json();
        setRestaurant(restaurantData);

        // Step 2: fetch menu items by restaurantId
        const menuRes = await fetch(`${config.API_URL}/api/menu/restaurant/${restaurantData._id}`);
        if (!menuRes.ok) throw new Error('Failed to fetch menu');
        const data = await menuRes.json();

        // Only show items that are available (visible)
        setMenuItems(data.filter(item => item.isAvailable !== false));
      } catch (err) {
        console.error('Failed to fetch menu:', err);
      } finally {
        setMenuLoading(false);
      }
    };
    fetchMenu();
  }, [slug]);

  const toggleItem = (item) => {
    setSelectedItems(prev =>
      prev.find(s => s._id === item._id)
        ? prev.filter(s => s._id !== item._id)
        : [...prev, item]
    );
  };

  const isSelected = (id) => selectedItems.some(s => s._id === id);

  // Cost estimate: sum of selected item prices × guest count
  const guestCount = parseInt(formData.guestCount) || 0;
  const pricePerHead = selectedItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const estimatedTotal = pricePerHead * guestCount;
  const hasEstimate = selectedItems.length > 0 && pricePerHead > 0 && guestCount > 0;

  const categories = ['All', ...Array.from(new Set(menuItems.map(i => i.category).filter(Boolean)))];
  const filteredMenu = menuFilter === 'All' ? menuItems : menuItems.filter(i => i.category === menuFilter);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedMenuDetails = selectedItems.map(i => `${i.name} ($${i.price || 'N/A'})`).join(', ');
      const costSummary = hasEstimate ? `\nEstimated Cost: $${estimatedTotal.toLocaleString()} total ($${pricePerHead.toFixed(2)}/head × ${guestCount} guests)` : '';
      const detailsWithMenu = selectedMenuDetails
        ? `Selected Menu: ${selectedMenuDetails}.${costSummary}\n\n${formData.details}`
        : formData.details;

      const response = await fetch(`${config.API_URL}/api/catering`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, details: detailsWithMenu, restaurantSlug: slug })
      });

      if (!response.ok) throw new Error('Failed to submit request');
      setSubmitted(true);
      setSelectedItems([]);
      setFormData({ eventType: 'corporate', guestCount: '25', date: '', location: '', name: '', email: '', phone: '', details: '' });
    } catch (err) {
      console.error(err);
      alert('There was an error submitting your request. Please try again.');
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--platinum)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  const isCateringEnabled = true; // Bypassed for testing

  if (submitted) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '72px', marginBottom: '24px' }}>🎉</div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '16px' }}>Request Submitted!</h2>
          <p style={{ color: 'var(--on-surface-variant)', lineHeight: 1.7, marginBottom: '32px' }}>
            Thank you for your catering inquiry. Our events team will review your request and contact you within 24 hours with a detailed proposal.
          </p>
          <button onClick={() => setSubmitted(false)} className="btn btn-gold">Submit Another Request</button>
        </div>
      </div>
    );
  }

  if (menuLoading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '4px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6b7280' }}>Loading catering details...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isCateringEnabled) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚛</div>
        <h2>Catering Not Enabled</h2>
        <p style={{ color: '#6b7280', maxWidth: '500px', margin: '10px auto' }}>
          This restaurant does not support online catering inquiries under its current subscription tier.
        </p>
        <button onClick={() => window.history.back()} className="btn btn-primary" style={{ marginTop: '20px' }}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-xxl) 0', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '920px' }}>

        {/* ── Hero Header ───────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍽️</div>
          <h1 style={{ color: 'var(--primary)', marginBottom: '12px', fontSize: '36px' }}>
            Catering Inquiry
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
            Tell us about your event and select menu items. We'll prepare a custom proposal and contact you within 24 hours.
          </p>
        </div>

        {/* ── Main Form Card ─────────────────────────────────── */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          border: '1px solid var(--platinum)',
          overflow: 'hidden'
        }}>

          <form onSubmit={handleSubmit}>

            {/* ── Section 1: Event Details ── */}
            <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--platinum)' }}>
              <h3 style={{ margin: '0 0 24px', fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--on-surface-variant)' }}>
                📋 Event Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>EVENT TYPE</label>
                  <select name="eventType" value={formData.eventType} onChange={handleChange} style={{ ...inputStyle, backgroundColor: 'white' }}>
                    <option value="corporate">Corporate Event</option>
                    <option value="wedding">Wedding</option>
                    <option value="private">Private Dinner</option>
                    <option value="other">Other Celebration</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>NUMBER OF GUESTS</label>
                  <input type="number" name="guestCount" value={formData.guestCount} onChange={handleChange} required min="1" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>EVENT DATE</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} required style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>LOCATION / VENUE</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="City or Venue Name" style={inputStyle} />
                </div>
              </div>
            </div>

            {/* ── Section 2: Contact Information ── */}
            <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--platinum)' }}>
              <h3 style={{ margin: '0 0 24px', fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--on-surface-variant)' }}>
                👤 Contact Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>FULL NAME</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>EMAIL ADDRESS</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>PHONE NUMBER</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} required style={inputStyle} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>ADDITIONAL NOTES</label>
                  <textarea name="details" value={formData.details} onChange={handleChange} rows="3"
                    placeholder="Dietary requirements, theme, special requests..."
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
            </div>

            {/* ── Section 3: Menu Selection ── */}
            <div style={{ padding: '32px 40px', borderBottom: '1px solid var(--platinum)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--on-surface-variant)' }}>
                  🍽️ Select Menu Items <span style={{ fontSize: '12px', fontWeight: '500', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMenuSection(!showMenuSection)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--gold)',
                    backgroundColor: showMenuSection ? 'var(--gold)' : 'transparent',
                    color: showMenuSection ? 'white' : 'var(--gold)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.2s'
                  }}
                >{showMenuSection ? '✕ Hide Menu' : '+ Browse Menu'}</button>
              </div>

              {showMenuSection && (
                <>
                  {/* Category tabs */}
                  {categories.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                      {categories.map(cat => (
                        <button key={cat} type="button" onClick={() => setMenuFilter(cat)}
                          style={{
                            padding: '5px 14px',
                            borderRadius: '20px',
                            border: '1px solid',
                            borderColor: menuFilter === cat ? 'var(--gold)' : 'var(--platinum)',
                            backgroundColor: menuFilter === cat ? 'var(--gold)' : 'white',
                            color: menuFilter === cat ? 'white' : '#6b7280',
                            fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.18s'
                          }}
                        >{cat}</button>
                      ))}
                    </div>
                  )}

                  {menuLoading ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--on-surface-variant)' }}>Loading menu...</div>
                  ) : filteredMenu.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--on-surface-variant)' }}>No items in this category.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {filteredMenu.map(item => {
                        const sel = isSelected(item._id);
                        return (
                          <label key={item._id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '14px 16px',
                            border: `1.5px solid ${sel ? '#f59e0b' : 'var(--platinum)'}`,
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            backgroundColor: sel ? '#fffbf0' : 'white',
                            transition: 'all 0.18s',
                            userSelect: 'none'
                          }}>
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={sel}
                              onChange={() => toggleItem(item)}
                              style={{ width: '18px', height: '18px', accentColor: '#f59e0b', cursor: 'pointer', flexShrink: 0 }}
                            />
                            {/* Thumbnail */}
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name}
                                style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: '52px', height: '52px', borderRadius: '8px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>🍽️</div>
                            )}
                            {/* Text */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: '700', fontSize: '14px' }}>{item.name}</div>
                              {item.description && (
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                  {item.description.length > 80 ? item.description.slice(0, 80) + '...' : item.description}
                                </div>
                              )}
                              {item.category && (
                                <span style={{ fontSize: '10px', backgroundColor: '#f3f4f6', padding: '2px 7px', borderRadius: '10px', color: '#6b7280', fontWeight: '600', marginTop: '4px', display: 'inline-block' }}>
                                  {item.category}
                                </span>
                              )}
                            </div>
                            {/* Price */}
                            {item.price != null && (
                              <div style={{ fontWeight: '800', color: '#d97706', fontSize: '16px', flexShrink: 0 }}>
                                ${parseFloat(item.price).toFixed(2)}<span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>/head</span>
                              </div>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Selected summary chips */}
              {selectedItems.length > 0 && (
                <div style={{ marginTop: '20px', padding: '14px 16px', backgroundColor: '#fffbf0', borderRadius: 'var(--radius-md)', border: '1px dashed #f59e0b' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', marginBottom: '8px' }}>
                    SELECTED ITEMS ({selectedItems.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedItems.map(item => (
                      <span key={item._id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '20px',
                        padding: '3px 12px', fontSize: '12px', fontWeight: '600', color: '#78350f'
                      }}>
                        {item.name}
                        {item.price != null && <span style={{ opacity: 0.6 }}>— ${parseFloat(item.price).toFixed(2)}</span>}
                        <button type="button" onClick={() => toggleItem(item)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', fontWeight: '800', padding: 0, lineHeight: 1 }}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Section 4: Cost Estimate ── */}
            {hasEstimate && (
              <div style={{ padding: '28px 40px', borderBottom: '1px solid var(--platinum)', background: 'linear-gradient(135deg, #fffbf0, #fef3c7)' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#92400e' }}>
                  💰 Estimated Cost Breakdown
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  {/* Per head */}
                  <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid #f59e0b', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', marginBottom: '4px' }}>COST PER HEAD</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#d97706' }}>${pricePerHead.toFixed(2)}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>per guest</div>
                  </div>
                  {/* Guests */}
                  <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid #f59e0b', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', marginBottom: '4px' }}>GUESTS</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#d97706' }}>{guestCount}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>people</div>
                  </div>
                  {/* Total */}
                  <div style={{ backgroundColor: '#f59e0b', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>ESTIMATED TOTAL</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>${estimatedTotal.toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>before taxes & service</div>
                  </div>
                </div>

                {/* Item breakdown */}
                <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', border: '1px solid #f59e0b', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', backgroundColor: '#fef3c7', fontSize: '12px', fontWeight: '700', color: '#78350f', borderBottom: '1px solid #f59e0b' }}>
                    ITEM BREAKDOWN
                  </div>
                  {selectedItems.filter(i => i.price != null).map((item, idx) => (
                    <div key={item._id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 16px',
                      borderBottom: idx < selectedItems.length - 1 ? '1px solid #fef3c7' : 'none',
                      fontSize: '13px'
                    }}>
                      <span>{item.name}</span>
                      <span style={{ fontWeight: '700', color: '#d97706' }}>
                        ${parseFloat(item.price).toFixed(2)} × {guestCount} = ${(parseFloat(item.price) * guestCount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#fef3c7', fontWeight: '800', fontSize: '14px' }}>
                    <span>TOTAL ESTIMATE</span>
                    <span style={{ color: '#d97706' }}>${estimatedTotal.toLocaleString()}</span>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px', marginBottom: 0 }}>
                  * This is an estimate only. Final pricing may vary based on service fees, gratuity, and specific preparation requirements. Our team will send you a formal quote.
                </p>
              </div>
            )}

            {/* ── Submit Button ── */}
            <div style={{ padding: '32px 40px', textAlign: 'center', backgroundColor: '#fafafa' }}>
              <button type="submit" style={{
                padding: '16px 60px',
                fontSize: '16px',
                fontWeight: '800',
                backgroundColor: 'var(--gold)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                letterSpacing: '0.5px',
                boxShadow: '0 4px 20px rgba(212,175,55,0.4)',
                transition: 'all 0.2s',
                width: '100%',
                maxWidth: '400px',
                display: 'block',
                margin: '0 auto'
              }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(212,175,55,0.5)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,175,55,0.4)'; }}
              >
                🍽️ Request Catering Quote
              </button>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px', marginBottom: 0 }}>
                Our events team will respond within 24 hours.
              </p>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default CateringPage;

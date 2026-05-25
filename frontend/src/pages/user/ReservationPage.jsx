import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import config from '../../config';

const ReservationPage = () => {
  const { restaurantName } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '19:00',
    guests: '2',
    name: '',
    email: '',
    phone: '',
    specialRequests: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${config.API_URL}/api/restaurants/${restaurantName}`)
      .then(res => res.json())
      .then(data => {
        if (!data.msg) {
          setRestaurant(data);
          setRestaurantId(data._id);
        }
      })
      .catch(err => console.error("Error fetching restaurant ID", err))
      .finally(() => setLoading(false));
  }, [restaurantName]);

  const isReservationsEnabled = true; // Bypassed for testing

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restaurantId) return alert('Restaurant data is still loading. Please wait.');

    setIsSubmitting(true);
    try {
      const res = await fetch(`${config.API_URL}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          guestName: formData.name,
          email: formData.email,
          phone: formData.phone || 'N/A',
          date: formData.date,
          time: formData.time,
          guests: parseInt(formData.guests, 10),
          specialRequests: formData.specialRequests
        })
      });

      if (res.ok) {
        alert('Reservation request sent successfully!');
        setFormData({ ...formData, date: '', name: '', email: '', phone: '', specialRequests: '' });
      } else {
        alert('Failed to send reservation request.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '4px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6b7280' }}>Loading reservation details...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isReservationsEnabled) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📅</div>
        <h2>Reservations Not Enabled</h2>
        <p style={{ color: '#6b7280', maxWidth: '500px', margin: '10px auto' }}>
          This restaurant does not support online reservations under its current subscription tier.
        </p>
        <button onClick={() => window.history.back()} className="btn btn-primary" style={{ marginTop: '20px' }}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-xxl) 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xxl)', alignItems: 'start' }}>
          
          {/* Info Side */}
          <div>
            <h1 style={{ marginBottom: 'var(--spacing-md)' }}>Reserve Your Table</h1>
            <p style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-lg)' }}>
              Join us for an unforgettable dining experience. Please note that for groups of 6 or more, we require a credit card on file.
            </p>
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <h4 style={{ color: 'var(--gold)' }}>Hours of Operation</h4>
              <p style={{ fontSize: '14px' }}>Mon - Thu: 17:00 - 22:00</p>
              <p style={{ fontSize: '14px' }}>Fri - Sat: 17:00 - 23:30</p>
              <p style={{ fontSize: '14px' }}>Sun: 12:00 - 21:00</p>
            </div>
          </div>

          {/* Form Side */}
          <div style={{
            backgroundColor: 'var(--surface)',
            padding: 'var(--spacing-xl)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-2)',
            border: '1px solid var(--platinum)'
          }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>DATE</label>
                  <input 
                    type="date" 
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--platinum)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>TIME</label>
                  <select 
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--platinum)', backgroundColor: 'white' }}
                  >
                    <option>18:00</option>
                    <option>18:30</option>
                    <option>19:00</option>
                    <option>19:30</option>
                    <option>20:00</option>
                    <option>20:30</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>GUESTS</label>
                <select 
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--platinum)', backgroundColor: 'white' }}
                >
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>FULL NAME</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--platinum)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>EMAIL</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--platinum)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>PHONE</label>
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--platinum)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>SPECIAL REQUESTS</label>
                <textarea 
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleChange}
                  rows="3"
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--platinum)', resize: 'none' }}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Complete Reservation'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;

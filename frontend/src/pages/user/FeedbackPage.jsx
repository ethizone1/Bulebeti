import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import config from '../../config';

const FeedbackPage = () => {
  const { restaurantName } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [restaurantData, setRestaurantData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [publishedFeedback, setPublishedFeedback] = useState([]);

  useEffect(() => {
    const fetchRestaurantAndFeedback = async () => {
      try {
        const res = await fetch(`${config.API_URL}/api/restaurants/${restaurantName}`);
        if (res.ok) {
          const data = await res.json();
          setRestaurantData(data);
          
          // Fetch published feedback
          const fbRes = await fetch(`${config.API_URL}/api/feedback/restaurant/${data._id}`);
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            setPublishedFeedback(fbData.filter(fb => fb.status === 'Published'));
          }
        }
      } catch (err) {
        console.error('Failed to fetch restaurant or feedback', err);
      }
    };
    fetchRestaurantAndFeedback();
  }, [restaurantName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restaurantData) {
      alert("Restaurant not loaded yet.");
      return;
    }
    
    if (rating === 0) {
      alert("Please select a star rating before submitting your feedback.");
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`${config.API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurantData._id,
          rating,
          comment,
          customer: name,
          phone: phone,
          date: new Date().toLocaleDateString(),
          status: 'New'
        })
      });

      if (res.ok) {
        alert('Thank you for your feedback! It helps us maintain the highest standards.');
        setRating(0);
        setComment('');
        setName('');
        setPhone('');
        // We do not redirect so they can stay on the page
      } else {
        alert('Failed to submit feedback. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while submitting feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-xxl) 0', backgroundColor: '#f9fafb' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Published Feedback Section */}
        {publishedFeedback.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-xxxl)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)', color: 'var(--primary)', fontSize: '28px' }}>What Our Guests Are Saying</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {publishedFeedback.map((t, idx) => (
                <div key={t._id || idx} style={{
                  backgroundColor: 'white',
                  padding: '30px',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-1)',
                  border: '1px solid var(--platinum)',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {t.customer ? t.customer.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--on-surface)' }}>{t.customer || 'Guest'}</h3>
                    </div>
                    <div style={{ color: 'var(--gold)', marginBottom: '12px', fontSize: '14px' }}>
                      {'★'.repeat(t.rating)}{'☆'.repeat(5 - (t.rating || 5))}
                      <span style={{ color: '#9ca3af', marginLeft: '10px', fontSize: '12px' }}>
                        {t.date ? new Date(t.date).toLocaleDateString() : t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '16px', lineHeight: '1.6', margin: 0 }}>
                      "{t.comment}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Section */}
        <div style={{
          backgroundColor: 'white',
          padding: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-2)',
          border: '1px solid var(--platinum)',
          textAlign: 'center',
          marginBottom: 'var(--spacing-xxl)'
        }}>
          <h1 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--primary)' }}>Share Your Experience</h1>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-xl)' }}>
            Your feedback is essential to our commitment to excellence.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 'var(--spacing-md)', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>YOUR NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--platinum)', fontSize: '16px' }}
              />
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>PHONE NUMBER</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+1 (555) 000-0000"
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--platinum)', fontSize: '16px' }}
              />
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>RATE YOUR EXPERIENCE</label>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '32px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setRating(star)}
                    style={{ cursor: 'pointer', color: star <= rating ? 'var(--gold)' : 'var(--platinum)' }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>YOUR COMMENTS</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="5"
                placeholder="Tell us what you enjoyed or how we can improve..."
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--platinum)',
                  resize: 'none',
                  fontSize: '16px'
                }}
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;

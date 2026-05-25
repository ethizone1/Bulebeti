import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const UserProfile = () => {
  const navigate = useNavigate();
  const user = {
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    memberSince: '2025',
    tier: 'Platinum Member'
  };

  const reservations = [
    { id: 'BB-1024', date: '2026-05-20', time: '19:30', guests: 4, status: 'Upcoming' },
    { id: 'BB-0988', date: '2026-04-12', time: '20:00', guests: 2, status: 'Completed' },
  ];

  return (
    <div style={{ padding: 'var(--spacing-xxl) 0' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-xxl)' }}>
          {/* Profile Sidebar */}
          <aside>
            <div style={{
              backgroundColor: 'var(--surface)',
              padding: 'var(--spacing-xl)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--platinum)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'var(--platinum)',
                margin: '0 auto var(--spacing-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: '700',
                color: 'var(--on-surface-variant)'
              }}>
                SJ
              </div>
              <h2 style={{ marginBottom: '4px' }}>{user.name}</h2>
              <div style={{ color: 'var(--gold)', fontWeight: '700', fontSize: '12px', marginBottom: '16px' }}>{user.tier}</div>
              <div style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginBottom: '24px' }}>
                Member since {user.memberSince}
              </div>
              <button style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--platinum)', background: 'none', cursor: 'pointer' }}>Edit Profile</button>
            </div>
          </aside>

          {/* Activity Feed */}
          <main>
            <section style={{ marginBottom: 'var(--spacing-xxl)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>My Reservations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {reservations.map((res) => (
                  <div key={res.id} style={{
                    backgroundColor: 'var(--surface)',
                    padding: 'var(--spacing-lg)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--platinum)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '700' }}>{res.date} at {res.time}</div>
                      <div style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>Reservation ID: {res.id} • {res.guests} Guests</div>
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: '700',
                      backgroundColor: res.status === 'Upcoming' ? '#e6f4ea' : '#f1f3f4',
                      color: res.status === 'Upcoming' ? '#1e7e34' : '#5f6368'
                    }}>{res.status}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Account Settings</h3>
              <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--platinum)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Email Notifications</span>
                  <span style={{ color: 'var(--gold)' }}>Enabled</span>
                </div>
                <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--platinum)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Two-Factor Authentication</span>
                  <span style={{ color: 'var(--on-surface-variant)' }}>Disabled</span>
                </div>
              </div>
            </section>

            <section style={{ marginTop: 'var(--spacing-xl)', padding: 'var(--spacing-lg)', backgroundColor: '#fff8e6', borderRadius: '12px', border: '1px solid #ffeeba' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>Need Assistance?</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#856404' }}>Our concierge team is available 24/7 to help with your dining experience.</p>
                </div>
                <button 
                  onClick={() => navigate('/contact-us')}
                  className="btn btn-gold" 
                  style={{ padding: '10px 24px' }}
                >
                  Contact Concierge
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

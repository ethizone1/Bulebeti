import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../config';

const SuperAdminDashboard = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${config.API_URL}/api/restaurants`)
      .then(res => res.json())
      .then(data => {
        setRestaurants(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching restaurants', err);
        setLoading(false);
      });
  }, []);

  const stats = [
    { title: 'Total Restaurants', value: restaurants.length.toString(), change: 'Registered Partners' },
    { title: 'Active Reservations', value: 'System', change: 'Live' },
    { title: 'Platform Revenue', value: 'Calculating', change: 'Monthly Recurring' },
    { title: 'Server Status', value: 'Optimal', change: '99.9% Uptime' },
  ];

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: 'var(--spacing-xl)' }}>Platform Overview</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--spacing-xl)',
        marginBottom: '40px'
      }}>
        {stats.map((s, idx) => (
          <div key={idx} style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>{s.title}</div>
            <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#10b981' }}>{s.change}</div>
          </div>
        ))}
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '20px' }}>Recent Partner Registrations</h3>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 8px', fontSize: '13px', color: '#6b7280' }}>RESTAURANT</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', color: '#6b7280' }}>OWNER</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', color: '#6b7280' }}>STATUS</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', color: '#6b7280' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.slice(0, 5).map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '16px 8px', fontWeight: '600' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {row.logoUrl ? <img src={row.logoUrl} alt={row.name} style={{ width: '24px', height: '24px', borderRadius: '4px' }} /> : <span>🍽️</span>}
                    {row.name}
                  </div>
                </td>
                <td style={{ padding: '16px 8px', fontSize: '14px' }}>{row.ownerId?.name || 'Unknown'}</td>
                <td style={{ padding: '16px 8px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                    backgroundColor: '#e6f4ea',
                    color: '#1e7e34'
                  }}>Active</span>
                </td>
                <td style={{ padding: '16px 8px' }}>
                  <button onClick={() => navigate(`/super-admin/restaurants`)} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '14px' }}>Manage</button>
                </td>
              </tr>
            ))}
            {restaurants.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No restaurants registered yet.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

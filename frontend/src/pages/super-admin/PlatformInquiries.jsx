import React, { useState, useEffect } from 'react';
import config from '../../config';

const PlatformInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_URL}/api/inquiries`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-auth-token': token } : {})
        }
      });
        const data = await res.json();
        setInquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch inquiries', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleResolve = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_URL}/api/inquiries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-auth-token': token } : {})
        },
        body: JSON.stringify({ status: 'Resolved' })
      });
      
      if (res.ok) {
        setInquiries(prev => prev.map(i => i._id === id ? { ...i, status: 'Resolved' } : i));
        alert('Inquiry marked as Resolved. A confirmation has been sent to the user.');
      }
    } catch {
      alert('Failed to update inquiry status');
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading inquiries...</div>;

  const safeInquiries = Array.isArray(inquiries) ? inquiries : [];

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>Platform Inquiries</h1>
          <p style={{ color: '#6b7280' }}>Managing global support and partnership communications.</p>
        </div>
        <div style={{ backgroundColor: '#1a1c23', color: 'white', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>
          {safeInquiries.filter(i => i.status !== 'Resolved').length} UNRESOLVED
        </div>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {safeInquiries.map((inquiry) => (
          <div key={inquiry._id} style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            borderLeft: inquiry.status === 'New' ? '4px solid var(--gold)' : inquiry.status === 'Pending' ? '4px solid #3b82f6' : '4px solid #10b981'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: '800', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  backgroundColor: inquiry.status === 'New' ? '#fff7ed' : inquiry.status === 'Pending' ? '#eff6ff' : '#ecfdf5',
                  color: inquiry.status === 'New' ? '#9a3412' : inquiry.status === 'Pending' ? '#1e40af' : '#065f46',
                  marginRight: '12px'
                }}>
                  {inquiry.status.toUpperCase()}
                </span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{new Date(inquiry.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--gold)' }}>{inquiry.subject}</div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>{inquiry.name}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                {inquiry.email} {inquiry.phone ? `• ${inquiry.phone}` : ''}
              </div>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#374151' }}>"{inquiry.message}"</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
              {inquiry.status !== 'Resolved' ? (
                <>
                  <a href={`mailto:${inquiry.email}`} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '12px', textDecoration: 'none' }}>Reply via Email</a>
                  {inquiry.phone && (
                    <a href={`https://wa.me/${inquiry.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn btn-outline-success" style={{ padding: '8px 20px', fontSize: '12px', textDecoration: 'none' }}>WhatsApp</a>
                  )}
                  <button onClick={() => handleResolve(inquiry._id)} className="btn btn-outline" style={{ padding: '8px 20px', fontSize: '12px' }}>Mark as Resolved</button>
                </>
              ) : (
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>✅ RESOLVED & ARCHIVED</div>
              )}
            </div>
          </div>
        ))}

        {inquiries.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', backgroundColor: 'white', borderRadius: '12px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <p>No platform inquiries found. Inbox zero!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformInquiries;

import React, { useState } from 'react';

const PlatformInquiries = () => {
  const [inquiries, setInquiries] = useState([
    { id: 1, name: 'Robert C.', email: 'robert@grandhotel.com', subject: 'Partnership Proposal', message: 'Interested in onboarding our 5 luxury locations to BuleBet.', status: 'New', date: '2026-05-14' },
    { id: 2, name: 'Sonia L.', email: 'sonia@bistro-east.com', subject: 'Technical Support', message: 'Unable to upload high-resolution menu images.', status: 'Pending', date: '2026-05-13' },
    { id: 3, name: 'Michael K.', email: 'mike@foodie.com', subject: 'Platform Inquiry', message: 'Do you offer custom branding for Platinum tier?', status: 'Resolved', date: '2026-05-12' },
  ]);

  const handleResolve = (id) => {
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: 'Resolved' } : i));
    alert('Inquiry marked as Resolved. A confirmation has been sent to the user.');
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>Platform Inquiries</h1>
          <p style={{ color: '#6b7280' }}>Managing global support and partnership communications.</p>
        </div>
        <div style={{ backgroundColor: '#1a1c23', color: 'white', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: '700' }}>
          {inquiries.filter(i => i.status !== 'Resolved').length} UNRESOLVED
        </div>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {inquiries.map((inquiry) => (
          <div key={inquiry.id} style={{
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
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{inquiry.date}</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--gold)' }}>{inquiry.subject}</div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>{inquiry.name}</div>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>{inquiry.email}</div>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#374151' }}>"{inquiry.message}"</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
              {inquiry.status !== 'Resolved' ? (
                <>
                  <button className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '12px' }}>Reply via Concierge</button>
                  <button onClick={() => handleResolve(inquiry.id)} className="btn btn-outline" style={{ padding: '8px 20px', fontSize: '12px' }}>Mark as Resolved</button>
                </>
              ) : (
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>✓ RESOLVED & ARCHIVED</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlatformInquiries;

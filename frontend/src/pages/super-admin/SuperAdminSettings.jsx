import React, { useState } from 'react';

const SuperAdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <section>
            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Platform Identity</h3>
            <div style={{ display: 'grid', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>PLATFORM NAME</label>
                <input type="text" defaultValue="BuleBet Global" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--platinum)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>SUPPORT EMAIL</label>
                <input type="email" defaultValue="support@bulebet.com" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--platinum)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>SYSTEM TIMEZONE</label>
                <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--platinum)' }}>
                  <option>Universal Coordinated Time (UTC)</option>
                  <option>Eastern Standard Time (EST)</option>
                  <option>Central European Time (CET)</option>
                </select>
              </div>
            </div>
          </section>
        );
      case 'security':
        return (
          <section>
            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Global Security Protocols</h3>
            <div style={{ display: 'grid', gap: '20px' }}>
              {[
                { title: 'Two-Factor Authentication (2FA)', desc: 'Enforce 2-step verification for all restaurant admins.', enabled: true },
                { title: 'Maintenance Mode', desc: 'Take the platform offline for system upgrades.', enabled: false },
                { title: 'Automatic Logging', desc: 'Archive all administrative actions for 90 days.', enabled: true },
              ].map((s, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid var(--platinum)' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{s.title}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{s.desc}</div>
                  </div>
                  <div style={{ width: '40px', height: '20px', backgroundColor: s.enabled ? 'var(--gold)' : '#d1d5db', borderRadius: '10px', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', right: s.enabled ? '2px' : 'auto', left: s.enabled ? 'auto' : '2px', top: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1>Platform Configuration</h1>
        <p style={{ color: '#6b7280' }}>Global settings and system-wide security controls.</p>
      </div>

      <div style={{ display: 'flex', gap: '40px' }}>
        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'general', name: 'General Settings', icon: '⚙️' },
            { id: 'security', name: 'Security & Access', icon: '🔒' },
            { id: 'billing', name: 'Billing Defaults', icon: '💳' },
            { id: 'backups', name: 'System Backups', icon: '💾' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? 'rgba(255, 184, 0, 0.1)' : 'transparent',
                color: activeTab === tab.id ? 'var(--gold)' : 'rgba(0,0,0,0.6)',
                fontWeight: activeTab === tab.id ? '700' : '500',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        <div style={{ 
          flex: 1, 
          backgroundColor: 'white', 
          padding: '32px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          minHeight: '500px'
        }}>
          {renderContent()}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--platinum)' }}>
            <button className="btn btn-primary" onClick={() => alert('Global Platform Settings Updated!')}>Save System Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettings;

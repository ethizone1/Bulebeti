import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import QRCodeModal from '../../components/QRCodeModal';
import config from '../../config';

const RestaurantManagement = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQrRestaurant, setSelectedQrRestaurant] = useState(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${config.API_URL}/api/restaurants`);
      if (!res.ok) throw new Error('Failed to fetch restaurants');
      const data = await res.json();
      
      const mappedRestaurants = data.map(rest => ({
        id: rest._id,
        name: rest.name,
        slug: rest.slug,
        owner: rest.ownerId ? rest.ownerId.name : 'Unknown Owner',
        tier: rest.subscriptionTier || 'Platinum',
        pendingTierRequest: rest.pendingTierRequest || '',
        status: rest.status || 'Active',
        joined: new Date(rest.createdAt || Date.now()).toLocaleDateString(),
        originalData: rest
      }));
      
      setRestaurants(mappedRestaurants);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRestaurants();
  }, []);

  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch(`${config.API_URL}/api/restaurants/admin/edit/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setRestaurants(prev => prev.map(r => {
          if (r.id === id) {
            return { ...r, status: nextStatus };
          }
          return r;
        }));
      } else {
        alert('Failed to update status in database');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  const handleApproveUpgrade = async (id, targetTier) => {
    try {
      const res = await fetch(`${config.API_URL}/api/restaurants/admin/upgrade/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionTier: targetTier,
          clearPending: true
        })
      });

      if (res.ok) {
        alert(`Successfully upgraded restaurant to ${targetTier}!`);
        fetchRestaurants(); // Refresh data
      } else {
        alert('Failed to approve upgrade');
      }
    } catch (err) {
      console.error(err);
      alert('Error approving upgrade');
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${config.API_URL}/api/restaurants/admin/edit/${editingRestaurant._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingRestaurant.name,
          slug: editingRestaurant.slug,
          subscriptionTier: editingRestaurant.subscriptionTier
        })
      });

      if (res.ok) {
        alert('Restaurant updated successfully!');
        setEditModalOpen(false);
        fetchRestaurants(); // Refresh data
      } else {
        const errorData = await res.json();
        alert(`Failed to update restaurant: ${errorData.msg || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error updating restaurant');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1>Restaurant Directory</h1>
          <p style={{ color: '#6b7280' }}>Global oversight of all partners and their operational status.</p>
        </div>
        <button onClick={() => navigate('/register')} className="btn btn-primary">Add New Partner</button>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 8px', fontSize: '13px', color: '#6b7280' }}>RESTAURANT</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', color: '#6b7280' }}>OWNER</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', color: '#6b7280' }}>PUBLIC URL</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', color: '#6b7280' }}>TIER</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', color: '#6b7280' }}>STATUS</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', color: '#6b7280' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '16px 8px' }}>
                  <div style={{ fontWeight: '600' }}>{row.name}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Joined {row.joined}</div>
                </td>
                <td style={{ padding: '16px 8px', fontSize: '14px' }}>{row.owner}</td>
                <td style={{ padding: '16px 8px' }}>
                  <Link to={`/bulebet/${row.slug}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <code style={{ fontSize: '11px', color: 'var(--gold)', backgroundColor: 'rgba(212, 175, 55, 0.05)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.15)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.05)'}>
                      bulebet/{row.slug}
                    </code>
                  </Link>
                </td>
                <td style={{ padding: '16px 8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: row.tier === 'Premium' ? 'var(--gold)' : 'var(--primary)'
                    }}>{row.tier}</span>
                    {row.pendingTierRequest && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: '700',
                        color: 'white',
                        backgroundColor: '#d97706',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        width: 'fit-content',
                        letterSpacing: '0.5px'
                      }}>
                        ⚡ REQ: {row.pendingTierRequest}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '16px 8px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                    backgroundColor: row.status === 'Active' ? '#e6f4ea' : row.status === 'Pending' ? '#fff7e6' : '#fef2f2',
                    color: row.status === 'Active' ? '#1e7e34' : row.status === 'Pending' ? '#d97706' : '#dc2626'
                  }}>{row.status}</span>
                </td>
                <td style={{ padding: '16px 8px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button 
                      onClick={() => toggleStatus(row.id, row.status)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: row.status === 'Active' ? '#dc2626' : '#1e7e34', 
                        cursor: 'pointer', 
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                    {row.pendingTierRequest && (
                      <button
                        onClick={() => handleApproveUpgrade(row.id, row.pendingTierRequest)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '700',
                          transition: 'opacity 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                        onMouseOut={e => e.currentTarget.style.opacity = '1'}
                      >
                        Approve Upgrade
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedQrRestaurant({ name: row.slug, id: row.id });
                        setQrModalOpen(true);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'white',
                        border: '1px solid var(--gold)',
                        color: 'var(--gold)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      View QRs
                    </button>
                    <button 
                      onClick={() => {
                        setEditingRestaurant(row.originalData);
                        setEditModalOpen(true);
                      }}
                      style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '14px' }}
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>

      <QRCodeModal 
        isOpen={qrModalOpen} 
        onClose={() => setQrModalOpen(false)} 
        restaurantName={selectedQrRestaurant?.name} 
        restaurantId={selectedQrRestaurant?.id} 
      />

      {/* Edit Modal */}
      {editModalOpen && editingRestaurant && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ margin: '0 0 24px 0' }}>Edit Restaurant</h2>
            <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Name</label>
                <input 
                  type="text" 
                  value={editingRestaurant.name} 
                  onChange={e => setEditingRestaurant({...editingRestaurant, name: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Slug</label>
                <input 
                  type="text" 
                  value={editingRestaurant.slug} 
                  onChange={e => setEditingRestaurant({...editingRestaurant, slug: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Tier</label>
                <select 
                  value={editingRestaurant.subscriptionTier || 'Basic'} 
                  onChange={e => setEditingRestaurant({...editingRestaurant, subscriptionTier: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                >
                  <option value="Basic">Basic</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setEditModalOpen(false)}
                  style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', borderRadius: '6px' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RestaurantManagement;

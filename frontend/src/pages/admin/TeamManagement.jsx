import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAdmin } from '../../layouts/AdminLayout';
import config from '../../config';

const AVAILABLE_PERMISSIONS = [
  { id: 'manage_menu', label: 'Menu & Gallery', minTier: 'Basic' },
  { id: 'manage_reservations', label: 'Reservations', minTier: 'Gold' },
  { id: 'manage_catering', label: 'Catering', minTier: 'Platinum' },
  { id: 'manage_locations', label: 'Locations', minTier: 'Platinum' },
  { id: 'manage_events', label: 'Events', minTier: 'Premium' },
  { id: 'manage_feedback', label: 'Feedback & Testimonials', minTier: 'Premium' },
  { id: 'manage_team', label: 'Team Management', minTier: 'Gold' }
];

const TIER_LEVELS = { Basic: 0, Gold: 1, Platinum: 2, Premium: 3 };

const TeamManagement = () => {
  const { restaurantName } = useParams();
  const [team, setTeam] = useState([]);
  const [owner, setOwner] = useState(null);
  const [restaurantTier, setRestaurantTier] = useState('Platinum'); // Default to Platinum if unknown
  const [loading, setLoading] = useState(true);
  const { searchQuery } = useAdmin();
  
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPermissions, setNewPermissions] = useState([]);
  const [adding, setAdding] = useState(false);
  
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  
  const [currentUserPermissions, setCurrentUserPermissions] = useState([]);
  const [isOwnerFlag, setIsOwnerFlag] = useState(false);

  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_URL}/api/restaurants/${restaurantName}/team`, {
        headers: { 'x-auth-token': token }
      });
      if (!res.ok) throw new Error('Failed to fetch team');
      const data = await res.json();
      setOwner(data.owner);
      setTeam(data.admins);
      if (data.subscriptionTier) {
        setRestaurantTier(data.subscriptionTier || 'Basic');
      }

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const storedUserId = String(storedUser._id || storedUser.id);
      const ownerIdStr = String(data.owner?._id || data.owner?.id || data.owner);
      const isSuperAdmin = storedUser.role === 'super-admin' || storedUser.role === 'hub owner';
      
      if (ownerIdStr === storedUserId || isSuperAdmin) {
        setIsOwnerFlag(true);
        setCurrentUserPermissions(AVAILABLE_PERMISSIONS.map(p => p.id));
      } else {
        setIsOwnerFlag(false);
        const adminRecord = data.admins.find(a => String(a.user?._id || a.user?.id || a.user) === storedUserId);
        setCurrentUserPermissions(adminRecord?.permissions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [restaurantName]);

  useEffect(() => {
    fetchTeam();
  }, [restaurantName, fetchTeam]);

  const [createdInvite, setCreatedInvite] = useState(null);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newEmail) return;

    setAdding(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_URL}/api/restaurants/${restaurantName}/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ email: newEmail, phone: newPhone, permissions: newPermissions })
      });

      if (res.ok) {
        const inviteLink = `${window.location.origin}/bulebeti/activate?email=${encodeURIComponent(newEmail)}&phone=${encodeURIComponent(newPhone)}&restaurant=${encodeURIComponent(restaurantName)}`;
        setCreatedInvite({
          email: newEmail,
          phone: newPhone,
          link: inviteLink
        });
        setNewEmail('');
        setNewPhone('');
        setNewPermissions([]);
        fetchTeam();
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to add user');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding user');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdatePermissions = async (userId, updatedPermissions) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_URL}/api/restaurants/${restaurantName}/team/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ permissions: updatedPermissions })
      });

      if (res.ok) {
        fetchTeam();
      } else {
        alert('Failed to update permissions');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_URL}/api/restaurants/${restaurantName}/team/${userId}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      if (res.ok) {
        fetchTeam();
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to remove user');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (admin) => {
    setEditingAdminId(admin.user._id);
    setEditName(admin.user.name || '');
    setEditEmail(admin.user.email || '');
    setEditPhone(admin.user.phone || '');
  };

  const handleCancelEdit = () => {
    setEditingAdminId(null);
  };

  const handleSaveProfile = async (userId) => {
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_URL}/api/restaurants/${restaurantName}/team/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ name: editName, email: editEmail, phone: editPhone })
      });

      if (res.ok) {
        setEditingAdminId(null);
        fetchTeam();
        alert('Profile updated successfully!');
      } else {
        const data = await res.json();
        alert(data.msg || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleNewPermission = (permId) => {
    if (newPermissions.includes(permId)) {
      setNewPermissions(newPermissions.filter(p => p !== permId));
    } else {
      setNewPermissions([...newPermissions, permId]);
    }
  };

  const toggleExistingPermission = (userId, currentPerms, permId) => {
    const updated = currentPerms.includes(permId)
      ? currentPerms.filter(p => p !== permId)
      : [...currentPerms, permId];
    handleUpdatePermissions(userId, updated);
  };

  if (loading) return <div className="p-5 text-center">Loading team data...</div>;

  const canManageTeam = isOwnerFlag || currentUserPermissions.includes('manage_team');

  const filteredTeam = team.filter(admin => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (admin.user.name || '').toLowerCase().includes(q) ||
      (admin.user.email || '').toLowerCase().includes(q) ||
      (admin.user.phone || '').toLowerCase().includes(q)
    );
  });

  const showOwner = owner && (!searchQuery || (
    (owner.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (owner.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  ));

  return (
    <div className="team-management py-3">
      <div className="mb-4">
        <h1 className="fs-3 fw-bold m-0">Team Management</h1>
        <p className="text-muted">Manage who has access to your restaurant's dashboard and what they can do.</p>
      </div>

      {createdInvite && (
        <div className="alert alert-success border-0 shadow-sm rounded-4 p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold m-0 text-success">🎉 Sub-Admin Invitation Link Created!</h6>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setCreatedInvite(null)}
            />
          </div>
          <p className="small mb-3 text-dark">
            An invitation email/SMS dispatch was sent to <strong>{createdInvite.email}</strong> ({createdInvite.phone}). You can also copy and send this activation link directly to the sub-admin:
          </p>
          <div className="input-group">
            <input 
              type="text" 
              className="form-control form-control-sm bg-white fw-semibold" 
              value={createdInvite.link} 
              readOnly 
            />
            <button 
              type="button" 
              className="btn btn-dark btn-sm fw-bold px-3"
              onClick={() => {
                navigator.clipboard.writeText(createdInvite.link);
                alert('Invitation link copied to clipboard!');
              }}
            >
              📋 Copy Link
            </button>
          </div>
        </div>
      )}

      {canManageTeam && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
          <h5 className="fw-bold mb-3">Invite New Admin</h5>
          <form onSubmit={handleAddAdmin} className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold">Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="user@example.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold">Phone Number</label>
              <input 
                type="tel" 
                className="form-control" 
                placeholder="+123456789"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                required
              />
            </div>
            
            <div className="col-12">
              <label className="form-label small fw-bold mb-2">Permissions</label>
              <div className="row g-2">
                {AVAILABLE_PERMISSIONS.filter(p => TIER_LEVELS[restaurantTier] >= TIER_LEVELS[p.minTier]).map(perm => (
                  <div className="col-6 col-md-4" key={perm.id}>
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id={`new-perm-${perm.id}`}
                        checked={newPermissions.includes(perm.id)}
                        onChange={() => toggleNewPermission(perm.id)}
                      />
                      <label className="form-check-label small" htmlFor={`new-perm-${perm.id}`}>
                        {perm.label}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-12 mt-4">
              <button type="submit" className="btn btn-primary fw-bold px-4" disabled={adding}>
                {adding ? 'Inviting...' : 'Invite Admin'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 p-4">
        <h5 className="fw-bold mb-3">Current Team</h5>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="small text-uppercase text-muted fw-bold">User</th>
                <th className="small text-uppercase text-muted fw-bold">Permissions</th>
                <th className="small text-uppercase text-muted fw-bold text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {showOwner && (
                <tr>
                  <td>
                    <div className="fw-bold">{owner.name}</div>
                    <div className="text-muted small">{owner.email}</div>
                  </td>
                  <td><span className="badge bg-gold text-white" style={{ backgroundColor: 'var(--gold)' }}>Owner (All Permissions)</span></td>
                  <td className="text-end"><span className="text-muted small fst-italic">Cannot be modified</span></td>
                </tr>
              )}
              {filteredTeam.map((admin) => (
                <tr key={admin.user._id}>
                  <td>
                    {editingAdminId === admin.user._id ? (
                      <div className="d-flex flex-column gap-2" style={{ maxWidth: '250px' }}>
                        <input type="text" className="form-control form-control-sm" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" />
                        <input type="email" className="form-control form-control-sm" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email" />
                        <input type="tel" className="form-control form-control-sm" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Phone" />
                      </div>
                    ) : (
                      <>
                        <div className="fw-bold d-flex align-items-center gap-2">
                          {admin.user.name}
                          <span className="badge bg-secondary" style={{ fontSize: '10px' }}>Sub-Admin</span>
                        </div>
                        <div className="text-muted small">{admin.user.email}</div>
                        {admin.user.phone && <div className="text-muted small">{admin.user.phone}</div>}
                      </>
                    )}
                  </td>
                  <td>
                    {editingAdminId === admin.user._id ? (
                      <div className="d-flex flex-wrap gap-2">
                        {AVAILABLE_PERMISSIONS.filter(p => TIER_LEVELS[restaurantTier] >= TIER_LEVELS[p.minTier]).map(perm => (
                          <div key={perm.id} className="form-check form-check-inline m-0">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id={`perm-${admin.user._id}-${perm.id}`}
                              checked={admin.permissions.includes(perm.id)}
                              onChange={() => toggleExistingPermission(admin.user._id, admin.permissions, perm.id)}
                              disabled={!canManageTeam}
                              style={{ cursor: canManageTeam ? 'pointer' : 'default' }}
                            />
                            <label 
                              className="form-check-label small" 
                              htmlFor={`perm-${admin.user._id}-${perm.id}`}
                              style={{ cursor: canManageTeam ? 'pointer' : 'default', opacity: admin.permissions.includes(perm.id) ? 1 : 0.6 }}
                            >
                              {perm.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="d-flex flex-wrap gap-1">
                        {(!admin.permissions || admin.permissions.length === 0) && (
                          <span className="text-muted small fst-italic">No specific permissions</span>
                        )}
                        {admin.permissions && admin.permissions.map(permId => {
                          const permDef = AVAILABLE_PERMISSIONS.find(p => p.id === permId);
                          return permDef ? (
                            <span key={permId} className="badge bg-light text-dark border fw-normal">
                              {permDef.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </td>
                  <td className="text-end">
                    {canManageTeam && (
                      <div className="d-flex gap-2 justify-content-end">
                        {editingAdminId === admin.user._id ? (
                          <>
                            <button onClick={() => handleSaveProfile(admin.user._id)} className="btn btn-sm btn-success" disabled={savingProfile}>Save</button>
                            <button onClick={handleCancelEdit} className="btn btn-sm btn-outline-secondary" disabled={savingProfile}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEditClick(admin)} className="btn btn-sm btn-outline-primary">Edit</button>
                            <button onClick={() => handleRemoveAdmin(admin.user._id)} className="btn btn-sm btn-outline-danger">Remove</button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {team.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center text-muted py-4 small">
                    No additional team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;

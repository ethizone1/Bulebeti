import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../layouts/AdminLayout';
import config from '../../config';

const CateringManagement = () => {
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { restaurantName } = useParams();
  const { tier } = useAdmin();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  
  // Expanded row state
  const [expandedRowId, setExpandedRowId] = useState(null);

  const isPlatinumOrPremium = tier === 'Platinum' || tier === 'Premium';

  if (!isPlatinumOrPremium) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: '12px', marginTop: '40px' }}>
        <h2 style={{ color: 'var(--on-surface)' }}>🔒 Feature Locked</h2>
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: '20px' }}>
          Catering Management requires the <strong>Platinum</strong> or <strong>Premium</strong> plan.
        </p>
        <Link to={`/bulebet/${restaurantName}/admin/settings`} className="btn btn-primary">Upgrade Plan</Link>
      </div>
    );
  }

  const fetchCateringRequests = async () => {
    try {
      setLoading(true);
      const restRes = await fetch(`${config.API_URL}/api/restaurants/${restaurantName}`);
      if (!restRes.ok) throw new Error('Restaurant not found');
      const restaurant = await restRes.json();

      const catRes = await fetch(`${config.API_URL}/api/catering/restaurant/${restaurant._id}`);
      if (!catRes.ok) throw new Error('Failed to fetch catering requests');
      const data = await catRes.json();
      const sortedData = data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });
      setRequests(sortedData);
    } catch (err) {
      console.error('Error fetching catering:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    const previous = [...requests];
    setRequests(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
    try {
      const res = await fetch(`${config.API_URL}/api/catering/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
    } catch (err) {
      console.error(err);
      alert('Failed to update status. Reverting...');
      setRequests(previous);
    }
  };

  React.useEffect(() => {
    fetchCateringRequests();
  }, [restaurantName]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Booked': return { backgroundColor: '#e6f4ea', color: '#1e7e34' };
      case 'Confirmed': return { backgroundColor: '#e6f4ea', color: '#1e7e34' };
      case 'Quote Sent': return { backgroundColor: '#fff7e6', color: '#d97706' };
      case 'Pending': return { backgroundColor: '#fff7e6', color: '#d97706' };
      case 'Inquiry': return { backgroundColor: '#f1f3f4', color: '#5f6368' };
      default: return { backgroundColor: '#fce8e6', color: '#d93025' };
    }
  };

  // Apply filters
  const filtered = requests.filter(req => {
    const search = searchTerm.toLowerCase();
    const matchSearch = !search ||
      (req.name || '').toLowerCase().includes(search) ||
      (req.email || '').toLowerCase().includes(search) ||
      (req.phone || '').toLowerCase().includes(search) ||
      (req.location || '').toLowerCase().includes(search);
    const matchStatus = statusFilter === 'All' || req.status === statusFilter;
    const matchDate = !dateFilter || (req.date ? new Date(req.date).toISOString().startsWith(dateFilter) : false);
    const matchType = typeFilter === 'All' || req.eventType === typeFilter;
    return matchSearch && matchStatus && matchDate && matchType;
  });

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--platinum)',
    fontSize: '14px',
    outline: 'none'
  };

  return (
    <div className="catering-management py-3">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fs-3 fw-bold m-0">{t('admin_cat_title')}</h1>
          <p className="text-muted small m-0 mt-1">
            {filtered.length} of {requests.length} catering requests
          </p>
        </div>
        <button className="btn btn-outline-secondary fw-bold px-4" onClick={fetchCateringRequests}>&#8635; Refresh</button>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4">
        {/* Filters */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-3">
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              className="form-control"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-3">
            <select
              className="form-select"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="All">All Event Types</option>
              <option value="corporate">Corporate</option>
              <option value="wedding">Wedding</option>
              <option value="private">Private Dinner</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="col-12 col-md-2">
            <select
              className="form-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Quote Sent">Quote Sent</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Booked">Booked</option>
            </select>
          </div>
          <div className="col-12 col-md-2">
            <input
              type="date"
              className="form-control"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-2">
            {(searchTerm || statusFilter !== 'All' || dateFilter || typeFilter !== 'All') && (
              <button
                className="btn btn-outline-danger w-100 fw-bold"
                onClick={() => { setSearchTerm(''); setStatusFilter('All'); setDateFilter(''); setTypeFilter('All'); }}
              >
                &#10005; Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-5 text-center text-muted">
            <div className="spinner-border text-secondary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading catering requests...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ minWidth: '750px' }}>
              <thead className="table-light">
                <tr>
                  <th className="text-muted text-uppercase small fw-bold">ID</th>
                  <th className="text-muted text-uppercase small fw-bold">Client</th>
                  <th className="text-muted text-uppercase small fw-bold">Event Type</th>
                  <th className="text-muted text-uppercase small fw-bold">Date</th>
                  <th className="text-muted text-uppercase small fw-bold">Guests</th>
                  <th className="text-muted text-uppercase small fw-bold">Location</th>
                  <th className="text-muted text-uppercase small fw-bold">Status</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <div className="display-6 mb-3">&#127869;&#65039;</div>
                      No catering requests match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map((req) => (
                  <React.Fragment key={req._id}>
                    <tr 
                      className={expandedRowId === req._id ? 'border-bottom-0' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedRowId(expandedRowId === req._id ? null : req._id)}
                    >
                      <td className="text-muted font-monospace small">
                        <span className="text-primary fw-bold me-2 d-inline-block" style={{ width: '16px' }}>
                          {expandedRowId === req._id ? '▼' : '▶'}
                        </span>
                        {req._id.slice(-6).toUpperCase()}
                      </td>
                      <td>
                        <div className="fw-bold">{req.name}</div>
                        <div className="small text-muted">{req.email}</div>
                        <div className="small text-muted">{req.phone || 'N/A'}</div>
                      </td>
                      <td className="text-capitalize">{req.eventType}</td>
                      <td>
                        {req.date ? new Date(req.date).toLocaleDateString() : '—'}
                      </td>
                      <td>{req.guestCount}</td>
                      <td className="small text-muted">{req.location}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <select
                          className="form-select form-select-sm fw-bold rounded-pill text-center border-0 shadow-sm"
                          style={getStatusStyle(req.status)}
                          value={req.status}
                          onChange={e => updateStatus(req._id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Quote Sent">Quote Sent</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Booked">Booked</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                    {expandedRowId === req._id && (
                      <tr className="bg-light">
                        <td colSpan="7" className="p-4">
                          <div className="bg-white p-4 rounded-3 border shadow-sm">
                            <h4 className="text-warning text-uppercase small fw-bold mb-3" style={{ letterSpacing: '1px' }}>Order Details &amp; Menu</h4>
                            <pre className="m-0" style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                              {req.details || 'No additional details or menu items provided.'}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 small text-muted">
          Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

export default CateringManagement;

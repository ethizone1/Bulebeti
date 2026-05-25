import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAdmin } from '../layouts/AdminLayout';
import QRCodeModal from './QRCodeModal';
import config from '../config';

// Persist read notification IDs in localStorage
const STORAGE_KEY = 'bulebet_read_notifs';
const getReadIds = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const saveReadId = (id) => {
  const ids = getReadIds();
  if (!ids.includes(id)) localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, id]));
};
const saveAllReadIds = (ids) => {
  const existing = getReadIds();
  const merged = [...new Set([...existing, ...ids])];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
};

const AdminNavbar = ({ currentTier = 'Platinum' }) => {
  const navigate = useNavigate();
  const { restaurantName } = useParams();
  const { language, toggleLanguage } = useLanguage();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifItems, setNotifItems] = useState([]);
  const [readIds, setReadIds] = useState(getReadIds);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Use context if available (it will be inside AdminLayout)
  const adminContext = useAdmin();
  const searchQuery = adminContext?.searchQuery || '';
  const setSearchQuery = adminContext?.setSearchQuery || (() => {});

  // ── Owner & Restaurant info ────────────────────────────────────
  // Read user immediately from localStorage (set during login)
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
  const [owner, setOwner] = useState(storedUser);         // { id, name, email, role }
  const [restaurant, setRestaurant] = useState(null);     // { name, address, phone, logoUrl }

  // Derive display values
  const ownerName = owner?.name || 'Admin';
  const ownerEmail = owner?.email || '';
  const ownerInitials = ownerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const restaurantDisplayName = restaurant?.name || restaurantName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Fetch restaurant & refresh owner from localStorage on mount
  React.useEffect(() => {
    // Re-read user in case it was updated after mount
    const u = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();
    if (u) setOwner(u);

    // Fetch restaurant details
    fetch(`${config.API_URL}/api/restaurants/${restaurantName}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setRestaurant(data); })
      .catch(() => {});
  }, [restaurantName]);

  React.useEffect(() => {
    const fetchPendingNotifications = async () => {
      try {
        const items = [];
        const settings = JSON.parse(localStorage.getItem('bulebet_notif_settings')) || { res: true, cat: true, fb: true, mkt: false };

        // Fetch reservations
        if (settings.res) {
          const resResp = await fetch(`${config.API_URL}/api/reservations/restaurant/${restaurantName}`, {
            headers: { 'x-auth-token': localStorage.getItem('token') }
          });
          if (resResp.ok) {
            const resData = await resResp.json();
            resData.filter(r => r.status === 'Pending').forEach(r => {
              items.push({
                type: 'reservation',
                id: r._id,
                label: `New Reservation`,
                detail: `${r.guestName} — ${r.date} at ${r.time} (${r.guests} guests)`,
                path: `/bulebet/${restaurantName}/admin/reservations`,
                time: r.createdAt
              });
            });
          }
        }

        // Fetch catering & feedback
        if (settings.cat || settings.fb) {
          const restResp = await fetch(`${config.API_URL}/api/restaurants/${restaurantName}`);
          if (restResp.ok) {
            const restaurant = await restResp.json();
            if (restaurant._id) {
              if (settings.cat) {
                const catResp = await fetch(`${config.API_URL}/api/catering/restaurant/${restaurant._id}`);
                if (catResp.ok) {
                  const catData = await catResp.json();
                  catData.filter(c => c.status === 'Pending').forEach(c => {
                    items.push({
                      type: 'catering',
                      id: c._id,
                      label: `New Catering Inquiry`,
                      detail: `${c.name} — ${c.eventType} for ${c.guestCount} guests`,
                      path: `/bulebet/${restaurantName}/admin/catering`,
                      time: c.createdAt
                    });
                  });
                }
              }

              if (settings.fb) {
                const fbResp = await fetch(`${config.API_URL}/api/feedback/restaurant/${restaurant._id}`);
                if (fbResp.ok) {
                  const fbData = await fbResp.json();
                  fbData.filter(f => f.status === 'New').forEach(f => {
                    items.push({
                      type: 'feedback',
                      id: f._id,
                      label: `New Feedback Received`,
                      detail: `${f.customer || 'Guest'} rated ${f.rating} stars`,
                      path: `/bulebet/${restaurantName}/admin/feedback`,
                      time: f.createdAt || new Date().toISOString()
                    });
                  });
                }
              }
            }
          }
        }

        // Sort newest first
        items.sort((a, b) => new Date(b.time) - new Date(a.time));
        setNotifItems(items);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchPendingNotifications();
    window.addEventListener('bulebet_notifs_changed', fetchPendingNotifications);
    const interval = setInterval(fetchPendingNotifications, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('bulebet_notifs_changed', fetchPendingNotifications);
    };
  }, [restaurantName]);

  // Unread = pending items not yet clicked
  const unreadItems = notifItems.filter(item => !readIds.includes(item.id));
  const unreadCount = unreadItems.length;

  const handleNotifClick = (item) => {
    // Mark this notification as read
    saveReadId(item.id);
    setReadIds(prev => [...new Set([...prev, item.id])]);
    setShowNotifDropdown(false);
    navigate(item.path);
  };

  const markAllRead = (e) => {
    e.stopPropagation();
    const allIds = notifItems.map(i => i.id);
    saveAllReadIds(allIds);
    setReadIds(prev => [...new Set([...prev, ...allIds])]);
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <header style={{
      height: '70px',
      backgroundColor: 'white',
      borderBottom: '1px solid var(--platinum)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--spacing-xl)',
      position: 'sticky',
      top: 0,
      zIndex: 200,
      gap: '24px'
    }}>
      {/* ── Brand logo → customer main page ──────────────────── */}
      <Link
        to={`/bulebet/${restaurantName}`}
        title="View customer site"
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          textDecoration: 'none', flexShrink: 0
        }}
      >
        {restaurant?.logoUrl ? (
          <img src={restaurant.logoUrl} alt={restaurantDisplayName}
            style={{ height: '36px', width: '36px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--platinum)' }} />
        ) : (
          <div style={{
            height: '36px', width: '36px', borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--primary), #333)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '800', fontSize: '13px', flexShrink: 0
          }}>
            {restaurantDisplayName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="hide-on-mobile">
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)', lineHeight: 1.1 }}>
            {restaurantDisplayName}
          </div>
          <div style={{ fontSize: '10px', color: '#9ca3af' }}>↗ View site</div>
        </div>
      </Link>

      {/* ── Search Bar ───────────────────────────────────── */}
      <div style={{ flex: 1, maxWidth: '400px', display: 'flex', alignItems: 'center' }} className="admin-navbar-search">
        <div style={{ position: 'relative', width: '100%' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search or ask AI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: searchQuery }));
                setSearchQuery(''); // clear it so the filter resets and they can chat
              }
            }}
            style={{
              width: '100%',
              padding: '10px 10px 10px 36px',
              borderRadius: '20px',
              border: '1px solid var(--platinum)',
              backgroundColor: '#f9fafb',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 2px rgba(212, 175, 55, 0.2)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--platinum)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* My Restaurant Button */}
        <a
          href={`/bulebet/${restaurantName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span>👁️</span> {restaurantDisplayName}
        </a>

        {/* Get QR Code Button */}
        <button
          onClick={() => setQrModalOpen(true)}
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--gold)', color: 'var(--gold)' }}
        >
          <span>📱</span> Get QR Code
        </button>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          style={{
            background: 'transparent',
            border: '1px solid var(--platinum)',
            padding: '4px 8px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '12px',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span style={{ color: language === 'en' ? 'var(--gold)' : 'inherit' }}>EN</span>
          |
          <span style={{ color: language === 'am' ? 'var(--gold)' : 'inherit' }}>አማ</span>
        </button>

        {/* Notifications Bell */}
        <div
          style={{ position: 'relative', cursor: 'pointer' }}
          onClick={() => { setShowNotifDropdown(!showNotifDropdown); setShowProfileMenu(false); }}
        >
          <span style={{ fontSize: '20px' }}>🔔</span>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: '#dc2626',
              color: 'white',
              fontSize: '10px',
              fontWeight: '700',
              minWidth: '16px',
              height: '16px',
              borderRadius: '8px',
              padding: '0 3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 1.5s infinite'
            }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}

          {/* Notification Dropdown */}
          {showNotifDropdown && (
            <div style={{
              position: 'absolute',
              top: '36px',
              right: '-12px',
              width: '340px',
              backgroundColor: 'white',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              border: '1px solid var(--platinum)',
              zIndex: 1000,
              overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--platinum)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fafafa'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '700', fontSize: '14px' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: '11px', backgroundColor: '#dc2626', color: 'white', padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{ fontSize: '11px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '2px 6px', borderRadius: '4px' }}
                    onMouseOver={e => e.target.style.color = 'var(--primary)'}
                    onMouseOut={e => e.target.style.color = '#6b7280'}
                  >
                    ✓ Mark all read
                  </button>
                )}
              </div>

              {/* Items */}
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {unreadItems.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
                    <div style={{ fontSize: '13px' }}>All caught up! No pending notifications.</div>
                  </div>
                ) : (
                  unreadItems.map((item, i) => {
                    return (
                      <div
                        key={`${item.id}-${i}`}
                        onClick={() => handleNotifClick(item)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #f3f4f6',
                          cursor: 'pointer',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start',
                          transition: 'background 0.15s',
                          backgroundColor: '#fffbf0',
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = '#fffbf0'}
                      >
                        {/* Icon */}
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          backgroundColor: item.type === 'reservation' ? '#eff6ff' : (item.type === 'feedback' ? '#f3e8ff' : '#fef3c7'),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '16px', flexShrink: 0, position: 'relative'
                        }}>
                          {item.type === 'reservation' ? '📅' : (item.type === 'feedback' ? '⭐' : '🍽️')}
                          {/* Unread dot */}
                          <span style={{
                            position: 'absolute', top: '0', right: '0',
                            width: '9px', height: '9px', borderRadius: '50%',
                            backgroundColor: '#dc2626', border: '2px solid white'
                          }} />
                        </div>
                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '700', fontSize: '13px' }}>{item.label}</span>
                            <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0, marginLeft: '8px' }}>{timeAgo(item.time)}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.detail}
                          </div>
                          <div style={{ marginTop: '4px', fontSize: '11px', color: item.type === 'reservation' ? '#1d4ed8' : (item.type === 'feedback' ? '#7e22ce' : '#d97706'), fontWeight: '700' }}>
                            {item.type === 'reservation' ? '→ View Reservations' : (item.type === 'feedback' ? '→ View Feedback' : '→ View Catering')}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifItems.length > 0 && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--platinum)', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { navigate(`/bulebet/${restaurantName}/admin/reservations`); setShowNotifDropdown(false); }}
                    style={{ flex: 1, padding: '7px', fontSize: '12px', fontWeight: '600', backgroundColor: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  >📅 All Reservations</button>
                  <button
                    onClick={() => { navigate(`/bulebet/${restaurantName}/admin/catering`); setShowNotifDropdown(false); }}
                    style={{ flex: 1, padding: '7px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  >🍽️ All Catering</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifDropdown(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--radius-md)', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {/* Avatar — show logo if available, else initials */}
            {restaurant?.logoUrl ? (
              <img src={restaurant.logoUrl} alt={ownerName}
                style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--platinum)' }} />
            ) : (
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--gold))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', flexShrink: 0 }}>
                {ownerInitials}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: '13px', fontWeight: '700' }}>{ownerName}</span>
              <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '400' }}>{restaurantDisplayName}</span>
            </div>
            <span style={{ fontSize: '10px', opacity: 0.5 }}>▼</span>
          </div>

          {showProfileMenu && (
            <div style={{
              position: 'absolute',
              top: '45px',
              right: 0,
              width: '220px',
              backgroundColor: 'white',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-2)',
              border: '1px solid var(--platinum)',
              padding: '8px 0',
              zIndex: 1000
            }}>
              {/* Profile header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--platinum)', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  {restaurant?.logoUrl ? (
                    <img src={restaurant.logoUrl} alt={ownerName}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--gold))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '15px', flexShrink: 0 }}>
                      {ownerInitials}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700' }}>{ownerName}</div>
                    {ownerEmail && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{ownerEmail}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: '6px', padding: '6px 10px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>{restaurantDisplayName}</div>
                    {restaurant?.address && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{restaurant.address}</div>}
                  </div>
                  <span style={{ fontSize: '10px', backgroundColor: 'var(--gold)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>{currentTier}</span>
                </div>
              </div>

              {[
                { label: 'Profile Settings', icon: '👤', path: `/bulebet/${restaurantName}/admin/settings` },
                { label: 'Add New Location', icon: '📍', path: `/bulebet/${restaurantName}/admin/locations` },
                { label: 'Security & Privacy', icon: '🔒', path: `/bulebet/${restaurantName}/admin/settings` },
                { label: 'Billing & Plans', icon: '💳', path: `/bulebet/${restaurantName}/admin/settings` },
                { label: 'Help & Support', icon: '❓', path: '#' },
              ].map((item) => (
                <div
                  key={item.label}
                  onClick={() => { navigate(item.path); setShowProfileMenu(false); }}
                  style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </div>
              ))}

              <div style={{ borderTop: '1px solid var(--platinum)', marginTop: '8px', paddingTop: '8px' }}>
                <div
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/bulebet/login');
                  }}
                  style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#dc2626', fontWeight: '600' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span>🚪</span>
                  Sign Out
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showNotifDropdown || showProfileMenu) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => { setShowNotifDropdown(false); setShowProfileMenu(false); }}
        />
      )}

      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        restaurantName={restaurantName}
        restaurantId={restaurant?._id}
      />
    </header>
  );
};

export default AdminNavbar;

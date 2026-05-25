import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin } from '../../layouts/AdminLayout';
import config from '../../config';

const MenuManagement = ({ currentTier = 'Platinum' }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { restaurantName } = useParams();
  const [filter, setFilter] = useState('All');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);

  React.useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        // 1. Get restaurant by slug
        const restRes = await fetch(`${config.API_URL}/api/restaurants/${restaurantName}`);
        if (!restRes.ok) throw new Error('Failed to fetch restaurant');
        const restaurant = await restRes.json();
        setRestaurantId(restaurant._id);

        // 2. Get menu by restaurant ID
        const menuRes = await fetch(`${config.API_URL}/api/menu/restaurant/${restaurant._id}`);
        if (!menuRes.ok) throw new Error('Failed to fetch menu');
        const menuData = await menuRes.json();
        
        // Map backend data to frontend state format if needed
        const mappedMenu = menuData.map(item => ({
          id: item._id,
          name: item.name,
          category: item.category || 'Mains', // Fallback
          timing: item.category || 'Dinner', // Using category as timing for now
          price: `$${item.price}`,
          ingredients: item.ingredients || 'Not specified',
          contains: item.contains || 'None',
          visible: item.isAvailable
        }));
        
        setMenuItems(mappedMenu);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [restaurantName]);

  const canAddItem = true;

  const toggleVisibility = async (id) => {
    // Optimistic UI update
    setMenuItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, visible: !item.visible };
      }
      return item;
    }));

    // Find the item to know its target state
    const itemToUpdate = menuItems.find(item => item.id === id);
    if (!itemToUpdate) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_URL}/api/menu/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          isAvailable: !itemToUpdate.visible
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update visibility on server');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update visibility. Reverting...');
      // Revert UI if it failed
      setMenuItems(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, visible: itemToUpdate.visible };
        }
        return item;
      }));
    }
  };

  const changeTiming = async (id, newTiming) => {
    const itemToUpdate = menuItems.find(item => item.id === id);
    if (!itemToUpdate) return;

    setMenuItems(prev => prev.map(item =>
      item.id === id ? { ...item, timing: newTiming } : item
    ));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_URL}/api/menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ category: newTiming })
      });
      if (!res.ok) throw new Error('Failed to update category on server');
    } catch (err) {
      console.error(err);
      alert('Failed to update category. Reverting...');
      setMenuItems(prev => prev.map(item =>
        item.id === id ? { ...item, timing: itemToUpdate.timing } : item
      ));
    }
  };

  const deleteItem = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from your menu?\n\nThis only removes it from your restaurant. The item will NOT be deleted from the universal menu.`)) return;

    // Optimistic removal
    setMenuItems(prev => prev.filter(item => item.id !== id));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_URL}/api/menu/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert('Session expired. Please log in again.');
        navigate(`/bulebet/${restaurantName}/login`);
        return;
      }

      if (!res.ok) throw new Error('Failed to delete item');
    } catch (err) {
      console.error(err);
      alert('Failed to delete item. Please try again.');
      // Re-fetch to restore list
      window.location.reload();
    }
  };

  const [globalMenuOpen, setGlobalMenuOpen] = useState(false);
  const [globalItems, setGlobalItems] = useState([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  const fetchGlobalMenu = async () => {
    try {
      setLoadingGlobal(true);
      setGlobalMenuOpen(true);
      const res = await fetch(`${config.API_URL}/api/menu`);
      if (res.ok) {
        const data = await res.json();
        // Deduplicate items by name
        const uniqueItems = [];
        const seenNames = new Set();
        data.forEach(item => {
          const nameKey = (item.name || '').toLowerCase().trim();
          if (!seenNames.has(nameKey)) {
            seenNames.add(nameKey);
            uniqueItems.push(item);
          }
        });
        setGlobalItems(uniqueItems);
      }
    } catch (err) {
      console.error("Failed to fetch global menu", err);
    } finally {
      setLoadingGlobal(false);
    }
  };

  const cloneToRestaurant = async (item) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_URL}/api/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          imageUrl: item.imageUrl, // carry over base64 string
          restaurantId: restaurantId
        })
      });

      if (res.ok) {
        const newItem = await res.json();
        alert(`Successfully added ${newItem.name} to your menu!`);
        // Refresh local menu list
        setMenuItems(prev => [...prev, {
          id: newItem._id,
          name: newItem.name,
          category: newItem.category || 'Mains',
          timing: newItem.category || 'Dinner',
          price: `$${newItem.price}`,
          ingredients: newItem.description || 'Not specified',
          contains: 'None',
          visible: true
        }]);
      } else {
        alert("Failed to clone item.");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding item.");
    }
  };

  const { searchQuery } = useAdmin();

  const filteredItems = menuItems.filter(i => {
    const matchesFilter = filter === 'All' || i.category === filter;
    const matchesSearch = !searchQuery || (i.name && i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="menu-management">
      {/* Global Menu Browser Modal */}
      {globalMenuOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            padding: 'var(--spacing-xl)',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <button 
              onClick={() => setGlobalMenuOpen(false)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
            >✕</button>
            
            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Universal Global Menu</h2>
            <p style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--spacing-xl)' }}>
              Browse dishes submitted by other restaurants across the platform. Click 'Add to My Menu' to instantly copy an item into your restaurant!
            </p>

            {loadingGlobal ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading universal items...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {globalItems.map(item => (
                  <div key={item._id} style={{ display: 'flex', gap: '12px', border: '1px solid var(--platinum)', padding: '12px', borderRadius: '8px', alignItems: 'center' }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🍽️</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '14px' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>{item.category} • ${item.price}</div>
                    </div>
                    {(() => {
                      const alreadyAdded = menuItems.some(m => (m.name || '').toLowerCase() === (item.name || '').toLowerCase());
                      if (alreadyAdded) {
                        return <span style={{ fontSize: '11px', color: '#1e7e34', fontWeight: '600', backgroundColor: '#e6f4ea', padding: '4px 8px', borderRadius: '4px' }}>✓ Added</span>;
                      }
                      if (canAddItem) {
                        return (
                          <button 
                            onClick={() => cloneToRestaurant(item)}
                            style={{ padding: '6px 12px', backgroundColor: '#e6f4ea', color: '#1e7e34', border: 'none', borderRadius: '4px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                          >
                            + Add
                          </button>
                        );
                      }
                      return <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600', backgroundColor: '#fee2e2', padding: '4px 8px', borderRadius: '4px' }}>Locked (Gold Req.)</span>;
                    })()}
                  </div>
                ))}
                {globalItems.length === 0 && <div style={{ gridColumn: 'span 2', textAlign: 'center' }}>No global items found.</div>}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>{t('admin_menu_mgt_title')}</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchGlobalMenu} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🌐</span> Browse Global Menu
          </button>
          {canAddItem ? (
            <button onClick={() => navigate(`/bulebet/${restaurantName}/admin/menu/add`)} className="btn btn-primary">{t('admin_menu_add_new')}</button>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: '700', backgroundColor: 'rgba(255, 184, 0, 0.1)', padding: '8px 12px', borderRadius: '4px' }}>
              {t('admin_menu_silver_warning')}
            </div>
          )}
        </div>
      </div>

      <div style={{
        backgroundColor: 'var(--surface)',
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-1)',
        border: '1px solid var(--platinum)'
      }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          {['All', 'Starters', 'Mains', 'Desserts', 'Beverages'].map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              style={{ 
                padding: '8px 16px', 
                borderRadius: 'var(--radius-full)', 
                border: filter === cat ? '1px solid var(--primary)' : '1px solid var(--platinum)', 
                backgroundColor: filter === cat ? 'var(--primary)' : 'transparent', 
                color: filter === cat ? 'white' : 'inherit',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {cat === 'All' ? t('admin_menu_cat_all') : cat}
            </button>
          ))}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--platinum)' }}>
              <th style={{ padding: '12px 8px', fontSize: '13px', fontWeight: '700' }}>{t('admin_menu_col_item')}</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', fontWeight: '700' }}>{t('admin_menu_col_ing')}</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', fontWeight: '700' }}>{t('admin_menu_col_con')}</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', fontWeight: '700' }}>{t('admin_menu_col_price')}</th>
              <th style={{ padding: '12px 8px', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>{t('admin_menu_col_action')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--platinum)' }}>
                <td style={{ padding: '16px 8px' }}>
                  <div style={{ fontWeight: '600' }}>{item.name}</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{item.category}</div>
                    <span style={{ fontSize: '10px', backgroundColor: 'var(--gold)', color: 'white', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                      {item.timing}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '16px 8px', fontSize: '11px', color: 'var(--on-surface-variant)', maxWidth: '150px' }}>
                  {Array.isArray(item.ingredients) 
                    ? item.ingredients.filter(i => i.checked).map(i => i.name).join(', ') 
                    : item.ingredients}
                </td>
                <td style={{ padding: '16px 8px' }}>
                  <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600', backgroundColor: '#fef2f2', padding: '2px 6px', borderRadius: '4px' }}>
                    {Array.isArray(item.contains)
                      ? item.contains.filter(i => i.checked).map(i => i.name).join(', ')
                      : item.contains}
                  </span>
                </td>
                <td style={{ padding: '16px 8px', fontSize: '14px', fontWeight: '700' }}>{item.price}</td>
                <td style={{ padding: '16px 8px' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select 
                      value={item.timing}
                      onChange={(e) => changeTiming(item.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid var(--platinum)', outline: 'none', cursor: 'pointer' }}
                    >
                      {['Our Signature', 'Breakfast', 'Lunch', 'Dinner', 'Beverages', 'Hot', 'Cold', 'All Items'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button onClick={() => toggleVisibility(item.id)} style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', border: '1px solid var(--platinum)', cursor: 'pointer', backgroundColor: item.visible ? '#e6f4ea' : '#f3f4f6', color: item.visible ? '#1e7e34' : '#6b7280', minWidth: '70px' }}>
                      {item.visible ? t('admin_menu_view') : t('admin_menu_hide')}
                    </button>
                    <button onClick={() => navigate(`/bulebet/${restaurantName}/admin/menu/edit/${item.id}`)} title="Edit item" style={{ background: 'none', border: '1px solid var(--platinum)', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>✏️</button>
                    <button
                      onClick={() => deleteItem(item.id, item.name)}
                      title="Remove from my menu"
                      style={{ background: 'none', border: '1px solid #fca5a5', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: '#dc2626', transition: 'all 0.15s' }}
                      onMouseOver={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.borderColor = '#dc2626'; }}
                      onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                    >🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        /* ── Menu Management Responsive ── */
        .menu-mgmt-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 8px;
        }
        .menu-mgmt-wrapper table { min-width: 720px; }

        @media (max-width: 768px) {
          .menu-header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .menu-header-row .header-actions {
            width: 100%;
            display: flex;
            gap: 8px;
          }
          .menu-filter-row {
            flex-direction: column !important;
            gap: 10px !important;
          }
          .menu-filter-row input,
          .menu-filter-row select {
            width: 100% !important;
          }
          .menu-filter-tabs {
            flex-wrap: wrap !important;
            gap: 6px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MenuManagement;

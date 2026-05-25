import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import config from '../../config';

const EditMenuItem = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { restaurantName, itemId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Mains',
    price: '',
    description: '',
    isAvailable: true,
    imageUrl: '',
    ingredients: [],
    contains: []
  });

  const [imagePreview, setImagePreview] = useState(null);

  // Fetch the real item from the backend
  useEffect(() => {
    if (!itemId) {
      setError('No item ID provided.');
      setLoading(false);
      return;
    }

    const fetchItem = async () => {
      try {
        setLoading(true);
        // Fetch all menu items and find by ID (or you could add a GET /api/menu/:id endpoint)
        const res = await fetch(`${config.API_URL}/api/menu`);
        if (!res.ok) throw new Error('Failed to fetch menu');
        const items = await res.json();
        const item = items.find(i => i._id === itemId);

        if (!item) throw new Error('Menu item not found');

        setFormData({
          name: item.name || '',
          category: item.category || 'Mains',
          price: item.price != null ? String(item.price) : '',
          description: item.description || '',
          isAvailable: item.isAvailable !== false,
          imageUrl: item.imageUrl || '',
          ingredients: item.ingredients || [],
          contains: item.contains || []
        });

        if (item.imageUrl) setImagePreview(item.imageUrl);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setFormData(prev => ({ ...prev, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${config.API_URL}/api/menu/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          description: formData.description,
          isAvailable: formData.isAvailable,
          imageUrl: formData.imageUrl,
          ingredients: formData.ingredients,
          contains: formData.contains
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Token expired or invalid — clear and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          alert('Your session has expired. Please log in again.');
          navigate(`/bulebet/${restaurantName}/login`);
          return;
        }

        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.msg || 'Failed to update menu item');
      }

      navigate(`/bulebet/${restaurantName}/admin/menu`);
    } catch (err) {
      console.error(err);
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--platinum)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', color: 'var(--on-surface-variant)' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
        Loading menu item...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '80px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>❌</div>
        <p style={{ color: '#dc2626', fontWeight: '600' }}>{error}</p>
        <button onClick={() => navigate(`/bulebet/${restaurantName}/admin/menu`)} className="btn btn-outline" style={{ marginTop: '16px' }}>
          ← Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="edit-menu-item py-3">

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fs-3 fw-bold m-0">&#9999;&#65039; Edit Menu Item</h1>
          <p className="text-muted m-0 mt-1">Changes will be saved to the database and reflected immediately.</p>
        </div>
        <button onClick={() => navigate(`/bulebet/${restaurantName}/admin/menu`)} className="btn btn-outline-secondary fw-bold px-4">
          &larr; Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card border-0 shadow-sm rounded-4 p-4 p-md-5 mx-auto" style={{ maxWidth: '800px' }}>
        <div className="row g-4">
          {/* Name */}
          <div className="col-12">
            <label className="form-label fw-bold small mb-1">ITEM NAME *</label>
            <input
              required
              type="text"
              className="form-control"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Truffle Arancini"
            />
          </div>

          {/* Category + Price row */}
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold small mb-1">CATEGORY *</label>
            <select
              className="form-select"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            >
              <option>Starters</option>
              <option>Mains</option>
              <option>Desserts</option>
              <option>Beverages</option>
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Dinner</option>
              <option>Our Signature</option>
            </select>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold small mb-1">PRICE (USD) *</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              placeholder="e.g. 18.00"
            />
          </div>

          {/* Description */}
          <div className="col-12">
            <label className="form-label fw-bold small mb-1">DESCRIPTION</label>
            <textarea
              rows="3"
              className="form-control"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the dish, its flavours, and preparation..."
            />
          </div>

          {/* Ingredients */}
          <div className="col-12">
            <label className="form-label fw-bold small mb-1">{t('admin_item_lbl_ing')}</label>
            <div className="bg-light border rounded p-3 d-flex flex-column gap-2">
              {formData.ingredients.length === 0 && <div className="small text-muted fst-italic">{t('admin_item_no_ing')}</div>}
              {formData.ingredients.map((ing, idx) => (
                <div key={idx} className="form-check">
                  <input 
                    className="form-check-input"
                    type="checkbox" 
                    id={`edit-ing-${idx}`}
                    checked={ing.checked}
                    onChange={(e) => {
                      const newIngs = [...formData.ingredients];
                      newIngs[idx].checked = e.target.checked;
                      setFormData({...formData, ingredients: newIngs});
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <label className="form-check-label small" htmlFor={`edit-ing-${idx}`} style={{ cursor: 'pointer' }}>
                    {ing.name}
                  </label>
                </div>
              ))}
              <div className="d-flex gap-2 mt-2">
                <input 
                  type="text" 
                  placeholder={t('admin_item_ph_ing')} 
                  className="form-control form-control-sm" 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (e.target.value.trim()) {
                        setFormData({...formData, ingredients: [...formData.ingredients, { name: e.target.value.trim(), checked: true }]});
                        e.target.value = '';
                      }
                    }
                  }} 
                />
                <button 
                  type="button" 
                  onClick={(e) => {
                    const input = e.target.previousSibling;
                    if (input.value.trim()) {
                      setFormData({...formData, ingredients: [...formData.ingredients, { name: input.value.trim(), checked: true }]});
                      input.value = '';
                    }
                  }} 
                  className="btn btn-outline-secondary btn-sm px-3"
                >
                  {t('admin_item_btn_add')}
                </button>
              </div>
            </div>
          </div>

          {/* Contains / Allergens */}
          <div className="col-12">
            <label className="form-label fw-bold small mb-1">{t('admin_item_lbl_con')}</label>
            <div className="bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded p-3 d-flex flex-column gap-2">
              {formData.contains.length === 0 && <div className="small text-muted fst-italic">{t('admin_item_no_con')}</div>}
              {formData.contains.map((allergen, idx) => (
                <div key={idx} className="form-check text-danger">
                  <input 
                    className="form-check-input border-danger"
                    type="checkbox" 
                    id={`edit-allergen-${idx}`}
                    checked={allergen.checked}
                    onChange={(e) => {
                      const newContains = [...formData.contains];
                      newContains[idx].checked = e.target.checked;
                      setFormData({...formData, contains: newContains});
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <label className="form-check-label small" htmlFor={`edit-allergen-${idx}`} style={{ cursor: 'pointer' }}>
                    {allergen.name}
                  </label>
                </div>
              ))}
              <div className="d-flex gap-2 mt-2">
                <input 
                  type="text" 
                  placeholder={t('admin_item_ph_con')} 
                  className="form-control form-control-sm border-danger border-opacity-50" 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (e.target.value.trim()) {
                        setFormData({...formData, contains: [...formData.contains, { name: e.target.value.trim(), checked: true }]});
                        e.target.value = '';
                      }
                    }
                  }} 
                />
                <button 
                  type="button" 
                  onClick={(e) => {
                    const input = e.target.previousSibling;
                    if (input.value.trim()) {
                      setFormData({...formData, contains: [...formData.contains, { name: input.value.trim(), checked: true }]});
                      input.value = '';
                    }
                  }} 
                  className="btn btn-danger btn-sm bg-opacity-25 px-3 border-danger border-opacity-50"
                >
                  {t('admin_item_btn_add')}
                </button>
              </div>
            </div>
          </div>

          {/* Availability toggle */}
          <div className="col-12">
            <div className="d-flex align-items-center gap-3 p-3 rounded bg-light border">
              <div className="form-check form-switch m-0" style={{ cursor: 'pointer', transform: 'scale(1.2)' }}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={formData.isAvailable}
                  onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
              </div>
              <div>
                <div className="fw-bold mb-1">
                  {formData.isAvailable ? '&#9989; Visible on menu' : '&#128584; Hidden from menu'}
                </div>
                <div className="small text-muted">
                  Toggle to show or hide this item on the public menu
                </div>
              </div>
            </div>
          </div>

          {/* Image upload */}
          <div className="col-12">
            <label className="form-label fw-bold small mb-1">ITEM IMAGE</label>
            <div className="d-flex flex-column flex-sm-row gap-3 align-items-sm-center">
              {/* Preview */}
              <div className="border rounded bg-light d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0" style={{ width: '110px', height: '110px' }}>
                {imagePreview
                  ? <img src={imagePreview} alt="Preview" className="w-100 h-100 object-fit-cover" />
                  : <span className="display-6">&#127869;&#65039;</span>
                }
              </div>
              {/* Upload */}
              <label className="flex-grow-1 border border-dashed rounded p-4 text-center bg-light" style={{ cursor: 'pointer' }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="d-none" />
                <div className="fs-3 mb-2">&#128247;</div>
                <div className="fw-bold small mb-1">Click to upload new image</div>
                <div className="small text-muted">PNG, JPG, WEBP &mdash; recommended 800&times;600px</div>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="col-12 d-flex flex-column flex-md-row gap-3 mt-4 pt-4 border-top">
            <button
              type="button"
              onClick={() => navigate(`/bulebet/${restaurantName}/admin/menu`)}
              className="btn btn-outline-secondary px-4 py-2 order-2 order-md-1 w-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary px-4 py-2 fw-bold order-1 order-md-2 w-100"
            >
              {saving ? '&#8987; Saving...' : '&#9989; Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditMenuItem;

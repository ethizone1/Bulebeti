import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import config from '../../config';

const GalleryManager = () => {
  const { restaurantName } = useParams();
  const [restaurantId, setRestaurantId] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '' // Will store base64
  });

  const fetchImages = async (restId) => {
    if (!restId) return;
    try {
      setLoading(true);
      const res = await fetch(`${config.API_URL}/api/gallery/restaurant/${restId}`);
      if (res.ok) {
        const data = await res.json();
        setImages(data);
      }
    } catch (err) {
      console.error('Failed to fetch gallery', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const restRes = await fetch(`${config.API_URL}/api/restaurants/${restaurantName}`);
        if (!restRes.ok) throw new Error('Restaurant not found');
        const restaurant = await restRes.json();
        setRestaurantId(restaurant._id);
        fetchImages(restaurant._id);
      } catch (err) {
        console.error('Error fetching restaurant:', err);
        setLoading(false);
      }
    };
    
    if (restaurantName) {
      fetchRestaurant();
    }
  }, [restaurantName]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (img) => {
    setFormData({
      title: img.title,
      description: img.description || '',
      imageUrl: img.imageUrl
    });
    setEditingId(img._id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setFormData({ title: '', description: '', imageUrl: '' });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imageUrl || !formData.title || !restaurantId) {
      return alert('Please provide an image and a title.');
    }

    setSubmitting(true);
    try {
      const url = editingId 
        ? `${config.API_URL}/api/gallery/${editingId}`
        : `${config.API_URL}/api/gallery`;
      
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurantId,
          ...formData
        })
      });

      if (res.ok) {
        alert(editingId ? 'Image updated!' : 'Image added to gallery!');
        cancelEdit();
        fetchImages(restaurantId);
      } else {
        alert('Failed to save image.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving image.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      const res = await fetch(`${config.API_URL}/api/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchImages(restaurantId);
      }
    } catch (err) {
      console.error('Failed to delete image', err);
    }
  };

  if (!restaurantId && !loading) return <div>Restaurant not found.</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: 'var(--primary)' }}>Gallery Management</h2>
        <button 
          onClick={() => showAddForm ? cancelEdit() : setShowAddForm(true)}
          className="btn btn-primary"
        >
          {showAddForm ? 'Cancel' : 'Add New Image'}
        </button>
      </div>
      
      {showAddForm && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h3>{editingId ? 'Edit Image' : 'Add New Image'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Title</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                placeholder="e.g., Signature Cocktails"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Description</label>
              <textarea 
                className="form-control" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of the image"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Upload Image</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="form-control"
                required={!formData.imageUrl && !editingId}
              />
            </div>
            {formData.imageUrl && (
              <div>
                <img src={formData.imageUrl} alt="Preview" style={{ height: '150px', borderRadius: '8px', objectFit: 'cover' }} />
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (editingId ? 'Update Image' : 'Add to Gallery')}
            </button>
          </form>
        </div>
      )}

      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Current Gallery</h3>
        {loading ? <p>Loading images...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {images.length === 0 ? <p>No images in gallery yet.</p> : images.map(img => (
              <div key={img._id} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                <img src={img.imageUrl} alt={img.title} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                <div style={{ padding: '10px' }}>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>{img.title}</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleEditClick(img)}
                      style={{ 
                        backgroundColor: '#3b82f6', 
                        color: 'white', 
                        border: 'none', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        flex: 1
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(img._id)}
                      style={{ 
                        backgroundColor: '#ef4444', 
                        color: 'white', 
                        border: 'none', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        flex: 1
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryManager;

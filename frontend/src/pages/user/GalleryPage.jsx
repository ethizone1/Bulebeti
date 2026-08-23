import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import config from '../../config';

// Fallback images if not viewing a specific restaurant or no images uploaded
const FALLBACK_IMAGES = [
  { imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800', title: 'Signature Cocktails' },
  { imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800', title: 'Main Dining Room' },
  { imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800', title: 'Executive Chef Selection' },
  { imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800', title: 'Private Event Setting' },
];

const GalleryPage = () => {
  const { restaurantName } = useParams();
  const [images, setImages] = useState(restaurantName ? [] : FALLBACK_IMAGES);
  const [loading, setLoading] = useState(!!restaurantName);

  useEffect(() => {
    if (!restaurantName) {
      return;
    }

    const fetchGallery = async () => {
      try {
        // Get restaurant ID
        const restRes = await fetch(`${config.API_URL}/api/restaurants/${restaurantName}`);
        if (!restRes.ok) throw new Error('Restaurant not found');
        const restData = await restRes.json();

        // Get gallery images
        const galRes = await fetch(`${config.API_URL}/api/gallery/restaurant/${restData._id}`);
        if (galRes.ok) {
          const data = await galRes.json();
          setImages(data.length > 0 ? data : FALLBACK_IMAGES);
        } else {
          setImages(FALLBACK_IMAGES);
        }
      } catch (err) {
        console.error('Error fetching gallery', err);
        setImages(FALLBACK_IMAGES);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, [restaurantName]);

  return (
    <div style={{ padding: 'var(--spacing-xxl) 0' }}>
      <div className="container">
        <header style={{ textAlign: 'center', marginBottom: 'var(--spacing-xxl)' }}>
          <h1>The Gallery</h1>
          <p style={{ color: 'var(--gold)', letterSpacing: '0.1em', fontWeight: '600' }}>ATMOSPHERE & ARTISTRY</p>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading gallery...</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--spacing-xl)'
          }}>
            {images.map((img, idx) => (
              <div key={img._id || idx} style={{
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-1)',
                backgroundColor: 'var(--surface)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                  <img 
                    src={img.imageUrl} 
                    alt={img.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--on-surface)' }}>{img.title}</h3>
                  {img.description && (
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--on-surface-variant)', lineHeight: '1.5' }}>
                      {img.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;

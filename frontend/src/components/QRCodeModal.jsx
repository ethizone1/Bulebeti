import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import config from '../config';

const QRCodeModal = ({ isOpen, onClose, restaurantName, restaurantId }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && restaurantId) {
      fetchLocations();
    }
  }, [isOpen, restaurantId]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${config.API_URL}/api/locations/restaurant/${restaurantId}`);
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = (id, filename) => {
    const svg = document.getElementById(id);
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${filename}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const printQR = (id) => {
    const svg = document.getElementById(id);
    const svgData = new XMLSerializer().serializeToString(svg);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            svg { width: 400px; height: 400px; }
          </style>
        </head>
        <body>
          ${svgData}
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  const baseUrl = `http://localhost:5173/bulebet/${restaurantName}`;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white', padding: '32px', borderRadius: '12px',
        width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>QR Codes: {restaurantName}</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280'
          }}>×</button>
        </div>

        {loading ? (
          <p>Loading locations...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Main Restaurant QR */}
            <div style={{ border: '1px solid var(--platinum)', padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ marginTop: 0 }}>Main Restaurant</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>{baseUrl}</p>
              <div style={{ marginBottom: '16px' }}>
                <QRCodeSVG id="qr-main" value={baseUrl} size={200} level="H" includeMargin={true} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button onClick={() => downloadQR('qr-main', `${restaurantName}-main-qr`)} className="btn" style={{ padding: '8px 16px', border: '1px solid var(--platinum)', backgroundColor: 'white', cursor: 'pointer', borderRadius: '6px' }}>Download</button>
                <button onClick={() => printQR('qr-main')} className="btn btn-primary" style={{ padding: '8px 16px' }}>Print</button>
              </div>
            </div>

            {/* Location QRs */}
            {locations.length > 0 && (
              <div>
                <h3 style={{ borderBottom: '1px solid var(--platinum)', paddingBottom: '12px', marginBottom: '20px' }}>Location QR Codes</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                  {locations.map(loc => {
                    const locUrl = `${baseUrl}?location=${loc._id}`;
                    const qrId = `qr-loc-${loc._id}`;
                    return (
                      <div key={loc._id} style={{ border: '1px solid var(--platinum)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 8px 0' }}>{loc.name}</h4>
                        <p style={{ color: '#6b7280', fontSize: '12px', margin: '0 0 16px 0', wordBreak: 'break-all' }}>{locUrl}</p>
                        <div style={{ marginBottom: '16px' }}>
                          <QRCodeSVG id={qrId} value={locUrl} size={150} level="M" includeMargin={true} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => downloadQR(qrId, `${restaurantName}-${loc.name}-qr`)} style={{ padding: '6px 12px', border: '1px solid var(--platinum)', backgroundColor: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '12px' }}>Download</button>
                          <button onClick={() => printQR(qrId)} style={{ padding: '6px 12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '12px' }}>Print</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeModal;

import React, { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import config from "../config";

const QRCodeModal = ({ isOpen, onClose, restaurantName, restaurantId }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${config.API_URL}/api/locations/restaurant/${restaurantId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (err) {
      console.error("Error fetching locations:", err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (isOpen && restaurantId) {
      fetchLocations();
    }
  }, [isOpen, restaurantId, fetchLocations]);

  const downloadQR = (id, filename) => {
    const svg = document.getElementById(id);
    if (!svg) return;
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
      const cleanFileName = (filename || "qr-code")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      downloadLink.download = `${cleanFileName}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  const printQR = (id, titleText, urlText) => {
    const svg = document.getElementById(id);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${titleText}</title>
          <style>
            @page { size: auto; margin: 20mm; }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              min-height: 90vh;
              margin: 0;
              padding: 20px;
              text-align: center;
              box-sizing: border-box;
            }
            .header-title {
              font-size: 32px;
              font-weight: 800;
              color: #111827;
              margin: 0 0 8px 0;
            }
            .header-url {
              font-size: 18px;
              font-weight: 700;
              color: #d97706;
              margin: 0 0 24px 0;
              word-break: break-all;
            }
            .qr-frame {
              padding: 24px;
              border: 2px solid #e5e7eb;
              border-radius: 16px;
              background-color: #ffffff;
              display: inline-block;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            svg { width: 340px; height: 340px; display: block; }
            .instructions {
              font-size: 15px;
              font-weight: 600;
              color: #4b5563;
              margin-top: 24px;
            }
            .footer-brand {
              font-size: 12px;
              color: #9ca3af;
              margin-top: 16px;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <h1 class="header-title">${titleText}</h1>
          <p class="header-url">${urlText}</p>
          <div class="qr-frame">
            ${svgData}
          </div>
          <p class="instructions">Scan QR Code to View Menu & Order Online</p>
          <p class="footer-brand">Powered by BuleBet Platform</p>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  const rawSlug = (restaurantName || "").trim();
  const cleanOrigin = window.location.origin.replace(/\/$/, "");
  const baseUrl = `${cleanOrigin}/${rawSlug}`;

  // Format hyphenated slug into clean display title (e.g. time-cafe -> Time Cafe)
  const formatTitle = (str) => {
    if (!str) return "Restaurant";
    if (str.includes("-")) {
      return str
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
    return str;
  };

  const displayName = formatTitle(rawSlug);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "32px",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "750px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
            borderBottom: "1px solid #f3f4f6",
            paddingBottom: "16px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#111827" }}>
            📱 QR Codes: {displayName}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#9ca3af",
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <p style={{ color: "#6b7280" }}>⏳ Loading locations...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* Main Restaurant QR Card */}
            <div
              style={{
                border: "1px solid #e5e7eb",
                padding: "28px 20px",
                borderRadius: "12px",
                textAlign: "center",
                backgroundColor: "#fafafa",
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: "20px", fontWeight: "800", color: "#111827" }}>
                {displayName}
              </h3>

              {/* Clickable URL Button */}
              <div style={{ marginBottom: "16px" }}>
                <a
                  href={baseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: "1.5px solid #d97706",
                    backgroundColor: "#fffdf0",
                    color: "#b45309",
                    fontWeight: "700",
                    fontSize: "13px",
                    textDecoration: "none",
                    wordBreak: "break-all",
                    boxShadow: "0 2px 4px rgba(217,119,6,0.12)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#d97706";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#fffdf0";
                    e.currentTarget.style.color = "#b45309";
                  }}
                  title="Click to visit live restaurant page"
                >
                  🔗 {baseUrl} ↗
                </a>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <QRCodeSVG
                  id="qr-main"
                  value={baseUrl}
                  size={210}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={() => downloadQR("qr-main", `${displayName}-QR`)}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "white",
                    cursor: "pointer",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "13px",
                    color: "#374151",
                  }}
                >
                  ⬇️ Download PNG
                </button>

                <button
                  onClick={() => printQR("qr-main", displayName, baseUrl)}
                  style={{
                    padding: "10px 20px",
                    border: "none",
                    backgroundColor: "#d97706",
                    color: "white",
                    cursor: "pointer",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "13px",
                  }}
                >
                  🖨️ Print QR Code
                </button>
              </div>
            </div>

            {/* Location QRs */}
            {locations.length > 0 && (
              <div>
                <h3
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: "12px",
                    marginBottom: "20px",
                    fontSize: "18px",
                    fontWeight: "800",
                    color: "#111827",
                  }}
                >
                  📍 Branch Location QR Codes
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "20px",
                  }}
                >
                  {locations.map((loc) => {
                    const locUrl = `${baseUrl}?location=${loc._id}`;
                    const qrId = `qr-loc-${loc._id}`;
                    const locTitle = `${displayName} - ${loc.name}`;

                    return (
                      <div
                        key={loc._id}
                        style={{
                          border: "1px solid #e5e7eb",
                          padding: "20px",
                          borderRadius: "12px",
                          textAlign: "center",
                          backgroundColor: "#ffffff",
                        }}
                      >
                        <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "700", color: "#111827" }}>
                          {loc.name}
                        </h4>

                        <div style={{ marginBottom: "12px" }}>
                          <a
                            href={locUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "12px",
                              color: "#b45309",
                              textDecoration: "underline",
                              wordBreak: "break-all",
                              fontWeight: "600",
                            }}
                          >
                            {locUrl} ↗
                          </a>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                          <QRCodeSVG
                            id={qrId}
                            value={locUrl}
                            size={160}
                            level="M"
                            includeMargin={true}
                          />
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "center",
                          }}
                        >
                          <button
                            onClick={() => downloadQR(qrId, `${displayName}-${loc.name}-QR`)}
                            style={{
                              padding: "8px 14px",
                              border: "1px solid #d1d5db",
                              backgroundColor: "white",
                              cursor: "pointer",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            ⬇️ Download
                          </button>

                          <button
                            onClick={() => printQR(qrId, locTitle, locUrl)}
                            style={{
                              padding: "8px 14px",
                              backgroundColor: "#d97706",
                              color: "white",
                              border: "none",
                              cursor: "pointer",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            🖨️ Print
                          </button>
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

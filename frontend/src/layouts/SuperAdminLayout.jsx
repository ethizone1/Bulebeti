import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const SuperAdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("user") || "null");
    } catch (e) {
      storedUser = null;
    }

    if (!token || !storedUser || storedUser.role !== "super-admin") {
      navigate("/bulebeti/login", { replace: true });
    } else {
      setIsAuthorized(true);
    }
  }, [navigate]);

  const { language, toggleLanguage } = useLanguage();

  if (!isAuthorized) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "#f0f2f5",
          color: "var(--primary, #0f172a)",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid var(--gold, #d4af37)",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            marginBottom: "16px",
          }}
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ fontWeight: "600", fontSize: "14px" }}>Verifying Super Admin Access...</div>
      </div>
    );
  }

  const navItems = [
    { name: "Platform Overview", path: "/super-admin", icon: "🌐" },
    { name: "Restaurants", path: "/super-admin/restaurants", icon: "🏢" },
    { name: "All Users", path: "/super-admin/users", icon: "👥" },
    { name: "Global Menu Review", path: "/super-admin/menus", icon: "👨‍🍳" },
    { name: "Revenue & Subs", path: "/super-admin/revenue", icon: "💰" },
    { name: "Platform Inquiries", path: "/super-admin/inquiries", icon: "✉️" },
    { name: "System Logs", path: "/super-admin/logs", icon: "📜" },
    { name: "Platform Settings", path: "/super-admin/settings", icon: "⚙️" },
  ];

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
        position: "relative",
      }}
    >
      {/* Mobile Toggle Bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "60px",
          backgroundColor: "#1a1c23",
          display: "none",
          alignItems: "center",
          padding: "0 20px",
          zIndex: 1000,
        }}
        className="super-admin-mobile-header"
      >
        <button
          onClick={() => setIsSidebarOpen(true)}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "24px",
            cursor: "pointer",
          }}
        >
          ☰
        </button>
        <div
          style={{
            marginLeft: "16px",
            color: "var(--gold)",
            fontWeight: "700",
            fontSize: "14px",
            letterSpacing: "0.1em",
          }}
        >
          SUPER HUB
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 1001,
          }}
        />
      )}

      {/* Super Admin Sidebar */}
      <aside
        style={{
          width: "280px",
          backgroundColor: "#1a1c23",
          color: "white",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          height: "100vh",
          zIndex: 1002,
          transition: "transform 0.3s ease",
        }}
        className={`super-admin-sidebar ${isSidebarOpen ? "sidebar-open" : ""}`}
      >
        <div
          style={{
            marginBottom: "40px",
            textAlign: "center",
            position: "relative",
          }}
        >
          <h2
            style={{ color: "var(--gold)", letterSpacing: "0.1em", margin: 0 }}
          >
            SUPER HUB
          </h2>
          <div
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.5)",
              marginTop: "4px",
            }}
          >
            PLATFORM ADMINISTRATION
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: "absolute",
              top: "-10px",
              right: "-10px",
              background: "none",
              border: "none",
              color: "white",
              fontSize: "20px",
              cursor: "pointer",
            }}
            className="mobile-only"
          >
            ✕
          </button>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                textDecoration: "none",
                color:
                  location.pathname === item.path
                    ? "white"
                    : "rgba(255,255,255,0.7)",
                backgroundColor:
                  location.pathname === item.path
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.3s ease",
              }}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <div
          style={{
            marginTop: "auto",
            padding: "16px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "6px 12px",
              borderRadius: "20px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "12px",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              width: "fit-content",
            }}
          >
            <span
              style={{
                color:
                  language === "en" ? "var(--gold)" : "rgba(255,255,255,0.5)",
              }}
            >
              EN
            </span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
            <span
              style={{
                color:
                  language === "am" ? "var(--gold)" : "rgba(255,255,255,0.5)",
              }}
            >
              አማ
            </span>
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/bulebeti/login", { replace: true });
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#ef4444",
              fontSize: "12px",
              cursor: "pointer",
              textAlign: "left",
              padding: "8px 0",
              marginTop: "8px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            ⎋ Sign Out
          </button>
          <Link
            to="/"
            style={{
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
              fontSize: "12px",
              marginTop: "8px",
            }}
          >
            ← Exit to Platform
          </Link>
        </div>
      </aside>

      <style>{`
        .super-admin-sidebar {
          transform: translateX(0);
        }
        @media (max-width: 1024px) {
          .super-admin-sidebar {
            transform: translateX(-100%);
          }
          .super-admin-sidebar.sidebar-open {
            transform: translateX(0) !important;
          }
          .super-admin-mobile-header {
            display: flex !important;
          }
          .super-admin-main {
            margin-left: 0 !important;
            padding-top: 80px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        @media (min-width: 1025px) {
          .super-admin-sidebar {
            transform: translateX(0) !important;
          }
          .super-admin-mobile-header {
            display: none !important;
          }
          .mobile-only {
            display: none !important;
          }
          .super-admin-main {
            margin-left: 280px !important;
            padding-top: 40px !important;
          }
        }
      `}</style>

      {/* Main Content */}
      {/* Platform logo removed from super-admin layout; customer header shows it left-side */}

      <main style={{ flex: 1, padding: "40px" }} className="super-admin-main">
        {children}
      </main>
    </div>
  );
};

export default SuperAdminLayout;

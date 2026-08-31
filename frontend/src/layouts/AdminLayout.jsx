import React, { useState, useEffect, createContext, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminNavbar from "../components/AdminNavbar";
import AIChatWidget from "../components/AIChatWidget";
import { setDynamicFavicon } from "../utils/favicon";
import config from "../config";

export const AdminContext = createContext();
export const useAdmin = () => useContext(AdminContext);

const AdminLayout = ({ children }) => {
  const [tier, setTier] = useState("Platinum");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { restaurantName } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/bulebeti/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!restaurantName) return;
    const fetchRestaurant = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${config.API_URL}/api/restaurants/${restaurantName}`,
          { headers: token ? { "x-auth-token": token } : {} }
        );
        let data = null;
        if (res.ok) {
          data = await res.json();
        } else if (token) {
          const myRes = await fetch(
            `${config.API_URL}/api/restaurants/owner/my`,
            { headers: { "x-auth-token": token } }
          );
          if (myRes.ok) {
            const myData = await myRes.json();
            if (myData && myData.length > 0) {
              data =
                myData.find(
                  (r) =>
                    r.slug &&
                    r.slug.toLowerCase() === (restaurantName || "").toLowerCase()
                ) || myData[0];
            }
          }
        }

        if (data) {
          setRestaurant(data);
          document.title = `BuleBet | ${data.name} Admin`;
          setDynamicFavicon(data.name, data.logoUrl);
          if (data.subscriptionTier) {
            setTier(data.subscriptionTier);
          }
        }
      } catch (err) {
        console.error("AdminLayout: failed to fetch restaurant", err);
      }
    };
    fetchRestaurant();
  }, [restaurantName]);

  const handleTierChange = async (newTier) => {
    // Optimistic UI update
    setTier(newTier);

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${config.API_URL}/api/restaurants/${restaurantName}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({ subscriptionTier: newTier }),
        },
      );

      if (res.ok) {
        const updated = await res.json();
        setRestaurant(updated);
      } else {
        console.warn("Failed to update tier on backend, using local state");
      }
    } catch (err) {
      console.error("AdminLayout: failed to save changed tier to backend", err);
    }
  };

  let storedUser = {};
  try {
    const rawU = localStorage.getItem("user");
    if (rawU && rawU !== "undefined") storedUser = JSON.parse(rawU);
  } catch {
    storedUser = {};
  }
  const storedUserId = String(storedUser._id || storedUser.id || "");
  const ownerIdStr = String(restaurant?.ownerId?._id || restaurant?.ownerId || "");
  const isOwner =
    (ownerIdStr && storedUserId && ownerIdStr === storedUserId) ||
    storedUser.role === "hub owner" ||
    storedUser.role === "super-admin";

  const adminRecord = restaurant?.admins?.find(
    (a) => String(a.user?._id || a.user?.id || a.user) === storedUserId
  );

  const userPermissions = isOwner ? ["all"] : adminRecord?.permissions || [];

  const canAccess = (permissionKey) => {
    if (isOwner) return true;
    if (!permissionKey || permissionKey === "none") return true;
    if (permissionKey === "all") return isOwner;
    return userPermissions.includes(permissionKey);
  };

  return (
    <AdminContext.Provider
      value={{
        tier,
        setTier: handleTierChange,
        restaurant,
        setRestaurant,
        searchQuery,
        setSearchQuery,
        isOwner,
        userPermissions,
        canAccess,
      }}
    >
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
          position: "relative",
        }}
      >
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 998,
            }}
          />
        )}

        {/* Sidebar */}
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            width: "280px",
            backgroundColor: "white",
            borderRight: "1px solid var(--platinum)",
            overflowY: "auto",
            zIndex: 999,
            transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.3s ease",
          }}
          className="admin-sidebar-wrapper"
        >
          <div
            style={{
              padding: "20px",
              display: "flex",
              justifyContent: "flex-end",
            }}
            className="mobile-only"
          >
            <button
              onClick={() => setIsSidebarOpen(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
          <AdminSidebar currentTier={tier} onTierChange={handleTierChange} />
        </div>

        <style>{`
        @media (min-width: 1025px) {
          .admin-sidebar-wrapper { transform: translateX(0) !important; position: sticky !important; }
          .mobile-only { display: none !important; }
        }
        @media (max-width: 1024px) {
          .main-content-wrapper { margin-left: 0 !important; }
        }
      `}</style>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
          className="main-content-wrapper"
        >
          {/* Top navbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "white",
              borderBottom: "1px solid var(--platinum)",
              position: "sticky",
              top: 0,
              zIndex: 100,
            }}
          >
            <button
              onClick={() => setIsSidebarOpen(true)}
              style={{
                padding: "12px 20px",
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
              }}
              className="mobile-only"
            >
              ☰
            </button>
            <div style={{ flex: 1 }}>
              <AdminNavbar currentTier={tier} />
            </div>
          </div>

          {/* Page content */}
          <main
            style={{
              flex: 1,
              padding: "var(--spacing-md)",
              backgroundColor: "#f9fafb",
              minWidth: 0,
            }}
          >
            {React.Children.map(children, (child) =>
              React.isValidElement(child)
                ? React.cloneElement(child, { currentTier: tier })
                : child,
            )}
          </main>

          {/* ── Admin Footer ─────────────────────────────────────────── */}
          <footer
            style={{
              backgroundColor: "var(--primary)",
              color: "white",
              padding: "20px 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginTop: "auto",
            }}
          >
            {/* Left — restaurant info */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {restaurant?.logoUrl && (
                <img
                  src={restaurant.logoUrl}
                  alt="logo"
                  style={{
                    height: "32px",
                    width: "32px",
                    borderRadius: "6px",
                    objectFit: "cover",
                  }}
                />
              )}
              <div>
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "14px",
                    color: "var(--gold)",
                  }}
                >
                  {restaurant?.name || "bulebeti Restaurant"}
                </div>
                <div
                  style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}
                >
                  {restaurant?.address || "Admin Dashboard"}
                  {restaurant?.phone && ` · ${restaurant.phone}`}
                </div>
              </div>
            </div>

            {/* Center — tier badge */}
            <div
              style={{
                backgroundColor: "rgba(212,175,55,0.15)",
                border: "1px solid rgba(212,175,55,0.4)",
                borderRadius: "20px",
                padding: "4px 16px",
                fontSize: "12px",
                fontWeight: "700",
                color: "var(--gold)",
                letterSpacing: "0.5px",
              }}
            >
              ✦ {tier} Plan
            </div>

            {/* Right — copyright */}
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
              © {currentYear} bulebeti Platform. All rights reserved.
            </div>
          </footer>
        </div>
        <AIChatWidget
          role="admin"
          restaurantName={
            restaurant?.name ||
            (restaurantName
              ? restaurantName
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())
              : "the restaurant")
          }
        />
      </div>
    </AdminContext.Provider>
  );
};

export default AdminLayout;

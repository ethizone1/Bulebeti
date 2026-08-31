import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import config from "../config";
import PlansComparisonModal from "./PlansComparisonModal";
import BuleBetLogo from "./BuleBetLogo";

// Super-admin contact details (platform support)
const SUPER_ADMIN_CONTACT = {
  name: "BuleBet Support",
  phone: "+1 (240) 441-1075",
  whatsapp: "+12404411075",
  email: "ethizone1@gmail.com",
  hours: "Mon–Fri, 9am–6pm EAT",
};

const AdminSidebar = ({ currentTier = "Platinum", _onTierChange }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { restaurantName } = useParams();

  const [showContactModal, setShowContactModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [_requestingUpgrade, setRequestingUpgrade] = useState(false);

  // ── Real owner info from localStorage ──────────────────────────
  const [owner, setOwner] = useState(null);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    // Load owner from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      if (stored) setOwner(stored);
    } catch {
      /* ignore */
    }

    // Fetch restaurant info
    fetch(`${config.API_URL}/api/restaurants/${restaurantName}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setRestaurant(data);
      })
      .catch(() => {});
  }, [restaurantName]);

  const _handleRequestUpgrade = async (targetTier) => {
    setRequestingUpgrade(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${config.API_URL}/api/restaurants/${restaurantName}/request-upgrade`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({ tier: targetTier }),
        },
      );

      if (res.ok) {
        const updated = await res.json();
        setRestaurant(updated);
        setShowUpgradeModal(false);
        alert(
          `Upgrade to ${targetTier} requested successfully! The super admin will review and approve your request.`,
        );
      } else {
        const data = await res.json();
        alert(data.msg || "Failed to submit upgrade request");
      }
    } catch (err) {
      console.error(err);
      alert("Error requesting upgrade");
    } finally {
      setRequestingUpgrade(false);
    }
  };

  const ownerName = owner?.name || "Admin";
  const ownerEmail = owner?.email || "";
  // Check if owner or admin
  const currentUserIdStr = String(owner?._id || owner?.id || "");
  const ownerIdStr = String(restaurant?.ownerId?._id || restaurant?.ownerId || "");
  const isOwner =
    (ownerIdStr && currentUserIdStr && ownerIdStr === currentUserIdStr) ||
    owner?.role === "hub owner" ||
    owner?.role === "super-admin";

  const adminRecord = restaurant?.admins?.find(
    (a) => String(a.user?._id || a.user?.id || a.user) === currentUserIdStr
  );
  const userRole = isOwner ? "Owner" : "Sub-Admin";
  const userPermissions = isOwner ? ["all"] : adminRecord?.permissions || [];

  const ownerInitials = ownerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const restaurantDisplayName =
    restaurant?.name ||
    restaurantName.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const allMenuItems = [
    {
      name: t("admin_overview"),
      path: `/bulebeti/${restaurantName}/admin`,
      icon: "📊",
      minTier: "Basic",
      requiredPermission: "none",
    },
    {
      name: t("admin_reservations"),
      path: `/bulebeti/${restaurantName}/admin/reservations`,
      icon: "📅",
      minTier: "Gold",
      requiredPermission: "manage_reservations",
    },
    {
      name: "Online Orders",
      path: `/bulebeti/${restaurantName}/admin/orders`,
      icon: "🛍️",
      minTier: "Platinum",
      requiredPermission: "manage_reservations",
    },
    {
      name: t("admin_catering"),
      path: `/bulebeti/${restaurantName}/admin/catering`,
      icon: "🚛",
      minTier: "Platinum",
      requiredPermission: "manage_catering",
    },
    {
      name: t("admin_menu"),
      path: `/bulebeti/${restaurantName}/admin/menu`,
      icon: "📜",
      minTier: "Basic",
      requiredPermission: "manage_menu",
    },
    {
      name: t("admin_locations"),
      path: `/bulebeti/${restaurantName}/admin/locations`,
      icon: "🏢",
      minTier: "Platinum",
      requiredPermission: "manage_locations",
    },
    {
      name: t("admin_events"),
      path: `/bulebeti/${restaurantName}/admin/events`,
      icon: "🎉",
      minTier: "Premium",
      requiredPermission: "manage_events",
    },
    {
      name: t("admin_feedback"),
      path: `/bulebeti/${restaurantName}/admin/feedback`,
      icon: "💬",
      minTier: "Premium",
      requiredPermission: "manage_feedback",
    },
    {
      name: t("admin_testimonials"),
      path: `/bulebeti/${restaurantName}/admin/testimonials`,
      icon: "⭐",
      minTier: "Premium",
      requiredPermission: "manage_feedback",
    },
    {
      name: "Gallery",
      path: `/bulebeti/${restaurantName}/admin/gallery`,
      icon: "🖼️",
      minTier: "Gold",
      requiredPermission: "manage_menu",
    },
    {
      name: "Team Management",
      path: `/bulebeti/${restaurantName}/admin/team`,
      icon: "👥",
      minTier: "Gold",
      requiredPermission: "manage_team",
    },
    {
      name: "Help & Support",
      path: `/bulebeti/${restaurantName}/admin/support`,
      icon: "❓",
      minTier: "Basic",
      requiredPermission: "none",
    },
    {
      name: t("admin_settings"),
      path: `/bulebeti/${restaurantName}/admin/settings`,
      icon: "⚙️",
      minTier: "Basic",
      requiredPermission: "all",
    },
  ];

  const _tiers = ["Basic", "Gold", "Platinum", "Premium"];
  const tierImportance = { Basic: 0, Gold: 1, Platinum: 2, Premium: 3 };
  const filteredItems = allMenuItems.filter(
    (item) =>
      tierImportance[currentTier] >= tierImportance[item.minTier] &&
      (isOwner ||
        item.requiredPermission === "none" ||
        userPermissions.includes(item.requiredPermission)),
  );

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/bulebeti/login");
  };

  return (
    <>
      <aside
        style={{
          width: "280px",
          backgroundColor: "var(--primary)",
          color: "var(--on-primary)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
          padding: "var(--spacing-xl) 0",
          overflowY: "auto",
        }}
      >
        {/* ── Brand + Tier ─────────────────────────────────────────── */}
        <div
          style={{
            padding: "0 var(--spacing-xl)",
            marginBottom: "var(--spacing-xl)",
          }}
        >
          {/* bulebeti Hub → admin dashboard */}
          <Link
            to={`/bulebeti/${restaurantName}/admin`}
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "10px" }}
          >
            <img
              src="/bulebet_emblem.png"
              alt="BuleBet Logo"
              style={{ height: "36px", width: "36px", objectFit: "cover", borderRadius: "50%" }}
            />
            <div>
              <h2
                style={{
                  color: "#ffffff",
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: "800",
                  letterSpacing: "0.05em",
                  fontFamily: "'Georgia', serif",
                  lineHeight: 1,
                }}
              >
                BuleBet <span style={{ color: "var(--gold)", fontSize: "14px", fontWeight: "700" }}>HUB</span>
              </h2>
            </div>
          </Link>

          {/* Restaurant name → customer main page */}
          <Link
            to={`/bulebeti/${restaurantName}`}
            title="View customer-facing site"
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.55)",
              marginTop: "3px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--gold)")}
            onMouseOut={(e) =>
              (e.currentTarget.style.color = "rgba(255,255,255,0.55)")
            }
          >
            {restaurantDisplayName} ↗
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: "800",
                backgroundColor: "var(--gold)",
                color: "white",
                padding: "2px 8px",
                borderRadius: "4px",
                letterSpacing: "0.5px",
              }}
            >
              {currentTier.toUpperCase()}
            </span>
            {restaurant?.pendingTierRequest ? (
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: "700",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  color: "var(--gold)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  letterSpacing: "0.5px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                title={`Upgrade to ${restaurant.pendingTierRequest} is pending approval`}
              >
                ⏳ {restaurant.pendingTierRequest.toUpperCase()} PENDING
              </span>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.45)",
                  fontSize: "10px",
                  fontWeight: "700",
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                  transition: "color 0.2s",
                }}
                onMouseOver={(e) => (e.target.style.color = "var(--gold)")}
                onMouseOut={(e) =>
                  (e.target.style.color = "rgba(255,255,255,0.45)")
                }
              >
                Update Plan
              </button>
            )}
          </div>
        </div>

        {/* ── Nav links ────────────────────────────────────────────── */}
        <nav style={{ flex: 1 }}>
          {filteredItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path.endsWith("/admin")}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "11px var(--spacing-xl)",
                textDecoration: "none",
                color: isActive ? "white" : "rgba(255,255,255,0.62)",
                backgroundColor: isActive
                  ? "rgba(255,255,255,0.12)"
                  : "transparent",
                borderLeft: isActive
                  ? "4px solid var(--gold)"
                  : "4px solid transparent",
                fontWeight: isActive ? "600" : "400",
                transition: "all 0.2s ease",
                fontSize: "14px",
              })}
              onMouseOver={(e) => {
                if (!e.currentTarget.style.backgroundColor.includes("0.12"))
                  e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.06)";
              }}
              onMouseOut={(e) => {
                if (
                  !e.currentTarget.style.borderLeft.includes("gold") &&
                  !e.currentTarget.style.backgroundColor.includes("0.12")
                )
                  e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <span
                style={{ fontSize: "17px", width: "20px", textAlign: "center" }}
              >
                {item.icon}
              </span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* ── Contact Support Button ────────────────────────────────── */}
        <div style={{ padding: "12px var(--spacing-xl)" }}>
          <button
            onClick={() => setShowContactModal(true)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(212,175,55,0.5)",
              backgroundColor: "rgba(212,175,55,0.12)",
              color: "var(--gold)",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(212,175,55,0.22)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(212,175,55,0.12)";
            }}
          >
            🎧 Contact Support
          </button>
        </div>

        {/* ── Owner profile at bottom ───────────────────────────────── */}
        <div
          style={{
            padding: "var(--spacing-lg) var(--spacing-xl)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            marginTop: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Avatar */}
            {restaurant?.logoUrl ? (
              <img
                src={restaurant.logoUrl}
                alt={ownerName}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(212,175,55,0.5)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--gold), #b8860b)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "13px",
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {ownerInitials}
              </div>
            )}

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "white",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {ownerName}
              </div>
              {ownerEmail && (
                <div
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.45)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {ownerEmail}
                </div>
              )}
              <div
                style={{
                  fontSize: "9px",
                  color: "var(--gold)",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginTop: "1px",
                }}
              >
                {userRole}
              </div>
            </div>

            {/* Sign out icon */}
            <button
              onClick={handleSignOut}
              title="Sign out"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
                color: "rgba(255,255,255,0.4)",
                padding: "4px",
                flexShrink: 0,
                transition: "color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#f87171")}
              onMouseOut={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.4)")
              }
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* ── Contact Support Modal ───────────────────────────────────── */}
      {showContactModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowContactModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "24px 20px",
              maxWidth: "420px",
              width: "92%",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              position: "relative",
              boxSizing: "border-box",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setShowContactModal(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                color: "#9ca3af",
              }}
            >
              ✕
            </button>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎧</div>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800" }}>
                Contact bulebeti Support
              </h3>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                Our team is here to help. Reach out via any channel below.
              </p>
            </div>

            {/* Contact options */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {/* Phone call */}
              <a
                href={`tel:${SUPER_ADMIN_CONTACT.phone}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    backgroundColor: "#f0fdf4",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#22c55e";
                    e.currentTarget.style.backgroundColor = "#dcfce7";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.backgroundColor = "#f0fdf4";
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: "#22c55e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      flexShrink: 0,
                    }}
                  >
                    📞
                  </div>
                  <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "13px",
                        color: "#15803d",
                      }}
                    >
                      Call Us
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: "800",
                        color: "#166534",
                        wordBreak: "break-word",
                      }}
                    >
                      {SUPER_ADMIN_CONTACT.phone}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>
                      {SUPER_ADMIN_CONTACT.hours}
                    </div>
                  </div>
                </div>
              </a>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/${SUPER_ADMIN_CONTACT.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    backgroundColor: "#f0fdf4",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#25D366";
                    e.currentTarget.style.backgroundColor = "#dcfce7";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.backgroundColor = "#f0fdf4";
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: "#25D366",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      flexShrink: 0,
                    }}
                  >
                    💬
                  </div>
                  <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "13px",
                        color: "#15803d",
                      }}
                    >
                      WhatsApp
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: "800",
                        color: "#166534",
                        wordBreak: "break-word",
                      }}
                    >
                      {SUPER_ADMIN_CONTACT.phone}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>
                      Usually replies within 1 hour
                    </div>
                  </div>
                </div>
              </a>

              {/* Email */}
              <a
                href={`mailto:${SUPER_ADMIN_CONTACT.email}?subject=Support Request from ${ownerName} (${restaurantDisplayName})`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    backgroundColor: "#eff6ff",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.backgroundColor = "#dbeafe";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.backgroundColor = "#eff6ff";
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: "#3b82f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      flexShrink: 0,
                    }}
                  >
                    📧
                  </div>
                  <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "13px",
                        color: "#1d4ed8",
                      }}
                    >
                      Email Support
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "800",
                        color: "#1e40af",
                        wordBreak: "break-all",
                        overflowWrap: "anywhere",
                        whiteSpace: "normal",
                      }}
                    >
                      {SUPER_ADMIN_CONTACT.email}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>
                      Response within 24 hours
                    </div>
                  </div>
                </div>
              </a>
            </div>

            {/* Footer note */}
            <div
              style={{
                marginTop: "20px",
                padding: "12px",
                backgroundColor: "#fafafa",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#9ca3af",
                textAlign: "center",
              }}
            >
              You are signed in as{" "}
              <strong style={{ color: "#374151" }}>{ownerName}</strong> ·{" "}
              {restaurantDisplayName}
            </div>
          </div>
        </div>
      )}

      <PlansComparisonModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={currentTier}
        restaurantSlug={restaurantName}
      />
    </>
  );
};

export default AdminSidebar;

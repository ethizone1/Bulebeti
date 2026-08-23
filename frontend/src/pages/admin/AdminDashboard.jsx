import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAdmin } from "../../layouts/AdminLayout";
import config from "../../config";
import PlansComparisonModal from "../../components/PlansComparisonModal";

const AdminDashboard = () => {
  const { tier: currentTier } = useAdmin();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { restaurantName } = useParams();
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);

  // ── Live data from DB ───────────────────────────────────────
  const [stats, setStats] = useState({
    reservations: { total: 0, pending: 0, confirmed: 0, cancelled: 0 },
    catering: { total: 0, pending: 0 },
    menu: { total: 0, visible: 0 },
    locations: { total: 0 },
  });
  const [recentReservations, setRecentReservations] = useState([]);
  const [recentCatering, setRecentCatering] = useState([]);
  const [myRestaurants, setMyRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        // 1. Resolve restaurant slug → _id
        let restaurant = null;
        const restRes = await fetch(
          `${config.API_URL}/api/restaurants/${restaurantName}`,
          { headers: { "x-auth-token": localStorage.getItem("token") || "" } }
        );

        if (restRes.ok) {
          restaurant = await restRes.json();
        } else {
          const token = localStorage.getItem("token");
          if (token) {
            const myRestRes = await fetch(
              `${config.API_URL}/api/restaurants/owner/my`,
              { headers: { "x-auth-token": token } }
            );
            if (myRestRes.ok) {
              const myData = await myRestRes.json();
              if (myData && myData.length > 0) {
                restaurant =
                  myData.find(
                    (r) =>
                      r.slug &&
                      r.slug.toLowerCase() === (restaurantName || "").toLowerCase()
                  ) || myData[0];
              }
            }
          }
        }

        if (!restaurant) throw new Error("Restaurant not found");
        const rId = restaurant._id;

        // 2. Parallel fetch of all data
        const [resRes, catRes, menuRes, _locRes] = await Promise.all([
          fetch(
            `${config.API_URL}/api/reservations/restaurant/${restaurantName}`,
            {
              headers: { "x-auth-token": localStorage.getItem("token") },
            },
          ),
          fetch(`${config.API_URL}/api/catering/restaurant/${rId}`),
          fetch(`${config.API_URL}/api/menu/restaurant/${rId}`),
          fetch(
            `${config.API_URL}/api/restaurants/${restaurantName}/locations`,
          ).catch(() => null),
        ]);

        // 3. Reservations
        let reservations = [];
        if (resRes.ok) {
          reservations = await resRes.json();
        }
        const resPending = reservations.filter(
          (r) => r.status === "Pending",
        ).length;
        const resConfirmed = reservations.filter(
          (r) => r.status === "Confirmed",
        ).length;
        const resCancelled = reservations.filter(
          (r) => r.status === "Cancelled",
        ).length;
        setRecentReservations(
          [...reservations]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 4),
        );

        // 4. Catering
        let cateringList = [];
        if (catRes.ok) {
          cateringList = await catRes.json();
        }
        const catPending = cateringList.filter(
          (c) => c.status === "Pending",
        ).length;
        setRecentCatering(
          [...cateringList]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 4),
        );

        // 5. Menu
        let menuList = [];
        if (menuRes.ok) {
          menuList = await menuRes.json();
        }
        const menuVisible = menuList.filter(
          (m) => m.isAvailable !== false,
        ).length;

        // 6. Sister Restaurants (formerly Locations count)
        let myRestCount = 0;
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const myRestRes = await fetch(
              `${config.API_URL}/api/restaurants/owner/my`,
              {
                headers: { "x-auth-token": token },
              },
            );
            if (myRestRes.ok) {
              const myRestData = await myRestRes.json();
              setMyRestaurants(myRestData);
              myRestCount = myRestData.length;
            }
          } catch (e) {
            console.error("Failed to fetch sister restaurants:", e);
          }
        }

        setStats({
          reservations: {
            total: reservations.length,
            pending: resPending,
            confirmed: resConfirmed,
            cancelled: resCancelled,
          },
          catering: { total: cateringList.length, pending: catPending },
          menu: { total: menuList.length, visible: menuVisible },
          locations: { total: myRestCount },
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [restaurantName]);

  const tourSteps = [
    {
      title: t("admin_tour_1_title"),
      content: t("admin_tour_1_desc"),
      icon: "✨",
    },
    {
      title: t("admin_tour_2_title"),
      content: t("admin_tour_2_desc"),
      icon: "📜",
    },
    {
      title: t("admin_tour_3_title"),
      content: t("admin_tour_3_desc"),
      icon: "📅",
    },
    {
      title: t("admin_tour_4_title"),
      content: t("admin_tour_4_desc"),
      icon: "🚀",
    },
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) setCurrentStep(currentStep + 1);
    else {
      setShowTour(false);
      setCurrentStep(0);
    }
  };

  const statusColor = (status) => {
    if (status === "Confirmed") return { bg: "#dcfce7", color: "#166534" };
    if (status === "Cancelled") return { bg: "#fee2e2", color: "#991b1b" };
    return { bg: "#fef3c7", color: "#92400e" };
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? "" : date.toLocaleDateString();
  };

  const tierImportance = { Silver: 0, Gold: 1, Platinum: 2, Premium: 3 };
  const getTierImportance = (t) =>
    tierImportance[t] !== undefined ? tierImportance[t] : 2;
  const currentTierImp = getTierImportance(currentTier);

  const statCards = [
    {
      title: "Total Reservations",
      value:
        currentTierImp < getTierImportance("Gold")
          ? "🔒"
          : loading
            ? "…"
            : stats.reservations.total,
      sub:
        currentTierImp < getTierImportance("Gold")
          ? "Requires Gold Plan"
          : loading
            ? ""
            : `${stats.reservations.pending} pending · ${stats.reservations.confirmed} confirmed`,
      icon: "📅",
      color: "var(--primary)",
      path: "reservations",
      highlight:
        currentTierImp >= getTierImportance("Gold") &&
        stats.reservations.pending > 0,
    },
    {
      title: "Catering Inquiries",
      value:
        currentTierImp < getTierImportance("Platinum")
          ? "🔒"
          : loading
            ? "…"
            : stats.catering.total,
      sub:
        currentTierImp < getTierImportance("Platinum")
          ? "Requires Platinum Plan"
          : loading
            ? ""
            : `${stats.catering.pending} pending review`,
      icon: "🍽️",
      color: "var(--gold)",
      path: "catering",
      highlight:
        currentTierImp >= getTierImportance("Platinum") &&
        stats.catering.pending > 0,
    },
    {
      title: "Menu Items",
      value: loading ? "…" : stats.menu.total,
      sub: loading ? "" : `${stats.menu.visible} visible to customers`,
      icon: "📜",
      color: "#7c3aed",
      path: "menu",
      highlight: false,
    },
    {
      title: "Sister Restaurants",
      value:
        currentTierImp < getTierImportance("Platinum")
          ? "🔒"
          : loading
            ? "…"
            : stats.locations.total,
      sub:
        currentTierImp < getTierImportance("Platinum")
          ? "Requires Platinum Plan"
          : currentTier === "Premium"
            ? "Unlimited"
            : `${currentTier} plan`,
      icon: "🏢",
      color: "#0891b2",
      path: "locations",
      highlight: false,
    },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      {/* ── Onboarding Tour Modal ──────────────────────────────── */}
      {showTour && (
        <div
          className="position-fixed inset-0 d-flex align-items-center justify-content-center p-3"
          style={{
            backgroundColor: "rgba(0,0,0,0.85)",
            zIndex: 1000,
            inset: 0,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <div
            className="bg-white p-4 p-md-5 rounded-4 position-relative shadow-lg text-center"
            style={{ maxWidth: "500px", width: "100%" }}
          >
            <button
              onClick={() => setShowTour(false)}
              className="btn-close position-absolute top-0 end-0 m-3"
              aria-label="Close"
            ></button>
            <div className="display-1 mb-3">{tourSteps[currentStep].icon}</div>
            <h2 className="mb-3">{tourSteps[currentStep].title}</h2>
            <p className="text-muted mb-4 lh-base">
              {tourSteps[currentStep].content}
            </p>
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex gap-2">
                {tourSteps.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-circle"
                    style={{
                      width: "8px",
                      height: "8px",
                      backgroundColor:
                        i === currentStep ? "var(--gold)" : "var(--platinum)",
                    }}
                  />
                ))}
              </div>
              <button className="btn btn-primary" onClick={handleNext}>
                {currentStep < tourSteps.length - 1
                  ? t("admin_tour_next")
                  : t("admin_tour_finish")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 admin-page-title-row">
        <div>
          <h1 className="fs-3 m-0 fw-bold">{t("admin_dash_title")}</h1>
          <p className="text-muted mt-1 mb-0" style={{ fontSize: "14px" }}>
            {t("admin_dash_subtitle")}
          </p>
        </div>
        <div className="d-flex align-items-center flex-wrap gap-2">
          {loading && <span className="text-muted small">⏳ Updating…</span>}
          <span className="badge rounded-pill bg-warning text-dark px-3 py-2 fw-bold letter-spacing-1">
            {currentTier.toUpperCase()} {t("admin_dash_plan")}
          </span>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowTour(true)}
          >
            {t("admin_dash_quick_tour")}
          </button>
        </div>
      </div>

      {/* ── Sister Restaurants Quick Switcher ────────────────── */}
      {myRestaurants.length > 0 && (
        <div className="bg-white p-3 p-md-4 rounded-3 border shadow-sm">
          <h3
            className="mb-3 text-uppercase fw-bold text-primary"
            style={{ fontSize: "13px", letterSpacing: "0.5px" }}
          >
            MY RESTAURANT HUBS
          </h3>
          <div className="d-flex gap-2 overflow-auto pb-1 align-items-center">
            {myRestaurants.map((r) => {
              const isActive = r.slug === restaurantName;
              return (
                <div
                  key={r._id}
                  onClick={() => {
                    if (!isActive) {
                      navigate(`/bulebeti/${r.slug}/admin`);
                      window.location.reload();
                    }
                  }}
                  className={`d-flex align-items-center gap-2 p-2 px-3 rounded-3 border flex-shrink-0 ${isActive ? "border-warning bg-warning bg-opacity-10" : "border-light bg-white"}`}
                  style={{ cursor: "pointer", transition: "all 0.2s" }}
                >
                  {r.logoUrl ? (
                    <img
                      src={r.logoUrl}
                      alt={r.name}
                      className="rounded-circle object-fit-cover"
                      style={{ width: "24px", height: "24px" }}
                    />
                  ) : (
                    <span className="fs-5">🏢</span>
                  )}
                  <span
                    className={`fw-bold ${isActive ? "text-primary" : "text-muted"}`}
                    style={{ fontSize: "13px" }}
                  >
                    {r.name}
                  </span>
                  {isActive && (
                    <span className="small text-warning ms-1">● Active</span>
                  )}
                </div>
              );
            })}

            {/* Quick Add Button */}
            {currentTierImp >= getTierImportance("Platinum") && (
              <button
                onClick={() =>
                  navigate(`/bulebeti/${restaurantName}/admin/locations`)
                }
                className="btn btn-outline-warning d-flex align-items-center gap-2 p-2 px-3 rounded-3 flex-shrink-0 fw-bold"
                style={{
                  fontSize: "13px",
                  transition: "all 0.2s",
                  borderStyle: "dashed",
                }}
              >
                ➕ Add Sister Restaurant
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Error banner ─────────────────────────────────────── */}
      {error && (
        <div
          className="alert alert-danger p-3 rounded-3 mb-0"
          style={{ fontSize: "13px" }}
        >
          ⚠️ Could not load some data: {error}
        </div>
      )}

      {/* ── Stat cards ───────────────────────────────────────── */}
      <div className="row g-3 stat-cards-grid">
        {statCards.map((card, idx) => (
          <div key={idx} className="col-12 col-sm-6 col-xl-3">
            <div
              onClick={() => {
                if (card.value === "🔒") {
                  setIsPlansModalOpen(true);
                } else {
                  navigate(`/bulebeti/${restaurantName}/admin/${card.path}`);
                }
              }}
              className={`card h-100 border-0 shadow-sm p-4 position-relative overflow-hidden ${card.highlight ? "border border-danger" : ""}`}
              style={{
                borderRadius: "12px",
                cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow-1)";
              }}
            >
              <div
                className="position-absolute h-100 start-0 top-0"
                style={{ width: "4px", backgroundColor: card.color }}
              ></div>
              {card.highlight && (
                <span
                  className="position-absolute top-0 end-0 m-3 rounded-circle bg-danger"
                  style={{
                    width: "8px",
                    height: "8px",
                    animation: "pulse 1.5s infinite",
                  }}
                />
              )}
              <div className="fs-3 mb-2">{card.icon}</div>
              <div
                className="text-muted fw-bold text-uppercase mb-1"
                style={{ fontSize: "11px", letterSpacing: "0.5px" }}
              >
                {card.title}
              </div>
              <div
                className="fw-bold lh-1"
                style={{ fontSize: "32px", color: card.color }}
              >
                {card.value}
              </div>
              <div className="text-muted mt-2" style={{ fontSize: "12px" }}>
                {card.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent activity split ─────────────────────────────── */}
      <div className="row g-4 stack-on-mobile">
        {/* Recent Reservations */}
        <div className="col-lg-6">
          <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-white border-bottom p-3 px-4 d-flex justify-content-between align-items-center">
              <h3 className="m-0 fs-6 fw-bold">📅 Recent Reservations</h3>
              <button
                onClick={() =>
                  navigate(`/bulebeti/${restaurantName}/admin/reservations`)
                }
                className="btn btn-link text-decoration-none text-warning fw-bold p-0 fs-7"
              >
                View all →
              </button>
            </div>
            <div
              className="card-body p-0 d-flex flex-column justify-content-center"
              style={{ minHeight: "140px" }}
            >
              {currentTierImp < getTierImportance("Gold") ? (
                <div className="text-center p-4">
                  <div className="fs-3 mb-2">🔒</div>
                  <div className="fw-bold text-primary fs-6">
                    Reservations Locked
                  </div>
                  <div className="text-muted small mt-1">
                    Upgrade to Gold Plan to manage table bookings
                  </div>
                </div>
              ) : recentReservations.length === 0 && !loading ? (
                <div className="text-center text-muted p-4 fs-6">
                  <div className="fs-3 mb-2">📭</div>
                  No reservations yet
                </div>
              ) : (
                recentReservations.map((r, i) => (
                  <div
                    key={i}
                    className={`p-3 px-4 d-flex justify-content-between align-items-center gap-2 ${i < recentReservations.length - 1 ? "border-bottom" : ""}`}
                  >
                    <div className="text-truncate">
                      <div
                        className="fw-bold text-truncate"
                        style={{ fontSize: "13px" }}
                      >
                        {r.guestName || r.name || "Guest"}
                      </div>
                      <div className="text-muted" style={{ fontSize: "11px" }}>
                        {r.date} at {r.time} · {r.guests} guests
                      </div>
                    </div>
                    <span
                      className="badge rounded-pill fw-bold"
                      style={{
                        fontSize: "10px",
                        backgroundColor: statusColor(r.status).bg,
                        color: statusColor(r.status).color,
                      }}
                    >
                      {r.status || "Pending"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Catering */}
        <div className="col-lg-6">
          <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-white border-bottom p-3 px-4 d-flex justify-content-between align-items-center">
              <h3 className="m-0 fs-6 fw-bold">🍽️ Recent Catering</h3>
              <button
                onClick={() =>
                  navigate(`/bulebeti/${restaurantName}/admin/catering`)
                }
                className="btn btn-link text-decoration-none text-warning fw-bold p-0 fs-7"
              >
                View all →
              </button>
            </div>
            <div
              className="card-body p-0 d-flex flex-column justify-content-center"
              style={{ minHeight: "140px" }}
            >
              {currentTierImp < getTierImportance("Platinum") ? (
                <div className="text-center p-4">
                  <div className="fs-3 mb-2">🔒</div>
                  <div className="fw-bold text-primary fs-6">
                    Catering Locked
                  </div>
                  <div className="text-muted small mt-1">
                    Upgrade to Platinum Plan to manage event catering
                  </div>
                </div>
              ) : recentCatering.length === 0 && !loading ? (
                <div className="text-center text-muted p-4 fs-6">
                  <div className="fs-3 mb-2">📭</div>
                  No catering inquiries yet
                </div>
              ) : (
                recentCatering.map((c, i) => (
                  <div
                    key={i}
                    className={`p-3 px-4 d-flex justify-content-between align-items-center gap-2 ${i < recentCatering.length - 1 ? "border-bottom" : ""}`}
                  >
                    <div className="text-truncate">
                      <div
                        className="fw-bold text-truncate"
                        style={{ fontSize: "13px" }}
                      >
                        {c.name}
                      </div>
                      <div className="text-muted" style={{ fontSize: "11px" }}>
                        {c.eventType} · {c.guestCount} guests ·{" "}
                        {timeAgo(c.createdAt)}
                      </div>
                    </div>
                    <span
                      className="badge rounded-pill fw-bold"
                      style={{
                        fontSize: "10px",
                        backgroundColor: statusColor(c.status).bg,
                        color: statusColor(c.status).color,
                      }}
                    >
                      {c.status || "Pending"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── System capabilities + Upgrade ────────────────────── */}
      <div className="row g-4 stack-on-mobile">
        <div className="col-lg-8">
          <div className="card h-100 border-0 shadow-sm rounded-4 p-4">
            <h3 className="mb-3 fs-6 d-flex justify-content-between align-items-center fw-bold">
              {t("admin_sys_cap")}
              <span className="small fw-bold text-success">
                ● {t("admin_sys_active")}
              </span>
            </h3>
            <div className="d-grid gap-2">
              {[
                {
                  label: t("admin_sys_acc"),
                  value:
                    currentTier === "Silver"
                      ? t("admin_cap_1admin")
                      : currentTier === "Gold"
                        ? t("admin_cap_up3")
                        : t("admin_cap_up7"),
                },
                {
                  label: t("admin_sys_menu"),
                  value:
                    currentTier === "Silver"
                      ? t("admin_cap_edit")
                      : t("admin_cap_editadd"),
                },
                {
                  label: t("admin_sys_scale"),
                  value:
                    currentTier === "Premium"
                      ? t("admin_stat_unlimited")
                      : currentTier === "Platinum"
                        ? t("admin_cap_3loc")
                        : t("admin_cap_1loc"),
                },
                {
                  label: t("admin_sys_comm"),
                  value:
                    currentTier === "Silver"
                      ? t("admin_cap_none")
                      : currentTier === "Gold"
                        ? t("admin_cap_res")
                        : t("admin_cap_rescat"),
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className="d-flex justify-content-between p-2 px-3 bg-light rounded-3"
                  style={{ fontSize: "13px" }}
                >
                  <span className="text-muted">{row.label}</span>
                  <span className="fw-bold">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card h-100 border-0 shadow-sm rounded-4 p-4 text-center text-white bg-primary d-flex flex-column justify-content-center align-items-center gap-3">
            <div className="display-4 text-warning">✦</div>
            <h3 className="text-warning m-0 fs-6 fw-bold">
              {t("admin_upgrade_title")}
            </h3>
            <p className="small m-0 text-white-50">{t("admin_upgrade_desc")}</p>
            <button
              className="btn btn-warning w-100 fw-bold mt-2"
              onClick={() => setIsPlansModalOpen(true)}
            >
              {t("admin_view_plans")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick action links ────────────────────────────────── */}
      <div className="row g-2">
        {[
          { label: "Add Menu Item", icon: "➕", path: "menu/add" },
          { label: "View Reservations", icon: "📅", path: "reservations" },
          { label: "View Catering", icon: "🍽️", path: "catering" },
          { label: "Manage Feedback", icon: "💬", path: "feedback" },
          { label: "Settings", icon: "⚙️", path: "settings" },
        ].map((action) => (
          <div key={action.path} className="col-6 col-md-4 col-xl">
            <button
              onClick={() =>
                navigate(`/bulebeti/${restaurantName}/admin/${action.path}`)
              }
              className="btn btn-light w-100 h-100 p-3 d-flex flex-column align-items-center gap-2 border shadow-sm rounded-3"
              style={{
                fontSize: "13px",
                fontWeight: "600",
                transition: "all 0.15s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.classList.add("border-warning");
                e.currentTarget.classList.add("bg-warning");
                e.currentTarget.classList.add("bg-opacity-10");
              }}
              onMouseOut={(e) => {
                e.currentTarget.classList.remove("border-warning");
                e.currentTarget.classList.remove("bg-warning");
                e.currentTarget.classList.remove("bg-opacity-10");
              }}
            >
              <span className="fs-4">{action.icon}</span>
              {action.label}
            </button>
          </div>
        ))}
      </div>

      <PlansComparisonModal
        isOpen={isPlansModalOpen}
        onClose={() => setIsPlansModalOpen(false)}
        currentTier={currentTier}
        restaurantSlug={restaurantName}
      />
    </div>
  );
};

export default AdminDashboard;

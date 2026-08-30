import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const PlansComparisonModal = ({
  isOpen,
  onClose,
  currentTier = "Basic",
  restaurantSlug = "",
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleSelectPlan = (tierKey) => {
    onClose();
    const query = new URLSearchParams();
    query.set("plan", tierKey);
    if (restaurantSlug) {
      query.set("restaurant", restaurantSlug);
    }
    navigate(`/register?${query.toString()}`);
  };

  const plans = [
    {
      name: t("landing_tier_silver") || "Basic",
      price: t("landing_free") || "Free",
      period: t("landing_year") || "/year",
      regPrice: t("landing_basic_reg") || "Regular $99/year (Save $99)",
      tierKey: "Basic",
      badge: null,
      isDark: false,
      titleColor: "var(--primary)",
      features: [
        { text: t("landing_silver_f1") || "✓ 1 Admin", included: true },
        { text: t("landing_silver_f2") || "✓ Up to 20 Menu Items", included: true },
        { text: t("landing_silver_f3") || "✗ Add New Menu Categories", included: false },
        { text: t("landing_silver_f4") || "✗ Online Ordering", included: false },
      ],
    },
    {
      name: t("landing_tier_gold") || "Gold",
      price: t("landing_gold_price") || "$149",
      period: t("landing_year") || "/year",
      regPrice: t("landing_gold_reg") || "Regular $250/year (Save $101)",
      tierKey: "Gold",
      badge: null,
      isDark: false,
      titleColor: "var(--gold)",
      features: [
        { text: t("landing_gold_f1") || "✓ Up to 3 Admins", included: true },
        {
          text:
            t("landing_gold_f2") ||
            "✓ Unlimited add new Food & Beverage Menus",
          included: true,
        },
        { text: t("landing_gold_f3") || "✓ Reservation SMS Alerts", included: true },
        { text: "✗ Online Ordering (Requires Platinum)", included: false },
      ],
    },
    {
      name: t("landing_tier_plat") || "Platinum",
      price: t("landing_plat_price") || "$399",
      period: t("landing_year") || "/year",
      regPrice: t("landing_plat_reg") || "Regular $500/year (Save $101)",
      tierKey: "Platinum",
      badge: t("landing_popular") || "MOST POPULAR",
      isDark: false,
      titleColor: "var(--primary)",
      features: [
        { text: "✓ Online Ordering System", included: true },
        { text: t("landing_plat_f1") || "✓ Up to 7 Admins", included: true },
        {
          text: t("landing_plat_f2") || "✓ Reservation & Catering SMS",
          included: true,
        },
        { text: t("landing_plat_f3") || "✓ Photo Gallery User Page", included: true },
        { text: t("landing_plat_f4") || "✓ Reply to Comments", included: true },
        { text: t("landing_plat_f5") || "✓ BuleBet Signature Page", included: true },
        { text: t("landing_plat_f6") || "✓ Up to 3 Locations", included: true },
      ],
    },
    {
      name: t("landing_tier_prem") || "Premium",
      price: t("landing_prem_price") || "$699",
      period: t("landing_year") || "/year",
      regPrice: t("landing_prem_reg") || "Regular $1,000/year (Save $301)",
      tierKey: "Premium",
      badge: null,
      isDark: true,
      titleColor: "var(--gold)",
      features: [
        { text: t("landing_prem_f1") || "✓ Everything in Platinum", included: true },
        { text: "✓ Online Ordering System", included: true },
        { text: t("landing_prem_f2") || "✓ Edit/Delete Comments", included: true },
        { text: t("landing_prem_f3") || "✓ Unlimited Locations", included: true },
        { text: t("landing_prem_f4") || "✓ Layout Customization", included: true },
        { text: t("landing_prem_f5") || "✓ Testimonials Module", included: true },
        {
          text: t("landing_prem_f6") || "✓ 24/7 Priority Concierge",
          included: true,
        },
      ],
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          maxWidth: "1200px",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "36px 28px",
          position: "relative",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "24px",
            background: "#f3f4f6",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            fontSize: "18px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#4b5563",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#e5e7eb")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#f3f4f6")}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h2
            style={{
              fontSize: "clamp(26px, 4vw, 36px)",
              fontWeight: "800",
              color: "var(--primary)",
              marginBottom: "12px",
            }}
          >
            {t("landing_pricing_title") || "Select Your BuleBet Hub Tier"}
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "var(--on-surface-variant)",
              maxWidth: "640px",
              margin: "0 auto",
            }}
          >
            Choose the perfect plan for your venue. Select a tier below to pre-select your plan and begin registration.
          </p>
        </div>

        {/* Plans Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          {plans.map((plan) => {
            const isCurrent =
              currentTier.toLowerCase() === plan.tierKey.toLowerCase();

            return (
              <div
                key={plan.tierKey}
                onClick={() => handleSelectPlan(plan.tierKey)}
                style={{
                  padding: "28px 20px",
                  borderRadius: "16px",
                  backgroundColor: plan.isDark ? "#0d1117" : "white",
                  color: plan.isDark ? "white" : "var(--primary)",
                  border: isCurrent
                    ? "3px solid var(--gold)"
                    : plan.badge
                    ? "2px solid var(--gold)"
                    : plan.isDark
                    ? "1px solid #1f2937"
                    : "1px solid var(--platinum)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  position: "relative",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  boxShadow: isCurrent
                    ? "0 8px 25px rgba(212, 175, 55, 0.35)"
                    : "0 4px 15px rgba(0,0,0,0.06)",
                }}
              >
                {/* Badge if present */}
                {plan.badge && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "var(--gold)",
                      color: "white",
                      padding: "2px 12px",
                      borderRadius: "12px",
                      fontSize: "10px",
                      fontWeight: "700",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {plan.badge}
                  </div>
                )}

                <h3
                  style={{
                    color: plan.titleColor,
                    marginBottom: "4px",
                    fontSize: "22px",
                    fontWeight: "700",
                  }}
                >
                  {plan.name}
                </h3>

                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "800",
                    marginTop: "8px",
                  }}
                >
                  {plan.price}
                  <span
                    style={{
                      fontSize: "14px",
                      opacity: 0.5,
                      fontWeight: "400",
                    }}
                  >
                    {plan.period}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    textDecoration: "line-through",
                    opacity: plan.isDark ? 0.7 : 0.55,
                    marginBottom: "20px",
                    minHeight: "18px",
                  }}
                >
                  {plan.regPrice}
                </div>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    marginBottom: "24px",
                    textAlign: "left",
                    flex: 1,
                    fontSize: "13px",
                    lineHeight: "1.6",
                  }}
                >
                  {plan.features.map((feat, idx) => (
                    <li
                      key={idx}
                      style={{
                        marginBottom: "8px",
                        color: !feat.included
                          ? "rgba(128,128,128,0.4)"
                          : plan.isDark
                          ? "#e5e7eb"
                          : "#374151",
                      }}
                    >
                      {feat.text}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  style={{
                    width: "100%",
                    marginTop: "auto",
                    padding: "12px",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: isCurrent
                      ? "var(--gold)"
                      : plan.isDark
                      ? "var(--gold)"
                      : "var(--primary)",
                    color: plan.isDark || isCurrent ? "#000000" : "#ffffff",
                    transition: "all 0.2s",
                  }}
                >
                  {isCurrent
                    ? "Selected ✨"
                    : `Select ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlansComparisonModal;

import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import config from "../config";

const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const { restaurantName } = useParams();

  const isRestaurantPage =
    Boolean(restaurantName) &&
    location.pathname !== "/bulebeti/login" &&
    location.pathname !== "/login" &&
    location.pathname !== "/register";

  // Dynamic restaurant data
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    if (!isRestaurantPage || !restaurantName) return;
    const fetchRestaurant = async () => {
      try {
        const res = await fetch(
          `${config.API_URL}/api/restaurants/${restaurantName}`,
        );
        if (res.ok) {
          const data = await res.json();
          setRestaurant(data);
        }
      } catch (err) {
        console.error("Footer: failed to fetch restaurant", err);
      }
    };
    fetchRestaurant();
  }, [restaurantName, isRestaurantPage]);

  const displayName = restaurant?.name || "BuleBet";
  const displayPhone = restaurant?.phone || null;
  const displayAddress = restaurant?.address || null;
  const displayDescription = restaurant?.description || t("footer_tagline");
  const openingHours = restaurant?.openingHours || null;

  const formatSocialUrl = (key, val) => {
    if (!val || typeof val !== "string" || !val.trim()) return null;
    const trimmed = val.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    const handle = trimmed.replace(/^@/, "");
    switch (key) {
      case "instagram":
        return `https://instagram.com/${handle}`;
      case "facebook":
        return trimmed.includes("facebook.com") || trimmed.includes("fb.com")
          ? `https://${trimmed}`
          : `https://facebook.com/${handle}`;
      case "twitter":
        return `https://x.com/${handle}`;
      case "linkedin":
        return trimmed.includes("linkedin.com")
          ? `https://${trimmed}`
          : `https://linkedin.com/in/${handle}`;
      case "youtube":
        return trimmed.includes("youtube.com")
          ? `https://${trimmed}`
          : `https://youtube.com/@${handle}`;
      case "tiktok":
        return `https://tiktok.com/@${handle}`;
      case "pinterest":
        return trimmed.includes("pinterest.com")
          ? `https://${trimmed}`
          : `https://pinterest.com/${handle}`;
      case "whatsapp": {
        const digits = trimmed.replace(/\D/g, "");
        return digits ? `https://wa.me/${digits}` : `https://wa.me/${trimmed}`;
      }
      case "telegram":
        return `https://t.me/${handle}`;
      case "snapchat":
        return trimmed.includes("snapchat.com")
          ? `https://${trimmed}`
          : `https://snapchat.com/add/${handle}`;
      default:
        return `https://${trimmed}`;
    }
  };

  const allSocialDefinitions = [
    { key: "instagram", name: "Instagram", icon: "📸", color: "#E1306C" },
    { key: "facebook", name: "Facebook", icon: "👤", color: "#1877F2" },
    { key: "twitter", name: "X", icon: "✖", color: "#000000" },
    { key: "linkedin", name: "LinkedIn", icon: "💼", color: "#0A66C2" },
    { key: "youtube", name: "YouTube", icon: "▶", color: "#FF0000" },
    { key: "tiktok", name: "TikTok", icon: "🎵", color: "#000000" },
    { key: "pinterest", name: "Pinterest", icon: "📌", color: "#E60023" },
    { key: "whatsapp", name: "WhatsApp", icon: "💬", color: "#25D366" },
    { key: "telegram", name: "Telegram", icon: "✈", color: "#24A1DE" },
    { key: "snapchat", name: "Snapchat", icon: "👻", color: "#FFFC00" },
  ];

  const activeSocialPlatforms = allSocialDefinitions
    .map((item) => {
      const rawValue = restaurant?.socialLinks?.[item.key];
      const url = formatSocialUrl(item.key, rawValue);
      return url ? { ...item, url } : null;
    })
    .filter(Boolean);

  return (
    <footer
      style={{
        backgroundColor: "var(--primary)",
        color: "white",
        padding: "var(--spacing-xxl) 0 var(--spacing-xl) 0",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "var(--spacing-xxl)",
            marginBottom: "var(--spacing-xxl)",
          }}
          className="footer-grid"
        >
          {/* Brand / Restaurant Info */}
          <div style={{ maxWidth: "300px" }}>
            {restaurant?.logoUrl && (
              <img
                src={restaurant.logoUrl}
                alt={displayName}
                style={{
                  height: "48px",
                  objectFit: "contain",
                  marginBottom: "12px",
                  borderRadius: "6px",
                }}
              />
            )}
            <h2
              style={{
                color: "var(--gold)",
                letterSpacing: "0.15em",
                marginBottom: "10px",
                fontSize: "20px",
              }}
            >
              {displayName.toUpperCase()}
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "13px",
                lineHeight: "1.7",
                margin: 0,
              }}
            >
              {displayDescription}
            </p>

            {/* Contact details & hours pulled from DB */}
            {(displayPhone || displayAddress || openingHours?.weekdays || openingHours?.weekends) && (
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {displayPhone && (
                  <a
                    href={`tel:${displayPhone}`}
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "13px",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    📞 {displayPhone}
                  </a>
                )}
                {displayAddress && (
                  <span
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    📍 {displayAddress}
                  </span>
                )}
                {openingHours?.weekdays && (
                  <span
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    🕒 Mon - Fri: {openingHours.weekdays}
                  </span>
                )}
                {openingHours?.weekends && (
                  <span
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    🕒 Sat - Sun: {openingHours.weekends}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4
              style={{
                color: "var(--gold)",
                marginBottom: "var(--spacing-lg)",
                fontSize: "13px",
                letterSpacing: "1px",
              }}
            >
              {(t("footer_quick_links") || "Quick Links").toUpperCase()}
            </h4>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gap: "12px",
              }}
            >
              {(() => {
                const tierImportance = {
                  Basic: 1,
                  Silver: 2,
                  Gold: 3,
                  Platinum: 4,
                  Premium: 5,
                };
                const currentTierImp =
                  tierImportance[restaurant?.subscriptionTier] || 1;

                const links = [
                  {
                    name: t("footer_our_menu") || "Our Menu",
                    path: isRestaurantPage
                      ? `/${restaurantName}/menu`
                      : "/menu",
                    minTier: "Basic",
                  },
                  {
                    name: t("footer_sister_rest") || "Sister Restaurants",
                    path: isRestaurantPage
                      ? `/${restaurantName}/sister-restaurants`
                      : "/sister-restaurants",
                    minTier: "Silver",
                  },
                  {
                    name: t("footer_catering") || "Catering",
                    path: isRestaurantPage
                      ? `/${restaurantName}/catering`
                      : "/catering",
                    minTier: "Gold",
                  },
                  {
                    name: t("footer_events") || "Events",
                    path: isRestaurantPage
                      ? `/${restaurantName}/events`
                      : "/events",
                    minTier: "Gold",
                  },
                  {
                    name: t("footer_feedback") || "Feedback",
                    path: isRestaurantPage
                      ? `/${restaurantName}/feedback`
                      : "/feedback",
                    minTier: "Platinum",
                  },
                  {
                    name: t("footer_gallery") || "Gallery",
                    path: isRestaurantPage
                      ? `/${restaurantName}/gallery`
                      : "/gallery",
                    minTier: "Platinum",
                  },
                ];

                return links
                  .filter(
                    (link) =>
                      currentTierImp >= (tierImportance[link.minTier] || 0),
                  )
                  .map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.path}
                        style={{
                          color: "rgba(255,255,255,0.75)",
                          textDecoration: "none",
                          fontSize: "14px",
                          transition: "color 0.2s",
                        }}
                        onMouseOver={(e) =>
                          (e.target.style.color = "var(--gold)")
                        }
                        onMouseOut={(e) =>
                          (e.target.style.color = "rgba(255,255,255,0.75)")
                        }
                      >
                        › {link.name}
                      </Link>
                    </li>
                  ));
              })()}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4
              style={{
                color: "var(--gold)",
                marginBottom: "var(--spacing-lg)",
                fontSize: "13px",
                letterSpacing: "1px",
              }}
            >
              {(t("footer_support") || "Support").toUpperCase()}
            </h4>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gap: "12px",
              }}
            >
              {[
                {
                  name: t("footer_help_center") || "Help Center",
                  path: isRestaurantPage
                    ? `/${restaurantName}/contact`
                    : "#",
                },
                {
                  name: t("footer_privacy") || "Privacy Policy",
                  path: isRestaurantPage
                    ? `/${restaurantName}/privacy`
                    : "/privacy",
                },
                {
                  name: t("footer_terms") || "Terms of Service",
                  path: isRestaurantPage
                    ? `/${restaurantName}/terms`
                    : "/terms",
                },
                {
                  name: t("footer_contact_us") || "Contact Us",
                  path: isRestaurantPage
                    ? `/${restaurantName}/contact`
                    : "/contact-us",
                },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    style={{
                      color: "rgba(255,255,255,0.75)",
                      textDecoration: "none",
                      fontSize: "14px",
                      transition: "color 0.2s",
                    }}
                    onMouseOver={(e) => (e.target.style.color = "var(--gold)")}
                    onMouseOut={(e) =>
                      (e.target.style.color = "rgba(255,255,255,0.75)")
                    }
                  >
                    › {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social / Connect */}
          <div>
            {activeSocialPlatforms.length > 0 && (
              <>
                <h4
                  style={{
                    color: "var(--gold)",
                    marginBottom: "var(--spacing-lg)",
                    fontSize: "13px",
                    letterSpacing: "1px",
                  }}
                >
                  {(t("footer_connect") || "Connect").toUpperCase()}
                </h4>
                <div
                  style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                  className="social-icon-grid"
                >
                  {activeSocialPlatforms.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={social.name}
                      style={{
                        width: "38px",
                        height: "38px",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textDecoration: "none",
                        fontSize: "16px",
                        border: "1px solid rgba(255,255,255,0.15)",
                        transition: "all 0.25s ease",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = social.color;
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.borderColor = social.color;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255,255,255,0.1)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.15)";
                      }}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </>
            )}

            {/* Newsletter / CTA */}
            <div style={{ marginTop: activeSocialPlatforms.length > 0 ? "24px" : "0" }}>
              <p
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.65)",
                  marginBottom: "10px",
                }}
              >
                Subscribe for updates & offers
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: "white",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
                <button
                  style={{
                    padding: "9px 16px",
                    backgroundColor: "var(--gold)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Join →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "var(--spacing-xl)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
          className="footer-bottom"
        >
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
            © {currentYear} {displayName}. {t("footer_rights") || "All rights reserved."}
          </div>
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <span
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "1px",
              }}
            >
              POWERED BY bulebeti PLATFORM
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr !important; text-align: center; }
          .footer-grid > div { max-width: 100% !important; }
          .social-icon-grid { justify-content: center; }
          .footer-bottom { flex-direction: column; text-align: center; }
        }
      `}</style>
    </footer>
  );
};

export default Footer;

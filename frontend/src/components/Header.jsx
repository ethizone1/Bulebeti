import React, { useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { setDynamicFavicon } from "../utils/favicon";
import BuleBetLogo from "./BuleBetLogo";
import config from "../config";

const Header = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurantName } = useParams(); // Removing default fallback to make it accurate
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);

  // Context-aware navigation links
  const isRestaurantPage =
    Boolean(restaurantName) &&
    location.pathname !== "/bulebeti/login" &&
    location.pathname !== "/login" &&
    location.pathname !== "/register";

  const headerRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMenuOpen]);

  React.useEffect(() => {
    if (isRestaurantPage && restaurantName) {
      fetch(`${config.API_URL}/api/restaurants/${restaurantName}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.msg) {
            setRestaurant(data);
            document.title = `BuleBet | ${data.name}`;
            setDynamicFavicon(data.name, data.logoUrl);

            // Fetch restaurant menu to extract unique DB categories
            fetch(`${config.API_URL}/api/menu/restaurant/${data._id}`)
              .then((res) => res.json())
              .then((menuData) => {
                if (Array.isArray(menuData)) {
                  const uniqueCategories = Array.from(
                    new Set(menuData.map((item) => item.category).filter(Boolean))
                  );
                  setCategories(uniqueCategories);
                }
              })
              .catch((err) => console.error("Header menu fetch error", err));
          }
        })
        .catch((err) => console.error("Header couldn't fetch restaurant", err));
    } else {
      document.title = "BuleBet | Premium Restaurant Management";
    }
  }, [isRestaurantPage, restaurantName]);

  const tierImportance = { Basic: 0, Gold: 1, Platinum: 2, Premium: 3 };
  const getTierImportance = (t) =>
    tierImportance[t] !== undefined ? tierImportance[t] : 2; // Default to Platinum

  const currentTier = restaurant?.subscriptionTier || "Basic";
  const currentTierImp = getTierImportance(currentTier);

  const allNavLinks = [
    {
      name: t("nav_menu") || "Menu",
      path: `/${restaurantName}/menu`,
      originalName: "Menu",
      minTier: "Basic",
    },
    {
      name: "🛍️ Online Order",
      path: `/${restaurantName}/menu#all-items`,
      originalName: "Online Order",
      minTier: "Platinum",
    },
    {
      name: t("nav_reservations") || "Reservations",
      path: `/${restaurantName}/reservations`,
      originalName: "Reservations",
      minTier: "Gold",
    },
    {
      name: t("nav_catering") || "Catering",
      path: `/${restaurantName}/catering`,
      originalName: "Catering",
      minTier: "Gold",
    },
    {
      name: t("nav_gallery") || "Gallery",
      path: `/${restaurantName}/gallery`,
      originalName: "Gallery",
      minTier: "Gold",
    },
    {
      name: t("nav_testimonials") || "Testimonials",
      path: `/${restaurantName}/testimonials`,
      originalName: "Testimonials",
      minTier: "Gold",
    },
    {
      name: t("nav_feedback") || "Feedback",
      path: `/${restaurantName}/feedback`,
      originalName: "Feedback",
      minTier: "Gold",
    },
  ];

  const navLinks = allNavLinks.filter(
    (link) => currentTierImp >= getTierImportance(link.minTier),
  );

  return (
    <header
      ref={headerRef}
      style={{
        backgroundColor: "white",
        borderBottom: "1px solid var(--platinum)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        className="container"
        style={{
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: Platform brand (customer only) + site/restaurant title */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          {isRestaurantPage && restaurant ? (
            <Link
              to={`/${restaurantName}`}
              style={{
                textDecoration: "none",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {restaurant.logoUrl ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={restaurant.logoUrl}
                    alt={restaurant.name}
                    style={{
                      height: "36px",
                      borderRadius: "4px",
                      objectFit: "contain",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      letterSpacing: "0.05em",
                      color: "var(--primary)",
                      marginTop: "2px",
                    }}
                  >
                    {restaurant.name.toUpperCase()}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    letterSpacing: "0.05em",
                  }}
                >
                  {restaurant.name.toUpperCase()}
                </div>
              )}
            </Link>
          ) : (
            <BuleBetLogo size={42} variant="combo" linkTo="/" />
          )}
        </div>

        {/* Desktop Nav */}
        <nav
          style={{
            display: "flex",
            gap: "clamp(8px, 1.2vw, 20px)",
            alignItems: "center",
          }}
          className="hide-on-mobile header-desktop-nav"
        >
          {/* AI Search Engine */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "12px",
                color: "#9ca3af",
                fontSize: "14px",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search..."
              style={{
                width: "180px",
                padding: "8px 12px 8px 32px",
                borderRadius: "20px",
                border: "1px solid var(--platinum)",
                backgroundColor: "rgba(0, 0, 0, 0.05)",
                outline: "none",
                fontSize: "14px",
                transition: "all 0.3s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--gold)";
                e.target.style.boxShadow = "0 0 0 2px rgba(212, 175, 55, 0.2)";
                e.target.style.width = "220px";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--platinum)";
                e.target.style.boxShadow = "none";
                e.target.style.width = "180px";
              }}
            />
          </div>

          {isRestaurantPage ? (
            navLinks.map((link) => {
              const isCurrentActive =
                location.pathname === link.path ||
                (link.path !== `/${restaurantName}` &&
                  location.pathname.startsWith(link.path));

              return (
                <div
                  key={link.path}
                  style={{ position: "relative" }}
                  className={
                    link.originalName === "Menu" ? "menu-dropdown-container" : ""
                  }
                >
                  <Link
                    to={link.path}
                    style={{
                      textDecoration: "none",
                      color: isCurrentActive
                        ? "var(--gold)"
                        : "var(--on-surface-variant)",
                      fontSize: "14px",
                      fontWeight: isCurrentActive ? "700" : "600",
                      transition: "color 0.2s, border-color 0.2s",
                      padding: "10px 0",
                      whiteSpace: "nowrap",
                      borderBottom: isCurrentActive
                        ? "2px solid var(--gold)"
                        : "2px solid transparent",
                    }}
                    onMouseOver={(e) => (e.target.style.color = "var(--gold)")}
                    onMouseOut={(e) =>
                      (e.target.style.color = isCurrentActive
                        ? "var(--gold)"
                        : "var(--on-surface-variant)")
                    }
                  >
                    {link.name}
                  </Link>
                  {link.originalName === "Menu" && currentTier !== "Basic" && (
                    <div
                      className="menu-dropdown"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "0",
                        backgroundColor: "white",
                        boxShadow: "var(--shadow-2)",
                        borderRadius: "var(--radius-md)",
                        padding: "10px 0",
                        minWidth: "160px",
                        display: "none", // Handled by CSS hover
                        flexDirection: "column",
                        zIndex: 1001,
                        border: "1px solid var(--platinum)",
                      }}
                    >
                      {[
                        { id: "Our Signature", name: t("menu_signature") || "Our Signature" },
                        ...categories.map((c) => ({ id: c, name: c })),
                        { id: "All Items", name: t("menu_all") || "All Items" },
                      ].map((cat) => (
                        <Link
                          key={cat.id}
                          to={`/bulebeti/${restaurantName}/menu#${cat.id.toLowerCase().replace(/ /g, "-")}`}
                          style={{
                            padding: "8px 20px",
                            color: "var(--on-surface-variant)",
                            textDecoration: "none",
                            fontSize: "14px",
                            transition: "all 0.2s",
                            display: "block",
                          }}
                          onMouseOver={(e) => {
                            e.target.style.backgroundColor = "#f9fafb";
                            e.target.style.color = "var(--gold)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.backgroundColor = "transparent";
                            e.target.style.color = "var(--on-surface-variant)";
                          }}
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // Global Nav Links for Landing/Registration Pages
            <div
              style={{
                display: "flex",
                gap: "var(--spacing-xl)",
                alignItems: "center",
              }}
            >
              <Link
                to="/"
                style={{
                  textDecoration: "none",
                  color:
                    location.pathname === "/"
                      ? "var(--gold)"
                      : "var(--on-surface-variant)",
                  fontSize: "14px",
                  fontWeight: location.pathname === "/" ? "700" : "600",
                  borderBottom:
                    location.pathname === "/"
                      ? "2px solid var(--gold)"
                      : "2px solid transparent",
                  padding: "10px 0",
                }}
              >
                Home
              </Link>
              <Link
                to="/register"
                style={{
                  textDecoration: "none",
                  color:
                    location.pathname === "/register"
                      ? "var(--gold)"
                      : "var(--on-surface-variant)",
                  fontSize: "14px",
                  fontWeight: location.pathname === "/register" ? "700" : "600",
                  borderBottom:
                    location.pathname === "/register"
                      ? "2px solid var(--gold)"
                      : "2px solid transparent",
                  padding: "10px 0",
                }}
              >
                Register Restaurant
              </Link>
            </div>
          )}
        </nav>

        {/* Right Actions (Language Toggle, Login, Hamburger - Always Visible) */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {/* Language Selector */}
          <button
            onClick={toggleLanguage}
            style={{
              background: "transparent",
              border: "1px solid var(--platinum)",
              padding: "4px 8px",
              borderRadius: "20px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "11px",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span
              style={{ color: language === "en" ? "var(--gold)" : "inherit" }}
            >
              EN
            </span>
            |
            <span
              style={{ color: language === "am" ? "var(--gold)" : "inherit" }}
            >
              አማ
            </span>
          </button>

          {/* Login Button */}
          <button
            onClick={() => navigate("/bulebeti/login")}
            className="btn btn-primary"
            style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "20px" }}
          >
            {t("nav_login")}
          </button>



          {/* Mobile Toggle Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              background: "none",
              border: "none",
              fontSize: "22px",
              cursor: "pointer",
              display: "none",
              padding: "4px 6px",
            }}
            className="mobile-toggle-btn"
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            zIndex: 998,
          }}
        />
      )}

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div
          style={{
            position: "absolute",
            top: "80px",
            left: 0,
            right: 0,
            backgroundColor: "white",
            borderBottom: "1px solid var(--platinum)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            zIndex: 999,
            boxShadow: "var(--shadow-2)",
          }}
          className="mobile-menu-drawer"
        >
          {isRestaurantPage ? (
            navLinks.map((link) => {
              const isCurrentActive =
                location.pathname === link.path ||
                (link.path !== `/${restaurantName}` &&
                  location.pathname.startsWith(link.path));

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    textDecoration: "none",
                    color: isCurrentActive ? "var(--gold)" : "var(--primary)",
                    fontSize: "18px",
                    fontWeight: isCurrentActive ? "700" : "600",
                    padding: "10px 12px",
                    borderBottom: "1px solid #f3f4f6",
                    borderLeft: isCurrentActive
                      ? "4px solid var(--gold)"
                      : "4px solid transparent",
                    backgroundColor: isCurrentActive
                      ? "rgba(212, 175, 55, 0.05)"
                      : "transparent",
                    borderRadius: "4px",
                  }}
                >
                  {link.name}
                </Link>
              );
            })
          ) : (
            <>
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                style={{
                  textDecoration: "none",
                  color:
                    location.pathname === "/"
                      ? "var(--gold)"
                      : "var(--primary)",
                  fontSize: "18px",
                  fontWeight: location.pathname === "/" ? "700" : "600",
                  padding: "10px 12px",
                  borderBottom: "1px solid #f3f4f6",
                  borderLeft:
                    location.pathname === "/"
                      ? "4px solid var(--gold)"
                      : "4px solid transparent",
                  backgroundColor:
                    location.pathname === "/"
                      ? "rgba(212, 175, 55, 0.05)"
                      : "transparent",
                  borderRadius: "4px",
                }}
              >
                Home
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMenuOpen(false)}
                style={{
                  textDecoration: "none",
                  color:
                    location.pathname === "/register"
                      ? "var(--gold)"
                      : "var(--primary)",
                  fontSize: "18px",
                  fontWeight:
                    location.pathname === "/register" ? "700" : "600",
                  padding: "10px 12px",
                  borderBottom: "1px solid #f3f4f6",
                  borderLeft:
                    location.pathname === "/register"
                      ? "4px solid var(--gold)"
                      : "4px solid transparent",
                  backgroundColor:
                    location.pathname === "/register"
                      ? "rgba(212, 175, 55, 0.05)"
                      : "transparent",
                  borderRadius: "4px",
                }}
              >
                Register Restaurant
              </Link>
            </>
          )}
          <button
            onClick={() => {
              navigate("/bulebeti/login");
              setIsMenuOpen(false);
            }}
            className="btn btn-primary"
            style={{ width: "100%", padding: "16px" }}
          >
            {t("nav_login")}
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 1080px) {
          .mobile-toggle-btn {
            display: block !important;
          }
          .header-desktop-nav,
          .hide-on-mobile {
            display: none !important;
          }
        }
        .menu-dropdown-container:hover .menu-dropdown {
          display: flex !important;
        }
      `}</style>
    </header>
  );
};

export default Header;

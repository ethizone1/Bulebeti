import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import config from "../../config";

// Haversine formula to compute distance in Km
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Math.round(dist * 10) / 10; // Round to 1 decimal place
};

// Geocode lookup & fallback for restaurant addresses
const getRestaurantCoords = (restaurant) => {
  if (
    restaurant.lat &&
    restaurant.lng &&
    !isNaN(restaurant.lat) &&
    !isNaN(restaurant.lng)
  ) {
    return { lat: Number(restaurant.lat), lng: Number(restaurant.lng) };
  }
  const addr = (
    (restaurant.address || "") +
    " " +
    (restaurant.name || "")
  ).toLowerCase();

  if (addr.includes("gonder") || addr.includes("gondar"))
    return { lat: 12.6000, lng: 37.4667 };
  if (addr.includes("hawassa") || addr.includes("awassa"))
    return { lat: 7.0621, lng: 38.4763 };
  if (addr.includes("nazret") || addr.includes("adama"))
    return { lat: 8.5400, lng: 39.2700 };
  if (addr.includes("bole")) return { lat: 8.9806, lng: 38.7831 };
  if (addr.includes("kazanchis")) return { lat: 9.0180, lng: 38.7650 };
  if (addr.includes("piassa")) return { lat: 9.0345, lng: 38.7520 };
  if (addr.includes("mexico")) return { lat: 9.0100, lng: 38.7450 };
  if (addr.includes("sarbet")) return { lat: 9.0010, lng: 38.7320 };
  if (addr.includes("addis")) return { lat: 9.0192, lng: 38.7525 };
  if (addr.includes("decatur")) return { lat: 33.7748, lng: -84.2963 };
  if (addr.includes("rexburg") || addr.includes("mine gap"))
    return { lat: 43.8260, lng: -111.7897 };

  // Fallback deterministic offset relative to Addis Ababa center
  const hash = addr
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const latOffset = ((hash % 100) - 50) * 0.006;
  const lngOffset = (((hash * 7) % 100) - 50) * 0.006;
  return { lat: 9.0192 + latOffset, lng: 38.7525 + lngOffset };
};

const LandingPage = () => {
  const { t } = useLanguage();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);
  // Customer geolocation state
  const [userCoords, setUserCoords] = useState(null);
  const [userLocationName, setUserLocationName] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const requestUserLocation = useCallback(() => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setUserLocationName("Your Current Geolocation");
          setIsLocating(false);
        },
        (err) => {
          console.warn("Geolocation error/denied:", err.message);
          setUserCoords({ lat: 9.0192, lng: 38.7525 });
          setUserLocationName("Addis Ababa (Default)");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setUserCoords({ lat: 9.0192, lng: 38.7525 });
      setUserLocationName("Addis Ababa (Default)");
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch(`${config.API_URL}/api/restaurants`);
        if (!response.ok) {
          throw new Error("Failed to fetch restaurants");
        }
        const data = await response.json();
        const activeRestaurants = data.filter((r) => r.status === "Active");
        setRestaurants(activeRestaurants);
      } catch (err) {
        console.error("Error fetching restaurants:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  // Compute distance and sort restaurants so the NEAREST appears FIRST
  const sortedRestaurants = React.useMemo(() => {
    if (!restaurants || restaurants.length === 0) return [];
    if (!userCoords) return restaurants;

    const listWithDist = restaurants.map((r) => {
      const coords = getRestaurantCoords(r);
      const dist = calculateDistanceKm(
        userCoords.lat,
        userCoords.lng,
        coords.lat,
        coords.lng
      );
      return { ...r, distanceKm: dist };
    });

    return listWithDist.sort(
      (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
    );
  }, [restaurants, userCoords]);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section
        id="hero"
        style={{
          padding: "var(--spacing-xxl) 0",
          background:
            "linear-gradient(135deg, var(--surface) 0%, var(--surface-dim) 100%)",
          textAlign: "center",
        }}
      >
        <div className="container">
          <h1 style={{ marginBottom: "var(--spacing-md)" }}>
            {t("landing_hero_title")}
          </h1>
          <p
            style={{
              fontSize: "20px",
              maxWidth: "700px",
              margin: "0 auto var(--spacing-xl)",
              color: "var(--on-surface-variant)",
            }}
          >
            {t("landing_hero_desc")}
          </p>
          <div
            style={{
              display: "flex",
              gap: "var(--spacing-md)",
              justifyContent: "center",
            }}
          >
            <Link to="/register" className="btn btn-primary btn-lg">
              {t("landing_get_started")}
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition / Features */}
      <section
        id="features"
        style={{
          padding: "var(--spacing-xxl) 0",
          backgroundColor: "var(--surface)",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "var(--spacing-xl)",
            }}
          >
            <div
              style={{
                padding: "var(--spacing-lg)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-1)",
              }}
            >
              <h3 style={{ color: "var(--gold)" }}>
                {t("landing_feat1_title")}
              </h3>
              <p>{t("landing_feat1_desc")}</p>
            </div>
            <div
              style={{
                padding: "var(--spacing-lg)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-1)",
              }}
            >
              <h3 style={{ color: "var(--gold)" }}>
                {t("landing_feat2_title")}
              </h3>
              <p>{t("landing_feat2_desc")}</p>
            </div>
            <div
              style={{
                padding: "var(--spacing-lg)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-1)",
              }}
            >
              <h3 style={{ color: "var(--gold)" }}>
                {t("landing_feat3_title")}
              </h3>
              <p>{t("landing_feat3_desc")}</p>
            </div>
          </div>
        </div>
      </section>



      {/* Registered Restaurants Section */}
      <section
        id="restaurants"
        style={{
          padding: "var(--spacing-xxl) 0",
          background:
            "linear-gradient(180deg, var(--background) 0%, var(--surface-bright) 100%)",
          borderTop: "1px solid rgba(0,0,0,0.04)",
          borderBottom: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        <div className="container">
          <div
            style={{ textAlign: "center", marginBottom: "var(--spacing-xl)" }}
          >
            <h2
              style={{
                fontSize: "clamp(24px, 4vw, 40px)",
                fontWeight: "800",
                color: "var(--primary)",
                letterSpacing: "-0.02em",
                marginBottom: "12px",
              }}
            >
              {t("landing_registered_restaurants")}
            </h2>
            <p
              style={{
                fontSize: "16px",
                maxWidth: "680px",
                margin: "0 auto",
                color: "var(--on-surface-variant)",
                lineHeight: "1.6",
              }}
            >
              {t("landing_registered_restaurants_desc")}
            </p>
          </div>

          {/* Location Status Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginBottom: "28px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                backgroundColor: "rgba(212, 175, 55, 0.1)",
                color: "var(--primary)",
                border: "1px solid rgba(212, 175, 55, 0.3)",
                padding: "8px 18px",
                borderRadius: "30px",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <span style={{ fontSize: "16px" }}>📍</span>
              <span>
                Nearest Restaurants First • <strong>{userLocationName || "Your Location"}</strong>
              </span>
            </div>
            <button
              onClick={requestUserLocation}
              disabled={isLocating}
              className="btn btn-outline"
              style={{
                padding: "6px 16px",
                fontSize: "13px",
                borderRadius: "20px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              {isLocating ? "Detecting Location..." : "📍 Update My Location"}
            </button>
          </div>

          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 0",
                gap: "16px",
              }}
            >
              <div
                className="spinner"
                style={{
                  width: "40px",
                  height: "40px",
                  border: "3px solid rgba(0,0,0,0.1)",
                  borderTop: "3px solid var(--gold)",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              ></div>
              <span
                style={{
                  fontSize: "14px",
                  color: "var(--on-surface-variant)",
                  fontWeight: "600",
                }}
              >
                {t("landing_loading_restaurants")}
              </span>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : sortedRestaurants.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 24px",
                backgroundColor: "white",
                borderRadius: "var(--radius-xl)",
                border: "1px dashed var(--outline-variant)",
                maxWidth: "500px",
                margin: "0 auto",
              }}
            >
              <span
                style={{
                  fontSize: "48px",
                  display: "block",
                  marginBottom: "16px",
                }}
              >
                🍽️
              </span>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  marginBottom: "8px",
                }}
              >
                {t("landing_no_restaurants")}
              </h3>
              <p
                style={{
                  color: "var(--on-surface-variant)",
                  fontSize: "14px",
                  marginBottom: "24px",
                }}
              >
                Be the first premier venue to register on BuleBet!
              </p>
              <Link to="/register" className="btn btn-primary">
                {t("landing_get_started")}
              </Link>
            </div>
          ) : (
            <div
              className="grid-auto"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "var(--spacing-xl)",
                padding: "10px 0",
              }}
            >
              {sortedRestaurants.map((restaurant, index) => {
                // Determine a nice fallback gradient based on the restaurant's name
                const gradients = [
                  "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                  "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                  "linear-gradient(135deg, #745c00 0%, #d4af37 100%)",
                  "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
                  "linear-gradient(135deg, #1c1917 0%, #292524 100%)",
                ];
                const charCodeSum = restaurant.name
                  .split("")
                  .reduce((sum, char) => sum + char.charCodeAt(0), 0);
                const bannerGradient =
                  gradients[charCodeSum % gradients.length];

                // Parse cuisine if it is embedded in description
                let cuisineBadge = "";
                if (restaurant.description) {
                  const match =
                    restaurant.description.match(/A (.+?) restaurant\./i);
                  if (match) {
                    cuisineBadge = match[1]
                      .replace("-", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase());
                  }
                }

                // Format Tier badge styling
                const tier = restaurant.subscriptionTier || "Basic";
                const getTierStyles = (t) => {
                  switch (t) {
                    case "Premium":
                      return {
                        bg: "#1e1b4b",
                        color: "#fbbf24",
                        border: "1px solid #fbbf24",
                      };
                    case "Platinum":
                      return {
                        bg: "#f1f5f9",
                        color: "#475569",
                        border: "1px solid #cbd5e1",
                      };
                    case "Gold":
                      return {
                        bg: "rgba(212, 175, 55, 0.1)",
                        color: "#b28900",
                        border: "1px solid rgba(212, 175, 55, 0.3)",
                      };
                    case "Silver":
                      return {
                        bg: "#f8fafc",
                        color: "#64748b",
                        border: "1px solid #e2e8f0",
                      };
                    default:
                      return {
                        bg: "#f3f4f6",
                        color: "#4b5563",
                        border: "1px solid #e5e7eb",
                      };
                  }
                };
                const tierStyle = getTierStyles(tier);

                return (
                  <Link
                    key={restaurant._id}
                    to={`/${restaurant.slug}`}
                    className="restaurant-card"
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      background: "white",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow:
                        index === 0
                          ? "0 10px 30px rgba(22, 163, 74, 0.15)"
                          : "0 4px 20px rgba(0, 0, 0, 0.03)",
                      border:
                        index === 0
                          ? "2px solid #16a34a"
                          : "1px solid rgba(0, 0, 0, 0.05)",
                      display: "flex",
                      flexDirection: "column",
                      transition:
                        "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease",
                      cursor: "pointer",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-6px)";
                      e.currentTarget.style.boxShadow =
                        "0 20px 40px rgba(0, 0, 0, 0.08)";
                      if (index !== 0) e.currentTarget.style.borderColor = "var(--gold)";
                      const arrow =
                        e.currentTarget.querySelector(".card-arrow");
                      if (arrow) arrow.style.transform = "translateX(4px)";
                      const btn = e.currentTarget.querySelector(".card-btn");
                      if (btn) btn.style.color = "var(--gold)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow =
                        index === 0
                          ? "0 10px 30px rgba(22, 163, 74, 0.15)"
                          : "0 4px 20px rgba(0, 0, 0, 0.03)";
                      if (index !== 0) e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.05)";
                      const arrow =
                        e.currentTarget.querySelector(".card-arrow");
                      if (arrow) arrow.style.transform = "none";
                      const btn = e.currentTarget.querySelector(".card-btn");
                      if (btn) btn.style.color = "var(--primary)";
                    }}
                  >
                    {/* Header Banner */}
                    <div
                      style={{
                        height: "140px",
                        width: "100%",
                        background: restaurant.bannerUrl
                          ? `url(${restaurant.bannerUrl}) center/cover no-repeat`
                          : bannerGradient,
                        position: "relative",
                      }}
                    >
                      {/* Nearest / Distance Badge Overlay */}
                      {index === 0 && restaurant.distanceKm != null ? (
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            left: "12px",
                            backgroundColor: "#16a34a",
                            color: "white",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "800",
                            letterSpacing: "0.5px",
                            boxShadow: "0 4px 12px rgba(22, 163, 74, 0.35)",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            zIndex: 3,
                          }}
                        >
                          <span>🏆</span> NEAREST ({restaurant.distanceKm} km)
                        </div>
                      ) : (
                        restaurant.distanceKm != null && (
                          <div
                            style={{
                              position: "absolute",
                              top: "12px",
                              left: "12px",
                              backgroundColor: "rgba(15, 23, 42, 0.8)",
                              backdropFilter: "blur(4px)",
                              color: "white",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              zIndex: 3,
                            }}
                          >
                            <span>📍</span> {restaurant.distanceKm} km away
                          </div>
                        )
                      )}
                      {/* Tier Badge Overlay */}
                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          backgroundColor: tierStyle.bg,
                          color: tierStyle.color,
                          border: tierStyle.border,
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {tier}
                      </div>
                    </div>

                    {/* Logo / Initial Overlay */}
                    <div
                      style={{
                        marginTop: "-40px",
                        padding: "0 20px",
                        display: "flex",
                        alignItems: "flex-end",
                        position: "relative",
                        zIndex: 2,
                        marginBottom: "16px",
                      }}
                    >
                      {restaurant.logoUrl ? (
                        <img
                          src={restaurant.logoUrl}
                          alt={restaurant.name}
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "4px solid white",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                            backgroundColor: "white",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, var(--gold) 0%, #b28900 100%)",
                            border: "4px solid white",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "32px",
                            fontWeight: "800",
                          }}
                        >
                          {restaurant.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Cuisine badge if parsed */}
                      {cuisineBadge && (
                        <span
                          style={{
                            marginLeft: "12px",
                            backgroundColor: "#f1f5f9",
                            color: "#475569",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                          }}
                        >
                          {cuisineBadge}
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div
                      style={{
                        padding: "0 20px 20px 20px",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "20px",
                          fontWeight: "700",
                          margin: "0 0 8px 0",
                          color: "var(--primary)",
                          fontFamily: "var(--font-heading)",
                          lineHeight: "1.3",
                        }}
                      >
                        {restaurant.name}
                      </h3>

                      {restaurant.description && (
                        <p
                          style={{
                            fontSize: "14px",
                            color: "var(--on-surface-variant)",
                            margin: "0 0 16px 0",
                            lineHeight: "1.5",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            height: "42px", // fix height for alignment
                          }}
                        >
                          {restaurant.description}
                        </p>
                      )}

                      {/* Details (Address/Phone) */}
                      <div
                        style={{
                          marginTop: "auto",
                          paddingTop: "12px",
                          borderTop: "1px solid rgba(0,0,0,0.04)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          fontSize: "13px",
                          color: "var(--on-surface-variant)",
                        }}
                      >
                        {restaurant.address && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <span style={{ fontSize: "14px" }}>📍</span>
                            <span
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={restaurant.address}
                            >
                              {restaurant.address}
                            </span>
                          </div>
                        )}
                        {restaurant.phone && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <span style={{ fontSize: "14px" }}>📞</span>
                            <span>{restaurant.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Visit CTA */}
                      <div
                        style={{
                          marginTop: "16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontWeight: "700",
                          fontSize: "14px",
                          color: "var(--primary)",
                          transition: "color 0.2s ease",
                        }}
                        className="card-btn"
                      >
                        <span>{t("landing_visit_restaurant")}</span>
                        <span
                          style={{
                            transition: "transform 0.2s ease",
                          }}
                          className="card-arrow"
                        >
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

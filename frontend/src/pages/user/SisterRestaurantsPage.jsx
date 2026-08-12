import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import config from "../../config";

const SisterRestaurantsPage = () => {
  const { t } = useLanguage();
  const { restaurantName } = useParams();
  const [mainRestaurant, setMainRestaurant] = useState(null);
  const [sisterRestaurants, setSisterRestaurants] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (restaurantName) {
          const res = await fetch(
            `${config.API_URL}/api/restaurants/${restaurantName}/sisters`
          );
          if (res.ok) {
            const data = await res.json();
            setMainRestaurant(data.mainRestaurant);
            setSisterRestaurants(data.sisterRestaurants || []);
          }
        }
        
        // Also fetch all active restaurants for discoverability fallback
        const allRes = await fetch(`${config.API_URL}/api/restaurants`);
        if (allRes.ok) {
          const allData = await allRes.json();
          setAllRestaurants(allData.filter((r) => r.status === "Active"));
        }
      } catch (err) {
        console.error("Error fetching sister restaurants:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [restaurantName]);

  const displayName = mainRestaurant?.name || "BuleBet";
  const displaySisters = sisterRestaurants;
  const otherPlatformHubs = allRestaurants.filter(
    (r) => r.slug !== restaurantName && !sisterRestaurants.some((s) => s._id === r._id)
  );

  return (
    <div style={{ padding: "40px 0 80px 0", backgroundColor: "var(--surface-bright)" }}>
      <div className="container" style={{ maxWidth: "1100px" }}>
        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              display: "inline-block",
              backgroundColor: "rgba(212, 175, 55, 0.12)",
              color: "var(--gold)",
              padding: "4px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "12px",
            }}
          >
            {t("footer_sister_rest") || "Sister Restaurants"}
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: "800",
              color: "var(--primary)",
              marginBottom: "12px",
            }}
          >
            {restaurantName
              ? `${displayName} Sister Hubs & Venues`
              : "BuleBet Sister Restaurant Network"}
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "var(--on-surface-variant)",
              maxWidth: "650px",
              margin: "0 auto",
              lineHeight: "1.6",
            }}
          >
            Discover sister branches and affiliated premier dining venues under the{" "}
            <strong>{displayName}</strong> brand umbrella.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div
              className="spinner"
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid rgba(0,0,0,0.1)",
                borderTop: "3px solid var(--gold)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px auto",
              }}
            ></div>
            <p style={{ color: "var(--on-surface-variant)", fontWeight: "600" }}>
              Loading sister restaurants...
            </p>
          </div>
        ) : (
          <>
            {/* Direct Sister Venues */}
            {displaySisters.length > 0 ? (
              <div style={{ marginBottom: "50px" }}>
                <h3
                  style={{
                    fontSize: "22px",
                    fontWeight: "800",
                    color: "var(--primary)",
                    marginBottom: "20px",
                  }}
                >
                  Direct Sister Hubs ({displaySisters.length})
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {displaySisters.map((venue) => (
                    <RenderVenueCard key={venue._id} venue={venue} isSister={true} />
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "white",
                  padding: "40px 24px",
                  borderRadius: "16px",
                  border: "1px dashed var(--platinum)",
                  textAlign: "center",
                  maxWidth: "600px",
                  margin: "0 auto 50px auto",
                  boxShadow: "var(--shadow-1)",
                }}
              >
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>🏢</div>
                <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>
                  No Additional Sister Locations
                </h3>
                <p style={{ color: "var(--on-surface-variant)", fontSize: "14px", lineHeight: "1.6" }}>
                  <strong>{displayName}</strong> is currently operating from its signature venue location.
                  Explore other premier partner restaurants on the BuleBet platform below!
                </p>
              </div>
            )}

            {/* Other Platform Hubs / Discoverability */}
            {otherPlatformHubs.length > 0 && (
              <div>
                <h3
                  style={{
                    fontSize: "22px",
                    fontWeight: "800",
                    color: "var(--primary)",
                    marginBottom: "20px",
                  }}
                >
                  Explore Other BuleBet Premier Venues
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {otherPlatformHubs.map((venue) => (
                    <RenderVenueCard key={venue._id} venue={venue} isSister={false} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const RenderVenueCard = ({ venue, isSister }) => {
  const gradients = [
    "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
    "linear-gradient(135deg, #745c00 0%, #d4af37 100%)",
    "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
  ];
  const hash = (venue.name || "").split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const bannerGradient = gradients[hash % gradients.length];
  const tier = venue.subscriptionTier || "Basic";

  return (
    <Link
      to={`/bulebeti/${venue.slug}`}
      style={{
        textDecoration: "none",
        color: "inherit",
        backgroundColor: "white",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
        border: isSister ? "2px solid var(--gold)" : "1px solid rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 14px 30px rgba(0, 0, 0, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.04)";
      }}
    >
      <div
        style={{
          height: "120px",
          background: venue.bannerUrl
            ? `url(${venue.bannerUrl}) center/cover no-repeat`
            : bannerGradient,
          position: "relative",
        }}
      >
        {isSister && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              backgroundColor: "var(--gold)",
              color: "white",
              padding: "3px 10px",
              borderRadius: "12px",
              fontSize: "10px",
              fontWeight: "800",
              letterSpacing: "0.5px",
            }}
          >
            SISTER HUB
          </div>
        )}
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "rgba(0,0,0,0.75)",
            color: "white",
            padding: "3px 10px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "700",
          }}
        >
          {tier}
        </div>
      </div>

      <div style={{ padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h4 style={{ fontSize: "18px", fontWeight: "700", color: "var(--primary)", margin: "0 0 6px 0" }}>
          {venue.name}
        </h4>
        {venue.address && (
          <p style={{ fontSize: "13px", color: "var(--on-surface-variant)", margin: "0 0 12px 0" }}>
            📍 {venue.address}
          </p>
        )}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "12px",
            borderTop: "1px solid #f3f4f6",
            fontSize: "13px",
            fontWeight: "700",
            color: "var(--gold)",
          }}
        >
          <span>Visit Venue Hub</span>
          <span>→</span>
        </div>
      </div>
    </Link>
  );
};

export default SisterRestaurantsPage;

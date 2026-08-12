import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import config from "../../config";

const EventsPage = () => {
  const { t } = useLanguage();
  const { restaurantName } = useParams();
  const [events, setEvents] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        if (restaurantName) {
          const res = await fetch(
            `${config.API_URL}/api/events/restaurant-slug/${restaurantName}`
          );
          if (res.ok) {
            const data = await res.json();
            setRestaurant(data.restaurant);
            setEvents(data.events || []);
          }
        } else {
          const res = await fetch(`${config.API_URL}/api/events`);
          if (res.ok) {
            const data = await res.json();
            setEvents(data || []);
          }
        }
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [restaurantName]);

  const displayName = restaurant?.name || "BuleBet Platform";

  return (
    <div style={{ padding: "40px 0 80px 0", backgroundColor: "var(--surface-bright)" }}>
      <div className="container" style={{ maxWidth: "1100px" }}>
        {/* Header */}
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
            {t("footer_events") || "Events & Experiences"}
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
              ? `${displayName} Special Events`
              : "Upcoming Events & Culinary Gatherings"}
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
            Join us for exclusive tasting sessions, live music, holiday specials, and signature dining experiences hosted by <strong>{displayName}</strong>.
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
              Loading upcoming events...
            </p>
          </div>
        ) : events.length === 0 ? (
          <div
            style={{
              backgroundColor: "white",
              padding: "48px 24px",
              borderRadius: "16px",
              border: "1px dashed var(--platinum)",
              textAlign: "center",
              maxWidth: "540px",
              margin: "0 auto",
              boxShadow: "var(--shadow-1)",
            }}
          >
            <div style={{ fontSize: "44px", marginBottom: "12px" }}>🎉</div>
            <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>
              No Active Events Scheduled
            </h3>
            <p style={{ color: "var(--on-surface-variant)", fontSize: "14px", lineHeight: "1.6" }}>
              There are currently no upcoming scheduled events for <strong>{displayName}</strong>. Check back soon or contact us to reserve private dining events!
            </p>
            {restaurantName && (
              <Link
                to={`/bulebeti/${restaurantName}/reservations`}
                className="btn btn-primary mt-3"
              >
                Reserve a Table
              </Link>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "28px",
            }}
          >
            {events.map((event) => (
              <div
                key={event._id}
                style={{
                  backgroundColor: "white",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.25s ease",
                }}
              >
                {event.bannerImage || event.eventImage ? (
                  <img
                    src={event.bannerImage || event.eventImage}
                    alt={event.title}
                    style={{ height: "160px", width: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      height: "140px",
                      background: "linear-gradient(135deg, var(--primary) 0%, #111827 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--gold)",
                      fontSize: "32px",
                    }}
                  >
                    🍷
                  </div>
                )}
                <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "var(--gold)",
                        textTransform: "uppercase",
                        backgroundColor: "rgba(212, 175, 55, 0.1)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      {event.category || "Event"}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#16a34a" }}>
                      {event.isFree ? "FREE ENTRY" : `${event.currency || "ETB"} ${event.price || ""}`}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "20px", fontWeight: "700", color: "var(--primary)", margin: "0 0 10px 0" }}>
                    {event.title}
                  </h3>

                  {event.description && (
                    <p style={{ fontSize: "14px", color: "var(--on-surface-variant)", lineHeight: "1.5", margin: "0 0 16px 0" }}>
                      {event.description}
                    </p>
                  )}

                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: "12px",
                      borderTop: "1px solid #f3f4f6",
                      fontSize: "13px",
                      color: "var(--on-surface-variant)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {event.startDate && (
                      <div>
                        🗓️ <strong>Date:</strong> {event.startDate} {event.endDate ? `- ${event.endDate}` : ""}
                      </div>
                    )}
                    {event.startTime && (
                      <div>
                        🕒 <strong>Time:</strong> {event.startTime} {event.endTime ? `- ${event.endTime}` : ""}
                      </div>
                    )}
                    {(event.address || event.city) && (
                      <div>
                        📍 <strong>Location:</strong> {event.address || event.city}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;

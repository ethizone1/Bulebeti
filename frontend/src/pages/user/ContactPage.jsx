import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import config from "../../config";

const ContactPage = () => {
  const { restaurantName } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [_loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });

  useEffect(() => {
    if (!restaurantName) {
      setLoading(false);
      return;
    }
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${config.API_URL}/api/restaurants/${restaurantName}`
        );
        if (res.ok) {
          const data = await res.json();
          setRestaurant(data);
        }
      } catch (err) {
        console.error("Failed to load restaurant contact details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [restaurantName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${config.API_URL}/api/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          restaurantId: restaurant?._id || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.msg || "Failed to submit inquiry");
      }

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = restaurant?.name || "BuleBet";
  const displayAddress =
    restaurant?.address || "Location details available upon reservation";
  const displayPhone = restaurant?.phone || "Direct phone line available";
  const displayEmail =
    restaurant?.email || `info@${restaurantName || "bulebeti"}.com`;
  const openingHours = restaurant?.openingHours;

  return (
    <div
      style={{
        padding: "var(--spacing-xxl) 0",
        backgroundColor: "var(--surface)",
        minHeight: "80vh",
      }}
    >
      <div className="container" style={{ maxWidth: "1000px" }}>
        <div
          style={{ textAlign: "center", marginBottom: "var(--spacing-xxl)" }}
        >
          <h1
            style={{
              fontSize: "clamp(32px, 8vw, 48px)",
              marginBottom: "var(--spacing-md)",
            }}
          >
            Contact {displayName}
          </h1>
          <p
            style={{
              color: "var(--on-surface-variant)",
              fontSize: "18px",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Have a question, feedback, or special request for {displayName}? Our
            guest hospitality team is here to assist you.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "60px",
            backgroundColor: "white",
            padding: "clamp(20px, 5vw, 60px)",
            borderRadius: "24px",
            boxShadow: "var(--shadow-2)",
            border: "1px solid var(--platinum)",
          }}
          className="contact-grid"
        >
          {/* Contact Info */}
          <div>
            <h2 style={{ fontSize: "24px", marginBottom: "32px" }}>
              {displayName} Info
            </h2>

            <div style={{ display: "grid", gap: "32px" }}>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ fontSize: "24px" }}>📍</div>
                <div>
                  <div
                    style={{
                      fontWeight: "700",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    ADDRESS & LOCATION
                  </div>
                  <div style={{ fontSize: "15px", color: "#6b7280" }}>
                    {displayAddress}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ fontSize: "24px" }}>📧</div>
                <div>
                  <div
                    style={{
                      fontWeight: "700",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    DIRECT EMAIL
                  </div>
                  <a
                    href={`mailto:${displayEmail}`}
                    style={{
                      fontSize: "15px",
                      color: "var(--gold)",
                      fontWeight: "600",
                      textDecoration: "none",
                    }}
                  >
                    {displayEmail}
                  </a>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ fontSize: "24px" }}>📞</div>
                <div>
                  <div
                    style={{
                      fontWeight: "700",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    PHONE & CONCIERGE
                  </div>
                  <a
                    href={`tel:${displayPhone}`}
                    style={{
                      fontSize: "15px",
                      color: "#6b7280",
                      textDecoration: "none",
                    }}
                  >
                    {displayPhone}
                  </a>
                </div>
              </div>

              {(openingHours?.weekdays || openingHours?.weekends) && (
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ fontSize: "24px" }}>🕒</div>
                  <div>
                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "14px",
                        marginBottom: "4px",
                      }}
                    >
                      OPENING HOURS
                    </div>
                    {openingHours.weekdays && (
                      <div style={{ fontSize: "14px", color: "#6b7280" }}>
                        Mon – Fri: {openingHours.weekdays}
                      </div>
                    )}
                    {openingHours.weekends && (
                      <div style={{ fontSize: "14px", color: "#6b7280" }}>
                        Sat – Sun: {openingHours.weekends}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: "48px",
                padding: "24px",
                backgroundColor: "#f9fafb",
                borderRadius: "12px",
                border: "1px solid var(--platinum)",
              }}
            >
              <div
                style={{
                  fontWeight: "700",
                  fontSize: "12px",
                  color: "var(--gold)",
                  marginBottom: "8px",
                  letterSpacing: "0.1em",
                }}
              >
                GUEST HOSPITALITY
              </div>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                Messages sent here go directly to {displayName}&apos;s
                management team. We respond to all inquiries within 24 hours.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            {!submitted ? (
              <form
                onSubmit={handleSubmit}
                style={{ display: "grid", gap: "20px" }}
              >
                {errorMsg && (
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#fee2e2",
                      color: "#dc2626",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    ⚠️ {errorMsg}
                  </div>
                )}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "700",
                      marginBottom: "8px",
                    }}
                  >
                    FULL NAME *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "8px",
                      border: "1px solid var(--platinum)",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "700",
                      marginBottom: "8px",
                    }}
                  >
                    EMAIL ADDRESS *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "8px",
                      border: "1px solid var(--platinum)",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "700",
                      marginBottom: "8px",
                    }}
                  >
                    PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "8px",
                      border: "1px solid var(--platinum)",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "700",
                      marginBottom: "8px",
                    }}
                  >
                    SUBJECT *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "8px",
                      border: "1px solid var(--platinum)",
                      fontSize: "14px",
                      backgroundColor: "white",
                    }}
                  >
                    <option>General Inquiry</option>
                    <option>Table Reservation Query</option>
                    <option>Catering & Private Event</option>
                    <option>Feedback & Suggestion</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "700",
                      marginBottom: "8px",
                    }}
                  >
                    MESSAGE *
                  </label>
                  <textarea
                    required
                    rows="5"
                    placeholder={`How can ${displayName} assist you today?`}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "8px",
                      border: "1px solid var(--platinum)",
                      fontSize: "14px",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
                <button
                  disabled={submitting}
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "16px", fontWeight: "700" }}
                >
                  {submitting
                    ? "Sending Inquiry..."
                    : "Send Message to Restaurant"}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>✉️</div>
                <h2 style={{ marginBottom: "12px" }}>
                  Inquiry Sent to {displayName}
                </h2>
                <p style={{ color: "#6b7280", fontSize: "14px" }}>
                  Thank you for reaching out to {displayName}. The restaurant
                  management team has received your message and will get back
                  to you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn btn-outline"
                  style={{ marginTop: "24px" }}
                >
                  Send Another Message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ContactPage;

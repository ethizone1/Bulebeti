import React, { useState } from "react";

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
            Get in Touch
          </h1>
          <p
            style={{
              color: "var(--on-surface-variant)",
              fontSize: "18px",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Whether you are looking to elevate your restaurant or have a
            platform inquiry, our platinum support team is here to assist.
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
              Platform Contact
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
                    GLOBAL HEADQUARTERS
                  </div>
                  <div style={{ fontSize: "15px", color: "#6b7280" }}>
                    123 Platinum Ave, Suite 500
                    <br />
                    New York, NY 10001
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
                    SUPPORT EMAIL
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      color: "var(--gold)",
                      fontWeight: "600",
                    }}
                  >
                    concierge@bulebeti.com
                  </div>
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
                    24/7 CONCIERGE
                  </div>
                  <div style={{ fontSize: "15px", color: "#6b7280" }}>
                    +1 (800) BULEBET
                  </div>
                </div>
              </div>
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
                PLATINUM PARTNERSHIP
              </div>
              <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
                Looking to onboard multiple locations? Contact our enterprise
                division for a personalized platform demo.
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
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "700",
                      marginBottom: "8px",
                    }}
                  >
                    FULL NAME
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Your Name"
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
                    EMAIL ADDRESS
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="email@example.com"
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
                    SUBJECT
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "8px",
                      border: "1px solid var(--platinum)",
                      fontSize: "14px",
                      backgroundColor: "white",
                    }}
                  >
                    <option>Platform Inquiry</option>
                    <option>Technical Support</option>
                    <option>Partnership Proposal</option>
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
                    MESSAGE
                  </label>
                  <textarea
                    required
                    rows="5"
                    placeholder="How can we assist you today?"
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
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "16px" }}
                >
                  Send Message
                </button>
              </form>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "20px" }}>✉️</div>
                <h2 style={{ marginBottom: "12px" }}>Message Received</h2>
                <p style={{ color: "#6b7280", fontSize: "14px" }}>
                  Thank you for reaching out. Our concierge team will review
                  your inquiry and respond within 24 hours.
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

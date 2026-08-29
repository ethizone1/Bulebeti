import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import config from "../../config";

const LegalPage = ({ title }) => {
  const { restaurantName } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(!!restaurantName);

  useEffect(() => {
    if (!restaurantName) return;
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
        console.error("LegalPage: failed to fetch restaurant", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [restaurantName]);

  if (loading) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center" }}>
        <div
          className="spinner"
          style={{
            margin: "0 auto 20px",
            width: "40px",
            height: "40px",
            border: "4px solid rgba(0,0,0,0.1)",
            borderTopColor: "var(--gold)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ color: "#6b7280" }}>Loading {title.toLowerCase()}...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const platformName = restaurant ? restaurant.name : "BuleBet";
  const contactPhone = restaurant ? restaurant.phone : "+1 (240) 441-1075";
  const contactAddress = restaurant ? restaurant.address : "BuleBet HQ";

  return (
    <div style={{ padding: "var(--spacing-xxl) 0" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        <h1 style={{ marginBottom: "var(--spacing-xl)" }}>{title}</h1>
        <div style={{ lineHeight: "1.8", color: "var(--on-surface-variant)" }}>
          <p style={{ marginBottom: "var(--spacing-lg)" }}>
            This is the official {platformName} {title}. Our commitment to
            security and transparency is at the core of our elite hospitality
            services.
          </p>
          <h3
            style={{
              color: "var(--primary)",
              marginBottom: "var(--spacing-md)",
            }}
          >
            1. Information We Collect
          </h3>
          <p style={{ marginBottom: "var(--spacing-lg)" }}>
            We collect information necessary to provide signature dining
            experiences and administrative management at {platformName}. This
            includes reservation details, catering requirements, and guest
            contact details.
          </p>
          <h3
            style={{
              color: "var(--primary)",
              marginBottom: "var(--spacing-md)",
            }}
          >
            2. How We Use Your Data
          </h3>
          <p style={{ marginBottom: "var(--spacing-lg)" }}>
            Data is used exclusively to facilitate transactions between guests
            and our operations, optimize guest service performance, and ensure a
            premium user experience across all services at {platformName}.
          </p>
          <h3
            style={{
              color: "var(--primary)",
              marginBottom: "var(--spacing-md)",
            }}
          >
            3. Contact Information
          </h3>
          <p style={{ marginBottom: "var(--spacing-lg)" }}>
            For any queries or concerns regarding our {title.toLowerCase()},
            please feel free to reach out to us at:
            <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
              {contactPhone && (
                <li>
                  <strong>Phone:</strong> {contactPhone}
                </li>
              )}
              {contactAddress && (
                <li>
                  <strong>Address:</strong> {contactAddress}
                </li>
              )}
            </ul>
          </p>
        </div>
      </div>
    </div>
  );
};

export const PrivacyPolicy = () => <LegalPage title="Privacy Policy" />;
export const TermsOfService = () => <LegalPage title="Terms of Service" />;

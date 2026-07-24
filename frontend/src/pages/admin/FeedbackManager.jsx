import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAdmin } from "../../layouts/AdminLayout";
import config from "../../config";

const FeedbackManager = () => {
  const { t } = useLanguage();
  const { restaurantName } = useParams();
  const { tier } = useAdmin();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const restRes = await fetch(
          `${config.API_URL}/api/restaurants/${restaurantName}`,
        );
        if (!restRes.ok) throw new Error("Restaurant not found");
        const restaurant = await restRes.json();

        const fbRes = await fetch(
          `${config.API_URL}/api/feedback/restaurant/${restaurant._id}`,
        );
        if (!fbRes.ok) throw new Error("Failed to fetch feedback");
        const data = await fbRes.json();
        setFeedbacks(data);
      } catch (err) {
        console.error("Error fetching feedback:", err);
      } finally {
        setLoading(false);
      }
    };
    if (tier === "Platinum" || tier === "Premium") {
      fetchFeedback();
    }
  }, [restaurantName, tier]);

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Published" ? "Reviewed" : "Published";
    const previous = [...feedbacks];
    setFeedbacks((prev) =>
      prev.map((f) => (f._id === id ? { ...f, status: newStatus } : f)),
    );
    try {
      const res = await fetch(`${config.API_URL}/api/feedback/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch (err) {
      console.error(err);
      alert("Failed to update status. Reverting...");
      setFeedbacks(previous);
    }
  };

  const isPlatinumOrPremium = tier === "Platinum" || tier === "Premium";

  if (!isPlatinumOrPremium) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          backgroundColor: "var(--surface)",
          borderRadius: "12px",
          marginTop: "40px",
        }}
      >
        <h2 style={{ color: "var(--on-surface)" }}>🔒 Feature Locked</h2>
        <p style={{ color: "var(--on-surface-variant)", marginBottom: "20px" }}>
          Feedback Management requires the <strong>Platinum</strong> or{" "}
          <strong>Premium</strong> plan.
        </p>
        <Link
          to={`/bulebeti/${restaurantName}/admin/settings`}
          style={{
            padding: "10px 20px",
            backgroundColor: "var(--primary)",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
          }}
        >
          Upgrade Plan
        </Link>
      </div>
    );
  }

  return (
    <div className="feedback-manager py-3">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <h1 className="fs-3 fw-bold m-0">{t("admin_fb_title")}</h1>
        <div className="d-flex gap-3">
          <div className="text-end">
            <div className="fs-5 fw-bold text-warning">4.8 ★</div>
            <div className="small text-muted">{t("admin_fb_avg")}</div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4">
        {feedbacks.map((fb) => (
          <div
            key={fb._id}
            className="d-flex flex-column flex-md-row gap-4 py-4 border-bottom last-border-0"
          >
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between mb-1">
                <span className="fw-bold">{fb.customer}</span>
                <span className="small text-muted">{fb.date}</span>
              </div>
              <div className="small text-muted mb-2">
                {fb.phone} {fb.email ? `• ${fb.email}` : ""}
              </div>
              <div className="text-warning mb-2">
                {"★".repeat(fb.rating)}
                {"☆".repeat(5 - fb.rating)}
              </div>
              <p className="fst-italic text-primary mb-0">"{fb.comment}"</p>
            </div>
            <div
              className="d-flex flex-md-column gap-2"
              style={{ minWidth: "120px" }}
            >
              <span
                className={`badge w-100 ${fb.status === "Published" ? "bg-success bg-opacity-10 text-success" : fb.status === "Flagged" ? "bg-danger bg-opacity-10 text-danger" : "bg-secondary bg-opacity-10 text-secondary"}`}
              >
                {fb.status === "Published"
                  ? t("admin_fb_pub")
                  : fb.status === "Flagged"
                    ? t("admin_fb_flag")
                    : t("admin_fb_rev")}
              </span>
              <button className="btn btn-outline-secondary btn-sm flex-grow-1">
                {t("admin_fb_reply")}
              </button>
              <button
                onClick={() => toggleStatus(fb._id, fb.status)}
                className="btn btn-outline-secondary btn-sm flex-grow-1"
              >
                {fb.status === "Published"
                  ? t("admin_fb_unpub")
                  : t("admin_fb_dopub")}
              </button>
            </div>
          </div>
        ))}
        {feedbacks.length === 0 && !loading && (
          <div className="py-5 text-center text-muted">
            <div className="display-6 mb-3">💬</div>
            <p>No feedback available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackManager;

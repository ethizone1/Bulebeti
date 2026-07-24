import React, { useState, useEffect } from "react";
import { useAdmin } from "../../layouts/AdminLayout";
import config from "../../config";

const SupportForm = () => {
  const { restaurant } = useAdmin();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Try to auto-fill user data
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setFormData((prev) => ({
          ...prev,
          name: user.name || prev.name,
          email: user.email || prev.email,
        }));
      }

      if (restaurant) {
        setFormData((prev) => ({
          ...prev,
          phone: restaurant.phone || prev.phone,
        }));
      }
    } catch (err) {}
  }, [restaurant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const res = await fetch(`${config.API_URL}/api/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          restaurantId: restaurant?._id,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit inquiry.");

      setSuccessMessage(
        "Your inquiry has been submitted! A member of the bulebeti team will contact you shortly.",
      );
      setFormData({ ...formData, subject: "", message: "" });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="support-form py-3"
      style={{ maxWidth: "800px", margin: "0 auto" }}
    >
      <div className="mb-4">
        <h1 className="fs-3 fw-bold m-0">Platform Support</h1>
        <p className="text-muted mb-0">
          Need help with your account or the platform? Contact the bulebeti
          Super Admin team.
        </p>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
        {successMessage && (
          <div className="alert alert-success py-2 mb-4 fw-medium fs-6 d-flex align-items-center gap-2">
            ✅ {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger py-2 mb-4 fw-medium fs-6 d-flex align-items-center gap-2">
            ⚠ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            <div className="col-12 col-md-6">
              <label className="form-label fw-bold small mb-1">Your Name</label>
              <input
                required
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-bold small mb-1">
                Email Address
              </label>
              <input
                required
                type="email"
                className="form-control"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-bold small mb-1">
                Phone Number
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-bold small mb-1">Subject</label>
              <input
                required
                type="text"
                placeholder="E.g., Upgrade my plan, Technical issue, Billing question..."
                className="form-control"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-bold small mb-1">Message</label>
              <textarea
                required
                rows="5"
                placeholder="Describe your inquiry in detail..."
                className="form-control"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
              ></textarea>
            </div>

            <div className="col-12 mt-4 pt-4 border-top">
              <button
                type="submit"
                className="btn btn-primary px-4 py-2 fw-bold w-100"
                disabled={loading}
              >
                {loading ? "⏳ Submitting..." : "Send Inquiry"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupportForm;

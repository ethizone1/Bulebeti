import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import config from "../../config";

const ActivatePage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${config.API_URL}/api/auth/change-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, phone, oldPassword, newPassword }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/bulebeti/login");
        }, 2000);
      } else {
        setError(data.msg || "Failed to change password.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container min-vh-100 d-flex flex-column justify-content-center align-items-center">
        <div
          className="card border-0 shadow-sm rounded-4 p-5 text-center"
          style={{ maxWidth: "400px" }}
        >
          <div className="text-success mb-3" style={{ fontSize: "48px" }}>
            ✓
          </div>
          <h2 className="fw-bold fs-4">Password Changed!</h2>
          <p className="text-muted small">
            You will be redirected to the login page momentarily.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container min-vh-100 d-flex flex-column justify-content-center align-items-center py-5">
      <div className="mb-4 text-center">
        <h1
          className="fw-bold"
          style={{ fontSize: "28px", letterSpacing: "0.05em" }}
        >
          BULEBET
        </h1>
        <div className="text-muted small fw-bold">CHANGE PASSWORD</div>
      </div>

      <div
        className="card border-0 shadow-sm rounded-4"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        <div className="card-body p-4 p-md-5">
          <h2 className="fs-5 fw-bold mb-4 text-center">
            Set Your New Password
          </h2>

          {error && (
            <div className="alert alert-danger py-2 small">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted">
                Email Address
              </label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter the email you were invited with"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted">
                Phone Number
              </label>
              <input
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter the phone number you were invited with"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted">
                Current Password
              </label>
              <input
                type="password"
                className="form-control"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter the default password from your invite"
                required
              />
            </div>
            <div className="mb-4">
              <label className="form-label small fw-bold text-muted">
                New Password
              </label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create a strong new password"
                minLength="6"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100 fw-bold mb-3 py-2"
              disabled={loading}
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>

          <div className="text-center mt-3">
            <Link to="/bulebeti/login" className="text-decoration-none small">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivatePage;

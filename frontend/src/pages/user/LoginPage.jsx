import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import config from "../../config";

const LoginPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForcePasswordChange, setShowForcePasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [userData, setUserData] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = { password };
    if (identifier.includes("@")) {
      payload.email = identifier.trim();
    } else {
      payload.phone = identifier.trim();
    }

    try {
      const response = await fetch(`${config.API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Login failed");
      }

      if (data.requiresPasswordChange) {
        setUserData(data);
        setShowForcePasswordChange(true);
        return;
      }

      // Store token
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Navigate based on role or default
      if (data.user.role === "super-admin") {
        navigate("/super-admin");
      } else {
        navigate(`/bulebeti/${data.restaurantSlug || "default"}/admin`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const changePayload = { oldPassword: password, newPassword };
    if (identifier.includes("@")) {
      changePayload.email = identifier.trim();
    } else {
      changePayload.phone = identifier.trim();
    }

    try {
      const response = await fetch(
        `${config.API_URL}/api/auth/change-password-preauth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(changePayload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Failed to change password");
      }

      // Proceed with original login flow
      localStorage.setItem("token", userData.token);
      localStorage.setItem("user", JSON.stringify(userData.user));

      if (userData.user.role === "super-admin") {
        navigate("/super-admin");
      } else {
        navigate(`/bulebeti/${userData.restaurantSlug || "default"}/admin`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginResponse = async (googleResponse) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${config.API_URL}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: googleResponse.credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Google Sign-In failed");
      }

      // Store token
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Navigate based on role or default
      if (data.user.role === "super-admin") {
        navigate("/super-admin");
      } else {
        navigate(`/bulebeti/${data.restaurantSlug || "default"}/admin`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id:
            import.meta.env.VITE_GOOGLE_CLIENT_ID ||
            "1014167389146-YOUR_CLIENT_ID.apps.googleusercontent.com",
          callback: handleGoogleLoginResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInButton"),
          { theme: "outline", size: "large", width: "100%" },
        );
      }
    };

    if (window.google && window.google.accounts) {
      initializeGoogleSignIn();
    } else {
      const script = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]',
      );
      if (script) {
        script.addEventListener("load", initializeGoogleSignIn);
      } else {
        const newScript = document.createElement("script");
        newScript.src = "https://accounts.google.com/gsi/client";
        newScript.async = true;
        newScript.defer = true;
        newScript.onload = initializeGoogleSignIn;
        document.head.appendChild(newScript);
      }
    }
  }, []);

  return (
    <div className="py-5 min-vh-100 d-flex align-items-center">
      <div className="container" style={{ maxWidth: "450px" }}>
        <div
          className="card shadow-sm border-0"
          style={{
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--surface)",
          }}
        >
          <div className="card-body p-4 p-md-5 text-center">
            <h2 className="mb-3">{t("login_welcome") || "Welcome Back"}</h2>
            <p className="text-muted mb-4">
              {t("login_enter_email") || "Enter your credentials to login"}
            </p>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {showForcePasswordChange ? (
              <form onSubmit={handlePasswordChange} className="text-start">
                <div
                  className="alert alert-warning mb-4"
                  role="alert"
                  style={{ fontSize: "14px" }}
                >
                  <strong>Security Requirement:</strong> Because you are using a
                  default password, you must set a new password before you can
                  access your dashboard.
                </div>
                <div className="mb-4">
                  <label
                    className="form-label fw-bold"
                    style={{ fontSize: "14px" }}
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter a new secure password"
                    required
                    minLength={6}
                    className="form-control p-3"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-100 p-3 fw-bold mb-4"
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Updating..." : "Update Password & Sign In"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="text-start">
                <div className="mb-3">
                  <label
                    className="form-label fw-bold"
                    style={{ fontSize: "14px" }}
                  >
                    {t("login_email_label") || "Email Address or Phone Number"}
                  </label>
                  <input
                    type="text"
                    name="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      t("login_email_placeholder") ||
                      "email@example.com or phone number"
                    }
                    required
                    className="form-control p-3"
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="form-label fw-bold"
                    style={{ fontSize: "14px" }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="form-control p-3"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-100 p-3 fw-bold mb-3"
                  style={{ opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? "Signing in..." : t("login_signin") || "Sign In"}
                </button>

                <div className="text-center my-3 text-muted position-relative">
                  <hr style={{ borderColor: "var(--platinum)" }} />
                  <span
                    className="position-absolute top-50 start-50 translate-middle px-3"
                    style={{
                      backgroundColor: "var(--surface)",
                      fontSize: "13px",
                    }}
                  >
                    {t("login_or") || "OR"}
                  </span>
                </div>

                <div
                  id="googleSignInButton"
                  className="w-100 mb-4"
                  style={{ minHeight: "44px" }}
                ></div>

                <div className="text-center text-muted">
                  {t("login_new") || "New to BuleBet?"}{" "}
                  <Link
                    to="/register"
                    style={{
                      color: "var(--gold)",
                      fontWeight: "600",
                      textDecoration: "none",
                    }}
                  >
                    {t("login_partner") || "Become a Partner"}
                  </Link>
                </div>
                <div
                  className="text-center text-muted mt-2"
                  style={{ fontSize: "13px" }}
                >
                  Invited as a team member? Just log in to activate your
                  account!
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

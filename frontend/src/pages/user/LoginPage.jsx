import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import BuleBetLogo from "../../components/BuleBetLogo";
import config from "../../config";

const LoginPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleGoogleLoginResponse = useCallback(async (googleResponse) => {
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
  }, [navigate]);

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
      const isPlaceholder = !rawClientId || rawClientId.includes("YOUR_CLIENT_ID");

      if (isPlaceholder) {
        console.warn("⚠️ [Google OAuth] VITE_GOOGLE_CLIENT_ID is not configured or contains placeholder.");
        return;
      }

      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: rawClientId,
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
  }, [handleGoogleLoginResponse]);

  const [useOtpMode, setUseOtpMode] = useState(false);
  const [otpStep, setOtpStep] = useState(1);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!otpEmail || !otpEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    setOtpSuccess("");

    try {
      const response = await fetch(`${config.API_URL}/api/auth/send-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Failed to send access code.");
      }

      setOtpSuccess(data.msg || "Access code sent to your email!");
      setOtpStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Please enter the 6-digit access code sent to your email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${config.API_URL}/api/auth/verify-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: otpEmail.trim(),
          code: otpCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Verification failed. Please check code.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

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

  return (
    <div
      className="py-5 d-flex align-items-center justify-content-center"
      style={{ minHeight: "75vh", backgroundColor: "var(--background, #f8f9fa)" }}
    >
      <div className="container" style={{ maxWidth: "clamp(440px, 90vw, 560px)", width: "100%" }}>
        <div
          className="card border text-start"
          style={{
            borderRadius: "16px",
            backgroundColor: "var(--surface, #ffffff)",
            border: "1px solid var(--platinum, #e2e8f0)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div className="card-body p-4 p-md-5 text-center">
            <div className="mb-4">
              <BuleBetLogo size={65} variant="full" linkTo="/" />
            </div>
            <h2 className="mb-3">{t("login_welcome") || "Welcome Back"}</h2>
            <p className="text-muted mb-4">
              {useOtpMode
                ? "Enter your email to receive a secure access code."
                : t("login_enter_email") || "Enter your email or phone to receive a secure access code."}
            </p>

            {error && (
              <div className="alert alert-danger p-3 small text-start mb-3" role="alert">
                <i className="fa-solid fa-circle-exclamation me-2"></i>
                {error}
              </div>
            )}

            {otpSuccess && (
              <div className="alert alert-success p-3 small text-start mb-3" role="alert">
                <i className="fa-solid fa-circle-check me-2"></i>
                {otpSuccess}
              </div>
            )}

            {useOtpMode ? (
              <div>
                {otpStep === 1 ? (
                  <form onSubmit={handleSendOtp} className="text-start">
                    <div className="mb-4">
                      <label className="form-label fw-bold small text-muted">
                        {t("login_email_label") || "EMAIL OR PHONE"}
                      </label>
                      <input
                        type="email"
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        placeholder={t("login_email_placeholder") || "name@example.com or +1..."}
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
                      {loading ? (
                        <span>
                          <i className="fa-solid fa-spinner fa-spin me-2"></i>
                          Sending Access Code...
                        </span>
                      ) : (
                        "Send Verification Code"
                      )}
                    </button>

                    <div className="text-center mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setUseOtpMode(false);
                          setOtpStep(1);
                          setError("");
                          setOtpSuccess("");
                        }}
                        className="btn btn-link text-decoration-none p-0 small text-muted"
                      >
                        ← Back to Password Login
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="text-start">
                    <div className="mb-4">
                      <label className="form-label fw-bold small text-muted">
                        ENTER 6-DIGIT ACCESS CODE
                      </label>
                      <input
                        type="text"
                        maxLength="6"
                        value={otpCode}
                        onChange={(e) =>
                          setOtpCode(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="e.g. 123456"
                        className="form-control form-control-lg text-center fw-bold fs-3 p-3 mb-2"
                        style={{ letterSpacing: "8px", borderRadius: "10px" }}
                        required
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="btn btn-primary w-100 p-3 fw-bold mb-3"
                    >
                      {loading ? "Verifying..." : "Verify & Sign In"}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <form onSubmit={handleLogin} className="text-start">
                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: "14px" }}>
                    {t("login_email_label") || "EMAIL OR PHONE"}
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="form-control p-3"
                    required
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label fw-bold" style={{ fontSize: "14px" }}>
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control p-3"
                    required
                  />
                </div>

                <div className="text-center mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setUseOtpMode(true);
                      if (identifier && identifier.includes("@")) {
                        setOtpEmail(identifier);
                      }
                      setError("");
                    }}
                    className="btn btn-link p-0 small text-decoration-none"
                    style={{ color: "var(--gold)", fontWeight: "500" }}
                  >
                    Sign in with email Access Code
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-100 p-3 fw-bold"
                >
                  {loading ? "Signing in..." : t("login_signin") || "Sign In"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

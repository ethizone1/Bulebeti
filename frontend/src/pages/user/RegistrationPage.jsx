import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import BuleBetLogo from "../../components/BuleBetLogo";
import config from "../../config";

const RegistrationPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    restaurantName: "",
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    cuisineType: "fine-dining",
    menuLayout: "image-left",
    location: "",
    logoBase64: null,
    subscriptionTier: "Gold",
  });

  const [prefilledAlert, setPrefilledAlert] = useState("");
  const [unfilledFields, setUnfilledFields] = useState([]);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleToken, setGoogleToken] = useState(null);
  const [googleUserEmail, setGoogleUserEmail] = useState("");

  // Email verification modal states
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [resendStatus, setResendStatus] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const targetRestaurantSlug =
    searchParams.get("restaurant") ||
    (() => {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "null");
        return u?.restaurantSlug || "";
      } catch {
        return "";
      }
    })();

  const isUpgradeMode = Boolean(
    searchParams.get("restaurant") ||
      (localStorage.getItem("token") && searchParams.get("plan"))
  );

  useEffect(() => {
    const paramTier = searchParams.get("tier") || searchParams.get("plan");
    const paramRestSlug = searchParams.get("restaurant");

    let chosenTier = "Gold";
    if (paramTier) {
      const formatted =
        paramTier.charAt(0).toUpperCase() + paramTier.slice(1).toLowerCase();
      if (
        ["Silver", "Gold", "Platinum", "Premium", "Basic"].includes(formatted)
      ) {
        chosenTier = formatted === "Basic" ? "Silver" : formatted;
      }
    }

    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const loadRestAndSet = async () => {
      let filledCount = 0;
      const targetSlug =
        paramRestSlug || (storedUser ? storedUser.restaurantSlug : "");
      let restData = null;
      if (targetSlug) {
        try {
          const res = await fetch(
            `${config.API_URL}/api/restaurants/${targetSlug}`
          );
          if (res.ok) {
            restData = await res.json();
          }
        } catch (err) {
          console.error("Auto-fill restaurant error:", err);
        }
      }

      setFormData((prev) => {
        const updated = { ...prev, subscriptionTier: chosenTier };
        if (storedUser) {
          if (storedUser.name) {
            updated.ownerName = storedUser.name;
            filledCount++;
          }
          if (storedUser.email) {
            updated.email = storedUser.email;
            filledCount++;
          }
          if (storedUser.phone) {
            updated.phone = storedUser.phone;
            filledCount++;
          }
        }
        if (restData) {
          if (restData.name) {
            updated.restaurantName = restData.name;
            filledCount++;
          }
          if (restData.address) {
            updated.location = restData.address;
            filledCount++;
          }
          if (restData.phone && !updated.phone) {
            updated.phone = restData.phone;
          }
          if (restData.menuLayout) {
            updated.menuLayout = restData.menuLayout;
          }
        }

        const missing = [];
        if (!updated.restaurantName) missing.push("Restaurant Name");
        if (!isUpgradeMode && !updated.ownerName) missing.push("Owner Name");
        if (!isUpgradeMode && !updated.email) missing.push("Email Address");
        if (!isUpgradeMode && !storedUser && !updated.password) missing.push("Password");

        setUnfilledFields(missing);

        if (paramTier || paramRestSlug || filledCount > 0) {
          setPrefilledAlert(
            `✦ Upgrading / Selected Plan: ${chosenTier}. Your existing restaurant details are loaded below.`
          );
          setTimeout(() => {
            const formElement = document.getElementById("registration-form");
            if (formElement) {
              formElement.scrollIntoView({ behavior: "smooth" });
            }
          }, 350);
        }

        return updated;
      });
    };

    loadRestAndSet();
  }, [searchParams, isUpgradeMode]);

  const handleSelectTier = (tier) => {
    setFormData((prev) => ({ ...prev, subscriptionTier: tier }));
    const formElement = document.getElementById("registration-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const validateForm = () => {
    if (isUpgradeMode) {
      return true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      setError("Please enter a valid email address (e.g., owner@example.com).");
      return false;
    }

    if (formData.phone) {
      const phoneRegex = /^\+?[0-9\s\-()]{9,18}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        setError("Please enter a valid phone number (at least 9 digits).");
        return false;
      }
    }

    if (!googleToken && formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }

    if (!googleToken && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return false;
    }

    return true;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSignupResponse = async (googleResponse) => {
    try {
      const token = googleResponse.credential;
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );

      const payload = JSON.parse(jsonPayload);

      setGoogleToken(token);
      setGoogleUserEmail(payload.email);
      setFormData((prev) => ({
        ...prev,
        email: payload.email,
        ownerName: payload.name || prev.ownerName,
      }));
    } catch (err) {
      console.error("Failed to parse Google signup payload:", err);
    }
  };

  useEffect(() => {
    const initializeGoogleSignup = () => {
      const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
      const isPlaceholder = !rawClientId || rawClientId.includes("YOUR_CLIENT_ID");

      if (isPlaceholder) {
        console.warn("⚠️ [Google OAuth] VITE_GOOGLE_CLIENT_ID is not configured or contains placeholder.");
        return;
      }

      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: rawClientId,
          callback: handleGoogleSignupResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleSignupButton"),
          { theme: "outline", size: "large", width: "100%" },
        );
      }
    };

    if (window.google && window.google.accounts) {
      initializeGoogleSignup();
    } else {
      const script = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]',
      );
      if (script) {
        script.addEventListener("load", initializeGoogleSignup);
      } else {
        const newScript = document.createElement("script");
        newScript.src = "https://accounts.google.com/gsi/client";
        newScript.async = true;
        newScript.defer = true;
        newScript.onload = initializeGoogleSignup;
        document.head.appendChild(newScript);
      }
    }
  }, []);



  const finalizeRegistration = async (token, userObj) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userObj));

    const slug = formData.restaurantName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-");

    const restResponse = await fetch(`${config.API_URL}/api/restaurants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token,
      },
      body: JSON.stringify({
        name: formData.restaurantName,
        slug: slug,
        address: formData.location,
        phone: formData.phone,
        menuLayout: formData.menuLayout,
        logoUrl: formData.logoBase64,
        description: `A ${formData.cuisineType} restaurant.`,
        subscriptionTier: formData.subscriptionTier,
      }),
    });

    if (!restResponse.ok) {
      const restData = await restResponse.json().catch(() => ({}));
      throw new Error(restData.msg || "Failed to create restaurant profile.");
    }

    navigate(`/bulebeti/${slug}/admin`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    if (isUpgradeMode && targetRestaurantSlug) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${config.API_URL}/api/restaurants/${targetRestaurantSlug}/request-upgrade`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { "x-auth-token": token } : {}),
            },
            body: JSON.stringify({ tier: formData.subscriptionTier }),
          }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.msg || "Failed to submit upgrade request");
        }

        setUpgradeSuccess(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      // 1. Register the user (Admin role)
      const authResponse = await fetch(`${config.API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.ownerName,
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: googleToken ? undefined : formData.password,
          googleToken: googleToken || undefined,
          role: "admin",
        }),
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(authData.msg || "Registration failed");
      }

      if (authData.requiresVerification) {
        setPendingEmail(authData.email || formData.email.trim());
        setShowVerificationModal(true);
        setLoading(false);
        return;
      }

      // If already verified (e.g. Google Login)
      await finalizeRegistration(authData.token, authData.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setVerificationError("Please enter the complete 6-digit confirmation code.");
      return;
    }

    setVerificationLoading(true);
    setVerificationError("");
    setResendStatus("");

    try {
      const verifyResponse = await fetch(`${config.API_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pendingEmail || formData.email.trim(),
          code: verificationCode.trim(),
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.msg || "Verification failed. Please try again.");
      }

      // Complete registration and navigate
      await finalizeRegistration(verifyData.token, verifyData.user);
    } catch (err) {
      setVerificationError(err.message);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendStatus("Sending new code to your email...");
    setVerificationError("");
    try {
      const resendResp = await fetch(`${config.API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail || formData.email.trim() }),
      });
      const data = await resendResp.json();
      if (!resendResp.ok) throw new Error(data.msg || "Failed to resend code");
      setResendStatus(data.msg || "A new 6-digit code has been sent!");
    } catch (err) {
      setVerificationError(err.message);
      setResendStatus("");
    }
  };

  if (upgradeSuccess) {
    return (
      <div className="container py-5" style={{ maxWidth: "650px" }}>
        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 text-center bg-white my-5">
          <div className="display-1 text-warning mb-3">✦</div>
          <h2 className="fw-bold mb-2">Upgrade Request Sent to Super Admin!</h2>
          <p
            className="text-muted mb-4"
            style={{ fontSize: "15px", lineHeight: "1.6" }}
          >
            Your request to upgrade{" "}
            <strong>{formData.restaurantName || targetRestaurantSlug}</strong> to the{" "}
            <strong style={{ color: "var(--gold)" }}>
              {formData.subscriptionTier} Plan
            </strong>{" "}
            has been submitted to the Super Admin team for review and approval.
          </p>
          <button
            onClick={() =>
              navigate(`/bulebeti/${targetRestaurantSlug || "adme"}/admin`)
            }
            className="btn btn-primary btn-lg fw-bold px-4 rounded-3 mx-auto"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* ─── HUB TIER SELECTION SECTION ─── */}
      <section
        id="pricing"
        style={{
          padding: "20px 0 40px 0",
          backgroundColor: "var(--surface)",
        }}
      >
        <div className="container" style={{ maxWidth: "1200px" }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div className="mb-3">
              <BuleBetLogo size={75} variant="full" linkTo="/" />
            </div>
            <h2
              style={{
                fontSize: "clamp(26px, 4vw, 36px)",
                fontWeight: "800",
                color: "var(--primary)",
                marginBottom: "12px",
              }}
            >
              {t("landing_pricing_title") || "Select Your BuleBet Hub Tier"}
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "var(--on-surface-variant)",
                maxWidth: "640px",
                margin: "0 auto",
              }}
            >
              Choose the perfect plan for your venue. Select a tier below to pre-select your plan and begin registration.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
              margin: "0 auto",
              alignItems: "stretch",
            }}
          >
            {/* Basic Plan */}
            <div
              onClick={() => handleSelectTier("Silver")}
              style={{
                padding: "28px 20px",
                borderRadius: "16px",
                backgroundColor: "white",
                border:
                  formData.subscriptionTier === "Silver" ||
                  formData.subscriptionTier === "Basic"
                    ? "3px solid var(--gold)"
                    : "1px solid var(--platinum)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                boxShadow:
                  formData.subscriptionTier === "Silver" ||
                  formData.subscriptionTier === "Basic"
                    ? "0 8px 25px rgba(212, 175, 55, 0.25)"
                    : "0 2px 8px rgba(0,0,0,0.04)",
                transform:
                  formData.subscriptionTier === "Silver" ||
                  formData.subscriptionTier === "Basic"
                    ? "translateY(-4px)"
                    : "none",
              }}
            >
              <h3
                style={{
                  color: "var(--primary)",
                  marginBottom: "4px",
                  fontSize: "22px",
                }}
              >
                {t("landing_tier_silver") || "Basic"}
              </h3>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "800",
                  marginTop: "8px",
                }}
              >
                {t("landing_free") || "Free"}
                <span
                  style={{ fontSize: "14px", opacity: 0.5, fontWeight: "400" }}
                >
                  {t("landing_year") || "/year"}
                </span>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  textDecoration: "line-through",
                  opacity: 0.55,
                  marginBottom: "20px",
                  minHeight: "18px",
                }}
              >
                {t("landing_basic_reg") || "Regular $99/year (Save $99)"}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  marginBottom: "24px",
                  textAlign: "left",
                  flex: 1,
                  fontSize: "13px",
                  lineHeight: "1.6",
                }}
              >
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_silver_f1") || "✓ 1 Admin"}
                </li>
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_silver_f2") || "✓ Up to 20 Menu Items"}
                </li>
                <li style={{ marginBottom: "8px", color: "rgba(0,0,0,0.3)" }}>
                  {t("landing_silver_f3") || "✗ Add New Menu Categories"}
                </li>
                <li style={{ marginBottom: "8px", color: "rgba(0,0,0,0.3)" }}>
                  {t("landing_silver_f4") || "✗ SMS Notifications"}
                </li>
              </ul>
              <button
                type="button"
                className={
                  formData.subscriptionTier === "Silver" ||
                  formData.subscriptionTier === "Basic"
                    ? "btn btn-primary"
                    : "btn btn-outline"
                }
                style={{ width: "100%", marginTop: "auto" }}
              >
                {formData.subscriptionTier === "Silver" ||
                formData.subscriptionTier === "Basic"
                  ? "Selected ✨"
                  : t("landing_select_silver") || "Select Basic"}
              </button>
            </div>

            {/* Gold Plan */}
            <div
              onClick={() => handleSelectTier("Gold")}
              style={{
                padding: "28px 20px",
                borderRadius: "16px",
                backgroundColor: "white",
                border:
                  formData.subscriptionTier === "Gold"
                    ? "3px solid var(--gold)"
                    : "1px solid var(--platinum)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                boxShadow:
                  formData.subscriptionTier === "Gold"
                    ? "0 8px 25px rgba(212, 175, 55, 0.25)"
                    : "0 2px 8px rgba(0,0,0,0.04)",
                transform:
                  formData.subscriptionTier === "Gold"
                    ? "translateY(-4px)"
                    : "none",
              }}
            >
              <h3
                style={{
                  color: "var(--gold)",
                  marginBottom: "4px",
                  fontSize: "22px",
                }}
              >
                {t("landing_tier_gold") || "Gold"}
              </h3>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "800",
                  marginTop: "8px",
                }}
              >
                {t("landing_gold_price") || "$149"}
                <span
                  style={{ fontSize: "14px", opacity: 0.5, fontWeight: "400" }}
                >
                  {t("landing_year") || "/year"}
                </span>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  textDecoration: "line-through",
                  opacity: 0.55,
                  marginBottom: "20px",
                  minHeight: "18px",
                }}
              >
                {t("landing_gold_reg") || "Regular $250/year (Save $101)"}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  marginBottom: "24px",
                  textAlign: "left",
                  flex: 1,
                  fontSize: "13px",
                  lineHeight: "1.6",
                }}
              >
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_gold_f1") || "✓ Up to 3 Admins"}
                </li>
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_gold_f2") ||
                    "✓ Unlimited add new Food & Beverage Menus"}
                </li>
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_gold_f3") || "✓ Reservation SMS Alerts"}
                </li>
              </ul>
              <button
                type="button"
                className={
                  formData.subscriptionTier === "Gold"
                    ? "btn btn-primary"
                    : "btn btn-outline"
                }
                style={{ width: "100%", marginTop: "auto" }}
              >
                {formData.subscriptionTier === "Gold"
                  ? "Selected ✨"
                  : t("landing_select_gold") || "Select Gold"}
              </button>
            </div>

            {/* Platinum Plan */}
            <div
              onClick={() => handleSelectTier("Platinum")}
              style={{
                padding: "28px 20px",
                borderRadius: "16px",
                backgroundColor: "white",
                border:
                  formData.subscriptionTier === "Platinum"
                    ? "3px solid var(--gold)"
                    : "2px solid var(--gold)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                height: "100%",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                boxShadow:
                  formData.subscriptionTier === "Platinum"
                    ? "0 12px 30px rgba(212, 175, 55, 0.35)"
                    : "0 10px 25px -5px rgba(0,0,0,0.1)",
                transform:
                  formData.subscriptionTier === "Platinum"
                    ? "translateY(-4px)"
                    : "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "var(--gold)",
                  color: "white",
                  padding: "2px 12px",
                  borderRadius: "12px",
                  fontSize: "10px",
                  fontWeight: "700",
                }}
              >
                {t("landing_popular") || "MOST POPULAR"}
              </div>
              <h3
                style={{
                  color: "var(--primary)",
                  marginBottom: "4px",
                  fontSize: "22px",
                }}
              >
                {t("landing_tier_plat") || "Platinum"}
              </h3>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "800",
                  marginTop: "8px",
                }}
              >
                {t("landing_plat_price") || "$399"}
                <span
                  style={{ fontSize: "14px", opacity: 0.5, fontWeight: "400" }}
                >
                  {t("landing_year") || "/year"}
                </span>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  textDecoration: "line-through",
                  opacity: 0.55,
                  marginBottom: "20px",
                  minHeight: "18px",
                }}
              >
                {t("landing_plat_reg") || "Regular $500/year (Save $101)"}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  marginBottom: "24px",
                  textAlign: "left",
                  flex: 1,
                  fontSize: "13px",
                  lineHeight: "1.6",
                }}
              >
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_plat_f1") || "✓ Up to 7 Admins"}
                </li>
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_plat_f2") || "✓ Reservation & Catering SMS"}
                </li>
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_plat_f3") || "✓ Photo Gallery User Page"}
                </li>
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_plat_f4") || "✓ Reply to Comments"}
                </li>
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_plat_f5") || "✓ BuleBet Signature Page"}
                </li>
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_plat_f6") || "✓ Up to 3 Locations"}
                </li>
              </ul>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "auto" }}
              >
                {formData.subscriptionTier === "Platinum"
                  ? "Selected ✨"
                  : t("landing_select_plat") || "Select Platinum"}
              </button>
            </div>

            {/* Premium Plan */}
            <div
              onClick={() => handleSelectTier("Premium")}
              style={{
                padding: "28px 20px",
                borderRadius: "16px",
                backgroundColor: "var(--primary)",
                color: "var(--on-primary)",
                border:
                  formData.subscriptionTier === "Premium"
                    ? "3px solid var(--gold)"
                    : "1px solid var(--primary)",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                boxShadow:
                  formData.subscriptionTier === "Premium"
                    ? "0 12px 30px rgba(212, 175, 55, 0.4)"
                    : "0 4px 15px rgba(0,0,0,0.15)",
                transform:
                  formData.subscriptionTier === "Premium"
                    ? "translateY(-4px)"
                    : "none",
              }}
            >
              <h3
                style={{
                  color: "var(--gold)",
                  marginBottom: "4px",
                  fontSize: "22px",
                }}
              >
                {t("landing_tier_prem") || "Premium"}
              </h3>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "800",
                  marginTop: "8px",
                }}
              >
                {t("landing_prem_price") || "$699"}
                <span
                  style={{ fontSize: "14px", opacity: 0.5, fontWeight: "400" }}
                >
                  {t("landing_year") || "/year"}
                </span>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  textDecoration: "line-through",
                  opacity: 0.7,
                  marginBottom: "20px",
                  minHeight: "18px",
                }}
              >
                {t("landing_prem_reg") || "Regular $1,000/year (Save $301)"}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  marginBottom: "24px",
                  textAlign: "left",
                  flex: 1,
                  fontSize: "13px",
                  lineHeight: "1.6",
                }}
              >
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_prem_f1") || "✓ Everything in Platinum"}
                </li>
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_prem_f2") || "✓ Edit/Delete Comments"}
                </li>
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_prem_f3") || "✓ Unlimited Locations"}
                </li>
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_prem_f4") || "✓ Layout Customization"}
                </li>
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_prem_f5") || "✓ Testimonials Module"}
                </li>
                <li style={{ marginBottom: "8px" }}>
                  {t("landing_prem_f6") || "✓ 24/7 Priority Concierge"}
                </li>
              </ul>
              <button
                type="button"
                className="btn btn-gold"
                style={{ width: "100%", marginTop: "auto" }}
              >
                {formData.subscriptionTier === "Premium"
                  ? "Selected ✨"
                  : t("landing_select_prem") || "Select Premium"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── REGISTRATION FORM CONTAINER ─── */}
      <div id="registration-form" className="container" style={{ maxWidth: "800px", paddingBottom: "40px" }}>
        <div
          className="card shadow-sm border-0"
          style={{
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--surface)",
          }}
        >
          <div className="card-body p-4 p-md-5">
            <h2 className="text-center mb-3">
              {t("reg_title") || "Register Your Restaurant"}
            </h2>
            <p className="text-center text-muted mb-4">
              {t("reg_subtitle") || "Enter details to get started"}
            </p>

            {prefilledAlert && (
              <div
                className="alert border-0 shadow-sm rounded-4 p-3 mb-4"
                style={{
                  backgroundColor: "rgba(212, 175, 55, 0.12)",
                  color: "#92400e",
                  borderLeft: "4px solid var(--gold)",
                }}
              >
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  {prefilledAlert}
                </div>
                {unfilledFields.length > 0 ? (
                  <div style={{ fontSize: "13px", color: "#b45309" }}>
                    ⚠️ <strong>Action Required:</strong> Please complete the remaining missing field(s):{" "}
                    <span style={{ fontWeight: "700" }}>
                      {unfilledFields.join(", ")}
                    </span>.
                  </div>
                ) : (
                  <div style={{ fontSize: "13px", color: "#15803d" }}>
                    ✅ All required fields are pre-filled! Click submit to confirm your new plan.
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="alert alert-danger text-center" role="alert">
                {error}
              </div>
            )}

            {!isUpgradeMode && (
              <>
                <div className="mb-4 text-center">
                  <div
                    id="googleSignupButton"
                    className="mx-auto"
                    style={{ maxWidth: "400px", minHeight: "44px" }}
                  ></div>
                  {googleToken && (
                    <div
                      className="alert alert-success mt-2 d-inline-block p-2"
                      role="alert"
                      style={{ fontSize: "13px" }}
                    >
                      Linked Google Account: <strong>{googleUserEmail}</strong>.
                      Name and email prefilled. Password is now optional!
                    </div>
                  )}
                </div>

                <div className="text-center my-3 text-muted position-relative">
                  <hr style={{ borderColor: "var(--platinum)" }} />
                  <span
                    className="position-absolute top-50 start-50 translate-middle px-3"
                    style={{ backgroundColor: "var(--surface)", fontSize: "13px" }}
                  >
                    {t("login_or") || "OR"} COMPLETE WITH PROFILE DETAILS
                  </span>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    {t("reg_rest_name") || "Restaurant Name"}
                  </label>
                  <input
                    type="text"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    required
                    placeholder={t("reg_rest_name_ph") || "e.g. Gourmet Hub"}
                    className="form-control p-3"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    {t("reg_owner_name") || "Owner Name"}
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required
                    placeholder={t("reg_owner_name_ph") || "e.g. John Doe"}
                    className="form-control p-3"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-bold">Restaurant Logo</label>
                  <div
                    className="p-3 text-center bg-white"
                    style={{
                      border: "1px dashed var(--platinum)",
                      borderRadius: "var(--radius-md)",
                      position: "relative",
                    }}
                  >
                    {formData.logoBase64 ? (
                      <div>
                        <img
                          src={formData.logoBase64}
                          alt="Logo Preview"
                          className="img-fluid mb-2"
                          style={{ maxHeight: "80px", borderRadius: "4px" }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, logoBase64: null })
                          }
                          className="btn btn-sm btn-outline-danger d-block mx-auto"
                        >
                          Remove Logo
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="fs-3 mb-1">📸</div>
                        <div className="small text-muted">
                          Click to upload logo
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData({
                                  ...formData,
                                  logoBase64: reader.result,
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            opacity: 0,
                            cursor: "pointer",
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>



                {!isUpgradeMode && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        {t("reg_email") || "Email Address"}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder={t("reg_email_ph") || "owner@example.com"}
                        className="form-control p-3"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Phone Number</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="Enter phone number"
                        className="form-control p-3"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required={!googleToken}
                        disabled={!!googleToken}
                        placeholder={
                          googleToken
                            ? "Password not required (Signed in via Google)"
                            : "Choose a strong password"
                        }
                        className="form-control p-3"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required={!googleToken}
                        disabled={!!googleToken}
                        placeholder={
                          googleToken
                            ? "Password not required (Signed in via Google)"
                            : "Re-enter your password"
                        }
                        className="form-control p-3"
                      />
                    </div>
                  </>
                )}

                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    {t("reg_cuisine") || "Cuisine Type"}
                  </label>
                  <select
                    name="cuisineType"
                    value={formData.cuisineType}
                    onChange={handleChange}
                    className="form-select p-3"
                  >
                    <option value="fine-dining">
                      {t("reg_cuisine_fine") || "Fine Dining"}
                    </option>
                    <option value="casual">
                      {t("reg_cuisine_casual") || "Casual Dining"}
                    </option>
                    <option value="bistro">
                      {t("reg_cuisine_bistro") || "Bistro"}
                    </option>
                    <option value="luxury">
                      {t("reg_cuisine_luxury") || "Luxury"}
                    </option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Menu Layout Style
                  </label>
                  <select
                    name="menuLayout"
                    value={formData.menuLayout || "image-left"}
                    onChange={handleChange}
                    className="form-select p-3"
                  >
                    <option value="image-left">
                      Image Left (Classic List)
                    </option>
                    <option value="image-right">
                      Image Right (Modern List)
                    </option>
                    <option value="image-top">Image Top (Card Grid)</option>
                    <option value="image-bottom">
                      Image Bottom (Magazine Style)
                    </option>
                    <option value="text-centered">
                      Text Centered (No Images)
                    </option>
                  </select>
                </div>

                <div className="col-12">
                  <div className="p-3 bg-light rounded border border-dashed">
                    <div className="small fw-bold text-muted mb-2 text-center text-uppercase">
                      Live Preview
                    </div>
                    <div
                      className="bg-white p-3 rounded shadow-sm d-flex"
                      style={{
                        flexDirection:
                          formData.menuLayout === "image-top"
                            ? "column"
                            : formData.menuLayout === "image-bottom"
                              ? "column-reverse"
                              : formData.menuLayout === "image-right"
                                ? "row-reverse"
                                : "row",
                        gap: "16px",
                        alignItems:
                          formData.menuLayout &&
                          formData.menuLayout.includes("image") &&
                          !formData.menuLayout.includes("top") &&
                          !formData.menuLayout.includes("bottom")
                            ? "center"
                            : "stretch",
                        textAlign:
                          formData.menuLayout === "text-centered"
                            ? "center"
                            : "left",
                        display:
                          formData.menuLayout === "text-centered"
                            ? "block"
                            : "flex",
                      }}
                    >
                      {formData.menuLayout !== "text-centered" && (
                        <div
                          className="bg-secondary bg-opacity-25 rounded d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width:
                              formData.menuLayout &&
                              (formData.menuLayout.includes("top") ||
                                formData.menuLayout.includes("bottom"))
                                ? "100%"
                                : "80px",
                            height:
                              formData.menuLayout &&
                              (formData.menuLayout.includes("top") ||
                                formData.menuLayout.includes("bottom"))
                                ? "120px"
                                : "80px",
                          }}
                        >
                          <span className="fs-4">🖼️</span>
                        </div>
                      )}
                      <div className="flex-grow-1">
                        <div
                          className="fw-bold mb-1"
                          style={{ fontSize: "14px", color: "var(--primary)" }}
                        >
                          Sample Menu Item
                        </div>
                        <div className="small text-muted mb-2">
                          A delicious sample description of the food.
                        </div>
                        <div
                          className="fw-bold"
                          style={{ color: "var(--gold)", fontSize: "14px" }}
                        >
                          $24.00
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label fw-bold">
                    {t("reg_location") || "Location"}
                  </label>
                  <div className="position-relative">
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      placeholder={t("reg_location_ph") || "e.g. 123 Main St"}
                      className="form-control p-3 pe-5"
                    />
                    <div
                      className="position-absolute text-primary"
                      style={{
                        right: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                      }}
                      title={t("reg_google_verify")}
                    >
                      <i className="fa-solid fa-location-dot"></i>
                    </div>
                  </div>
                  <div
                    className="d-flex align-items-center gap-2 mt-2 p-2 rounded"
                    style={{
                      backgroundColor: "#e8f0fe",
                      border: "1px solid #c2d7fa",
                    }}
                  >
                    <div className="text-primary">
                      <i className="fa-solid fa-map-location-dot"></i>
                    </div>
                    <div
                      className="small fw-medium"
                      style={{ color: "#1967d2" }}
                    >
                      {t("reg_google_connected") ||
                        "Google Maps verified location"}
                    </div>
                  </div>
                </div>

                <div className="col-12 mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-100 p-3 fw-bold"
                    style={{ opacity: loading ? 0.7 : 1 }}
                  >
                    {loading
                      ? isUpgradeMode
                        ? "Submitting Upgrade Request..."
                        : "Creating Account..."
                      : isUpgradeMode
                      ? `Submit Upgrade Request to Super Admin ✦`
                      : t("reg_submit") || "Create Account"}
                  </button>
                </div>
              </div>
            </form>

            {!isUpgradeMode && (
              <p className="text-center mt-4 small text-muted">
                {t("reg_already") || "Already have an account?"}{" "}
                <Link
                  to="/bulebeti/login"
                  style={{
                    color: "var(--gold)",
                    fontWeight: "600",
                    textDecoration: "none",
                  }}
                >
                  {t("reg_login") || "Login"}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── EMAIL VERIFICATION CONFIRMATION MODAL ─── */}
      {showVerificationModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(5px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            className="card shadow-lg border-0 text-start w-100"
            style={{
              maxWidth: "460px",
              borderRadius: "16px",
              overflow: "hidden",
              backgroundColor: "var(--surface, #ffffff)",
            }}
          >
            <div
              className="card-header border-0 text-white p-4 text-center"
              style={{
                background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
              }}
            >
              <div
                className="mx-auto mb-2 d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: "56px",
                  height: "56px",
                  backgroundColor: "rgba(212, 175, 55, 0.2)",
                  color: "#D4AF37",
                  fontSize: "24px",
                }}
              >
                ✉️
              </div>
              <h4 className="fw-bold mb-1" style={{ color: "#D4AF37" }}>
                Verify Registration Email
              </h4>
              <p className="small text-light opacity-75 mb-0">
                A 6-digit confirmation code was sent to:
              </p>
              <div className="fw-bold text-white small mt-1">{pendingEmail}</div>
            </div>

            <div className="card-body p-4">
              {verificationError && (
                <div className="alert alert-danger p-3 small mb-3 rounded-3">
                  <i className="fa-solid fa-triangle-exclamation me-2"></i>
                  {verificationError}
                </div>
              )}

              {resendStatus && (
                <div className="alert alert-success p-3 small mb-3 rounded-3">
                  <i className="fa-solid fa-circle-check me-2"></i>
                  {resendStatus}
                </div>
              )}

              <form onSubmit={handleVerifyCode}>
                <div className="mb-4">
                  <label className="form-label fw-bold small text-muted">
                    ENTER 6-DIGIT CONFIRMATION CODE
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="e.g. 123456"
                    className="form-control form-control-lg text-center fw-bold fs-3 p-3"
                    style={{
                      letterSpacing: "8px",
                      borderColor: "var(--gold, #D4AF37)",
                      borderRadius: "10px",
                    }}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    verificationLoading || verificationCode.length !== 6
                  }
                  className="btn btn-primary w-100 p-3 fw-bold mb-3"
                  style={{
                    borderRadius: "10px",
                    opacity:
                      verificationLoading || verificationCode.length !== 6
                        ? 0.6
                        : 1,
                  }}
                >
                  {verificationLoading ? (
                    <span>
                      <i className="fa-solid fa-spinner fa-spin me-2"></i>
                      Verifying Code...
                    </span>
                  ) : (
                    "Confirm & Activate Account"
                  )}
                </button>
              </form>

              <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-3">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="btn btn-link text-decoration-none p-0 small fw-bold"
                  style={{ color: "var(--gold, #D4AF37)" }}
                >
                  Didn't get the code? Resend
                </button>
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(false)}
                  className="btn btn-link text-muted text-decoration-none p-0 small"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationPage;

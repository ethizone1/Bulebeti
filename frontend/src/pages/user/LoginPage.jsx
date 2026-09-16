import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSignIn, useSignUp, useAuth } from "@clerk/clerk-react";
import BuleBetLogo from "../../components/BuleBetLogo";

const LoginPage = () => {
  const navigate = useNavigate();
  const {
    isLoaded: isSignInLoaded,
    signIn,
    setActive: setSignInActive,
  } = useSignIn();
  const {
    isLoaded: isSignUpLoaded,
    signUp,
    setActive: setSignUpActive,
  } = useSignUp();
  const { getToken } = useAuth();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [authFlowMode, setAuthFlowMode] = useState("signin"); // 'signin' or 'signup'

  // Step 1: Request 6-Digit Email OTP from Clerk (Auto-detect SignIn vs SignUp)
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!isSignInLoaded || !isSignUpLoaded || !email.trim()) return;

    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    // Try Sign-In first
    try {
      const result = await signIn.create({
        identifier: cleanEmail,
      });

      const emailCodeFactor = result.supportedFirstFactors?.find(
        (factor) => factor.strategy === "email_code",
      );

      if (emailCodeFactor) {
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: emailCodeFactor.emailAddressId,
        });
        setAuthFlowMode("signin");
        setVerifying(true);
        setSuccessMsg(
          `Access code sent to ${cleanEmail}. Check your inbox (and spam folder).`,
        );
        return;
      }
    } catch (signInErr) {
      console.log("[CLERK SIGNIN TRY FAILED]", signInErr.message || signInErr);
      const isNotFound =
        signInErr.errors?.[0]?.code === "form_identifier_not_found" ||
        signInErr.message?.includes("Couldn't find your account");

      if (isNotFound) {
        // Fallback: Account doesn't exist in Clerk yet — trigger SignUp!
        try {
          await signUp.create({
            emailAddress: cleanEmail,
          });
          await signUp.prepareEmailAddressVerification({
            strategy: "email_code",
          });
          setAuthFlowMode("signup");
          setVerifying(true);
          setSuccessMsg(
            `Welcome! Access code sent to ${cleanEmail}. Check your inbox (and spam folder).`,
          );
          return;
        } catch (signUpErr) {
          console.error("[CLERK SIGNUP ERROR]", signUpErr);
          setError(
            signUpErr.errors?.[0]?.longMessage ||
              signUpErr.errors?.[0]?.message ||
              signUpErr.message ||
              "Failed to send verification code.",
          );
          return;
        }
      } else {
        setError(
          signInErr.errors?.[0]?.longMessage ||
            signInErr.errors?.[0]?.message ||
            signInErr.message ||
            "Failed to send verification code.",
        );
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectByRole = async () => {
    try {
      let jwtToken = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          jwtToken = await getToken();
          if (jwtToken) break;
        } catch (tErr) {
          console.warn("[TOKEN FETCH RETRY]", tErr);
        }
        await new Promise((r) => setTimeout(r, 250));
      }

      const API_URL = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${jwtToken || ""}`,
          "x-auth-token": jwtToken || "",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const user = data.user;
        if (user.role === "super-admin" || user.role === "sub-admin") {
          navigate("/super-admin");
          return;
        }
        if (user.role === "admin" || user.restaurantId || user.restaurantSlug) {
          navigate(
            user.restaurantSlug
              ? `/maedbet/${user.restaurantSlug}/admin`
              : "/maedbet/default/admin",
          );
          return;
        }
        navigate("/profile");
        return;
      }
    } catch (err) {
      console.error("[ROLE REDIRECT ERROR]", err);
    }
    navigate("/profile");
  };

  // Step 2: Verify 6-Digit Code with Clerk Provider
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    try {
      if (authFlowMode === "signin") {
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: code.trim(),
        });

        const sessionId = result.createdSessionId || signIn.createdSessionId;
        if (sessionId) {
          await setSignInActive({ session: sessionId });
          setTimeout(() => handleRedirectByRole(), 300);
        } else if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
          setTimeout(() => handleRedirectByRole(), 300);
        } else {
          setError(
            "Verification incomplete. Please check your verification code.",
          );
        }
      } else {
        // SignUp Mode Verification
        const result = await signUp.attemptEmailAddressVerification({
          code: code.trim(),
        });

        console.log("[CLERK SIGNUP VERIFY RESULT]", result);

        const sessionId = result.createdSessionId || signUp.createdSessionId;
        if (sessionId) {
          await setSignUpActive({ session: sessionId });
          setTimeout(() => handleRedirectByRole(), 300);
        } else if (
          result.status === "complete" ||
          result.verifications?.emailAddress?.status === "verified"
        ) {
          if (signUp.createdSessionId) {
            await setSignUpActive({ session: signUp.createdSessionId });
          }
          setTimeout(() => handleRedirectByRole(), 300);
        } else {
          setError(
            `Verification status: ${result.status || "incomplete"}. Please check your verification code.`,
          );
        }
      }
    } catch (err) {
      console.error("[CLERK VERIFY OTP ERROR]", err);
      setError(
        err.errors?.[0]?.longMessage ||
          err.errors?.[0]?.message ||
          err.message ||
          "Invalid or expired verification code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "36px 32px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <BuleBetLogo style={{ height: "48px", margin: "0 auto 16px" }} />
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: "#0f172a",
              margin: 0,
            }}
          >
            Welcome to MaedBet
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
            {!verifying
              ? "Enter your email to receive a 6-digit access code"
              : "Enter the 6-digit access code sent to your email"}
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: "#dc2626",
              fontSize: "14px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              color: "#166534",
              fontSize: "14px",
              marginBottom: "20px",
            }}
          >
            {successMsg}
          </div>
        )}

        {!verifying ? (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#334155",
                  marginBottom: "8px",
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "15px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#d4af37",
                color: "#0f172a",
                fontWeight: "700",
                fontSize: "16px",
                borderRadius: "8px",
                border: "none",
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Sending Access Code..." : "Send Access Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#334155",
                  marginBottom: "8px",
                }}
              >
                6-Digit Access Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "20px",
                  fontWeight: "700",
                  letterSpacing: "6px",
                  textAlign: "center",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#d4af37",
                color: "#0f172a",
                fontWeight: "700",
                fontSize: "16px",
                borderRadius: "8px",
                border: "none",
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginBottom: "12px",
              }}
            >
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>

            <button
              type="button"
              onClick={() => {
                setVerifying(false);
                setCode("");
                setError("");
              }}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color: "#64748b",
                fontSize: "14px",
                cursor: "pointer",
                padding: "8px",
              }}
            >
              ← Change Email
            </button>
          </form>
        )}

        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "20px",
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          Want to add your restaurant?{" "}
          <Link
            to="/register"
            style={{
              color: "#d4af37",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            Register Your Restaurant →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

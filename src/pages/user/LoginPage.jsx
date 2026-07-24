import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

const LoginPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState("identify"); // 'identify' or 'verify'
  const [identity, setIdentity] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const handleIdentify = (e) => {
    e.preventDefault();
    const val = e.target.identity.value;
    setIdentity(val);

    // In a real app, this would trigger the SMS/Email send
    console.log("Sending code to:", val);
    setStep("verify");
  };

  const handleVerify = (e) => {
    e.preventDefault();
    // Simulate verification check
    // If it's the super admin email, we can handle it specifically or just use a dummy code
    if (identity === "mac@mac.mac") {
      navigate("/super-admin");
    } else {
      // Default to a known restaurant for demo purposes
      navigate("/bulebeti/the-golden-truffle/admin");
    }
  };

  return (
    <div
      style={{
        padding: "var(--spacing-xxl) 0",
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="container" style={{ maxWidth: "450px" }}>
        <div
          style={{
            backgroundColor: "var(--surface)",
            padding: "var(--spacing-xl)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-2)",
            border: "1px solid var(--platinum)",
            textAlign: "center",
          }}
        >
          {step === "identify" ? (
            <>
              <h1 style={{ marginBottom: "var(--spacing-md)" }}>
                {t("login_welcome")}
              </h1>
              <p
                style={{
                  color: "var(--on-surface-variant)",
                  marginBottom: "var(--spacing-xl)",
                }}
              >
                {t("login_enter_email")}
              </p>

              <form onSubmit={handleIdentify}>
                <div
                  style={{
                    marginBottom: "var(--spacing-xl)",
                    textAlign: "left",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "700",
                      marginBottom: "4px",
                    }}
                  >
                    {t("login_email_label")}
                  </label>
                  <input
                    type="text"
                    name="identity"
                    placeholder={t("login_email_placeholder")}
                    required
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--platinum)",
                      fontSize: "16px",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "14px",
                    fontSize: "16px",
                    marginBottom: "var(--spacing-lg)",
                  }}
                >
                  {t("login_send_code")}
                </button>

                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  {t("login_new")}{" "}
                  <Link
                    to="/register"
                    style={{
                      color: "var(--gold)",
                      fontWeight: "600",
                      textDecoration: "none",
                    }}
                  >
                    {t("login_partner")}
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <>
              <h1 style={{ marginBottom: "var(--spacing-md)" }}>
                {t("login_verify_title")}
              </h1>
              <p
                style={{
                  color: "var(--on-surface-variant)",
                  marginBottom: "var(--spacing-xl)",
                }}
              >
                {t("login_sent_code")} <br />
                <strong>{identity}</strong>
              </p>

              <form onSubmit={handleVerify}>
                <div
                  style={{
                    marginBottom: "var(--spacing-xl)",
                    textAlign: "left",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "700",
                      marginBottom: "4px",
                    }}
                  >
                    {t("login_code_label")}
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "center",
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <input
                        key={i}
                        type="text"
                        maxLength="1"
                        required
                        style={{
                          width: "45px",
                          height: "55px",
                          textAlign: "center",
                          fontSize: "20px",
                          fontWeight: "700",
                          borderRadius: "8px",
                          border: "2px solid var(--platinum)",
                          backgroundColor: "#f9fafb",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "14px",
                    fontSize: "16px",
                    marginBottom: "var(--spacing-lg)",
                  }}
                >
                  {t("login_signin")}
                </button>

                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  {t("login_didnt_receive")}{" "}
                  <button
                    type="button"
                    onClick={() => setStep("identify")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--gold)",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    {t("login_try_again")}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

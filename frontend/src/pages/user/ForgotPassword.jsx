import React from "react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
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
          <h1 style={{ marginBottom: "var(--spacing-md)" }}>Reset Password</h1>
          <p
            style={{
              color: "var(--on-surface-variant)",
              marginBottom: "var(--spacing-xl)",
            }}
          >
            Enter your email and we'll send you instructions to reset your
            password.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Reset link sent!");
            }}
          >
            <div
              style={{ marginBottom: "var(--spacing-xl)", textAlign: "left" }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "700",
                  marginBottom: "4px",
                }}
              >
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--platinum)",
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
              Send Reset Link
            </button>

            <div style={{ fontSize: "14px" }}>
              <Link
                to="/bulebeti/login"
                style={{
                  color: "var(--on-surface-variant)",
                  textDecoration: "none",
                }}
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

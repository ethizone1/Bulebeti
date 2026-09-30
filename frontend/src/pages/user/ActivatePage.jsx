import React from "react";
import { useSearchParams, Link } from "react-router-dom";

// Landing page for team invitations. Invited members sign in with the email
// they were invited with (6-digit email code); the backend links that sign-in
// to the invited account, so no temporary password is needed.
const ActivatePage = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const restaurant = searchParams.get("restaurant") || "";

  const loginUrl = email
    ? `/login?email=${encodeURIComponent(email)}`
    : "/login";

  return (
    <div className="container min-vh-100 d-flex flex-column justify-content-center align-items-center py-5">
      <div className="mb-4 text-center">
        <h1
          className="fw-bold"
          style={{ fontSize: "28px", letterSpacing: "0.05em" }}
        >
          MAEDBET
        </h1>
        <div className="text-muted small fw-bold">TEAM INVITATION</div>
      </div>

      <div
        className="card border-0 shadow-sm rounded-4"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        <div className="card-body p-4 p-md-5 text-center">
          <h2 className="fs-5 fw-bold mb-3">You&apos;ve been invited!</h2>
          <p className="text-muted small mb-4">
            {restaurant ? (
              <>
                You were added to the team for <strong>{restaurant}</strong>.{" "}
              </>
            ) : null}
            Sign in with{" "}
            {email ? <strong>{email}</strong> : "the email you were invited with"}.
            We&apos;ll send a 6-digit code to that address; no password is needed.
          </p>

          <Link to={loginUrl} className="btn btn-primary w-100 fw-bold py-2">
            Continue to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ActivatePage;

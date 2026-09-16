import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";

const UserProfile = () => {
  const navigate = useNavigate();
  const { mongoUser, clerkUser, logout } = useAuthContext();

  const userName = mongoUser?.name || clerkUser?.fullName || clerkUser?.username || "MaedBet Member";
  const userEmail = mongoUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || "";
  const userInitials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "MB";
  const memberSince = mongoUser?.createdAt ? new Date(mongoUser.createdAt).getFullYear() : "2026";
  const roleDisplay = mongoUser?.role ? mongoUser.role.toUpperCase() : "MEMBER";

  return (
    <div style={{ padding: "var(--spacing-xxl) 0", minHeight: "80vh" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "var(--spacing-xxl)" }}>
          {/* Profile Sidebar */}
          <aside>
            <div
              style={{
                backgroundColor: "var(--surface)",
                padding: "var(--spacing-xl)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--platinum)",
                textAlign: "center",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
              }}
            >
              <div
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  backgroundColor: "#f3f4f6",
                  border: "2px solid var(--gold)",
                  margin: "0 auto var(--spacing-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "30px",
                  fontWeight: "800",
                  color: "var(--primary)",
                }}
              >
                {userInitials}
              </div>
              <h2 style={{ marginBottom: "4px", fontSize: "20px", fontWeight: "700" }}>{userName}</h2>
              <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 8px" }}>{userEmail}</p>
              <div
                style={{
                  display: "inline-block",
                  color: "var(--gold)",
                  backgroundColor: "rgba(212, 175, 55, 0.1)",
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontWeight: "700",
                  fontSize: "12px",
                  marginBottom: "16px",
                  border: "1px solid rgba(212, 175, 55, 0.2)",
                }}
              >
                ✦ {roleDisplay}
              </div>
              <div style={{ fontSize: "13px", color: "var(--on-surface-variant)", marginBottom: "20px" }}>
                Member since {memberSince}
              </div>

              {mongoUser?.role === "super-admin" && (
                <button
                  onClick={() => navigate("/super-admin")}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", marginBottom: "10px", fontSize: "13px" }}
                >
                  👑 Open Super Admin Console
                </button>
              )}

              {(mongoUser?.role === "admin" || mongoUser?.restaurantId) && (
                <button
                  onClick={() =>
                    navigate(mongoUser.restaurantSlug ? `/maedbet/${mongoUser.restaurantSlug}/admin` : "/maedbet/default/admin")
                  }
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", marginBottom: "10px", fontSize: "13px" }}
                >
                  ✦ Open Restaurant Dashboard
                </button>
              )}

              <button
                onClick={logout}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid var(--platinum)",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#ef4444",
                  fontWeight: "600",
                }}
              >
                Sign Out
              </button>
            </div>
          </aside>

          {/* Account Overview & Activity */}
          <main>
            <section
              style={{
                backgroundColor: "white",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid var(--platinum)",
                marginBottom: "24px",
              }}
            >
              <h3 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: "700" }}>Account Identity & Status</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "14px" }}>
                <div>
                  <span style={{ color: "#6b7280" }}>Account Status:</span>
                  <div style={{ fontWeight: "600", color: "#166534" }}>🟢 Active & Verified</div>
                </div>
                <div>
                  <span style={{ color: "#6b7280" }}>Authentication Provider:</span>
                  <div style={{ fontWeight: "600", color: "#0f172a" }}>🔒 Clerk Managed Auth (Email OTP)</div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

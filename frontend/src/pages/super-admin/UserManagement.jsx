import React, { useState, useEffect } from "react";
import config from "../../config";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${config.API_URL}/api/auth/users`, {
        headers: {
          "x-auth-token": token,
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.msg || "Failed to load user directory.");
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${config.API_URL}/api/auth/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed to update role.");

      setActionMessage({ type: "success", text: data.msg });
      fetchUsers();
      setTimeout(() => setActionMessage({ type: "", text: "" }), 4000);
    } catch (err) {
      setActionMessage({ type: "error", text: err.message });
      setTimeout(() => setActionMessage({ type: "", text: "" }), 4000);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${config.API_URL}/api/auth/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed to update status.");

      setActionMessage({ type: "success", text: data.msg });
      fetchUsers();
      setTimeout(() => setActionMessage({ type: "", text: "" }), 4000);
    } catch (err) {
      setActionMessage({ type: "error", text: err.message });
      setTimeout(() => setActionMessage({ type: "", text: "" }), 4000);
    }
  };

  const handleDeleteUser = async (userId, userName, userEmail) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName || userEmail}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${config.API_URL}/api/auth/users/${userId}`, {
        method: "DELETE",
        headers: {
          "x-auth-token": token,
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Failed to delete user.");

      setActionMessage({ type: "success", text: data.msg });
      fetchUsers();
      setTimeout(() => setActionMessage({ type: "", text: "" }), 4000);
    } catch (err) {
      setActionMessage({ type: "error", text: err.message });
      setTimeout(() => setActionMessage({ type: "", text: "" }), 4000);
    }
  };

  // Filtered Users
  const safeUsers = Array.isArray(users) ? users : [];
  const filteredUsers = safeUsers.filter((u) => {
    const matchesSearch =
      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || (u.status || "active") === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // KPI Statistics
  const totalUsers = safeUsers.length;
  const superAdminsCount = safeUsers.filter((u) => u.role === "super-admin").length;
  const restaurantAdminsCount = safeUsers.filter((u) => u.role === "admin").length;
  const activeUsersCount = safeUsers.filter((u) => (u.status || "active") === "active").length;

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "super-admin":
        return { backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #f59e0b" };
      case "admin":
        return { backgroundColor: "#e0e7ff", color: "#3730a3", border: "1px solid #6366f1" };
      case "staff":
        return { backgroundColor: "#e0f2fe", color: "#075985", border: "1px solid #0ea5e9" };
      default:
        return { backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" };
    }
  };

  return (
    <div style={{ padding: "0 10px 40px 10px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#111827", margin: 0 }}>
          User Directory & Management
        </h1>
        <p style={{ color: "#6b7280", marginTop: "6px", fontSize: "14px" }}>
          Platform-wide user management, role assignments, and account oversight.
        </p>
      </div>

      {/* Action Banner */}
      {actionMessage.text && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontWeight: "600",
            fontSize: "14px",
            backgroundColor: actionMessage.type === "success" ? "#def7ec" : "#fde8e8",
            color: actionMessage.type === "success" ? "#03543f" : "#9b1c1c",
            border: `1px solid ${actionMessage.type === "success" ? "#84e1bc" : "#f8b4b4"}`,
          }}
        >
          {actionMessage.type === "success" ? "✅ " : "⚠️ "} {actionMessage.text}
        </div>
      )}

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>
              Total Users
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#111827", marginTop: "4px" }}>
              {totalUsers}
            </div>
          </div>
          <div style={{ fontSize: "32px", backgroundColor: "#f3f4f6", borderRadius: "10px", padding: "10px" }}>
            👥
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>
              Super Admins
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#b45309", marginTop: "4px" }}>
              {superAdminsCount}
            </div>
          </div>
          <div style={{ fontSize: "32px", backgroundColor: "#fef3c7", borderRadius: "10px", padding: "10px" }}>
            👑
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>
              Restaurant Owners
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#4338ca", marginTop: "4px" }}>
              {restaurantAdminsCount}
            </div>
          </div>
          <div style={{ fontSize: "32px", backgroundColor: "#e0e7ff", borderRadius: "10px", padding: "10px" }}>
            🏢
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>
              Active Users
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#047857", marginTop: "4px" }}>
              {activeUsersCount}
            </div>
          </div>
          <div style={{ fontSize: "32px", backgroundColor: "#d1fae5", borderRadius: "10px", padding: "10px" }}>
            ✅
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: 1, minWidth: "240px" }}>
          <input
            type="text"
            placeholder="🔍 Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="super-admin">Super Admin</option>
            <option value="admin">Restaurant Admin / Owner</option>
            <option value="staff">Staff</option>
            <option value="customer">Customer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflowX: "auto",
        }}
      >
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
            ⏳ Loading registered users...
          </div>
        ) : error ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>
            ❌ Error: {error}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
            No users match your criteria.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", color: "#4b5563" }}>
                <th style={{ padding: "14px 20px" }}>USER</th>
                <th style={{ padding: "14px 20px" }}>ROLE</th>
                <th style={{ padding: "14px 20px" }}>STATUS</th>
                <th style={{ padding: "14px 20px" }}>JOINED</th>
                <th style={{ padding: "14px 20px", textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isCurrentActiveStatus = (user.status || "active") === "active";
                return (
                  <tr key={user._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontWeight: "700", color: "#111827" }}>
                        {user.name || "Anonymous User"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>{user.email}</div>
                    </td>

                    <td style={{ padding: "14px 20px" }}>
                      <select
                        value={user.role || "customer"}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        style={{
                          ...getRoleBadgeStyle(user.role),
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          outline: "none",
                        }}
                      >
                        <option value="super-admin">👑 Super Admin</option>
                        <option value="admin">🏢 Restaurant Admin</option>
                        <option value="staff">👔 Staff</option>
                        <option value="customer">👤 Customer</option>
                      </select>
                    </td>

                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "700",
                          backgroundColor: isCurrentActiveStatus ? "#def7ec" : "#fde8e8",
                          color: isCurrentActiveStatus ? "#03543f" : "#9b1c1c",
                        }}
                      >
                        {isCurrentActiveStatus ? "Active" : "Suspended"}
                      </span>
                    </td>

                    <td style={{ padding: "14px 20px", color: "#6b7280", fontSize: "13px" }}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </td>

                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                          onClick={() => handleStatusToggle(user._id, user.status || "active")}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            backgroundColor: "#fff",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: isCurrentActiveStatus ? "#dc2626" : "#16a34a",
                            cursor: "pointer",
                          }}
                        >
                          {isCurrentActiveStatus ? "Suspend" : "Activate"}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user._id, user.name, user.email)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: "#fde8e8",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#9b1c1c",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserManagement;

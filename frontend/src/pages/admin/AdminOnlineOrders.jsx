import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAdmin } from "../../layouts/AdminLayout";
import config from "../../config";

const AdminOnlineOrders = () => {
  const { t } = useLanguage();
  const { restaurantName } = useParams();
  const { tier, searchQuery } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const isPlatinumOrAbove = tier === "Platinum" || tier === "Premium";

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${config.API_URL}/api/reservations/restaurant/${restaurantName}`,
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        }
      );
      if (res.ok) {
        const data = await res.json();
        // Filter strictly online orders
        const orderData = data.filter((item) => {
          const req = item.specialRequests || "";
          return (
            req.toUpperCase().includes("ONLINE ORDER") ||
            req.includes("Takeout") ||
            req.includes("Delivery") ||
            req.includes("Total: $")
          );
        });

        const sortedData = orderData.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        });
        setOrders(sortedData);
      }
    } catch (err) {
      console.error("Error fetching online orders:", err);
    } finally {
      setLoading(false);
    }
  }, [restaurantName]);

  useEffect(() => {
    fetchOrders();
  }, [restaurantName, fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(
        `${config.API_URL}/api/reservations/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": localStorage.getItem("token"),
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        alert("Failed to update order status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating order status");
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "approved":
        return { bg: "#dcfce7", color: "#15803d", label: "Confirmed" };
      case "preparing":
        return { bg: "#fef3c7", color: "#b45309", label: "Preparing 🍳" };
      case "ready":
        return { bg: "#e0e7ff", color: "#4338ca", label: "Ready 📦" };
      case "completed":
        return { bg: "#d1fae5", color: "#047857", label: "Completed ✨" };
      case "cancelled":
      case "rejected":
        return { bg: "#fee2e2", color: "#b91c1c", label: "Cancelled" };
      default:
        return { bg: "#fef3c7", color: "#d97706", label: "Pending" };
    }
  };

  // Helper to extract clean information from order specialRequests string
  const parseOrderDetails = (order) => {
    const raw = order.specialRequests || "";
    let orderType = "Takeout";
    if (raw.includes("Dine-In")) orderType = "Dine-In";
    else if (raw.includes("Delivery")) orderType = "Delivery";
    else if (raw.includes("Takeout")) orderType = "Takeout";

    let itemsStr = raw;
    let totalStr = "$0.00";
    let notesStr = "";

    if (raw.includes("ONLINE ORDER")) {
      const parts = raw.split(":");
      if (parts.length > 1) {
        itemsStr = parts.slice(1).join(":").trim();
      }
      if (itemsStr.includes("Total: $")) {
        const totalSplit = itemsStr.split("Total: $");
        itemsStr = totalSplit[0].replace(/\.$/, "").trim();
        const afterTotal = totalSplit[1] || "";
        const spaceIdx = afterTotal.indexOf(". ");
        if (spaceIdx !== -1) {
          totalStr = "$" + afterTotal.substring(0, spaceIdx);
          notesStr = afterTotal.substring(spaceIdx + 2).trim();
        } else {
          totalStr = "$" + afterTotal;
        }
      }
    }

    return {
      orderType,
      itemsStr: itemsStr || "Selected Menu Items",
      totalStr: totalStr !== "$0.00" ? totalStr : `$${((order.guests || 1) * 15).toFixed(2)}`,
      notesStr,
    };
  };

  // Filter Logic
  const filteredOrders = orders.filter((o) => {
    const activeSearch = (searchTerm || searchQuery || "").toLowerCase();
    const parsed = parseOrderDetails(o);
    const matchesSearch =
      (o.guestName || "").toLowerCase().includes(activeSearch) ||
      (o.email || "").toLowerCase().includes(activeSearch) ||
      (o.phone || "").toLowerCase().includes(activeSearch) ||
      parsed.itemsStr.toLowerCase().includes(activeSearch);

    const matchesStatus =
      statusFilter === "All" ||
      o.status?.toLowerCase() === statusFilter.toLowerCase();

    const matchesType =
      typeFilter === "All" ||
      parsed.orderType.toLowerCase() === typeFilter.toLowerCase();

    const matchesDate = !dateFilter || o.date === dateFilter;

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const totalRevenue = orders.reduce((sum, o) => {
    const parsed = parseOrderDetails(o);
    const num = parseFloat(parsed.totalStr.replace("$", "")) || 0;
    return sum + num;
  }, 0);

  const pendingCount = orders.filter((o) => (o.status || "Pending").toLowerCase() === "pending").length;
  const completedCount = orders.filter((o) => (o.status || "").toLowerCase() === "completed").length;

  if (!isPlatinumOrAbove) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          backgroundColor: "#0d1117",
          border: "2px solid #D4AF37",
          borderRadius: "16px",
          color: "white",
          maxWidth: "540px",
          margin: "40px auto",
        }}
      >
        <div style={{ fontSize: "42px", color: "#D4AF37", marginBottom: "12px" }}>🛍️</div>
        <h2 style={{ color: "#D4AF37", fontWeight: "800", marginBottom: "8px" }}>Online Order Management</h2>
        <p style={{ color: "#e5e7eb", marginBottom: "20px", fontSize: "14px", lineHeight: "1.6" }}>
          Online Orders management requires the <strong>Platinum</strong> or <strong>Premium</strong> plan.
        </p>
        <Link
          to={`/bulebeti/${restaurantName}/admin/settings`}
          style={{
            backgroundColor: "#D4AF37",
            color: "#000000",
            padding: "10px 24px",
            borderRadius: "8px",
            fontWeight: "800",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Upgrade Plan ✦
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Title Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "var(--primary)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            🛍️ Online Food &amp; Beverage Orders
          </h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>
            Track, confirm, and fulfill online takeout, delivery, and dine-in orders in real time.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          style={{
            backgroundColor: "#f1f5f9",
            border: "1px solid #cbd5e1",
            padding: "8px 16px",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          🔄 Refresh Orders
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div style={{ backgroundColor: "white", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Total Orders</div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{orders.length}</div>
        </div>

        <div style={{ backgroundColor: "white", padding: "18px 20px", borderRadius: "12px", border: "1px solid #fef3c7", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#d97706", textTransform: "uppercase" }}>Pending Orders</div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#b45309", marginTop: "4px" }}>{pendingCount}</div>
        </div>

        <div style={{ backgroundColor: "white", padding: "18px 20px", borderRadius: "12px", border: "1px solid #dcfce7", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#166534", textTransform: "uppercase" }}>Completed Orders</div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#15803d", marginTop: "4px" }}>{completedCount}</div>
        </div>

        <div style={{ backgroundColor: "#0d1117", padding: "18px 20px", borderRadius: "12px", border: "1.5px solid #D4AF37", color: "white" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#D4AF37", textTransform: "uppercase" }}>Total Sales Revenue</div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#ffffff", marginTop: "4px" }}>${totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div
        style={{
          backgroundColor: "white",
          padding: "16px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "24px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, minWidth: "220px" }}>
          <input
            type="text"
            placeholder="Search by customer, phone, email or item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
            }}
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: "9px 14px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontSize: "13px",
            fontWeight: "600",
            backgroundColor: "#f8fafc",
          }}
        >
          <option value="All">All Order Options</option>
          <option value="Takeout">🛍️ Takeout Only</option>
          <option value="Dine-In">🍽️ Dine-In Only</option>
          <option value="Delivery">🛵 Delivery Only</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "9px 14px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontSize: "13px",
            fontWeight: "600",
            backgroundColor: "#f8fafc",
          }}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Preparing">Preparing 🍳</option>
          <option value="Ready">Ready 📦</option>
          <option value="Completed">Completed ✨</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            padding: "9px 14px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontSize: "13px",
            backgroundColor: "#f8fafc",
          }}
        />

        {(searchTerm || statusFilter !== "All" || typeFilter !== "All" || dateFilter) && (
          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("All");
              setTypeFilter("All");
              setDateFilter("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          Loading online orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
            backgroundColor: "white",
            borderRadius: "12px",
            border: "1px dashed #cbd5e1",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>🛒</div>
          <h3 style={{ margin: "0 0 4px 0", color: "#334155", fontSize: "18px" }}>No online orders found</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
            When customers place orders from your online menu page, they will appear here live.
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "12px 16px" }}>ORDER ID</th>
                  <th style={{ padding: "12px 16px" }}>CUSTOMER</th>
                  <th style={{ padding: "12px 16px" }}>OPTION</th>
                  <th style={{ padding: "12px 16px" }}>ITEMS ORDERED</th>
                  <th style={{ padding: "12px 16px" }}>AMOUNT</th>
                  <th style={{ padding: "12px 16px" }}>DATE &amp; TIME</th>
                  <th style={{ padding: "12px 16px" }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const badge = getStatusBadge(o.status);
                  const parsed = parseOrderDetails(o);
                  const shortId = (o._id || "").slice(-6).toUpperCase();

                  return (
                    <tr key={o._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {/* Order ID */}
                      <td style={{ padding: "14px 16px", fontWeight: "800", color: "#0f172a" }}>
                        #ORD-{shortId}
                      </td>

                      {/* Customer Info */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: "700", color: "#0f172a" }}>{o.guestName}</div>
                        {o.email && (
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            <a href={`mailto:${o.email}`} style={{ color: "#2563eb", textDecoration: "none" }}>
                              {o.email}
                            </a>
                          </div>
                        )}
                        {o.phone && (
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                            <a href={`tel:${o.phone}`} style={{ color: "#059669", fontWeight: "600", textDecoration: "none" }}>
                              📞 {o.phone}
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Option */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            backgroundColor: parsed.orderType === "Dine-In" ? "#f3e8ff" : parsed.orderType === "Delivery" ? "#e0f2fe" : "#fef3c7",
                            color: parsed.orderType === "Dine-In" ? "#6b21a8" : parsed.orderType === "Delivery" ? "#0369a1" : "#92400e",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontWeight: "700",
                            fontSize: "12px",
                          }}
                        >
                          {parsed.orderType === "Dine-In" ? "🍽️ Dine-In" : parsed.orderType === "Delivery" ? "🛵 Delivery" : "🛍️ Takeout"}
                        </span>
                      </td>

                      {/* Items & Notes */}
                      <td style={{ padding: "14px 16px", maxWidth: "280px" }}>
                        <div style={{ fontWeight: "600", color: "#1e293b", lineHeight: "1.4" }}>
                          {parsed.itemsStr}
                        </div>
                        {parsed.notesStr && (
                          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontStyle: "italic" }}>
                            Note: "{parsed.notesStr}"
                          </div>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td style={{ padding: "14px 16px", fontWeight: "800", color: "#166534", fontSize: "15px" }}>
                        {parsed.totalStr}
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        <div><strong>{o.date || "Today"}</strong></div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{o.time || ""}</div>
                      </td>

                      {/* Status Selector */}
                      <td style={{ padding: "14px 16px" }}>
                        <select
                          value={o.status || "Pending"}
                          onChange={(e) => handleStatusChange(o._id, e.target.value)}
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontWeight: "800",
                            fontSize: "12px",
                            cursor: "pointer",
                            outline: "none",
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Preparing">Preparing 🍳</option>
                          <option value="Ready">Ready 📦</option>
                          <option value="Completed">Completed ✨</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOnlineOrders;

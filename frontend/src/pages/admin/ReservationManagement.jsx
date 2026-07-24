import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAdmin } from "../../layouts/AdminLayout";
import config from "../../config";

const ReservationManagement = () => {
  const { t } = useLanguage();
  const { restaurantName } = useParams();
  const { tier, searchQuery } = useAdmin();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const isGoldOrAbove =
    tier === "Gold" || tier === "Platinum" || tier === "Premium";

  if (!isGoldOrAbove) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          backgroundColor: "var(--surface)",
          borderRadius: "12px",
          marginTop: "40px",
        }}
      >
        <h2 style={{ color: "var(--on-surface)" }}>🔒 Feature Locked</h2>
        <p style={{ color: "var(--on-surface-variant)", marginBottom: "20px" }}>
          Reservation Management requires the <strong>Gold</strong>,{" "}
          <strong>Platinum</strong>, or <strong>Premium</strong> plan.
        </p>
        <Link
          to={`/bulebeti/${restaurantName}/admin/settings`}
          className="btn btn-primary"
        >
          Upgrade Plan
        </Link>
      </div>
    );
  }

  useEffect(() => {
    fetchReservations();
  }, [restaurantName]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${config.API_URL}/api/reservations/restaurant/${restaurantName}`,
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        },
      );
      if (res.ok) {
        const data = await res.json();
        const sortedData = data.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        });
        setReservations(sortedData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    const previousReservations = [...reservations];
    setReservations((prev) =>
      prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r)),
    );
    try {
      const res = await fetch(`${config.API_URL}/api/reservations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch (err) {
      console.error(err);
      alert("Failed to update status. Reverting...");
      setReservations(previousReservations);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Confirmed":
        return { backgroundColor: "#e6f4ea", color: "#1e7e34" };
      case "Pending":
        return { backgroundColor: "#fff7e6", color: "#d97706" };
      case "Cancelled":
        return { backgroundColor: "#fce8e6", color: "#d93025" };
      case "Completed":
        return { backgroundColor: "#e8f0fe", color: "#1a73e8" };
      default:
        return { backgroundColor: "#f1f3f4", color: "#5f6368" };
    }
  };

  // Apply filters
  const filtered = reservations.filter((r) => {
    const search = searchTerm.toLowerCase();
    const globalSearch = searchQuery ? searchQuery.toLowerCase() : "";

    const matchLocalSearch =
      !search ||
      (r.guestName || "").toLowerCase().includes(search) ||
      (r.email || "").toLowerCase().includes(search) ||
      (r.phone || "").toLowerCase().includes(search);

    const matchGlobalSearch =
      !globalSearch ||
      (r.guestName || "").toLowerCase().includes(globalSearch) ||
      (r.email || "").toLowerCase().includes(globalSearch) ||
      (r.phone || "").toLowerCase().includes(globalSearch);

    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    const matchDate = !dateFilter || (r.date || "").startsWith(dateFilter);

    return matchLocalSearch && matchGlobalSearch && matchStatus && matchDate;
  });

  const inputStyle = {
    padding: "8px 12px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--platinum)",
    fontSize: "14px",
    outline: "none",
  };

  return (
    <div className="reservation-management py-3">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fs-3 fw-bold m-0">{t("admin_res_title")}</h1>
          <p className="text-muted small m-0 mt-1">
            {filtered.length} of {reservations.length} reservations
          </p>
        </div>
        <button
          className="btn btn-outline-secondary fw-bold px-4"
          onClick={fetchReservations}
        >
          ↻ Refresh
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4">
        {/* Filters */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              className="form-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-3">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="col-12 col-md-3">
            <input
              type="date"
              className="form-control"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-2">
            {(searchTerm || statusFilter !== "All" || dateFilter) && (
              <button
                className="btn btn-outline-danger w-100 fw-bold"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("All");
                  setDateFilter("");
                }}
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-5 text-center text-muted">
            <div className="spinner-border text-secondary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading reservations...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table
              className="table table-hover align-middle mb-0"
              style={{ minWidth: "700px" }}
            >
              <thead className="table-light">
                <tr>
                  <th className="text-muted text-uppercase small fw-bold">
                    ID
                  </th>
                  <th className="text-muted text-uppercase small fw-bold">
                    Customer
                  </th>
                  <th className="text-muted text-uppercase small fw-bold">
                    Date & Time
                  </th>
                  <th className="text-muted text-uppercase small fw-bold">
                    Guests
                  </th>
                  <th className="text-muted text-uppercase small fw-bold">
                    Special Req.
                  </th>
                  <th className="text-muted text-uppercase small fw-bold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <div className="display-6 mb-3">📋</div>
                      No reservations match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map((res) => (
                  <tr key={res._id}>
                    <td className="text-muted font-monospace small">
                      {res._id.slice(-6).toUpperCase()}
                    </td>
                    <td>
                      <div className="fw-bold">{res.guestName}</div>
                      <div className="small text-muted">{res.email}</div>
                      <div className="small text-muted">{res.phone}</div>
                    </td>
                    <td>
                      <div className="fw-bold">{res.date}</div>
                      <div className="small text-muted">{res.time}</div>
                    </td>
                    <td>{res.guests}</td>
                    <td
                      className="small text-muted"
                      style={{ maxWidth: "180px" }}
                    >
                      {res.specialRequests || "—"}
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm fw-bold rounded-pill text-center border-0 shadow-sm"
                        style={getStatusStyle(res.status)}
                        value={res.status}
                        onChange={(e) => updateStatus(res._id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mt-4 small text-muted">
          <div>
            Showing {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationManagement;

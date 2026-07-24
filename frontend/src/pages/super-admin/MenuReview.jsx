import React, { useState, useEffect } from "react";
import config from "../../config";

const MenuReview = () => {
  const [globalMenu, setGlobalMenu] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalMenu = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${config.API_URL}/api/menu`);
        if (!res.ok) throw new Error("Failed to fetch menus");
        const data = await res.json();

        const mappedData = data.map((item) => ({
          id: item._id,
          restaurant: item.restaurantId
            ? item.restaurantId.name
            : "Unknown Restaurant",
          name: item.name,
          category: item.category || "Mains",
          price: `$${item.price}`,
          status: "Reviewed", // Could be driven by a status field in DB
          submittedAt: new Date().toLocaleDateString(),
        }));

        setGlobalMenu(mappedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalMenu();
  }, []);

  const handleApprove = (id) => {
    setGlobalMenu((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Reviewed" } : item,
      ),
    );
    alert(
      "Menu item approved and officially registered in the bulebeti Network!",
    );
  };

  return (
    <div>
      <div
        style={{
          marginBottom: "var(--spacing-xl)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <h1>Global Menu Registry</h1>
          <p style={{ color: "#6b7280" }}>
            Overseeing all culinary additions across the restaurant ecosystem.
          </p>
        </div>
        <div
          style={{
            backgroundColor: "var(--gold)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          {globalMenu.length} TOTAL REGISTRATIONS
        </div>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}
            >
              <th
                style={{
                  padding: "12px 8px",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                RESTAURANT
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                ITEM DETAILS
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                STATUS
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                SUBMITTED
              </th>
              <th
                style={{
                  padding: "12px 8px",
                  fontSize: "13px",
                  color: "#6b7280",
                  textAlign: "right",
                }}
              >
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {globalMenu.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "16px 8px" }}>
                  <div style={{ fontWeight: "700", color: "var(--primary)" }}>
                    {row.restaurant}
                  </div>
                </td>
                <td style={{ padding: "16px 8px" }}>
                  <div style={{ fontWeight: "600" }}>{row.name}</div>
                  <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                    {row.category} • {row.price}
                  </div>
                </td>
                <td style={{ padding: "16px 8px" }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "700",
                      backgroundColor:
                        row.status === "New" || row.status === "Pending Review"
                          ? "#fff7ed"
                          : "#f0fdf4",
                      color:
                        row.status === "New" || row.status === "Pending Review"
                          ? "#9a3412"
                          : "#15803d",
                    }}
                  >
                    {row.status.toUpperCase()}
                  </span>
                </td>
                <td
                  style={{
                    padding: "16px 8px",
                    fontSize: "14px",
                    color: "#6b7280",
                  }}
                >
                  {row.submittedAt}
                </td>
                <td style={{ padding: "16px 8px", textAlign: "right" }}>
                  {row.status === "New" || row.status === "Pending Review" ? (
                    <button
                      onClick={() => handleApprove(row.id)}
                      style={{
                        backgroundColor: "var(--gold)",
                        color: "white",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      Approve & Register
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#15803d",
                        fontWeight: "700",
                      }}
                    >
                      ✓ REGISTERED
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {globalMenu.length === 0 && (
          <div
            style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}
          >
            No new menu registrations detected in the platform queue.
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuReview;

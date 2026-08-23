import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAdmin } from "../../layouts/AdminLayout";
import config from "../../config";

const EventsManager = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { restaurantName } = useParams();
  const { tier } = useAdmin();
  const isPremiumOrPlatinum = tier === "Premium" || tier === "Platinum";

  const [events, setEvents] = useState([]);
  const [_loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const restRes = await fetch(
          `${config.API_URL}/api/restaurants/${restaurantName}`,
        );
        if (!restRes.ok) throw new Error("Restaurant not found");
        const restaurant = await restRes.json();

        const eventsRes = await fetch(
          `${config.API_URL}/api/events/restaurant/${restaurant._id}`,
        );
        if (!eventsRes.ok) throw new Error("Failed to fetch events");
        const data = await eventsRes.json();
        setEvents(data);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [restaurantName]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${config.API_URL}/api/events/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-auth-token": token } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to delete event");
      setEvents(events.filter((e) => e._id !== id));
    } catch (err) {
      console.error(err);
      alert("Error deleting event");
    }
  };

  return (
    <div className="events-manager">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--spacing-xl)",
        }}
      >
        <h1 style={{ fontSize: "24px", margin: 0 }}>
          {t("admin_event_title")}
        </h1>
        <button
          onClick={() =>
            isPremiumOrPlatinum
              ? navigate(`/bulebeti/${restaurantName}/admin/events/create`)
              : null
          }
          className={`btn ${isPremiumOrPlatinum ? "btn-primary" : "btn-outline"}`}
          style={
            !isPremiumOrPlatinum ? { cursor: "not-allowed", opacity: 0.6 } : {}
          }
          title={!isPremiumOrPlatinum ? "Requires Platinum Plan" : ""}
        >
          {t("admin_event_add")} {!isPremiumOrPlatinum && "🔒"}
        </button>
      </div>

      <div
        style={{
          backgroundColor: "var(--surface)",
          padding: "var(--spacing-lg)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-1)",
          border: "1px solid var(--platinum)",
        }}
      >
        <div className="table-responsive">
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "600px",
            }}
          >
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  borderBottom: "2px solid var(--platinum)",
                }}
              >
                <th
                  style={{
                    padding: "12px 8px",
                    fontSize: "13px",
                    fontWeight: "700",
                  }}
                >
                  {t("admin_event_col_title")}
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    fontSize: "13px",
                    fontWeight: "700",
                  }}
                >
                  CATEGORY
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    fontSize: "13px",
                    fontWeight: "700",
                  }}
                >
                  START DATE
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    fontSize: "13px",
                    fontWeight: "700",
                  }}
                >
                  {t("admin_event_col_stat")}
                </th>
                <th
                  style={{
                    padding: "12px 8px",
                    fontSize: "13px",
                    fontWeight: "700",
                  }}
                >
                  {t("admin_event_col_act")}
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr
                  key={ev._id}
                  style={{ borderBottom: "1px solid var(--platinum)" }}
                >
                  <td style={{ padding: "16px 8px", fontWeight: "600" }}>
                    {ev.title}
                  </td>
                  <td style={{ padding: "16px 8px", fontSize: "14px" }}>
                    <span
                      style={{
                        backgroundColor: "#f3f4f6",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    >
                      {ev.category}
                    </span>
                  </td>
                  <td style={{ padding: "16px 8px", fontSize: "14px" }}>
                    {ev.startDate || "N/A"}
                  </td>
                  <td style={{ padding: "16px 8px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "var(--radius-md)",
                        fontSize: "11px",
                        fontWeight: "700",
                        backgroundColor:
                          ev.status === "Active"
                            ? "var(--surface-dim)"
                            : ev.status === "Closed" ||
                                ev.status === "Cancelled"
                              ? "rgba(186, 26, 26, 0.1)"
                              : "var(--platinum)",
                        color:
                          ev.status === "Active"
                            ? "var(--primary)"
                            : ev.status === "Closed" ||
                                ev.status === "Cancelled"
                              ? "var(--error)"
                              : "var(--on-surface-variant)",
                      }}
                    >
                      {ev.status}
                    </span>
                  </td>
                  <td style={{ padding: "16px 8px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                        title="View"
                      >
                        🔗
                      </button>
                      <button
                        onClick={() =>
                          navigate(
                            `/bulebeti/${restaurantName}/admin/events/edit/${ev._id}`,
                          )
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(ev._id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventsManager;

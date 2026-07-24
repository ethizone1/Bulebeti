import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAdmin } from "../../layouts/AdminLayout";
import config from "../../config";

const TestimonialsManager = () => {
  const { t } = useLanguage();
  const { restaurantName } = useParams();
  const { tier } = useAdmin();
  const navigate = useNavigate();

  // States
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    text: "",
    rating: 5,
    mediaUrl: "",
    mediaType: "image",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    role: "",
    text: "",
    rating: 5,
    mediaUrl: "",
    mediaType: "image",
  });

  const isPremium = tier === "Premium";

  if (!isPremium) {
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
          Testimonials Management is an exclusive feature of the{" "}
          <strong>Premium</strong> plan.
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
    if (isPremium) {
      fetchTestimonials();
    } else {
      setLoading(false);
    }
  }, [restaurantName, isPremium]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${config.API_URL}/api/testimonials/restaurant/${restaurantName}/admin`,
        {
          headers: {
            "x-auth-token": token,
          },
        },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch testimonials");
      }
      const data = await response.json();
      setTestimonials(data);
    } catch (err) {
      console.error("Error fetching admin testimonials:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e, isEditing = false) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert(
        "File is too large. Please select an image or video under 8MB to ensure it saves correctly.",
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      const mediaType = file.type.startsWith("video/") ? "video" : "image";

      if (isEditing) {
        setEditData({ ...editData, mediaUrl: base64String, mediaType });
      } else {
        setFormData({ ...formData, mediaUrl: base64String, mediaType });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${config.API_URL}/api/testimonials/restaurant/${restaurantName}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );
      if (!response.ok) throw new Error("Failed to submit testimonial");
      const newTestimonial = await response.json();
      setTestimonials([newTestimonial, ...testimonials]);
      setFormData({
        name: "",
        role: "",
        text: "",
        rating: 5,
        mediaUrl: "",
        mediaType: "image",
      });
      setShowForm(false);
      alert("Testimonial added successfully!");
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    setActionLoadingId(id);
    const newStatus = currentStatus === "Approved" ? "Pending" : "Approved";
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${config.API_URL}/api/testimonials/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update testimonial status");
      }

      // Update state locally
      setTestimonials(
        testimonials.map((item) =>
          item._id === id ? { ...item, status: newStatus } : item,
        ),
      );
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this testimonial permanently?",
      )
    ) {
      return;
    }
    setActionLoadingId(id);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${config.API_URL}/api/testimonials/${id}`, {
        method: "DELETE",
        headers: {
          "x-auth-token": token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete testimonial");
      }

      // Remove from state locally
      setTestimonials(testimonials.filter((item) => item._id !== id));
    } catch (err) {
      alert(`Error deleting testimonial: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item._id);
    setEditData({
      name: item.name,
      role: item.role || "",
      text: item.text,
      rating: item.rating,
      mediaUrl: item.mediaUrl || "",
      mediaType: item.mediaType || "image",
    });
  };

  const handleUpdate = async (id) => {
    setActionLoadingId(id);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${config.API_URL}/api/testimonials/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        throw new Error("Failed to update testimonial");
      }

      const updatedTestimonial = await response.json();
      setTestimonials(
        testimonials.map((item) =>
          item._id === id ? updatedTestimonial : item,
        ),
      );
      setEditingId(null);
    } catch (err) {
      alert(`Error updating testimonial: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div
          style={{
            margin: "0 auto 10px",
            width: "32px",
            height: "32px",
            border: "3px solid rgba(0,0,0,0.1)",
            borderTopColor: "var(--gold)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p>Loading testimonials...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--spacing-xl)",
        }}
      >
        <div>
          <h1 style={{ fontSize: "28px", margin: 0 }}>
            ⭐ Testimonials Management
          </h1>
          <p style={{ color: "var(--on-surface-variant)", margin: "4px 0 0" }}>
            Add, review, publish, and delete customer testimonials on your
            premium profile.
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#b91c1c",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Admin Testimonial Form */}
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid var(--platinum)",
          marginBottom: "32px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>📝</span> Add New Testimonial
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className={showForm ? "btn btn-outline" : "btn btn-primary"}
          >
            {showForm ? "Cancel" : "➕ Add Testimonial"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gap: "16px",
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid var(--platinum)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginBottom: "6px",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  CUSTOMER NAME
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid var(--platinum)",
                  }}
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginBottom: "6px",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  ROLE / COMPANY (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid var(--platinum)",
                  }}
                  placeholder="e.g. Regular Guest"
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginBottom: "6px",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  UPLOAD MEDIA (PHOTO/VIDEO)
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => handleFileUpload(e, false)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid var(--platinum)",
                    marginBottom: "8px",
                  }}
                />
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "12px",
                    color: "var(--on-surface-variant)",
                    marginBottom: "8px",
                  }}
                >
                  OR PASTE URL
                </div>
                <input
                  type="text"
                  value={formData.mediaUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, mediaUrl: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid var(--platinum)",
                  }}
                  placeholder="Link to photo or video (.jpg, .mp4)"
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "bold",
                    marginBottom: "6px",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  MEDIA TYPE
                </label>
                <select
                  value={formData.mediaType}
                  onChange={(e) =>
                    setFormData({ ...formData, mediaType: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid var(--platinum)",
                    backgroundColor: "white",
                  }}
                >
                  <option value="image">Image (Photo)</option>
                  <option value="video">Video</option>
                </select>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "bold",
                  marginBottom: "6px",
                  color: "var(--on-surface-variant)",
                }}
              >
                RATING
              </label>
              <select
                value={formData.rating}
                onChange={(e) =>
                  setFormData({ ...formData, rating: Number(e.target.value) })
                }
                style={{
                  width: "120px",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid var(--platinum)",
                  backgroundColor: "white",
                }}
              >
                <option value={5}>5 Stars ⭐⭐⭐⭐⭐</option>
                <option value={4}>4 Stars ⭐⭐⭐⭐</option>
                <option value={3}>3 Stars ⭐⭐⭐</option>
                <option value={2}>2 Stars ⭐⭐</option>
                <option value={1}>1 Star ⭐</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "bold",
                  marginBottom: "6px",
                  color: "var(--on-surface-variant)",
                }}
              >
                TESTIMONIAL TEXT
              </label>
              <textarea
                required
                rows="3"
                value={formData.text}
                onChange={(e) =>
                  setFormData({ ...formData, text: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  border: "1px solid var(--platinum)",
                  resize: "vertical",
                }}
                placeholder="What did they have to say about their experience?"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ justifySelf: "start", padding: "10px 24px" }}
            >
              {isSubmitting ? "Adding..." : "Save Testimonial"}
            </button>
          </form>
        )}
      </div>

      {testimonials.length === 0 ? (
        <div
          style={{
            backgroundColor: "var(--surface)",
            padding: "60px 20px",
            borderRadius: "12px",
            textAlign: "center",
            border: "1px solid var(--platinum)",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>💬</div>
          <h3>No Testimonials Yet</h3>
          <p
            style={{
              color: "var(--on-surface-variant)",
              maxWidth: "500px",
              margin: "0 auto",
            }}
          >
            Use the form above to add your first customer testimonial. It will
            appear on your public page automatically!
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "var(--surface)",
            borderRadius: "12px",
            border: "1px solid var(--platinum)",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                minWidth: "800px",
              }}
            >
              <thead
                style={{
                  backgroundColor: "#f9fafb",
                  borderBottom: "2px solid var(--platinum)",
                }}
              >
                <tr>
                  <th
                    style={{
                      padding: "16px",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "var(--on-surface-variant)",
                      textTransform: "uppercase",
                    }}
                  >
                    Customer Name
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "var(--on-surface-variant)",
                      textTransform: "uppercase",
                    }}
                  >
                    Role
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "var(--on-surface-variant)",
                      textTransform: "uppercase",
                    }}
                  >
                    Rating
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "var(--on-surface-variant)",
                      textTransform: "uppercase",
                    }}
                  >
                    Review Text
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "var(--on-surface-variant)",
                      textTransform: "uppercase",
                    }}
                  >
                    Media
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "var(--on-surface-variant)",
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "16px",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "var(--on-surface-variant)",
                      textTransform: "uppercase",
                      textAlign: "right",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map((item) => {
                  const isEditing = editingId === item._id;

                  return (
                    <tr
                      key={item._id}
                      style={{
                        borderBottom: "1px solid var(--platinum)",
                        backgroundColor: isEditing ? "#fefce8" : "white",
                        transition: "background-color 0.2s",
                      }}
                    >
                      <td style={{ padding: "16px" }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.name}
                            onChange={(e) =>
                              setEditData({ ...editData, name: e.target.value })
                            }
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                            }}
                          />
                        ) : (
                          <span style={{ fontWeight: "600", fontSize: "14px" }}>
                            {item.name}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px" }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.role}
                            onChange={(e) =>
                              setEditData({ ...editData, role: e.target.value })
                            }
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: "13px", color: "#6b7280" }}>
                            {item.role || "Guest"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px", whiteSpace: "nowrap" }}>
                        {isEditing ? (
                          <select
                            value={editData.rating}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                rating: Number(e.target.value),
                              })
                            }
                            style={{
                              padding: "8px",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                            }}
                          >
                            {[5, 4, 3, 2, 1].map((num) => (
                              <option key={num} value={num}>
                                {num}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div
                            style={{
                              color: "var(--gold)",
                              letterSpacing: "1px",
                              fontSize: "14px",
                            }}
                          >
                            {"★".repeat(item.rating)}
                            {"☆".repeat(5 - item.rating)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "16px", maxWidth: "300px" }}>
                        {isEditing ? (
                          <textarea
                            value={editData.text}
                            onChange={(e) =>
                              setEditData({ ...editData, text: e.target.value })
                            }
                            rows="3"
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              resize: "vertical",
                            }}
                          />
                        ) : (
                          <p
                            style={{
                              margin: 0,
                              fontSize: "13px",
                              color: "#4b5563",
                              fontStyle: "italic",
                              display: "-webkit-box",
                              WebkitLineClamp: "3",
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            "{item.text}"
                          </p>
                        )}
                      </td>
                      <td style={{ padding: "16px" }}>
                        {isEditing ? (
                          <div style={{ display: "grid", gap: "8px" }}>
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={(e) => handleFileUpload(e, true)}
                              style={{
                                width: "100%",
                                padding: "4px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                fontSize: "12px",
                              }}
                            />
                            <input
                              type="text"
                              placeholder="Or Media URL"
                              value={editData.mediaUrl}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  mediaUrl: e.target.value,
                                })
                              }
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                fontSize: "12px",
                              }}
                            />
                            <select
                              value={editData.mediaType}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  mediaType: e.target.value,
                                })
                              }
                              style={{
                                padding: "8px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                fontSize: "12px",
                              }}
                            >
                              <option value="image">Image</option>
                              <option value="video">Video</option>
                            </select>
                          </div>
                        ) : item.mediaUrl ? (
                          <a
                            href={item.mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: "20px", textDecoration: "none" }}
                            title={item.mediaUrl}
                          >
                            {item.mediaType === "video" ? "🎥" : "🖼️"}
                          </a>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                            None
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            backgroundColor:
                              item.status === "Approved"
                                ? "#dcfce7"
                                : "#fee2e2",
                            color:
                              item.status === "Approved"
                                ? "#15803d"
                                : "#b91c1c",
                          }}
                        >
                          {item.status.toUpperCase()}
                        </span>
                        <div style={{ marginTop: "8px" }}>
                          <button
                            disabled={actionLoadingId === item._id || isEditing}
                            onClick={() =>
                              handleStatusToggle(item._id, item.status)
                            }
                            style={{
                              padding: "4px 8px",
                              fontSize: "11px",
                              borderRadius: "4px",
                              border: "1px solid var(--platinum)",
                              backgroundColor: "white",
                              cursor: "pointer",
                            }}
                          >
                            {item.status === "Approved" ? "Hide" : "Publish"}
                          </button>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "16px",
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isEditing ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              onClick={() => setEditingId(null)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "4px",
                                border: "1px solid #d1d5db",
                                backgroundColor: "white",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdate(item._id)}
                              disabled={actionLoadingId === item._id}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "4px",
                                border: "none",
                                backgroundColor: "var(--primary)",
                                color: "white",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              onClick={() => handleEditClick(item)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "4px",
                                border: "1px solid var(--platinum)",
                                backgroundColor: "white",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              disabled={actionLoadingId === item._id}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "4px",
                                border: "none",
                                backgroundColor: "#fee2e2",
                                color: "#b91c1c",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
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

export default TestimonialsManager;

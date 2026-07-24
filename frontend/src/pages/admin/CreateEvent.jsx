import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import config from "../../config";

const CreateEvent = () => {
  const navigate = useNavigate();
  const { restaurantName } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    category: "Other",
    description: "",
    restaurantNameField: "",
    branchLocation: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    isRepeat: false,
    address: "",
    city: "",
    area: "",
    mapLink: "",
    indoorOutdoor: "Indoor",
    eventImage: "",
    posterImage: "",
    bannerImage: "",
    isFree: false,
    price: "",
    currency: "ETB",
    bookingRequired: false,
    maxGuests: "",
    specialMenu: false,
    menuItems: "",
    discountPercent: "",
    specialOfferDesc: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    whatsappLink: "",
    reservationLink: "",
    status: "Active",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [restaurantData, setRestaurantData] = useState(null);

  React.useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const restRes = await fetch(
          `${config.API_URL}/api/restaurants/${restaurantName}`,
        );
        if (restRes.ok) {
          const restaurant = await restRes.json();
          setRestaurantData(restaurant);
          setFormData((prev) => ({
            ...prev,
            restaurantNameField: restaurant.name || "",
            address: restaurant.address || "",
          }));
        }
      } catch (err) {
        console.error("Failed to fetch restaurant", err);
      }
    };
    fetchRestaurant();
  }, [restaurantName]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, eventImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!restaurantData) throw new Error("Restaurant data not loaded");
      const payload = { ...formData, restaurantId: restaurantData._id };

      const res = await fetch(`${config.API_URL}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create event");

      navigate(`/bulebeti/${restaurantName}/admin/events`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sectionStyle = {
    marginBottom: "var(--spacing-xxl)",
    padding: "var(--spacing-lg)",
    backgroundColor: "var(--surface-dim)",
    borderRadius: "8px",
    border: "1px solid var(--platinum)",
  };

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "4px",
    textTransform: "uppercase",
  };
  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid var(--platinum)",
    backgroundColor: "white",
  };
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "var(--spacing-lg)",
    marginBottom: "var(--spacing-lg)",
  };

  return (
    <div className="create-event">
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <button
          onClick={() => navigate(`/bulebeti/${restaurantName}/admin/events`)}
          style={{
            background: "none",
            border: "none",
            color: "var(--on-surface-variant)",
            cursor: "pointer",
            marginBottom: "8px",
          }}
        >
          ← Back to Events Manager
        </button>
        <h1 style={{ fontSize: "24px", margin: 0 }}>Create New Event</h1>
      </div>

      <div
        style={{
          backgroundColor: "var(--surface)",
          padding: "var(--spacing-xl)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-1)",
          border: "1px solid var(--platinum)",
          maxWidth: "900px",
        }}
      >
        {error && (
          <div style={{ color: "red", marginBottom: "16px" }}>{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div style={sectionStyle}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                borderBottom: "1px solid var(--platinum)",
                paddingBottom: "8px",
              }}
            >
              Basic Information
            </h3>
            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>Event Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Event Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Live Music">Live Music</option>
                  <option value="Food Discount">Food Discount</option>
                  <option value="Holiday Special">Holiday Special</option>
                  <option value="Buffet Night">Buffet Night</option>
                  <option value="Cultural Event">Cultural Event</option>
                  <option value="Private Event">Private Event</option>
                  <option value="New Menu Launch">New Menu Launch</option>
                  <option value="Happy Hour">Happy Hour</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: "var(--spacing-lg)" }}>
              <label style={labelStyle}>Event Description</label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                style={{ ...inputStyle, resize: "vertical" }}
              ></textarea>
            </div>
          </div>

          {/* Date & Time */}
          <div style={sectionStyle}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                borderBottom: "1px solid var(--platinum)",
                paddingBottom: "8px",
              }}
            >
              Date & Time
            </h3>
            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Images (Basic) */}
          <div style={sectionStyle}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                borderBottom: "1px solid var(--platinum)",
                paddingBottom: "8px",
              }}
            >
              Event Image
            </h3>
            <div style={{ marginBottom: "var(--spacing-lg)" }}>
              <label style={labelStyle}>Upload from PC</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ ...inputStyle, marginBottom: "12px" }}
              />
              <label style={labelStyle}>Or enter Image URL</label>
              <input
                type="url"
                name="eventImage"
                value={formData.eventImage}
                onChange={handleChange}
                placeholder="Main display image"
                style={inputStyle}
              />
              {formData.eventImage && (
                <div style={{ marginTop: "12px" }}>
                  <img
                    src={formData.eventImage}
                    alt="Preview"
                    style={{
                      width: "100%",
                      maxHeight: "200px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Ticketing (Basic) */}
          <div style={sectionStyle}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                borderBottom: "1px solid var(--platinum)",
                paddingBottom: "8px",
              }}
            >
              Ticketing & Pricing
            </h3>
            <div style={gridStyle}>
              <div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    height: "100%",
                  }}
                >
                  <input
                    type="checkbox"
                    name="isFree"
                    checked={formData.isFree}
                    onChange={handleChange}
                  />
                  Is the event free?
                </label>
              </div>
              {!formData.isFree && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Ticket Price</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ width: "80px" }}>
                    <label style={labelStyle}>Currency</label>
                    <input
                      type="text"
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div style={sectionStyle}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                borderBottom: "1px solid var(--platinum)",
                paddingBottom: "8px",
              }}
            >
              Event Status
            </h3>
            <div style={{ width: "50%" }}>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Toggle Advanced */}
          <div
            style={{ textAlign: "center", marginBottom: "var(--spacing-xl)" }}
          >
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: "none",
                border: "1px solid var(--platinum)",
                padding: "8px 16px",
                borderRadius: "20px",
                cursor: "pointer",
                fontWeight: "600",
                color: "var(--on-surface-variant)",
              }}
            >
              {showAdvanced
                ? "Hide Advanced Options ⬆️"
                : "Show Advanced Options ⬇️"}
            </button>
          </div>

          {showAdvanced && (
            <div
              style={{
                borderTop: "2px dashed var(--platinum)",
                paddingTop: "var(--spacing-xl)",
                marginBottom: "var(--spacing-xl)",
              }}
            >
              <div style={sectionStyle}>
                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: "16px",
                    borderBottom: "1px solid var(--platinum)",
                    paddingBottom: "8px",
                  }}
                >
                  Advanced Location
                </h3>
                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>Restaurant Name (Display)</label>
                    <input
                      type="text"
                      name="restaurantNameField"
                      value={formData.restaurantNameField}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Branch / Location</label>
                    <input
                      type="text"
                      name="branchLocation"
                      value={formData.branchLocation}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: "var(--spacing-lg)" }}>
                  <label style={labelStyle}>Restaurant Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Area / District</label>
                    <input
                      type="text"
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>Google Map Link</label>
                    <input
                      type="url"
                      name="mapLink"
                      value={formData.mapLink}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Indoor or Outdoor</label>
                    <select
                      name="indoorOutdoor"
                      value={formData.indoorOutdoor}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      <option value="Indoor">Indoor</option>
                      <option value="Outdoor">Outdoor</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={sectionStyle}>
                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: "16px",
                    borderBottom: "1px solid var(--platinum)",
                    paddingBottom: "8px",
                  }}
                >
                  Advanced Ticketing
                </h3>
                <div style={gridStyle}>
                  <div>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        height: "100%",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="bookingRequired"
                        checked={formData.bookingRequired}
                        onChange={handleChange}
                      />
                      Booking Required?
                    </label>
                  </div>
                  <div>
                    <label style={labelStyle}>Maximum Number of Guests</label>
                    <input
                      type="number"
                      name="maxGuests"
                      value={formData.maxGuests}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Special Offers */}
              <div style={sectionStyle}>
                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: "16px",
                    borderBottom: "1px solid var(--platinum)",
                    paddingBottom: "8px",
                  }}
                >
                  Menu & Offers
                </h3>
                <div style={{ marginBottom: "var(--spacing-lg)" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="specialMenu"
                      checked={formData.specialMenu}
                      onChange={handleChange}
                    />
                    Special Menu Available?
                  </label>
                </div>
                {formData.specialMenu && (
                  <div style={{ marginBottom: "var(--spacing-lg)" }}>
                    <label style={labelStyle}>Event Menu Items</label>
                    <textarea
                      name="menuItems"
                      rows="2"
                      value={formData.menuItems}
                      onChange={handleChange}
                      style={{ ...inputStyle, resize: "vertical" }}
                    ></textarea>
                  </div>
                )}
                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>Discount Percentage (%)</label>
                    <input
                      type="number"
                      name="discountPercent"
                      value={formData.discountPercent}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Special Offer Description</label>
                    <input
                      type="text"
                      name="specialOfferDesc"
                      value={formData.specialOfferDesc}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div style={sectionStyle}>
                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: "16px",
                    borderBottom: "1px solid var(--platinum)",
                    paddingBottom: "8px",
                  }}
                >
                  Contact Information
                </h3>
                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>Contact Person Name</label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>WhatsApp Link</label>
                    <input
                      type="url"
                      name="whatsappLink"
                      value={formData.whatsappLink}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: "var(--spacing-lg)" }}>
                  <label style={labelStyle}>Reservation Link</label>
                  <input
                    type="url"
                    name="reservationLink"
                    value={formData.reservationLink}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Advanced Images */}
              <div style={sectionStyle}>
                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: "16px",
                    borderBottom: "1px solid var(--platinum)",
                    paddingBottom: "8px",
                  }}
                >
                  Advanced Media
                </h3>
                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>Poster Image URL</label>
                    <input
                      type="url"
                      name="posterImage"
                      value={formData.posterImage}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Banner Image URL</label>
                    <input
                      type="url"
                      name="bannerImage"
                      value={formData.bannerImage}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "var(--spacing-md)",
              justifyContent: "flex-end",
              borderTop: "1px solid var(--platinum)",
              paddingTop: "var(--spacing-xl)",
            }}
          >
            <button
              type="button"
              onClick={() =>
                navigate(`/bulebeti/${restaurantName}/admin/events`)
              }
              style={{
                padding: "12px 24px",
                borderRadius: "4px",
                border: "1px solid var(--platinum)",
                background: "none",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                padding: "12px 32px",
                opacity: loading ? 0.7 : 1,
                fontSize: "16px",
              }}
            >
              {loading ? "Publishing..." : "Publish Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;

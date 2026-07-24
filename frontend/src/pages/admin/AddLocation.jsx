import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useAdmin } from "../../layouts/AdminLayout";
import config from "../../config";

const AddLocation = ({ currentTier }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { restaurantName } = useParams();
  const { tier } = useAdmin();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cuisineType, setCuisineType] = useState("fine-dining");
  const [menuLayout, setMenuLayout] = useState("image-left");
  const [logoBase64, setLogoBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!slug.trim()) {
      setError("Website slug is required.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error(
          "You must be logged in to register a sister restaurant.",
        );

      const response = await fetch(`${config.API_URL}/api/restaurants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({
          name,
          slug,
          address,
          phone,
          email,
          menuLayout,
          logoUrl: logoBase64,
          description: description || `A ${cuisineType} restaurant.`,
          subscriptionTier: currentTier || "Basic",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || "Failed to create sister restaurant.");
      }

      // Successfully created! Navigate to the new restaurant's admin panel
      navigate(`/bulebeti/${slug}/admin`);
      window.location.reload(); // Reload to refresh the AdminLayout context
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-location py-3">
      <div className="mb-4">
        <button
          onClick={() =>
            navigate(`/bulebeti/${restaurantName}/admin/locations`)
          }
          className="btn btn-link text-muted text-decoration-none p-0 mb-2 d-flex align-items-center gap-1"
        >
          &larr; Back to Sister Restaurants
        </button>
        <h1 className="fs-3 fw-bold m-0">
          {t("admin_loc_add") || "Add Sister Restaurant"}
        </h1>
      </div>

      <div
        className="card border-0 shadow-sm rounded-4"
        style={{ maxWidth: "700px" }}
      >
        <div className="card-body p-4 p-md-5">
          {error && (
            <div className="alert alert-danger py-2 mb-4 fw-medium fs-6">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="row g-4">
            <div className="col-12 col-md-6">
              <label className="form-label fw-bold small mb-1">
                RESTAURANT NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g., The Golden Truffle Downtown"
                required
                className="form-control"
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-bold small mb-1">
                WEBSITE SLUG (URL PART)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                  )
                }
                placeholder="e.g., truffle-downtown"
                required
                className="form-control"
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-bold small mb-1">
                CUISINE TYPE
              </label>
              <select
                value={cuisineType}
                onChange={(e) => setCuisineType(e.target.value)}
                className="form-select"
              >
                <option value="fine-dining">Fine Dining</option>
                <option value="casual">Casual Dining</option>
                <option value="bistro">Bistro / Cafe</option>
                <option value="luxury">Luxury / Private</option>
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-bold small mb-1">
                PHONE NUMBER
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., +1 (555) 987-6543"
                required
                className="form-control"
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-bold small mb-1">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., contact@restaurant.com"
                required
                className="form-control"
              />
            </div>

            {tier === "Premium" && (
              <div className="col-12">
                <label className="form-label fw-bold small mb-1">
                  MENU LAYOUT STYLE
                </label>
                <select
                  value={menuLayout}
                  onChange={(e) => setMenuLayout(e.target.value)}
                  className="form-select"
                >
                  <option value="image-left">Image Left (Classic List)</option>
                  <option value="image-right">Image Right (Modern List)</option>
                  <option value="image-top">Image Top (Card Grid)</option>
                  <option value="image-bottom">
                    Image Bottom (Magazine Style)
                  </option>
                  <option value="text-centered">
                    Text Centered (No Images)
                  </option>
                </select>
              </div>
            )}

            <div className="col-12">
              <label className="form-label fw-bold small mb-1">
                FULL ADDRESS
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 456 Gourmet Way, San Francisco, CA 94102"
                required
                className="form-control"
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-bold small mb-1">
                RESTAURANT TAGLINE / DESCRIPTION
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your culinary excellence..."
                rows="3"
                className="form-control"
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-bold small mb-1">
                RESTAURANT LOGO IMAGE
              </label>
              <div className="border border-dashed p-4 text-center rounded position-relative bg-light">
                {logoBase64 ? (
                  <div>
                    <img
                      src={logoBase64}
                      alt="Logo Preview"
                      className="rounded mb-2"
                      style={{ maxHeight: "80px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setLogoBase64(null)}
                      className="btn btn-outline-danger btn-sm d-block mx-auto"
                    >
                      Remove Logo
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="display-6 mb-2">📸</div>
                    <div className="small text-muted">
                      Click to upload logo image
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setLogoBase64(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                      style={{ cursor: "pointer" }}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="col-12 d-flex gap-3 justify-content-end border-top pt-4 mt-2">
              <button
                type="button"
                onClick={() =>
                  navigate(`/bulebeti/${restaurantName}/admin/locations`)
                }
                className="btn btn-outline-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary px-4 py-2 fw-bold"
              >
                {loading ? "Registering..." : "Register Sister Restaurant"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddLocation;

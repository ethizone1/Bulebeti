import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import config from "../../config";

const DEFAULT_INGREDIENTS = [
  "Injera",
  "Berbere",
  "Niter Kibbeh (Spiced Butter)",
  "Garlic",
  "Onion",
  "Tomato",
  "Rosemary",
  "Green Chili / Jalapeño",
  "Cardamom",
  "Ginger",
  "Beef",
  "Chicken",
  "Lamb",
  "Fish",
  "Lentils (Misir)",
  "Shiro (Chickpea Flour)",
  "Spinach (Gomen)",
  "Cabbage",
  "Carrots",
  "Potatoes",
  "Cheese (Ayib)",
  "Olive Oil",
];

const DEFAULT_CONTAINS = [
  "Dairy",
  "Gluten",
  "Nuts / Peanuts",
  "Eggs",
  "Soy",
  "Sesame",
  "Shellfish",
  "Mustard",
];

const EditMenuItem = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { restaurantName, itemId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [availableCategories, setAvailableCategories] = useState([
    "Breakfast",
    "Lunch",
    "Dinner",
    "Starters",
    "Mains",
    "Desserts",
    "Beverages",
    "Hot Drinks",
    "Cold Drinks",
    "Our Signature",
  ]);
  const [selectedCategories, setSelectedCategories] = useState(["Mains"]);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    isAvailable: true,
    imageUrl: "",
    ingredients: [],
    contains: [],
  });

  const [imagePreview, setImagePreview] = useState(null);

  // Fetch the real item from the backend
  useEffect(() => {
    if (!itemId) {
      setError("No item ID provided.");
      setLoading(false);
      return;
    }

    const fetchItem = async () => {
      try {
        setLoading(true);
        // Fetch all menu items and find by ID
        const res = await fetch(`${config.API_URL}/api/menu`);
        if (!res.ok) throw new Error("Failed to fetch menu");
        const items = await res.json();
        const item = items.find((i) => i._id === itemId);

        if (!item) throw new Error("Menu item not found");

        const cats = Array.isArray(item.categories) && item.categories.length > 0
          ? item.categories
          : (item.category ? item.category.split(',').map(c => c.trim()) : ["Mains"]);

        setSelectedCategories(cats);

        // Ensure all loaded categories exist in availableCategories
        setAvailableCategories((prev) => {
          const combined = Array.from(new Set([...prev, ...cats]));
          return combined;
        });

        // 1. Ingredients mapping
        const itemIngMap = {};
        if (Array.isArray(item.ingredients)) {
          item.ingredients.forEach((ing) => {
            if (typeof ing === "string") itemIngMap[ing] = true;
            else if (ing?.name) itemIngMap[ing.name] = Boolean(ing.checked);
          });
        }

        let allIngNames = [...DEFAULT_INGREDIENTS];
        if (Array.isArray(items)) {
          items.forEach((it) => {
            if (Array.isArray(it.ingredients)) {
              it.ingredients.forEach((ing) => {
                const n = typeof ing === "string" ? ing : ing?.name;
                if (n && !allIngNames.includes(n)) allIngNames.push(n);
              });
            }
          });
        }
        Object.keys(itemIngMap).forEach((n) => {
          if (!allIngNames.includes(n)) allIngNames.push(n);
        });

        // 2. Contains mapping
        const itemConMap = {};
        if (Array.isArray(item.contains)) {
          item.contains.forEach((con) => {
            if (typeof con === "string") itemConMap[con] = true;
            else if (con?.name) itemConMap[con.name] = Boolean(con.checked);
          });
        }

        let allConNames = [...DEFAULT_CONTAINS];
        if (Array.isArray(items)) {
          items.forEach((it) => {
            if (Array.isArray(it.contains)) {
              it.contains.forEach((con) => {
                const n = typeof con === "string" ? con : con?.name;
                if (n && !allConNames.includes(n)) allConNames.push(n);
              });
            }
          });
        }
        Object.keys(itemConMap).forEach((n) => {
          if (!allConNames.includes(n)) allConNames.push(n);
        });

        setFormData({
          name: item.name || "",
          price: item.price != null ? String(item.price) : "",
          description: item.description || "",
          isAvailable: item.isAvailable !== false,
          imageUrl: item.imageUrl || "",
          ingredients: allIngNames.map((name) => ({
            name,
            checked: Boolean(itemIngMap[name]),
          })),
          contains: allConNames.map((name) => ({
            name,
            checked: Boolean(itemConMap[name]),
          })),
        });

        if (item.imageUrl) setImagePreview(item.imageUrl);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setFormData((prev) => ({ ...prev, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedCategories.length === 0) {
      alert("Please select at least one category or meal timing.");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${config.API_URL}/api/menu/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({
          name: formData.name,
          categories: selectedCategories,
          category: selectedCategories.join(", "),
          price: parseFloat(formData.price),
          description: formData.description,
          isAvailable: formData.isAvailable,
          imageUrl: formData.imageUrl,
          ingredients: formData.ingredients,
          contains: formData.contains,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Token expired or invalid — clear and redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          alert("Your session has expired. Please log in again.");
          navigate(`/bulebeti/${restaurantName}/login`);
          return;
        }

        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.msg || "Failed to update menu item");
      }

      navigate(`/bulebeti/${restaurantName}/admin/menu`);
    } catch (err) {
      console.error(err);
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px",
          color: "var(--on-surface-variant)",
        }}
      >
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</div>
        Loading menu item...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "80px" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>❌</div>
        <p style={{ color: "#dc2626", fontWeight: "600" }}>{error}</p>
        <button
          onClick={() => navigate(`/bulebeti/${restaurantName}/admin/menu`)}
          className="btn btn-outline"
          style={{ marginTop: "16px" }}
        >
          ← Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="edit-menu-item py-3">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fs-3 fw-bold m-0">✏️ Edit Menu Item</h1>
          <p className="text-muted m-0 mt-1">
            Changes will be saved to the database and reflected immediately.
          </p>
        </div>
        <button
          onClick={() => navigate(`/bulebeti/${restaurantName}/admin/menu`)}
          className="btn btn-outline-secondary fw-bold px-4"
        >
          &larr; Back
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card border-0 shadow-sm rounded-4 p-4 p-md-5 mx-auto"
        style={{ maxWidth: "800px" }}
      >
        <div className="row g-4">
          {/* Name */}
          <div className="col-12">
            <label className="form-label fw-bold small mb-1">ITEM NAME *</label>
            <input
              required
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Truffle Arancini"
            />
          </div>

          {/* Categories & Meal Timings Checklist */}
          <div className="col-12">
            <label className="form-label fw-bold small mb-1">
              CATEGORIES & MEAL TIMINGS * (Check all that apply)
            </label>
            <div className="bg-light border rounded p-3">
              <div className="row g-2">
                {availableCategories.map((cat) => {
                  const isChecked = selectedCategories.includes(cat);
                  return (
                    <div key={cat} className="col-6 col-sm-4 col-md-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`edit-cat-${cat}`}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories([...selectedCategories, cat]);
                            } else {
                              setSelectedCategories(
                                selectedCategories.filter((c) => c !== cat)
                              );
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        />
                        <label
                          className="form-check-label small fw-semibold"
                          htmlFor={`edit-cat-${cat}`}
                          style={{ cursor: "pointer" }}
                        >
                          {cat}
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="d-flex gap-2 mt-3 pt-2 border-top">
                <input
                  type="text"
                  placeholder="Add custom category (e.g. Ethiopian Specialties)..."
                  className="form-control form-control-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = e.target.value.trim();
                      if (val && !availableCategories.includes(val)) {
                        setAvailableCategories([...availableCategories, val]);
                        setSelectedCategories([...selectedCategories, val]);
                        e.target.value = "";
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.target.previousSibling;
                    const val = input.value.trim();
                    if (val && !availableCategories.includes(val)) {
                      setAvailableCategories([...availableCategories, val]);
                      setSelectedCategories([...selectedCategories, val]);
                      input.value = "";
                    }
                  }}
                  className="btn btn-outline-secondary btn-sm px-3"
                >
                  {t("admin_item_btn_add")}
                </button>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-bold small mb-1">
              PRICE (USD) *
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              placeholder="e.g. 18.00"
            />
          </div>

          {/* Description */}
          <div className="col-12">
            <label className="form-label fw-bold small mb-1">DESCRIPTION</label>
            <textarea
              rows="3"
              className="form-control"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the dish, its flavours, and preparation..."
            />
          </div>

          {/* Ingredients */}
          <div className="col-12">
            <label className="form-label fw-bold small mb-1">
              {t("admin_item_lbl_ing")}
            </label>
            <div className="bg-light border rounded p-3">
              <div
                className="row g-2"
                style={{ maxHeight: "220px", overflowY: "auto" }}
              >
                {formData.ingredients.map((ing, idx) => (
                  <div key={ing.name || idx} className="col-6 col-sm-4 col-md-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`edit-ing-${idx}`}
                        checked={Boolean(ing.checked)}
                        onChange={(e) => {
                          const newIngs = [...formData.ingredients];
                          newIngs[idx].checked = e.target.checked;
                          setFormData({ ...formData, ingredients: newIngs });
                        }}
                        style={{ cursor: "pointer" }}
                      />
                      <label
                        className="form-check-label small fw-semibold"
                        htmlFor={`edit-ing-${idx}`}
                        style={{ cursor: "pointer" }}
                      >
                        {ing.name}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <div className="d-flex gap-2 mt-3 pt-2 border-top">
                <input
                  type="text"
                  placeholder={t("admin_item_ph_ing")}
                  className="form-control form-control-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = e.target.value.trim();
                      if (val) {
                        const existsIdx = formData.ingredients.findIndex(
                          (i) => i.name.toLowerCase() === val.toLowerCase()
                        );
                        if (existsIdx >= 0) {
                          const newIngs = [...formData.ingredients];
                          newIngs[existsIdx].checked = true;
                          setFormData({ ...formData, ingredients: newIngs });
                        } else {
                          setFormData({
                            ...formData,
                            ingredients: [
                              ...formData.ingredients,
                              { name: val, checked: true },
                            ],
                          });
                        }
                        e.target.value = "";
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.target.previousSibling;
                    const val = input.value.trim();
                    if (val) {
                      const existsIdx = formData.ingredients.findIndex(
                        (i) => i.name.toLowerCase() === val.toLowerCase()
                      );
                      if (existsIdx >= 0) {
                        const newIngs = [...formData.ingredients];
                        newIngs[existsIdx].checked = true;
                        setFormData({ ...formData, ingredients: newIngs });
                      } else {
                        setFormData({
                          ...formData,
                          ingredients: [
                            ...formData.ingredients,
                            { name: val, checked: true },
                          ],
                        });
                      }
                      input.value = "";
                    }
                  }}
                  className="btn btn-outline-secondary btn-sm px-3"
                >
                  {t("admin_item_btn_add")}
                </button>
              </div>
            </div>
          </div>

          {/* Contains / Allergens */}
          <div className="col-12">
            <label className="form-label fw-bold small mb-1">
              {t("admin_item_lbl_con")}
            </label>
            <div className="bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded p-3">
              <div
                className="row g-2"
                style={{ maxHeight: "220px", overflowY: "auto" }}
              >
                {formData.contains.map((allergen, idx) => (
                  <div
                    key={allergen.name || idx}
                    className="col-6 col-sm-4 col-md-3"
                  >
                    <div className="form-check text-danger">
                      <input
                        className="form-check-input border-danger"
                        type="checkbox"
                        id={`edit-allergen-${idx}`}
                        checked={Boolean(allergen.checked)}
                        onChange={(e) => {
                          const newContains = [...formData.contains];
                          newContains[idx].checked = e.target.checked;
                          setFormData({ ...formData, contains: newContains });
                        }}
                        style={{ cursor: "pointer" }}
                      />
                      <label
                        className="form-check-label small fw-semibold"
                        htmlFor={`edit-allergen-${idx}`}
                        style={{ cursor: "pointer" }}
                      >
                        {allergen.name}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <div className="d-flex gap-2 mt-3 pt-2 border-top border-danger border-opacity-25">
                <input
                  type="text"
                  placeholder={t("admin_item_ph_con")}
                  className="form-control form-control-sm border-danger border-opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = e.target.value.trim();
                      if (val) {
                        const existsIdx = formData.contains.findIndex(
                          (c) => c.name.toLowerCase() === val.toLowerCase()
                        );
                        if (existsIdx >= 0) {
                          const newContains = [...formData.contains];
                          newContains[existsIdx].checked = true;
                          setFormData({ ...formData, contains: newContains });
                        } else {
                          setFormData({
                            ...formData,
                            contains: [
                              ...formData.contains,
                              { name: val, checked: true },
                            ],
                          });
                        }
                        e.target.value = "";
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.target.previousSibling;
                    const val = input.value.trim();
                    if (val) {
                      const existsIdx = formData.contains.findIndex(
                        (c) => c.name.toLowerCase() === val.toLowerCase()
                      );
                      if (existsIdx >= 0) {
                        const newContains = [...formData.contains];
                        newContains[existsIdx].checked = true;
                        setFormData({ ...formData, contains: newContains });
                      } else {
                        setFormData({
                          ...formData,
                          contains: [
                            ...formData.contains,
                            { name: val, checked: true },
                          ],
                        });
                      }
                      input.value = "";
                    }
                  }}
                  className="btn btn-danger btn-sm bg-opacity-25 px-3 border-danger border-opacity-50"
                >
                  {t("admin_item_btn_add")}
                </button>
              </div>
            </div>
          </div>

          {/* Availability toggle */}
          <div className="col-12">
            <div className="d-flex align-items-center gap-3 p-3 rounded bg-light border">
              <div
                className="form-check form-switch m-0"
                style={{ cursor: "pointer", transform: "scale(1.2)" }}
              >
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={formData.isAvailable}
                  onChange={(e) =>
                    setFormData({ ...formData, isAvailable: e.target.checked })
                  }
                  style={{ cursor: "pointer" }}
                />
              </div>
              <div>
                <div className="fw-bold mb-1">
                  {formData.isAvailable
                    ? "✅ Visible on menu"
                    : "🙈 Hidden from menu"}
                </div>
                <div className="small text-muted">
                  Toggle to show or hide this item on the public menu
                </div>
              </div>
            </div>
          </div>

          {/* Image upload */}
          <div className="col-12">
            <label className="form-label fw-bold small mb-1">ITEM IMAGE</label>
            <div className="d-flex flex-column flex-sm-row gap-3 align-items-sm-center">
              {/* Preview */}
              <div
                className="border rounded bg-light d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
                style={{ width: "110px", height: "110px" }}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-100 h-100 object-fit-cover"
                  />
                ) : (
                  <span className="display-6">🍽️</span>
                )}
              </div>
              {/* Upload */}
              <label
                className="flex-grow-1 border border-dashed rounded p-4 text-center bg-light"
                style={{ cursor: "pointer" }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="d-none"
                />
                <div className="fs-3 mb-2">📷</div>
                <div className="fw-bold small mb-1">
                  Click to upload new image
                </div>
                <div className="small text-muted">
                  PNG, JPG, WEBP &mdash; recommended 800&times;600px
                </div>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="col-12 d-flex flex-column flex-md-row gap-3 mt-4 pt-4 border-top">
            <button
              type="button"
              onClick={() => navigate(`/bulebeti/${restaurantName}/admin/menu`)}
              className="btn btn-outline-secondary px-4 py-2 order-2 order-md-1 w-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary px-4 py-2 fw-bold order-1 order-md-2 w-100"
            >
              {saving ? "⏳ Saving..." : "✅ Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditMenuItem;

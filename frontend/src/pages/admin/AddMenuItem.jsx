import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import config from "../../config";

const AddMenuItem = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { restaurantName } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    category: "Mains",
    price: "",
    description: "",
    ingredients: [],
    contains: [],
    showIngredients: true,
    showContains: true,
    timing: "All Items",
    image: null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Fetch restaurant ID
      const restRes = await fetch(
        `${config.API_URL}/api/restaurants/${restaurantName}`,
      );
      if (!restRes.ok) throw new Error("Restaurant not found");
      const restaurant = await restRes.json();

      // 2. Format description with ingredients/contains if needed
      const ingredientsList = formData.ingredients
        .filter((i) => i.checked)
        .map((i) => i.name)
        .join(", ");
      const containsList = formData.contains
        .filter((i) => i.checked)
        .map((i) => i.name)
        .join(", ");
      const fullDescription = `${formData.description}\nIngredients: ${ingredientsList}\nContains: ${containsList}`;

      // 3. Post to backend
      const token = localStorage.getItem("token");
      const response = await fetch(`${config.API_URL}/api/menu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.timing, // Since timing was used as category
          price: parseFloat(formData.price.replace(/[^0-9.]/g, "")) || 0,
          description: formData.description,
          ingredients: formData.ingredients,
          contains: formData.contains,
          isAvailable: true,
          imageUrl: formData.image, // Add the base64 image data
          restaurantId: restaurant._id,
        }),
      });

      if (!response.ok) throw new Error("Failed to add menu item");

      alert(t("admin_item_add_success"));
      navigate(`/bulebeti/${restaurantName}/admin/menu`);
    } catch (err) {
      console.error(err);
      alert("Error adding menu item: " + err.message);
    }
  };

  return (
    <div className="add-menu-item py-3">
      <div className="mb-4">
        <h1 className="fs-3 fw-bold m-0">{t("admin_item_add_title")}</h1>
        <p className="text-muted mb-0">{t("admin_item_add_desc")}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card border-0 shadow-sm rounded-4 p-4 p-md-5 mx-auto"
        style={{ maxWidth: "800px" }}
      >
        <div className="row g-4">
          <div className="col-12">
            <label className="form-label fw-bold small mb-1">
              {t("admin_item_lbl_name")}
            </label>
            <input
              required
              type="text"
              placeholder={t("admin_item_ph_name")}
              className="form-control"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label fw-bold small mb-1">
              {t("admin_item_lbl_cat")}
            </label>
            <select
              className="form-select"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              <option>Starters</option>
              <option>Mains</option>
              <option>Desserts</option>
              <option>Beverages</option>
            </select>
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label fw-bold small mb-1">
              {t("admin_item_lbl_timing")}
            </label>
            <select
              className="form-select"
              value={formData.timing}
              onChange={(e) =>
                setFormData({ ...formData, timing: e.target.value })
              }
            >
              {[
                "Our Signature",
                "Breakfast",
                "Lunch",
                "Dinner",
                "Beverages",
                "Hot",
                "Cold",
                "All Items",
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12">
            <label className="form-label fw-bold small mb-1">
              {t("admin_item_lbl_price")}
            </label>
            <input
              required
              type="text"
              placeholder={t("admin_item_ph_price")}
              className="form-control"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-bold small mb-1">
              {t("admin_item_lbl_desc")}
            </label>
            <textarea
              required
              rows="3"
              placeholder={t("admin_item_ph_desc")}
              className="form-control"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-bold small mb-1">
              {t("admin_item_lbl_ing")}
            </label>
            <div className="bg-light border rounded p-3 d-flex flex-column gap-2">
              {formData.ingredients.length === 0 && (
                <div className="small text-muted fst-italic">
                  {t("admin_item_no_ing")}
                </div>
              )}
              {formData.ingredients.map((ing, idx) => (
                <div key={idx} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`ing-${idx}`}
                    checked={ing.checked}
                    onChange={(e) => {
                      const newIngs = [...formData.ingredients];
                      newIngs[idx].checked = e.target.checked;
                      setFormData({ ...formData, ingredients: newIngs });
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <label
                    className="form-check-label small"
                    htmlFor={`ing-${idx}`}
                    style={{ cursor: "pointer" }}
                  >
                    {ing.name}
                  </label>
                </div>
              ))}
              <div className="d-flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder={t("admin_item_ph_ing")}
                  className="form-control form-control-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (e.target.value.trim()) {
                        setFormData({
                          ...formData,
                          ingredients: [
                            ...formData.ingredients,
                            { name: e.target.value.trim(), checked: true },
                          ],
                        });
                        e.target.value = "";
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.target.previousSibling;
                    if (input.value.trim()) {
                      setFormData({
                        ...formData,
                        ingredients: [
                          ...formData.ingredients,
                          { name: input.value.trim(), checked: true },
                        ],
                      });
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

          <div className="col-12">
            <label className="form-label fw-bold small mb-1">
              {t("admin_item_lbl_con")}
            </label>
            <div className="bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded p-3 d-flex flex-column gap-2">
              {formData.contains.length === 0 && (
                <div className="small text-muted fst-italic">
                  {t("admin_item_no_con")}
                </div>
              )}
              {formData.contains.map((allergen, idx) => (
                <div key={idx} className="form-check text-danger">
                  <input
                    className="form-check-input border-danger"
                    type="checkbox"
                    id={`allergen-${idx}`}
                    checked={allergen.checked}
                    onChange={(e) => {
                      const newContains = [...formData.contains];
                      newContains[idx].checked = e.target.checked;
                      setFormData({ ...formData, contains: newContains });
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <label
                    className="form-check-label small"
                    htmlFor={`allergen-${idx}`}
                    style={{ cursor: "pointer" }}
                  >
                    {allergen.name}
                  </label>
                </div>
              ))}
              <div className="d-flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder={t("admin_item_ph_con")}
                  className="form-control form-control-sm border-danger border-opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (e.target.value.trim()) {
                        setFormData({
                          ...formData,
                          contains: [
                            ...formData.contains,
                            { name: e.target.value.trim(), checked: true },
                          ],
                        });
                        e.target.value = "";
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.target.previousSibling;
                    if (input.value.trim()) {
                      setFormData({
                        ...formData,
                        contains: [
                          ...formData.contains,
                          { name: input.value.trim(), checked: true },
                        ],
                      });
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

          <div className="col-12">
            <div className="border border-dashed p-4 p-md-5 text-center rounded position-relative bg-light">
              {formData.image ? (
                <div>
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="rounded mb-3"
                    style={{ maxHeight: "150px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: null })}
                    className="btn btn-outline-danger btn-sm d-block mx-auto"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <>
                  <div className="display-6 mb-2">🖼️</div>
                  <div className="fw-bold">{t("admin_item_upload")}</div>
                  <div className="small text-muted mt-1">
                    {t("admin_item_upload_rec")}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, image: reader.result });
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

          <div className="col-12 d-flex flex-column flex-md-row gap-3 mt-4 pt-4 border-top">
            <button
              type="button"
              onClick={() => navigate(`/bulebeti/${restaurantName}/admin/menu`)}
              className="btn btn-outline-secondary px-4 py-2 order-2 order-md-1 w-100"
            >
              {t("admin_item_btn_cancel")}
            </button>
            <button
              type="submit"
              className="btn btn-primary px-4 py-2 fw-bold order-1 order-md-2 w-100"
            >
              {t("admin_item_btn_reg")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddMenuItem;

import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import config from "../../config";

const MenuDescription = ({ text }) => {
  const [expanded, setExpanded] = React.useState(false);
  if (!text) return null;
  const shouldTruncate = text.length > 100;

  return (
    <p
      style={{
        color: "var(--on-surface-variant)",
        fontSize: "14px",
        lineHeight: "1.6",
        marginBottom: "12px",
      }}
    >
      {!shouldTruncate || expanded ? text : `${text.substring(0, 100)}...`}
      {shouldTruncate && (
        <span
          onClick={() => setExpanded(!expanded)}
          style={{
            color: "var(--primary)",
            cursor: "pointer",
            fontWeight: "700",
            marginLeft: "8px",
            fontSize: "13px",
          }}
        >
          {expanded ? "Show Less" : "Read More"}
        </span>
      )}
    </p>
  );
};

const MenuPage = () => {
  const { t } = useLanguage();
  const { restaurantName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const displayName = restaurantName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  // Layout state will be set from DB

  // Dynamic filter based on URL hash (e.g., #beverages)
  const activeFilter = location.hash
    ? location.hash.replace("#", "").replace(/-/g, " ").toLowerCase()
    : "all items";

  const [menuCategories, setMenuCategories] = React.useState([]);
  const [_loading, setLoading] = React.useState(true);
  const [restaurantTier, setRestaurantTier] = React.useState("Platinum");
  const [globalImgPos, setGlobalImgPos] = React.useState("Left");

  const isPlatinumOrAbove = restaurantTier === "Platinum" || restaurantTier === "Premium";

  // Online Order Cart & Checkout State (Platinum & Premium feature)
  const [cart, setCart] = React.useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [orderForm, setOrderForm] = React.useState({
    customerName: "",
    phone: "",
    email: "",
    orderType: "Takeout",
    tableNumber: "",
    deliveryAddress: "",
    specialInstructions: "",
  });
  const [orderSubmitting, setOrderSubmitting] = React.useState(false);
  const [orderSuccess, setOrderSuccess] = React.useState(false);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      const numericPrice = parseFloat(item.price.replace(/[^0-9.]/g, "")) || 0;
      return [...prev, { ...item, numericPrice, qty: 1 }];
    });
  };

  const updateCartQty = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean),
    );
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + item.numericPrice * item.qty, 0);
  const totalCartItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    setOrderSubmitting(true);
    setTimeout(() => {
      setOrderSubmitting(false);
      setOrderSuccess(true);
    }, 1000);
  };

  React.useEffect(() => {
    let intervalId;

    const fetchMenu = async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true);
        // 1. Get restaurant
        const restRes = await fetch(
          `${config.API_URL}/api/restaurants/${restaurantName}`,
        );
        if (!restRes.ok) throw new Error("Restaurant not found");
        const restaurant = await restRes.json();
        setRestaurantTier(restaurant.subscriptionTier || "Basic");

        let layoutMap = {
          "image-left": "Left",
          "image-right": "Right",
          "image-top": "Top",
          "image-bottom": "Bottom",
          "text-centered": "Center",
        };
        setGlobalImgPos(layoutMap[restaurant.menuLayout] || "Left");

        // 2. Get menu
        const menuRes = await fetch(
          `${config.API_URL}/api/menu/restaurant/${restaurant._id}`,
        );
        if (!menuRes.ok) throw new Error("Failed to fetch menu");
        const menuData = await menuRes.json();

        // 3. Group by categories (supporting multi-category menu items)
        const categoriesMap = {};
        menuData.forEach((item) => {
          const itemCats =
            Array.isArray(item.categories) && item.categories.length > 0
              ? item.categories
              : item.category
                ? item.category.split(",").map((c) => c.trim())
                : ["Mains"];

          itemCats.forEach((catName) => {
            if (!categoriesMap[catName]) {
              categoriesMap[catName] = { name: catName, items: [] };
            }
            if (!categoriesMap[catName].items.some((i) => i.id === item._id)) {
              categoriesMap[catName].items.push({
                id: item._id,
                name: item.name,
                price: `$${item.price}`,
                description: item.description,
                ingredients:
                  item.ingredients && item.ingredients.length > 0
                    ? item.ingredients
                    : "See description",
                contains:
                  item.contains && item.contains.length > 0
                    ? item.contains
                    : "Ask server",
                visible: item.isAvailable,
                img:
                  item.imageUrl ||
                  "https://images.unsplash.com/photo-1541529086526-db283c563270?w=400&q=80",
                timing: catName,
              });
            }
          });
        });

        setMenuCategories(Object.values(categoriesMap));
      } catch (err) {
        console.error("Error fetching menu:", err);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    // Initial fetch
    fetchMenu();

    // Set up polling every 3 seconds to keep it "real-time" synced with the admin dashboard
    intervalId = setInterval(() => {
      fetchMenu(true);
    }, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [restaurantName]);

  return (
    <div className="menu-page" style={{ backgroundColor: "var(--surface)" }}>
      {/* Signature Section - Featured at Top of User Page */}
      {restaurantTier !== "Basic" &&
        (activeFilter === "all items" || activeFilter === "our signature") && (
          <section
            id="signature"
            style={{
              padding: "var(--spacing-xl) 0",
              backgroundColor: "var(--primary)",
              color: "white",
              textAlign: "center",
              borderBottom: "4px solid var(--gold)",
            }}
          >
            <div className="container">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{ flex: "1", minWidth: "300px", textAlign: "left" }}
                >
                  <h4
                    style={{
                      color: "var(--gold)",
                      letterSpacing: "0.2em",
                      fontSize: "14px",
                      marginBottom: "8px",
                    }}
                  >
                    {t("menu_sig_label")}
                  </h4>
                  <h2
                    style={{
                      color: "white",
                      marginBottom: "var(--spacing-md)",
                    }}
                  >
                    {t("menu_sig_title")}
                  </h2>
                  <p
                    style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px" }}
                  >
                    {t("menu_sig_desc")}
                  </p>
                </div>
                {(() => {
                  const allItems = menuCategories
                    .flatMap((c) => c.items)
                    .filter((i) => i.visible);
                  const customImgs = allItems
                    .filter((i) => i.img && !i.img.includes("unsplash.com"))
                    .map((i) => i.img);
                  const fallbackImgs = allItems
                    .filter((i) => i.img && i.img.includes("unsplash.com"))
                    .map((i) => i.img);
                  const images = [...customImgs, ...fallbackImgs];

                  return (
                    <div
                      style={{
                        flex: "1",
                        minWidth: "300px",
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          gridRow: "span 2",
                          height: "300px",
                          borderRadius: "var(--radius-lg)",
                          overflow: "hidden",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          backgroundColor: "rgba(255,255,255,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {images[0] ? (
                          <img
                            src={images[0]}
                            alt="Signature Dish"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: "64px" }}>🍽️</span>
                        )}
                      </div>
                      <div
                        style={{
                          height: "142px",
                          backgroundColor: "rgba(255,255,255,0.1)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                          color: "var(--gold)",
                          overflow: "hidden",
                        }}
                      >
                        {images[1] ? (
                          <img
                            src={images[1]}
                            alt="Featured Dish"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          "🍷"
                        )}
                      </div>
                      <div
                        style={{
                          height: "142px",
                          backgroundColor: "rgba(255,255,255,0.1)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                          color: "var(--gold)",
                          overflow: "hidden",
                        }}
                      >
                        {images[2] ? (
                          <img
                            src={images[2]}
                            alt="Featured Drink"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          "🕯️"
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>
        )}

      <div style={{ padding: "var(--spacing-xl) 0" }}>
        <div
          className="container"
          style={{ maxWidth: globalImgPos === "Center" ? "800px" : "1000px" }}
        >
          <div
            style={{ textAlign: "center", marginBottom: "var(--spacing-xl)" }}
          >
            <h1
              style={{
                fontSize: "clamp(32px, 8vw, 48px)",
                marginBottom: "var(--spacing-md)",
                textTransform: "capitalize",
              }}
            >
              {activeFilter === "all items" ? t("menu_our_menu") : activeFilter}
            </h1>
            <p
              style={{
                color: "var(--on-surface-variant)",
                fontSize: "clamp(14px, 4vw, 18px)",
                padding: "0 20px",
                marginBottom: "var(--spacing-lg)",
              }}
            >
              {activeFilter === "all items"
                ? t("menu_all_desc")
                : t("menu_filter_desc").replace("{filter}", activeFilter)}
            </p>

            {/* Menu Category Dropdown Filter */}
            {restaurantTier !== "Basic" && (
              <div style={{ display: "inline-block", position: "relative" }}>
                <select
                  value={activeFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "all items") {
                      navigate(`/bulebeti/${restaurantName}/menu#all-items`);
                    } else if (val === "our signature") {
                      navigate(`/bulebeti/${restaurantName}/menu#our-signature`);
                    } else {
                      navigate(
                        `/bulebeti/${restaurantName}/menu#${val.replace(/ /g, "-")}`,
                      );
                    }
                  }}
                  style={{
                    padding: "12px 40px 12px 20px",
                    fontSize: "16px",
                    fontWeight: "600",
                    borderRadius: "30px",
                    border: "2px solid var(--gold)",
                    backgroundColor: "white",
                    color: "var(--primary)",
                    cursor: "pointer",
                    appearance: "none",
                    outline: "none",
                    boxShadow: "var(--shadow-1)",
                  }}
                >
                  <option value="our signature">
                    {t("menu_signature") || "Our Signature"}
                  </option>
                  {menuCategories
                    .filter(
                      (cat) =>
                        cat.name.toLowerCase() !== "all items" &&
                        cat.name.toLowerCase() !== "our signature",
                    )
                    .map((cat) => (
                      <option key={cat.name} value={cat.name.toLowerCase()}>
                        {cat.name}
                      </option>
                    ))}
                  <option value="all items">
                    {t("menu_all") || "All Items"}
                  </option>
                </select>
                <span
                  style={{
                    position: "absolute",
                    right: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    fontSize: "12px",
                    color: "var(--gold)",
                  }}
                >
                  ▼
                </span>
              </div>
            )}
          </div>

          {/* Online Ordering Status Banner (Platinum & Premium feature) */}
          <div style={{ maxWidth: "1200px", margin: "0 auto 28px auto", padding: "0 var(--spacing-lg)" }}>
            {isPlatinumOrAbove ? (
              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  border: "1.5px solid #86efac",
                  borderRadius: "14px",
                  padding: "16px 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "14px",
                  flexWrap: "wrap",
                  boxShadow: "0 4px 12px rgba(22, 101, 52, 0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>🛍️</span>
                  <div>
                    <strong style={{ color: "#166534", fontSize: "16px" }}>Online Ordering Active</strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#15803d" }}>
                      Select items below to place your order online for Dine-In, Takeout, or Delivery!
                    </p>
                  </div>
                </div>
                <span
                  style={{
                    backgroundColor: "#166534",
                    color: "white",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "700",
                    letterSpacing: "0.5px",
                  }}
                >
                  Platinum Feature
                </span>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "#fffbe6",
                  border: "1px solid #ffe58f",
                  borderRadius: "14px",
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  fontSize: "13px",
                  color: "#856404",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong>📖 Digital Menu (View Only)</strong>
                  <span style={{ marginLeft: "8px" }}>
                    Online Ordering is enabled on <strong>Platinum</strong> &amp; <strong>Premium</strong> plans.
                  </span>
                </div>
                <button
                  onClick={() => navigate("/register")}
                  style={{
                    backgroundColor: "#d97706",
                    color: "white",
                    border: "none",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Upgrade to Platinum
                </button>
              </div>
            )}
          </div>

          <div className="container" style={{ paddingBottom: "var(--spacing-xxl)" }}>
            {menuCategories.map((category) => {
              let visibleItems = category.items.filter((item) => item.visible);

              if (
                activeFilter !== "all items" &&
                activeFilter !== "our signature"
              ) {
                if (category.name.toLowerCase() !== activeFilter) {
                  return null;
                }
              } else if (activeFilter === "our signature") {
                return null;
              }

              if (visibleItems.length === 0) return null;

              return (
                <div
                  key={category.name}
                  style={{ marginBottom: "var(--spacing-xxl)" }}
                >
                <h2
                  style={{
                    textAlign: "center",
                    borderBottom: "1px solid var(--platinum)",
                    paddingBottom: "12px",
                    marginBottom: "var(--spacing-xl)",
                    color: "var(--gold)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontSize: "clamp(16px, 5vw, 20px)",
                  }}
                >
                  {category.name}
                </h2>

                <div style={{ display: "grid", gap: "clamp(24px, 5vw, 48px)" }}>
                  {visibleItems.map((item) => (
                    <div
                      key={item.id}
                      className="menu-item-row"
                      style={{
                        display: "flex",
                        flexDirection:
                          globalImgPos === "Center" || globalImgPos === "Top"
                            ? "column"
                            : globalImgPos === "Bottom"
                              ? "column-reverse"
                              : globalImgPos === "Right"
                                ? "row-reverse"
                                : "row",
                        alignItems:
                          globalImgPos === "Center" || globalImgPos === "Top" || globalImgPos === "Bottom"
                            ? "center"
                            : "flex-start",
                        gap: "clamp(16px, 4vw, 32px)",
                        textAlign:
                          globalImgPos === "Center" ? "center" : "left",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: "0" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              globalImgPos === "Center"
                                ? "center"
                                : "space-between",
                            alignItems: "baseline",
                            marginBottom: "8px",
                            gap: "16px",
                            flexWrap: "wrap",
                          }}
                        >
                          <h3
                            style={{
                              fontSize: "clamp(18px, 5vw, 24px)",
                              margin: 0,
                            }}
                          >
                            {item.name}
                          </h3>
                          {globalImgPos !== "Center" && (
                            <div
                              style={{
                                fontWeight: "700",
                                fontSize: "clamp(16px, 4vw, 20px)",
                                color: "var(--primary)",
                              }}
                            >
                              {item.price}
                            </div>
                          )}
                        </div>
                        <MenuDescription text={item.description} />

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                            letterSpacing: "0.05em",
                          }}
                        >
                          <div>
                            <span style={{ color: "var(--gold)" }}>
                              {t("menu_ingredients")}
                            </span>{" "}
                            <span
                              style={{ color: "#6b7280", fontWeight: "400" }}
                            >
                              {Array.isArray(item.ingredients)
                                ? item.ingredients
                                    .filter((i) => i.checked)
                                    .map((i) => i.name)
                                    .join(", ")
                                : item.ingredients}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: "#dc2626" }}>
                              {t("menu_contains")}
                            </span>{" "}
                            <span
                              style={{ color: "#6b7280", fontWeight: "400" }}
                            >
                              {Array.isArray(item.contains)
                                ? item.contains
                                    .filter((i) => i.checked)
                                    .map((i) => i.name)
                                    .join(", ")
                                : item.contains}
                            </span>
                          </div>
                        </div>

                        {globalImgPos === "Center" && (
                          <div
                            style={{
                              fontWeight: "700",
                              fontSize: "20px",
                              color: "var(--primary)",
                              marginTop: "12px",
                            }}
                          >
                            {item.price}
                          </div>
                        )}

                        {/* Platinum & Premium Online Order Button */}
                        {isPlatinumOrAbove && (
                          <div style={{ marginTop: "14px" }}>
                            {cart.find((c) => c.id === item.id) ? (
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  backgroundColor: "#f0fdf4",
                                  border: "1px solid #86efac",
                                  borderRadius: "8px",
                                  padding: "4px 10px",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(item.id, -1)}
                                  style={{
                                    width: "26px",
                                    height: "26px",
                                    borderRadius: "50%",
                                    border: "1px solid #166534",
                                    backgroundColor: "white",
                                    color: "#166534",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                  }}
                                >
                                  -
                                </button>
                                <span
                                  style={{
                                    fontWeight: "800",
                                    fontSize: "14px",
                                    color: "#166534",
                                    minWidth: "20px",
                                    textAlign: "center",
                                  }}
                                >
                                  {cart.find((c) => c.id === item.id).qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(item.id, 1)}
                                  style={{
                                    width: "26px",
                                    height: "26px",
                                    borderRadius: "50%",
                                    border: "1px solid #166534",
                                    backgroundColor: "#166534",
                                    color: "white",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToCart(item)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "8px 16px",
                                  borderRadius: "8px",
                                  backgroundColor: "#10b981",
                                  color: "white",
                                  border: "none",
                                  fontSize: "13px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  boxShadow: "0 2px 6px rgba(16,185,129,0.3)",
                                  transition: "all 0.2s",
                                }}
                              >
                                🛒 Order Online
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          width: "100%",
                          maxWidth:
                            globalImgPos === "Center" ? "600px" : "350px",
                          height: "clamp(180px, 40vw, 240px)",
                          borderRadius: "var(--radius-lg)",
                          overflow: "hidden",
                          boxShadow: "var(--shadow-2)",
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={item.img}
                          alt={item.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Restaurant Contact Section */}
          <section
            style={{
              marginTop: "var(--spacing-xxl)",
              padding: "clamp(20px, 5vw, 60px)",
              backgroundColor: "#f9fafb",
              borderRadius: "24px",
              border: "1px solid var(--platinum)",
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: "28px", marginBottom: "12px" }}>
              {t("menu_inquiries")}
            </h2>
            <p
              style={{
                color: "#6b7280",
                marginBottom: "32px",
                maxWidth: "600px",
                margin: "0 auto 32px auto",
              }}
            >
              {t("menu_inquiries_desc").replace("{restaurant}", displayName)}
            </p>

            <form
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px",
                maxWidth: "800px",
                margin: "0 auto",
              }}
            >
              <input
                required
                type="text"
                placeholder={t("menu_name_ph")}
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid var(--platinum)",
                  fontSize: "14px",
                }}
              />
              <input
                required
                type="email"
                placeholder={t("menu_email_ph")}
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid var(--platinum)",
                  fontSize: "14px",
                }}
              />
              <div style={{ gridColumn: "1 / -1" }}>
                <textarea
                  required
                  rows="4"
                  placeholder={t("menu_message_ph")}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "8px",
                    border: "1px solid var(--platinum)",
                    fontSize: "14px",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "16px" }}
                >
                  {t("menu_send_msg")}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>

      {/* Floating View Order Cart Button (Platinum & Premium) */}
      {isPlatinumOrAbove && totalCartItems > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 1000,
          }}
        >
          <button
            onClick={() => {
              setOrderSuccess(false);
              setIsCheckoutOpen(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 24px",
              borderRadius: "30px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              fontSize: "15px",
              fontWeight: "800",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(16,185,129,0.45)",
              transition: "all 0.2s",
            }}
          >
            <span>🛍️ View Order ({totalCartItems})</span>
            <span style={{ backgroundColor: "rgba(255,255,255,0.25)", padding: "4px 10px", borderRadius: "14px" }}>
              ${totalCartPrice.toFixed(2)}
            </span>
          </button>
        </div>
      )}

      {/* Online Order Checkout Modal */}
      {isCheckoutOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1100,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "28px",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1px solid #f3f4f6", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#111827" }}>
                🛍️ Online Order — {displayName}
              </h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#9ca3af" }}
              >
                ✕
              </button>
            </div>

            {orderSuccess ? (
              <div style={{ textAlign: "center", padding: "24px 12px" }}>
                <div style={{ fontSize: "56px", marginBottom: "12px" }}>🎉</div>
                <h3 style={{ color: "#10b981", margin: "0 0 8px 0" }}>Order Placed Successfully!</h3>
                <p style={{ color: "#4b5563", fontSize: "14px", marginBottom: "20px" }}>
                  Thank you! Your order has been sent to <strong>{displayName}</strong>. The restaurant team will prepare your order shortly.
                </p>
                <button
                  onClick={() => {
                    setCart([]);
                    setIsCheckoutOpen(false);
                    setOrderSuccess(false);
                  }}
                  style={{
                    backgroundColor: "#10b981",
                    color: "white",
                    border: "none",
                    padding: "10px 24px",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handlePlaceOrder} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {/* Order Items List */}
                <div style={{ backgroundColor: "#fafafa", borderRadius: "10px", padding: "14px", border: "1px solid #f3f4f6" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "700", color: "#374151" }}>Your Order Items</h4>
                  {cart.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontSize: "13px" }}>
                      <div>
                        <strong>{item.name}</strong> × {item.qty}
                      </div>
                      <div style={{ fontWeight: "700", color: "#111827" }}>
                        ${(item.numericPrice * item.qty).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e5e7eb", paddingTop: "8px", marginTop: "8px", fontWeight: "800", fontSize: "15px", color: "#111827" }}>
                    <span>Total Amount:</span>
                    <span style={{ color: "#10b981" }}>${totalCartPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Order Type Selector */}
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "700", marginBottom: "6px" }}>Order Option *</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    {["Dine-In", "Takeout", "Delivery"].map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setOrderForm({ ...orderForm, orderType: type })}
                        style={{
                          padding: "8px",
                          borderRadius: "6px",
                          border: orderForm.orderType === type ? "2px solid #10b981" : "1px solid #d1d5db",
                          backgroundColor: orderForm.orderType === type ? "#ecfdf5" : "white",
                          color: orderForm.orderType === type ? "#065f46" : "#374151",
                          fontWeight: "700",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        {type === "Dine-In" ? "🍽️ Dine-In" : type === "Takeout" ? "🛍️ Takeout" : "🛵 Delivery"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact Inputs */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Samuel Alemu"
                      value={orderForm.customerName}
                      onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+251 911 000 000"
                      value={orderForm.phone}
                      onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}
                    />
                  </div>
                </div>

                {orderForm.orderType === "Dine-In" && (
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Table Number (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Table 5"
                      value={orderForm.tableNumber}
                      onChange={(e) => setOrderForm({ ...orderForm, tableNumber: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}
                    />
                  </div>
                )}

                {orderForm.orderType === "Delivery" && (
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Delivery Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="Bole Road, Addis Ababa"
                      value={orderForm.deliveryAddress}
                      onChange={(e) => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>Special Notes (optional)</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Extra sauce on the side..."
                    value={orderForm.specialInstructions}
                    onChange={(e) => setOrderForm({ ...orderForm, specialInstructions: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #f3f4f6" }}>
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #d1d5db", backgroundColor: "white", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={orderSubmitting}
                    style={{ padding: "10px 20px", borderRadius: "6px", backgroundColor: "#10b981", color: "white", border: "none", fontWeight: "700", cursor: "pointer" }}
                  >
                    {orderSubmitting ? "⏳ Placing Order..." : "🚀 Place Order ($" + totalCartPrice.toFixed(2) + ")"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style>
        {`
        @media (max-width: 768px) {
          .menu-item-row {
            flex-direction: column !important;
            text-align: center !important;
          }
          .menu-item-row > div {
            min-width: 100% !important;
          }
          .menu-item-row img {
            max-width: 100% !important;
          }
        }
        `}
      </style>
    </div>
  );
};

export default MenuPage;

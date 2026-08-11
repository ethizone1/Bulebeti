import React, { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useAdmin } from "../../layouts/AdminLayout";
import config from "../../config";

const AdminSettings = () => {
  const { t } = useLanguage();
  const { restaurant, setRestaurant, tier } = useAdmin();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [openingHours, setOpeningHours] = useState({ weekdays: "", weekends: "" });
  const [socialLinks, setSocialLinks] = useState({
    instagram: "",
    facebook: "",
    twitter: "",
    linkedin: "",
    youtube: "",
    tiktok: "",
    pinterest: "",
    whatsapp: "",
    telegram: "",
    snapchat: "",
  });
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || "");
      setPhone(restaurant.phone || "");
      setEmail(restaurant.email || "");
      setAddress(restaurant.address || "");
      setDescription(restaurant.description || "");
      setLogoUrl(restaurant.logoUrl || "");
      setBannerUrl(restaurant.bannerUrl || "");
      setOpeningHours({
        weekdays: restaurant.openingHours?.weekdays || "",
        weekends: restaurant.openingHours?.weekends || "",
      });
      setSocialLinks({
        instagram: restaurant.socialLinks?.instagram || "",
        facebook: restaurant.socialLinks?.facebook || "",
        twitter: restaurant.socialLinks?.twitter || "",
        linkedin: restaurant.socialLinks?.linkedin || "",
        youtube: restaurant.socialLinks?.youtube || "",
        tiktok: restaurant.socialLinks?.tiktok || "",
        pinterest: restaurant.socialLinks?.pinterest || "",
        whatsapp: restaurant.socialLinks?.whatsapp || "",
        telegram: restaurant.socialLinks?.telegram || "",
        snapchat: restaurant.socialLinks?.snapchat || "",
      });
    }
  }, [restaurant]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    if (!name.trim()) {
      setProfileError("Restaurant name is required.");
      return;
    }

    setProfileSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found.");

      const res = await fetch(
        `${config.API_URL}/api/restaurants/${restaurant.slug}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          body: JSON.stringify({
            name,
            phone,
            email,
            address,
            description,
            logoUrl,
            bannerUrl,
            openingHours,
            socialLinks,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || "Failed to update restaurant profile.");
      }

      setProfileSuccess(t("admin_set_prof_alert") || "Full Profile Updated!");
      setRestaurant(data);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Security / Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityMessage, setSecurityMessage] = useState(null);
  const [securityError, setSecurityError] = useState(null);
  const [securitySubmitting, setSecuritySubmitting] = useState(false);

  // Notifications State
  const defaultNotifs = { res: true, cat: true, fb: true, mkt: false };
  const [notifSettings, setNotifSettings] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("bulebeti_notif_settings")) ||
        defaultNotifs
      );
    } catch {
      return defaultNotifs;
    }
  });

  const toggleNotif = (key) => {
    const updated = { ...notifSettings, [key]: !notifSettings[key] };
    setNotifSettings(updated);
    localStorage.setItem("bulebeti_notif_settings", JSON.stringify(updated));
    // Dispatch an event so Navbar can update immediately if needed
    window.dispatchEvent(new Event("bulebeti_notifs_changed"));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSecurityMessage(null);
    setSecurityError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setSecurityError("All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError("New password and confirm password do not match.");
      return;
    }

    setSecuritySubmitting(true);
    try {
      const res = await fetch(`${config.API_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token"),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || "Failed to update password.");
      }

      setSecurityMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setSecurityError(err.message);
    } finally {
      setSecuritySubmitting(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <section>
            <div className="d-flex flex-wrap align-items-center gap-4 mb-4 pb-4 border-bottom">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="rounded-circle object-fit-cover border"
                  style={{ width: "80px", height: "80px" }}
                />
              ) : (
                <div
                  className="bg-light rounded-circle d-flex align-items-center justify-content-center fs-4"
                  style={{ width: "80px", height: "80px" }}
                >
                  🏢
                </div>
              )}
              <div className="flex-grow-1">
                <h4 className="m-0 mb-2">{t("admin_set_prof_logo")}</h4>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Logo Image URL (e.g. https://...)"
                  className="form-control"
                  style={{ maxWidth: "400px" }}
                />
              </div>
            </div>

            <h3 className="mb-4">{t("admin_set_prof_gen")}</h3>
            <form className="row g-3 mb-5">
              <div className="col-12 col-md-6">
                <label className="form-label fw-bold small mb-1">
                  {t("admin_set_prof_name")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-bold small mb-1">
                  {t("admin_set_prof_url")}
                </label>
                <input
                  type="url"
                  value={
                    restaurant
                      ? `${window.location.origin}/bulebeti/${restaurant.slug}`
                      : ""
                  }
                  readOnly
                  className="form-control bg-light text-muted"
                  style={{ cursor: "not-allowed" }}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-bold small mb-1">
                  {t("admin_set_prof_phone")}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-bold small mb-1">
                  {t("admin_set_prof_email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. contact@restaurant.com"
                  className="form-control"
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-bold small mb-1">
                  {t("admin_set_prof_addr")}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
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
                  BANNER IMAGE URL
                </label>
                <input
                  type="text"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="Banner Image URL (e.g. https://...)"
                  className="form-control"
                />
              </div>
            </form>

            <h3 className="mb-4">{t("admin_set_prof_ops")}</h3>
            <div className="row g-3 mb-5">
              <div className="col-12 col-md-6">
                <label className="form-label fw-bold small mb-1">
                  {t("admin_set_prof_wkdy")}
                </label>
                <input
                  type="text"
                  value={openingHours.weekdays}
                  onChange={(e) =>
                    setOpeningHours({ ...openingHours, weekdays: e.target.value })
                  }
                  placeholder="e.g. 11:00 AM - 11:00 PM"
                  className="form-control"
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-bold small mb-1">
                  {t("admin_set_prof_wknd")}
                </label>
                <input
                  type="text"
                  value={openingHours.weekends}
                  onChange={(e) =>
                    setOpeningHours({ ...openingHours, weekends: e.target.value })
                  }
                  placeholder="e.g. 10:00 AM - 12:00 AM"
                  className="form-control"
                />
              </div>
            </div>

            <h3 className="mb-4">{t("admin_set_prof_soc")}</h3>
            <div className="row g-3 mb-5">
              {[
                {
                  key: "instagram",
                  name: "Instagram",
                  icon: "fa-brands fa-instagram",
                  color: "#E1306C",
                  placeholder: "@your_handle or URL",
                },
                {
                  key: "facebook",
                  name: "Facebook",
                  icon: "fa-brands fa-facebook-f",
                  color: "#1877F2",
                  placeholder: "fb.com/your_page or URL",
                },
                {
                  key: "twitter",
                  name: "Twitter",
                  icon: "fa-brands fa-x-twitter",
                  color: "#000000",
                  placeholder: "@your_handle or URL",
                },
                {
                  key: "linkedin",
                  name: "LinkedIn",
                  icon: "fa-brands fa-linkedin-in",
                  color: "#0A66C2",
                  placeholder: "linkedin.com/in/profile",
                },
                {
                  key: "youtube",
                  name: "YouTube",
                  icon: "fa-brands fa-youtube",
                  color: "#FF0000",
                  placeholder: "youtube.com/@channel",
                },
                {
                  key: "tiktok",
                  name: "TikTok",
                  icon: "fa-brands fa-tiktok",
                  color: "#000000",
                  placeholder: "@your_handle or URL",
                },
                {
                  key: "pinterest",
                  name: "Pinterest",
                  icon: "fa-brands fa-pinterest-p",
                  color: "#E60023",
                  placeholder: "pinterest.com/profile",
                },
                {
                  key: "whatsapp",
                  name: "WhatsApp",
                  icon: "fa-brands fa-whatsapp",
                  color: "#25D366",
                  placeholder: "+1 (555) 000-0000",
                },
                {
                  key: "telegram",
                  name: "Telegram",
                  icon: "fa-brands fa-telegram",
                  color: "#24A1DE",
                  placeholder: "@your_handle",
                },
                {
                  key: "snapchat",
                  name: "Snapchat",
                  icon: "fa-brands fa-snapchat",
                  color: "#FFFC00",
                  placeholder: "snapchat.com/add/handle",
                },
              ].map((social) => (
                <div key={social.key} className="col-12 col-md-6 col-lg-4">
                  <div className="d-flex align-items-center gap-2 bg-light p-2 rounded border">
                    <i
                      className={social.icon}
                      style={{
                        fontSize: "18px",
                        color: social.color,
                        width: "24px",
                        textAlign: "center",
                      }}
                      title={social.name}
                    ></i>
                    <input
                      type="text"
                      value={socialLinks[social.key] || ""}
                      onChange={(e) =>
                        setSocialLinks({
                          ...socialLinks,
                          [social.key]: e.target.value,
                        })
                      }
                      placeholder={social.placeholder}
                      className="form-control border-0 bg-transparent shadow-none p-1"
                    />
                  </div>
                </div>
              ))}
            </div>

            <h3 className="mb-4 mt-5 pt-3 border-top">
              {t("admin_set_sec_title") || "Change Password"}
            </h3>
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4">
                <label className="form-label fw-bold small mb-1">
                  {t("admin_set_sec_cur") || "Current Password"}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-control"
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-bold small mb-1">
                  {t("admin_set_sec_new") || "New Password"}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-control"
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-bold small mb-1">
                  {t("admin_set_sec_conf") || "Confirm New Password"}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-control"
                />
              </div>
            </div>

            {activeTab === "profile" && securityMessage && (
              <div className="alert alert-success py-2 mb-3 fs-6">
                {securityMessage}
              </div>
            )}
            {activeTab === "profile" && securityError && (
              <div className="alert alert-danger py-2 mb-3 fs-6">
                {securityError}
              </div>
            )}

            <button
              className="btn btn-outline-secondary mb-4"
              type="button"
              onClick={handlePasswordChange}
              disabled={securitySubmitting}
            >
              {securitySubmitting
                ? "Updating..."
                : t("admin_set_sec_btn") || "Update Password"}
            </button>

            {activeTab === "profile" && profileSuccess && (
              <div className="alert alert-success py-3 mb-3 fw-medium">
                ✓ {profileSuccess}
              </div>
            )}
            {activeTab === "profile" && profileError && (
              <div className="alert alert-danger py-3 mb-3 fw-medium">
                ⚠ {profileError}
              </div>
            )}

            <div className="border-top pt-4 mt-2">
              <button
                className="btn btn-primary px-4 py-2 fw-bold"
                type="button"
                onClick={handleProfileSave}
                disabled={profileSubmitting}
              >
                {profileSubmitting ? "Saving..." : t("admin_set_prof_save")}
              </button>
            </div>
          </section>
        );
      case "security":
        return (
          <section>
            <h3 className="mb-4">{t("admin_set_sec_title")}</h3>
            <form
              onSubmit={handlePasswordChange}
              className="d-grid gap-4"
              style={{ maxWidth: "400px" }}
            >
              {securityMessage && (
                <div className="alert alert-success py-2 m-0 fs-6">
                  {securityMessage}
                </div>
              )}
              {securityError && (
                <div className="alert alert-danger py-2 m-0 fs-6">
                  {securityError}
                </div>
              )}
              <div>
                <label className="form-label fw-bold small mb-1">
                  {t("admin_set_sec_cur")}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="form-control"
                />
              </div>
              <div>
                <label className="form-label fw-bold small mb-1">
                  {t("admin_set_sec_new")}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="form-control"
                />
              </div>
              <div>
                <label className="form-label fw-bold small mb-1">
                  {t("admin_set_sec_conf")}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="form-control"
                />
              </div>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={securitySubmitting}
              >
                {securitySubmitting ? "Updating..." : t("admin_set_sec_btn")}
              </button>
            </form>
          </section>
        );
      case "notifications":
        return (
          <section>
            <h3 className="mb-4">{t("admin_set_not_title")}</h3>
            <div className="d-grid gap-3">
              {[
                {
                  key: "res",
                  title: t("admin_set_not_res") || "Reservations",
                  desc:
                    t("admin_set_not_res_d") ||
                    "Get notified for new reservation requests",
                },
                {
                  key: "cat",
                  title: t("admin_set_not_cat") || "Catering Inquiries",
                  desc:
                    t("admin_set_not_cat_d") ||
                    "Get notified for new catering requests",
                },
                {
                  key: "fb",
                  title: t("admin_set_not_fb") || "Customer Feedback",
                  desc:
                    t("admin_set_not_fb_d") ||
                    "Get notified when new feedback is submitted",
                },
                {
                  key: "mkt",
                  title: t("admin_set_not_mkt") || "Marketing",
                  desc:
                    t("admin_set_not_mkt_d") ||
                    "Receive platform marketing updates",
                },
              ].map((n) => {
                const isOn = notifSettings[n.key];
                return (
                  <div
                    key={n.key}
                    className="d-flex justify-content-between align-items-center pb-3 border-bottom"
                  >
                    <div>
                      <div className="fw-bold">{n.title}</div>
                      <div className="text-muted small">{n.desc}</div>
                    </div>
                    <div
                      onClick={() => toggleNotif(n.key)}
                      className={`form-check form-switch m-0`}
                      style={{ cursor: "pointer" }}
                    >
                      <input
                        className="form-check-input fs-4 m-0"
                        type="checkbox"
                        role="switch"
                        checked={isOn}
                        readOnly
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      case "layout":
        return (
          <section>
            <h3 className="mb-4">{t("admin_set_lay_title")}</h3>
            <p className="text-muted mb-4">{t("admin_set_lay_desc")}</p>

            <div className="row g-3 mb-5">
              {[
                {
                  id: "image-left",
                  name: t("admin_set_lay_left"),
                  desc: t("admin_set_lay_left_d"),
                  icon: "📑",
                },
                {
                  id: "image-right",
                  name: t("admin_set_lay_right"),
                  desc: t("admin_set_lay_right_d"),
                  icon: "📖",
                },
                {
                  id: "text-centered",
                  name: t("admin_set_lay_cent"),
                  desc: t("admin_set_lay_cent_d"),
                  icon: "🔝",
                },
              ].map((layout) => {
                const currentLayout = restaurant?.menuLayout || "image-left";
                const isActive = currentLayout === layout.id;
                return (
                  <div key={layout.id} className="col-12 col-md-4">
                    <div
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem("token");
                          const res = await fetch(
                            `${config.API_URL}/api/restaurants/${restaurant.slug}`,
                            {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                                "x-auth-token": token,
                              },
                              body: JSON.stringify({ menuLayout: layout.id }),
                            },
                          );
                          const data = await res.json();
                          if (res.ok) {
                            setRestaurant(data);
                            alert(`Layout updated successfully!`);
                          } else {
                            alert(data.msg || "Failed to update layout");
                          }
                        } catch (err) {
                          alert("Error updating layout");
                        }
                      }}
                      className={`card h-100 text-center p-4 border ${isActive ? "border-warning bg-warning bg-opacity-10" : "border-light shadow-sm"}`}
                      style={{ cursor: "pointer", transition: "all 0.2s" }}
                    >
                      <div className="display-4 mb-3">{layout.icon}</div>
                      <div className="fw-bold mb-1">{layout.name}</div>
                      <div className="text-muted small">{layout.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="alert alert-warning mb-0">
              <div className="fw-bold text-dark mb-1">
                💡 {t("admin_set_lay_tip")}
              </div>
              <div className="small text-dark opacity-75">
                {t("admin_set_lay_tip_d")}
              </div>
            </div>
          </section>
        );
      case "billing":
        return (
          <section>
            <div className="bg-primary text-white p-4 rounded-4 mb-4">
              <div className="text-warning fw-bold small mb-2 text-uppercase">
                {t("admin_set_bill_cur")}
              </div>
              <h3 className="m-0 text-white display-6 fw-bold">
                $500.00{" "}
                <span className="fs-6 opacity-75 fw-normal">
                  {t("admin_set_bill_yr")}
                </span>
              </h3>
              <div className="small mt-2 opacity-75">
                {t("admin_set_bill_next")} May 15, 2027
              </div>
            </div>

            <h4 className="mb-3 fs-5">{t("admin_set_bill_hist")}</h4>
            <div className="d-grid gap-2">
              {[
                {
                  id: "INV-001",
                  date: "2026-05-15",
                  amount: "$500.00",
                  status: "Paid",
                },
                {
                  id: "INV-000",
                  date: "2025-05-15",
                  amount: "$250.00",
                  status: "Paid",
                },
              ].map((inv) => (
                <div
                  key={inv.id}
                  className="d-flex flex-wrap justify-content-between align-items-center p-3 border rounded-3 bg-light gap-2"
                >
                  <span className="fw-bold">{inv.id}</span>
                  <span className="text-muted small">{inv.date}</span>
                  <span className="fw-bold">{inv.amount}</span>
                  <span className="badge bg-success">{inv.status}</span>
                </div>
              ))}
            </div>
          </section>
        );
      case "backups":
        return (
          <section>
            <h3 className="mb-4">{t("admin_set_back_title")}</h3>
            <p className="text-muted mb-4">{t("admin_set_back_desc")}</p>

            <div className="d-grid gap-3">
              {[
                {
                  date: "2026-05-14 03:00 AM",
                  size: "1.2 MB",
                  type: "Daily Auto",
                },
                {
                  date: "2026-05-13 03:00 AM",
                  size: "1.2 MB",
                  type: "Daily Auto",
                },
                {
                  date: "2026-05-12 03:00 AM",
                  size: "1.1 MB",
                  type: "Daily Auto",
                },
              ].map((b, i) => (
                <div
                  key={i}
                  className="d-flex flex-wrap justify-content-between align-items-center p-3 border rounded-3 bg-light gap-3"
                >
                  <div>
                    <div className="fw-bold">Backup_{b.date.split(" ")[0]}</div>
                    <div className="text-muted small">
                      {b.date} • {b.size} • {b.type}
                    </div>
                  </div>
                  <button className="btn btn-outline-secondary btn-sm px-3">
                    {t("admin_set_back_dl")}
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="admin-settings py-3">
      <h1 className="fs-3 fw-bold mb-4">{t("admin_set_title")}</h1>

      <div className="row g-4">
        {/* Sidebar Tabs */}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="d-flex flex-row flex-md-column gap-2 overflow-auto pb-2 pb-md-0">
            {(() => {
              const TIER_LEVELS = {
                Silver: 0,
                Gold: 1,
                Platinum: 2,
                Premium: 3,
              };
              const currentTierLevel = TIER_LEVELS[tier] || 0;

              return [
                { id: "profile", name: t("admin_set_tab_prof"), icon: "👤" },
                {
                  id: "layout",
                  name: t("admin_set_tab_lay"),
                  icon: "🎨",
                  minTier: "Premium",
                },
                { id: "security", name: t("admin_set_tab_sec"), icon: "🔒" },
                {
                  id: "notifications",
                  name: t("admin_set_tab_not"),
                  icon: "🔔",
                  minTier: "Gold",
                },
                { id: "billing", name: t("admin_set_tab_bill"), icon: "💳" },
                {
                  id: "backups",
                  name: t("admin_set_tab_back"),
                  icon: "💾",
                  minTier: "Platinum",
                },
              ]
                .filter(
                  (tab) =>
                    !tab.minTier ||
                    currentTierLevel >= TIER_LEVELS[tab.minTier],
                )
                .map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`btn d-flex align-items-center gap-3 px-3 py-2 border-0 text-start text-nowrap flex-shrink-0 ${activeTab === tab.id ? "bg-warning bg-opacity-10 text-warning fw-bold" : "text-muted fw-medium"}`}
                  >
                    <span
                      className="fs-5 d-inline-block text-center"
                      style={{ width: "28px" }}
                    >
                      {tab.icon}
                    </span>
                    <span>{tab.name}</span>
                  </button>
                ));
            })()}
          </div>
        </div>

        {/* Content Area */}
        <div className="col-12 col-md-8 col-lg-9">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 p-md-5">{renderContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

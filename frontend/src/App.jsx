import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CustomerLayout from "./layouts/CustomerLayout";
import AdminLayout from "./layouts/AdminLayout";
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import ScrollToTop from "./components/ScrollToTop";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";

// User Pages
import LandingPage from "./pages/user/LandingPage";
import RegistrationPage from "./pages/user/RegistrationPage";
import LoginPage from "./pages/user/LoginPage";
import ActivatePage from "./pages/user/ActivatePage";
import UserProfile from "./pages/user/UserProfile";
import ForgotPassword from "./pages/user/ForgotPassword";
import RestaurantLandingPage from "./pages/user/RestaurantLandingPage";
import MenuPage from "./pages/user/MenuPage";
import ContactPage from "./pages/user/ContactPage";
import ReservationPage from "./pages/user/ReservationPage";
import CateringPage from "./pages/user/CateringPage";
import FeedbackPage from "./pages/user/FeedbackPage";
import EventLandingPage from "./pages/user/EventLandingPage";
import GalleryPage from "./pages/user/GalleryPage";
import TestimonialsPage from "./pages/user/TestimonialsPage";
import SisterRestaurantsPage from "./pages/user/SisterRestaurantsPage";
import EventsPage from "./pages/user/EventsPage";
import { PrivacyPolicy, TermsOfService } from "./pages/user/LegalPages";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ReservationManagement from "./pages/admin/ReservationManagement";
import AdminOnlineOrders from "./pages/admin/AdminOnlineOrders";
import CateringManagement from "./pages/admin/CateringManagement";
import MenuManagement from "./pages/admin/MenuManagement";
import FeedbackManager from "./pages/admin/FeedbackManager";
import LocationManagement from "./pages/admin/LocationManagement";
import GalleryManager from "./pages/admin/GalleryManager";
import EventsManager from "./pages/admin/EventsManager";
import AddMenuItem from "./pages/admin/AddMenuItem";
import EditMenuItem from "./pages/admin/EditMenuItem";
import CreateEvent from "./pages/admin/CreateEvent";
import EditEvent from "./pages/admin/EditEvent";
import AddLocation from "./pages/admin/AddLocation";
import AdminSettings from "./pages/admin/AdminSettings";
import TestimonialsManager from "./pages/admin/TestimonialsManager";
import TeamManagement from "./pages/admin/TeamManagement";
import SupportForm from "./pages/admin/SupportForm";

// Super Admin Pages
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import RestaurantManagement from "./pages/super-admin/RestaurantManagement";
import RevenueTracking from "./pages/super-admin/RevenueTracking";
import MenuReview from "./pages/super-admin/MenuReview";
import SuperAdminSettings from "./pages/super-admin/SuperAdminSettings";
import PlatformInquiries from "./pages/super-admin/PlatformInquiries";
import UserManagement from "./pages/super-admin/UserManagement";
import { useAdmin } from "./layouts/AdminLayout";

const UpgradeRequiredScreen = ({ requiredTier, currentTier }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        textAlign: "center",
        backgroundColor: "white",
        borderRadius: "16px",
        border: "1px solid var(--platinum)",
        boxShadow: "var(--shadow-2)",
        maxWidth: "520px",
        margin: "60px auto",
      }}
    >
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          backgroundColor: "rgba(212, 175, 55, 0.1)",
          border: "2px solid var(--gold)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px",
          marginBottom: "20px",
          color: "var(--gold)",
          boxShadow: "0 0 15px rgba(212, 175, 55, 0.3)",
        }}
      >
        ✦
      </div>
      <h2
        style={{
          fontSize: "22px",
          fontWeight: "800",
          margin: "0 0 10px",
          color: "var(--primary)",
          letterSpacing: "0.5px",
        }}
      >
        {requiredTier.toUpperCase()} Plan Required
      </h2>
      <p
        style={{
          color: "var(--on-surface-variant)",
          fontSize: "14px",
          lineHeight: "1.6",
          margin: "0 0 28px",
          maxWidth: "380px",
        }}
      >
        This premium module is locked under the{" "}
        <strong>{requiredTier} Plan</strong>. Your restaurant is currently on
        the <strong>{currentTier} Plan</strong>.
      </p>

      <div style={{ display: "flex", gap: "14px", justifyContent: "center" }}>
        <a
          href={`/register?plan=${requiredTier}`}
          className="btn btn-primary"
          style={{
            padding: "10px 20px",
            fontWeight: "700",
            borderRadius: "8px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Upgrade to {requiredTier} Plan ✦
        </a>
        <button
          onClick={() => window.history.back()}
          className="btn btn-outline"
          style={{
            padding: "10px 20px",
            fontWeight: "700",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

const AdminPage = ({ element: Element, minTier }) => {
  const { tier, restaurant } = useAdmin();

  const tierImportance = { Basic: 0, Gold: 1, Platinum: 2, Premium: 3 };
  const currentTierImportance =
    tierImportance[tier] !== undefined ? tierImportance[tier] : 0; // Default to Basic
  const requiredTierImportance =
    tierImportance[minTier] !== undefined ? tierImportance[minTier] : 0; // Default to Basic

  if (currentTierImportance < requiredTierImportance) {
    return <UpgradeRequiredScreen requiredTier={minTier} currentTier={tier} />;
  }

  return <Element currentTier={tier} restaurant={restaurant} />;
};

// Every platform page is reachable at its plain path and under the legacy
// /maedbet and /bulebeti prefixes.
const PREFIXES = ["", "/maedbet", "/bulebeti"];
const withPrefixes = (...paths) =>
  paths.flatMap((path) => PREFIXES.map((prefix) => `${prefix}${path}`));

const PLATFORM_PAGES = [
  { paths: ["/"], Page: LandingPage },
  { paths: withPrefixes("/register"), Page: RegistrationPage },
  { paths: withPrefixes("/activate"), Page: ActivatePage },
  { paths: withPrefixes("/login", "/signin", "/sign-in"), Page: LoginPage },
  { paths: withPrefixes("/forgot-password"), Page: ForgotPassword },
  { paths: ["/profile"], Page: UserProfile },
  { paths: withPrefixes("/contact-us"), Page: ContactPage },
  { paths: withPrefixes("/gallery"), Page: GalleryPage },
  { paths: withPrefixes("/testimonials"), Page: TestimonialsPage },
  { paths: withPrefixes("/sister-restaurants"), Page: SisterRestaurantsPage },
  { paths: withPrefixes("/events"), Page: EventsPage },
  { paths: withPrefixes("/events/truffle-festival"), Page: EventLandingPage },
  { paths: withPrefixes("/privacy"), Page: PrivacyPolicy },
  { paths: withPrefixes("/terms"), Page: TermsOfService },
];

const SUPER_ADMIN_PAGES = [
  { path: "restaurants", Page: RestaurantManagement },
  { path: "users", Page: UserManagement },
  { path: "revenue", Page: RevenueTracking },
  { path: "menus", Page: MenuReview },
  { path: "inquiries", Page: PlatformInquiries },
  { path: "settings", Page: SuperAdminSettings },
];

// Public pages under /:restaurantName/...
const RESTAURANT_PAGES = [
  { path: "menu", Page: MenuPage },
  { path: "reservations", Page: ReservationPage },
  { path: "contact", Page: ContactPage },
  { path: "catering", Page: CateringPage },
  { path: "feedback", Page: FeedbackPage },
  { path: "gallery", Page: GalleryPage },
  { path: "testimonials", Page: TestimonialsPage },
  { path: "sister-restaurants", Page: SisterRestaurantsPage },
  { path: "events", Page: EventsPage },
  { path: "privacy", Page: PrivacyPolicy },
  { path: "terms", Page: TermsOfService },
];

// Admin pages under /:restaurantName/admin/... with the minimum plan for each
const ADMIN_PAGES = [
  { path: "dashboard", Page: AdminDashboard, minTier: "Basic" },
  { path: "reservations", Page: ReservationManagement, minTier: "Gold" },
  { path: "orders", Page: AdminOnlineOrders, minTier: "Platinum" },
  { path: "catering", Page: CateringManagement, minTier: "Platinum" },
  { path: "menu", Page: MenuManagement, minTier: "Basic" },
  { path: "menu/add", Page: AddMenuItem, minTier: "Basic" },
  { path: "menu/edit/:itemId", Page: EditMenuItem, minTier: "Basic" },
  { path: "feedback", Page: FeedbackManager, minTier: "Premium" },
  { path: "testimonials", Page: TestimonialsManager, minTier: "Premium" },
  { path: "gallery", Page: GalleryManager, minTier: "Basic" },
  { path: "locations", Page: LocationManagement, minTier: "Platinum" },
  { path: "locations/add", Page: AddLocation, minTier: "Platinum" },
  { path: "events", Page: EventsManager, minTier: "Premium" },
  { path: "events/create", Page: CreateEvent, minTier: "Premium" },
  { path: "events/edit/:eventId", Page: EditEvent, minTier: "Premium" },
  { path: "team", Page: TeamManagement, minTier: "Gold" },
  { path: "support", Page: SupportForm, minTier: "Basic" },
  { path: "settings", Page: AdminSettings, minTier: "Basic" },
];

const customerPage = (Page) => (
  <CustomerLayout>
    <Page />
  </CustomerLayout>
);

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {PLATFORM_PAGES.flatMap(({ paths, Page }) =>
              paths.map((path) => (
                <Route key={path} path={path} element={customerPage(Page)} />
              )),
            )}

            {/* Super Admin (must come before the /:restaurantName catch-all) */}
            {withPrefixes("/super-admin/*").map((pathPattern) => (
              <Route
                key={pathPattern}
                path={pathPattern}
                element={
                  <SuperAdminLayout>
                    <Routes>
                      <Route index element={<SuperAdminDashboard />} />
                      {SUPER_ADMIN_PAGES.map(({ path, Page }) => (
                        <Route key={path} path={path} element={<Page />} />
                      ))}
                      <Route
                        path="*"
                        element={
                          <div style={{ textAlign: "center", padding: "40px" }}>
                            <h2>Super Admin Module Coming Soon</h2>
                            <p>
                              This platform-level management module is currently
                              under development.
                            </p>
                          </div>
                        }
                      />
                    </Routes>
                  </SuperAdminLayout>
                }
              />
            ))}

            {/* Restaurant public and admin pages, e.g. /injera-world and /bulebeti/injera-world */}
            {withPrefixes("/:restaurantName").map((pattern) => (
              <Route key={pattern} path={pattern}>
                <Route index element={customerPage(RestaurantLandingPage)} />
                {RESTAURANT_PAGES.map(({ path, Page }) => (
                  <Route key={path} path={path} element={customerPage(Page)} />
                ))}
                <Route
                  path="admin/*"
                  element={
                    <AdminLayout>
                      <Routes>
                        <Route
                          index
                          element={<AdminPage element={AdminDashboard} minTier="Basic" />}
                        />
                        {ADMIN_PAGES.map(({ path, Page, minTier }) => (
                          <Route
                            key={path}
                            path={path}
                            element={<AdminPage element={Page} minTier={minTier} />}
                          />
                        ))}
                      </Routes>
                    </AdminLayout>
                  }
                />
              </Route>
            ))}

            {/* Global 404 */}
            <Route
              path="*"
              element={
                <CustomerLayout>
                  <div
                    style={{
                      padding: "var(--spacing-xxl) 0",
                      textAlign: "center",
                    }}
                  >
                    <h2>Page Not Found</h2>
                    <p>The page you are looking for does not exist.</p>
                  </div>
                </CustomerLayout>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

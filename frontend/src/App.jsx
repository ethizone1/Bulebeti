import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CustomerLayout from "./layouts/CustomerLayout";
import AdminLayout from "./layouts/AdminLayout";
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import ScrollToTop from "./components/ScrollToTop";
import { LanguageProvider } from "./context/LanguageContext";

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
    tierImportance[tier] !== undefined ? tierImportance[tier] : 2; // Default to Platinum
  const requiredTierImportance =
    tierImportance[minTier] !== undefined ? tierImportance[minTier] : 0; // Default to Basic

  if (currentTierImportance < requiredTierImportance) {
    return <UpgradeRequiredScreen requiredTier={minTier} currentTier={tier} />;
  }

  return <Element currentTier={tier} restaurant={restaurant} />;
};

function App() {
  return (
    <LanguageProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Customer Routes */}
          <Route
            path="/"
            element={
              <CustomerLayout>
                <LandingPage />
              </CustomerLayout>
            }
          />

          <Route
            path="/register"
            element={
              <CustomerLayout>
                <RegistrationPage />
              </CustomerLayout>
            }
          />
          <Route
            path="/bulebeti/register"
            element={
              <CustomerLayout>
                <RegistrationPage />
              </CustomerLayout>
            }
          />

          <Route
            path="/activate"
            element={
              <CustomerLayout>
                <ActivatePage />
              </CustomerLayout>
            }
          />

          <Route
            path="/bulebeti/activate"
            element={
              <CustomerLayout>
                <ActivatePage />
              </CustomerLayout>
            }
          />

          <Route
            path="/login"
            element={
              <CustomerLayout>
                <LoginPage />
              </CustomerLayout>
            }
          />

          <Route
            path="/bulebeti/login"
            element={
              <CustomerLayout>
                <LoginPage />
              </CustomerLayout>
            }
          />

          <Route
            path="/forgot-password"
            element={
              <CustomerLayout>
                <ForgotPassword />
              </CustomerLayout>
            }
          />
          <Route
            path="/bulebeti/forgot-password"
            element={
              <CustomerLayout>
                <ForgotPassword />
              </CustomerLayout>
            }
          />

          <Route
            path="/profile"
            element={
              <CustomerLayout>
                <UserProfile />
              </CustomerLayout>
            }
          />

          {/* Public & Admin Restaurant Pages (Supports clean domain URLs like /injera-world and /bulebeti/injera-world) */}
          {["/:restaurantName", "/bulebeti/:restaurantName"].map((pattern) => (
            <Route key={pattern} path={pattern}>
              <Route
                index
                element={
                  <CustomerLayout>
                    <RestaurantLandingPage />
                  </CustomerLayout>
                }
              />
              <Route
                path="menu"
                element={
                  <CustomerLayout>
                    <MenuPage />
                  </CustomerLayout>
                }
              />
              <Route
                path="reservations"
                element={
                  <CustomerLayout>
                    <ReservationPage />
                  </CustomerLayout>
                }
              />
              <Route
                path="contact"
                element={
                  <CustomerLayout>
                    <ContactPage />
                  </CustomerLayout>
                }
              />
              <Route
                path="catering"
                element={
                  <CustomerLayout>
                    <CateringPage />
                  </CustomerLayout>
                }
              />
              <Route
                path="feedback"
                element={
                  <CustomerLayout>
                    <FeedbackPage />
                  </CustomerLayout>
                }
              />
              <Route
                path="gallery"
                element={
                  <CustomerLayout>
                    <GalleryPage />
                  </CustomerLayout>
                }
              />
              <Route
                path="testimonials"
                element={
                  <CustomerLayout>
                    <TestimonialsPage />
                  </CustomerLayout>
                }
              />
              <Route
                path="sister-restaurants"
                element={
                  <CustomerLayout>
                    <SisterRestaurantsPage />
                  </CustomerLayout>
                }
              />
              <Route
                path="events"
                element={
                  <CustomerLayout>
                    <EventsPage />
                  </CustomerLayout>
                }
              />
              <Route
                path="privacy"
                element={
                  <CustomerLayout>
                    <PrivacyPolicy />
                  </CustomerLayout>
                }
              />
              <Route
                path="terms"
                element={
                  <CustomerLayout>
                    <TermsOfService />
                  </CustomerLayout>
                }
              />

              {/* Admin Restaurant Pages */}
              <Route
                path="admin/*"
                element={
                  <AdminLayout>
                    <Routes>
                      <Route
                        index
                        element={
                          <AdminPage element={AdminDashboard} minTier="Basic" />
                        }
                      />
                      <Route
                        path="dashboard"
                        element={
                          <AdminPage element={AdminDashboard} minTier="Basic" />
                        }
                      />
                      <Route
                        path="reservations"
                        element={
                          <AdminPage
                            element={ReservationManagement}
                            minTier="Gold"
                          />
                        }
                      />
                      <Route
                        path="orders"
                        element={
                          <AdminPage
                            element={AdminOnlineOrders}
                            minTier="Platinum"
                          />
                        }
                      />
                      <Route
                        path="catering"
                        element={
                          <AdminPage
                            element={CateringManagement}
                            minTier="Platinum"
                          />
                        }
                      />
                      <Route
                        path="menu"
                        element={
                          <AdminPage element={MenuManagement} minTier="Basic" />
                        }
                      />
                      <Route
                        path="menu/add"
                        element={
                          <AdminPage element={AddMenuItem} minTier="Basic" />
                        }
                      />
                      <Route
                        path="menu/edit/:itemId"
                        element={
                          <AdminPage element={EditMenuItem} minTier="Basic" />
                        }
                      />
                      <Route
                        path="feedback"
                        element={
                          <AdminPage
                            element={FeedbackManager}
                            minTier="Premium"
                          />
                        }
                      />
                      <Route
                        path="testimonials"
                        element={
                          <AdminPage
                            element={TestimonialsManager}
                            minTier="Premium"
                          />
                        }
                      />
                      <Route
                        path="gallery"
                        element={
                          <AdminPage element={GalleryManager} minTier="Basic" />
                        }
                      />
                      <Route
                        path="locations"
                        element={
                          <AdminPage
                            element={LocationManagement}
                            minTier="Platinum"
                          />
                        }
                      />
                      <Route
                        path="locations/add"
                        element={
                          <AdminPage element={AddLocation} minTier="Platinum" />
                        }
                      />
                      <Route
                        path="events"
                        element={
                          <AdminPage element={EventsManager} minTier="Premium" />
                        }
                      />
                      <Route
                        path="events/create"
                        element={
                          <AdminPage element={CreateEvent} minTier="Premium" />
                        }
                      />
                      <Route
                        path="events/edit/:eventId"
                        element={
                          <AdminPage element={EditEvent} minTier="Premium" />
                        }
                      />
                      <Route
                        path="team"
                        element={
                          <AdminPage element={TeamManagement} minTier="Gold" />
                        }
                      />
                      <Route
                        path="support"
                        element={
                          <AdminPage element={SupportForm} minTier="Basic" />
                        }
                      />
                      <Route
                        path="settings"
                        element={
                          <AdminPage element={AdminSettings} minTier="Basic" />
                        }
                      />
                    </Routes>
                  </AdminLayout>
                }
              />
            </Route>
          ))}

          <Route
            path="/contact-us"
            element={
              <CustomerLayout>
                <ContactPage />
              </CustomerLayout>
            }
          />

          <Route
            path="/gallery"
            element={
              <CustomerLayout>
                <GalleryPage />
              </CustomerLayout>
            }
          />

          <Route
            path="/testimonials"
            element={
              <CustomerLayout>
                <TestimonialsPage />
              </CustomerLayout>
            }
          />

          <Route
            path="/sister-restaurants"
            element={
              <CustomerLayout>
                <SisterRestaurantsPage />
              </CustomerLayout>
            }
          />

          <Route
            path="/events"
            element={
              <CustomerLayout>
                <EventsPage />
              </CustomerLayout>
            }
          />

          <Route
            path="/events/truffle-festival"
            element={
              <CustomerLayout>
                <EventLandingPage />
              </CustomerLayout>
            }
          />

          <Route
            path="/privacy"
            element={
              <CustomerLayout>
                <PrivacyPolicy />
              </CustomerLayout>
            }
          />

          <Route
            path="/terms"
            element={
              <CustomerLayout>
                <TermsOfService />
              </CustomerLayout>
            }
          />

          {/* Super Admin Routes */}
          <Route
            path="/super-admin/*"
            element={
              <SuperAdminLayout>
                <Routes>
                  <Route index element={<SuperAdminDashboard />} />
                  <Route
                    path="restaurants"
                    element={<RestaurantManagement />}
                  />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="revenue" element={<RevenueTracking />} />
                  <Route path="menus" element={<MenuReview />} />
                  <Route path="inquiries" element={<PlatformInquiries />} />
                  <Route path="settings" element={<SuperAdminSettings />} />
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
    </LanguageProvider>
  );
}

export default App;

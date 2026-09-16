import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser, useAuth, useClerk } from "@clerk/clerk-react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();

  const [mongoUser, setMongoUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync Clerk authenticated user with backend MongoDB user
  useEffect(() => {
    let isMounted = true;

    const syncUserWithBackend = async () => {
      if (!isLoaded) return;

      if (!isSignedIn || !clerkUser) {
        if (isMounted) {
          setMongoUser(null);
          setLoading(false);
          // Clean up legacy localStorage items
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        return;
      }

      try {
        setLoading(true);

        let token = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          token = await getToken();
          if (token) break;
          await new Promise((r) => setTimeout(r, 250));
        }

        const API_URL = import.meta.env.VITE_API_URL || "";

        const response = await fetch(`${API_URL}/api/auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
            "x-auth-token": token || "",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setMongoUser(data.user);
            setError(null);
          }
        } else {
          console.warn(
            "[AUTH CONTEXT] Backend user sync status:",
            response.status,
          );
          if (isMounted) {
            // Fallback basic user structure from Clerk identity while backend sync completes
            setMongoUser({
              clerkUserId: clerkUser.id,
              email: clerkUser.primaryEmailAddress?.emailAddress || "",
              name: clerkUser.fullName || clerkUser.username || "MaedBet User",
              role: "customer",
              status: "active",
            });
          }
        }
      } catch (err) {
        console.error("[AUTH CONTEXT SYNC ERROR]", err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    syncUserWithBackend();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, clerkUser, getToken]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      await signOut();
      setMongoUser(null);
    } catch (err) {
      console.error("[LOGOUT ERROR]", err);
    }
  };

  const getAuthToken = async () => {
    try {
      return await getToken();
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        isSignedIn,
        clerkUser,
        mongoUser,
        role: mongoUser?.role || "customer",
        restaurantId: mongoUser?.restaurantId || null,
        loading,
        error,
        logout: handleLogout,
        getAuthToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;

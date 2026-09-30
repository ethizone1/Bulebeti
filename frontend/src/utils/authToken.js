// Central source of the auth token for API calls.
// Prefers a fresh Clerk session token (Clerk tokens are short-lived, so they
// must be fetched per request), falling back to the legacy token stored by the
// registration flow.

let clerkTokenGetter = null;

export const setClerkTokenGetter = (getter) => {
  clerkTokenGetter = getter;
};

export const getAuthToken = async () => {
  if (clerkTokenGetter) {
    try {
      const token = await clerkTokenGetter();
      if (token) return token;
    } catch {
      // fall through to legacy token
    }
  }
  try {
    const legacy = localStorage.getItem("token");
    return legacy && legacy !== "undefined" && legacy !== "null" ? legacy : null;
  } catch {
    return null;
  }
};

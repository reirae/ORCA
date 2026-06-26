import { createContext } from "react";

// The auth context object lives alone so fast-refresh stays happy and both
// AuthProvider (AuthContext.jsx) and useAuth (useAuth.js) can import it.
export const AuthContext = createContext(null);

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

/**
 * Route guards.
 *
 * IMPORTANT: these are client-side checks for UX only — they keep users from
 * seeing pages they can't use. They are NOT a security boundary. Every API
 * route must enforce role-based access control on the server regardless of
 * what these guards allow: the client hides the door, the server locks it.
 *
 * Usage in App.jsx:
 *   <Route element={<RequireAuth />}>            // any logged-in user
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *   <Route element={<RequireRole roles={["admin"]} />}>
 *     <Route path="/admin" element={<AdminConsole />} />
 *   </Route>
 */

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Remember where they were headed so we can return them after login.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export function RequireRole({ roles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!roles.includes(user?.role)) {
    // Authenticated but wrong role — send to their own dashboard, not login.
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

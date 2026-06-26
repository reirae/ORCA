import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth, RequireRole } from "./auth/guards";
import AppShell from "./components/AppShell";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

/**
 * ROUTE MAP.
 *
 * Keep route definitions in THIS file only. Build page components and slot
 * them into the routes below.
 *
 *  Public:        /            -> Landing
 *                 /login       -> Login (wired)
 *                 /register    -> Register (not yet wired)
 *
 *  Authenticated (any role), inside AppShell:
 *                 /dashboard   -> Dashboard
 *                 /profile     -> profile page (todo)
 *                 /experts     -> expert directory (todo)
 *                 /chat        -> chat + video (todo)
 *
 *  Admin only:    /admin       -> admin console (todo)
 *
 * To add a page: import it, drop a <Route> in the right guard block.
 */
export default function App() {
  return (
    <Routes>
      {/* ---- Public ---- */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* todo: add /verify-pending and /forgot-password here (public). */}
      {/* <Route path="/verify-pending" element={<VerifyPending />} /> */}
      {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}

      {/* ---- Authenticated: any logged-in user ---- */}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* todo: profile + expert directory */}
          {/* <Route path="/profile" element={<Profile />} /> */}
          {/* <Route path="/experts" element={<ExpertDirectory />} /> */}

          {/* todo: chat + video */}
          {/* <Route path="/chat" element={<Chat />} /> */}
          {/* <Route path="/chat/:conversationId" element={<Chat />} /> */}
        </Route>
      </Route>

      {/* ---- Admin only ---- */}
      <Route element={<RequireRole roles={["admin"]} />}>
        <Route element={<AppShell />}>
          {/* todo: admin console */}
          {/* <Route path="/admin" element={<AdminConsole />} /> */}
        </Route>
      </Route>

      {/* ---- Fallbacks ---- */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

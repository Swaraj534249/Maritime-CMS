import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { selectLoggedInUser } from "../AuthSlice";

/** Agents with verified status must finish onboarding before other routes. */
export function AgentStatusRedirect() {
  const user = useSelector(selectLoggedInUser);
  const location = useLocation();

  if (user?.role !== "AGENT") {
    return <Outlet />;
  }

  if (
    user.status === "verified" &&
    location.pathname !== "/agent/onboarding"
  ) {
    return <Navigate to="/agent/onboarding" replace />;
  }

  if (
    user.status === "active" &&
    location.pathname === "/agent/onboarding"
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

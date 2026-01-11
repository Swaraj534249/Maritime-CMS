import { useSelector } from "react-redux";
import {
  Navigate,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import {
  selectIsAuthChecked,
  selectLoggedInUser,
  selectUserRole,
} from "./features/auth/AuthSlice";
import { Logout } from "./features/auth/components/Logout";
import { Protected } from "./features/auth/components/Protected";
import { useAuthCheck } from "./hooks/useAuth/useAuthCheck";
import { useFetchLoggedInUserDetails } from "./hooks/useAuth/useFetchLoggedInUserDetails";
import {
  ForgotPasswordPage,
  HomePage,
  LoginPage,
  OtpVerificationPage,
  ResetPasswordPage,
  SignupPage,
  UserProfilePage,
} from "./pages";
import { NotFoundPage } from "./pages/NotFoundPage";
import { Child } from "./pages/Child";
import { RootLayout } from "./layout/RootLayout";
import { VesselOwnerPage } from "./pages/VesselOwnerPage";
import { CrewingAgentPage } from "./pages/CrewingAgentPage";
import { VesselPage } from "./pages/VesselPage";
import { AgentManagementPage } from "./pages/AgentManagementPage";
import { AgencyManagementPage } from "./pages/AgencyManagementPage";
import {
  AgencyAdminProtected,
  SuperAdminProtected,
} from "./features/auth/components/RoleProtected";

function App() {
  const isAuthChecked = useSelector(selectIsAuthChecked);
  const loggedInUser = useSelector(selectLoggedInUser);
  const userRole = useSelector(selectUserRole);

  useAuthCheck();
  useFetchLoggedInUserDetails(loggedInUser);

  const routes = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/child" element={<Child />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-otp" element={<OtpVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/reset-password/:userId/:passwordResetToken"
          element={<ResetPasswordPage />}
        />
        <Route
          exact
          path="/logout"
          element={
            <Protected>
              <Logout />
            </Protected>
          }
        />

        {/* Protected layout: Navbar + SidebarStatic + Outlet */}
        <Route
          element={
            <Protected>
              <RootLayout />
            </Protected>
          }
        >
          {userRole === "SUPER_ADMIN" && (
            <>
              <Route
                path="/"
                element={<Navigate to="/super-admin/agencies" replace />}
              />
              <Route
                path="/super-admin/dashboard"
                element={
                  <SuperAdminProtected>
                    {/* <SuperAdminDashboardPage /> */}
                  </SuperAdminProtected>
                }
              />
              <Route
                path="/super-admin/agencies"
                element={
                  <SuperAdminProtected>
                    <AgencyManagementPage />
                  </SuperAdminProtected>
                }
              />
              {/* New route: Super admin viewing agents of a specific agency */}
              <Route
                path="/super-admin/agencies/:agencyId/agents"
                element={
                  <SuperAdminProtected>
                    <AgentManagementPage viewMode="super-admin" />
                  </SuperAdminProtected>
                }
              />
            </>
          )}

          {userRole === "AGENCY_ADMIN" && (
            <>
              <Route
                path="/"
                element={<Navigate to="/agency/agents" replace />}
              />
              <Route
                path="/agency/dashboard"
                element={
                  <AgencyAdminProtected>
                    {/* <AgencyDashboardPage /> */}
                  </AgencyAdminProtected>
                }
              />
              <Route
                path="/agency/agents"
                element={
                  <AgencyAdminProtected>
                    <AgentManagementPage />
                  </AgencyAdminProtected>
                }
              />
              <Route
                path="/vessel-owners"
                element={
                  <AgencyAdminProtected>
                    <VesselOwnerPage />
                  </AgencyAdminProtected>
                }
              />
              <Route
                path="/vessels/:id"
                element={
                  <AgencyAdminProtected>
                    <VesselPage />
                  </AgencyAdminProtected>
                }
              />
              <Route
                path="/crewing-agents"
                element={
                  <AgencyAdminProtected>
                    <CrewingAgentPage />
                  </AgencyAdminProtected>
                }
              />
            </>
          )}

          {userRole === "AGENT" && (
            <>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/vessel-owners" element={<VesselOwnerPage />} />
              <Route path="/vessels/:id" element={<VesselPage />} />
              <Route path="/crewing-agents" element={<CrewingAgentPage />} />
            </>
          )}

          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </>,
    ),
  );

  return isAuthChecked ? <RouterProvider router={routes} /> : "";
}

export default App;

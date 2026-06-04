import { useMemo } from "react";
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
} from "./features/auth/AuthSlice";
import { Logout } from "./features/auth/components/Logout";
import { Protected } from "./features/auth/components/Protected";
import { AgentStatusRedirect } from "./features/auth/components/AgentStatusRedirect";
import { useAuthCheck } from "./hooks/useAuth/useAuthCheck";
import {
  ForgotPasswordPage,
  LoginPage,
  OtpVerificationPage,
  ResetPasswordPage,
  UserProfilePage,
} from "./pages";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RootLayout } from "./layout/RootLayout";
import { VesselOwnerPage } from "./pages/VesselOwnerPage";
import { VesselPage } from "./pages/VesselPage";
import { AgentManagementPage } from "./pages/AgentManagementPage";
import { AgencyManagementPage } from "./pages/AgencyManagementPage";
import { CandidatesPage } from "./pages/CandidatesPage";
import { CandidatesFormPage } from "./pages/CandidatesFormPage";
import { FeedbacksPage } from "./pages/FeedbacksPage";
import { AgentOnboardingPage } from "./pages/AgentOnboardingPage";
import { DashboardPage } from "./pages/DashboardPage";
import {
  AgencyAdminProtected,
  SuperAdminProtected,
  AgentProtected,
} from "./features/auth/components/RoleProtected";

function RoleHomeRedirect() {
  const user = useSelector(selectLoggedInUser);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
}

const appRoutes = createRoutesFromElements(
  <>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/verify-otp" element={<OtpVerificationPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route
      path="/reset-password/:userId/:passwordResetToken"
      element={<ResetPasswordPage />}
    />
    <Route
      path="/logout"
      element={
        <Protected>
          <Logout />
        </Protected>
      }
    />

    <Route
      element={
        <Protected>
          <RootLayout />
        </Protected>
      }
    >
      <Route element={<AgentStatusRedirect />}>
        <Route path="/" element={<RoleHomeRedirect />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<UserProfilePage />} />

        <Route
          path="/super-admin/agencies"
          element={
            <SuperAdminProtected>
              <AgencyManagementPage />
            </SuperAdminProtected>
          }
        />
        <Route
          path="/super-admin/agencies/:agencyId/agents"
          element={
            <SuperAdminProtected>
              <AgentManagementPage viewMode="super-admin" />
            </SuperAdminProtected>
          }
        />
        <Route
          path="/super-admin/feedbacks"
          element={
            <SuperAdminProtected>
              <FeedbacksPage />
            </SuperAdminProtected>
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

        <Route path="/agent/onboarding" element={<AgentOnboardingPage />} />
        <Route
          path="/vessel-owners"
          element={
            <AgentProtected>
              <VesselOwnerPage />
            </AgentProtected>
          }
        />
        <Route
          path="/vessels/:id"
          element={
            <AgentProtected>
              <VesselPage />
            </AgentProtected>
          }
        />
        <Route
          path="/candidates"
          element={
            <AgentProtected>
              <CandidatesPage />
            </AgentProtected>
          }
        />
        <Route
          path="/candidates/add"
          element={
            <AgentProtected>
              <CandidatesFormPage />
            </AgentProtected>
          }
        />
        <Route
          path="/candidates/edit/:id"
          element={
            <AgentProtected>
              <CandidatesFormPage />
            </AgentProtected>
          }
        />
        <Route
          path="/feedbacks"
          element={
            <AgentProtected>
              <FeedbacksPage />
            </AgentProtected>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/login" replace />} />
  </>,
);

function App() {
  const isAuthChecked = useSelector(selectIsAuthChecked);
  useAuthCheck();

  const router = useMemo(() => createBrowserRouter(appRoutes), []);

  return isAuthChecked ? <RouterProvider router={router} /> : null;
}

export default App;

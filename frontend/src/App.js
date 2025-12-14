import { useSelector } from 'react-redux';
import {
  Navigate,
  Route, RouterProvider, createBrowserRouter, createRoutesFromElements
} from "react-router-dom";
import { selectIsAuthChecked, selectLoggedInUser } from './features/auth/AuthSlice';
import { Logout } from './features/auth/components/Logout';
import { Protected } from './features/auth/components/Protected';
import { useAuthCheck } from "./hooks/useAuth/useAuthCheck";
import { useFetchLoggedInUserDetails } from "./hooks/useAuth/useFetchLoggedInUserDetails";
import { ForgotPasswordPage, HomePage, LoginPage, OtpVerificationPage, ResetPasswordPage, SignupPage, UserProfilePage } from './pages';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
// import { VesselOwnerPage } from './pages/VesselOwnerPage';
// import { VesselManagerPage } from './pages/VesselManagerPage';
// import { VesselPage } from './pages/VesselPage';
// import { RankPage } from './pages/RankPage';
// import { CrewPage } from './pages/CrewPage';
// import { CrewingAgentPage } from './pages/CrewingAgentPage';
// import { ProposePage } from './pages/ProposePage';
// import { AddProposePage } from './pages/AddProposePage';
// import { EditProposalPage } from './pages/EditProposalPage';
// import { Form1PDF } from './pages/Form1PDF';
import { Child } from './pages/Child';
import { Box } from 'react-router-dom'
import { RootLayout } from './layout/RootLayout'
import { VesselOwnerPage } from './pages/VesselOwnerPage';
import { CrewingAgentPage } from './pages/CrewingAgentPage';

function App() {
  const isAuthChecked = useSelector(selectIsAuthChecked)
  const loggedInUser = useSelector(selectLoggedInUser)

  useAuthCheck();
  useFetchLoggedInUserDetails(loggedInUser);

  const routes = createBrowserRouter(
    createRoutesFromElements(
      <>
        {/* Public routes */}
        <Route path='/signup' element={<SignupPage />} />
        <Route path='/child' element={<Child />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/verify-otp' element={<OtpVerificationPage />} />
        <Route path='/forgot-password' element={<ForgotPasswordPage />} />
        <Route path='/reset-password/:userId/:passwordResetToken' element={<ResetPasswordPage />} />
        <Route exact path='/logout' element={<Protected><Logout /></Protected>} />

        {/* Protected layout: Navbar + SidebarStatic + Outlet */}
        <Route element={<Protected><RootLayout /></Protected>}>
          {loggedInUser?.isAdmin ? (
            // admin routes inside RootLayout
            <>
              <Route path='/admin/dashboard' element={<AdminDashboardPage />} />
              <Route path='/' element={<Navigate to='/admin/dashboard' replace />} />
            </>
          ) : (
            // user routes inside RootLayout
            <>
              <Route path='/' element={<HomePage />} />
              <Route path='/profile' element={<UserProfilePage />} />
+             <Route path='/vessel-owners' element={<VesselOwnerPage/>}/>
+             <Route path='/crewingAgents' element={<CrewingAgentPage/>}/>
            </>
          )}
        </Route>

        {/* fallback */}
        <Route path='*' element={<NotFoundPage />} />
      </>
    )
  )

  return isAuthChecked ? <RouterProvider router={routes} /> : ""
}

export default App;

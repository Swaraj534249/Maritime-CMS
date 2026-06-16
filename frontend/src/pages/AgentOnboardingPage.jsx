import { Paper, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ProfileForm } from "../features/user/components/ProfileForm";
import {
  selectLoggedInUser,
  setLoggedInUser,
} from "../features/auth/AuthSlice";
import { completeUserOnboarding } from "../features/user/UserApi";
import { usePageTitle } from "../features/navigation/PageTitleContext";

export function AgentOnboardingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loggedInUser = useSelector(selectLoggedInUser);

  usePageTitle("Complete your profile");

  const handleComplete = async ({ id, data, s3Uploads }) => {
    const updated = await completeUserOnboarding({ id, data, s3Uploads });
    const agency = updated.agencyId;
    const merged = {
      ...updated,
      agencyId: agency?._id || agency || updated.agencyId,
      agencyName: agency?.name || loggedInUser?.agencyName,
      agencyShortName: agency?.shortName || loggedInUser?.agencyShortName,
    };
    dispatch(setLoggedInUser(merged));
    toast.success("Profile saved. Welcome!");
    navigate("/dashboard", { replace: true });
  };

  if (!loggedInUser?._id) return null;

  return (
    <Stack alignItems="center" sx={{ py: 2 }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, width: "100%", maxWidth: 800 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Complete your profile
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Add your contact and identity details to continue. Email cannot be
          changed.
        </Typography>
        <ProfileForm
          mode="onboarding"
          userId={loggedInUser._id}
          email={loggedInUser.email}
          initialValues={loggedInUser}
          submitLabel="Save and continue"
          onSubmitSuccess={handleComplete}
        />
      </Paper>
    </Stack>
  );
}

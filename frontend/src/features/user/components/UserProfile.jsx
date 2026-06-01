import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useDispatch, useSelector } from "react-redux";
import {
  selectLoggedInUser,
  setLoggedInUser,
} from "../../auth/AuthSlice";
import {
  fetchLoggedInUserById,
  updateUserProfile,
} from "../UserApi";
import { ProfileForm } from "./ProfileForm";
import {
  useFileDisplayUrl,
  invalidateFileDisplayCache,
} from "../../../hooks/useFileDisplayUrl";
import { toast } from "react-toastify";
import { usePageTitle } from "../../navigation/PageTitleContext";
import { getProfileBadgeLabel } from "../../../utils/formatLabel";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function DetailRow({ label, value }) {
  return (
    <Stack spacing={0.25} sx={{ py: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value || "—"}</Typography>
    </Stack>
  );
}

function roleLabel(user) {
  if (user?.userType) return user.userType;
  if (user?.role === "AGENCY_ADMIN") return "Agency Admin";
  if (user?.role === "SUPER_ADMIN") return "Super Admin";
  if (user?.role === "AGENT") return "Agent";
  return null;
}

function ProfileAvatar({ user }) {
  const avatarUrl = useFileDisplayUrl(user?.avatar);
  const [imgFailed, setImgFailed] = React.useState(false);
  const initials = (user?.name || "A")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const showImage = avatarUrl && user?.avatar?.path && !imgFailed;

  React.useEffect(() => {
    setImgFailed(false);
  }, [user?.avatar?.path]);

  return (
    <Box
      sx={{
        width: 96,
        height: 96,
        borderRadius: "50%",
        bgcolor: "primary.main",
        color: "primary.contrastText",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontWeight: 700,
        fontSize: "1.5rem",
      }}
    >
      {showImage ? (
        <Box
          component="img"
          src={avatarUrl}
          alt={user?.name}
          onError={() => setImgFailed(true)}
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initials
      )}
    </Box>
  );
}

export const UserProfile = () => {
  const dispatch = useDispatch();
  const loggedInUser = useSelector(selectLoggedInUser);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  usePageTitle("Profile");

  const userId = loggedInUser?._id;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    setLoading(true);

    fetchLoggedInUserById(userId)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const user = profile || loggedInUser;
  const badgeLabel = getProfileBadgeLabel(user);

  const handleProfileUpdate = async ({ id, data, s3Uploads }) => {
    if (s3Uploads?.avatar?.key) {
      invalidateFileDisplayCache(profile?.avatar?.path);
    }
    const updated = await updateUserProfile({ id, data, s3Uploads });
    const agency = updated.agencyId;
    const merged = {
      ...updated,
      agencyId: agency?._id || agency || updated.agencyId,
      agencyName: agency?.name || loggedInUser?.agencyName,
      agencyShortName: agency?.shortName || loggedInUser?.agencyShortName,
    };
    dispatch(setLoggedInUser(merged));
    setProfile(updated);
    setEditOpen(false);
    toast.success("Profile updated");
  };

  if (loading && !user?.phone) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        Loading profile…
      </Typography>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Stack alignItems="center" spacing={2}>
              <ProfileAvatar user={user} />
              <Stack alignItems="center" spacing={0.5} sx={{ width: "100%" }}>
                <Typography variant="h6" fontWeight={600} textAlign="center">
                  {user?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
                {badgeLabel && (
                  <Chip label={badgeLabel} size="small" sx={{ mt: 0.5 }} />
                )}
                {(user?.agencyName || user?.agencyId?.name) && (
                  <Typography variant="caption" color="text.secondary">
                    {user.agencyName || user.agencyId?.name}
                  </Typography>
                )}
              </Stack>
              <Button
                variant="outlined"
                startIcon={<EditOutlinedIcon />}
                onClick={() => setEditOpen(true)}
                sx={{ textTransform: "none" }}
              >
                Edit profile
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Personal details
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <DetailRow label="Phone" value={user?.phone} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailRow label="Alternate phone" value={user?.alternatePhone} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailRow label="Date of birth" value={formatDate(user?.dateOfBirth)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailRow label="Gender" value={user?.gender} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailRow label="Blood group" value={user?.bloodGroup} />
              </Grid>
              <Grid item xs={12}>
                <DetailRow label="Address" value={user?.address} />
              </Grid>
            </Grid>

            <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3 }} gutterBottom>
              Identity
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <DetailRow label="Aadhar number" value={user?.aadharNumber} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailRow label="PAN number" value={user?.panNumber} />
              </Grid>
            </Grid>

            {(user?.socialMedia?.linkedin ||
              user?.socialMedia?.instagram ||
              user?.socialMedia?.facebook) && (
              <>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3 }} gutterBottom>
                  Social
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <DetailRow label="LinkedIn" value={user?.socialMedia?.linkedin} />
                <DetailRow label="Instagram" value={user?.socialMedia?.instagram} />
                <DetailRow label="Facebook" value={user?.socialMedia?.facebook} />
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit profile</DialogTitle>
        <DialogContent>
          <ProfileForm
            mode="edit"
            userId={user?._id}
            email={user?.email}
            initialValues={user}
            submitLabel="Save changes"
            onSubmitSuccess={handleProfileUpdate}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

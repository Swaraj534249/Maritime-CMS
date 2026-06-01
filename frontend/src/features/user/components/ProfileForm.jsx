import React, { useState } from "react";
import {
  Box,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { LoadingButton } from "@mui/lab";
import FileUploadField from "../../../components/FileUpload/FileUploadField";
import { uploadFormFilesViaPresigned } from "../../../utils/s3PresignedUpload";
import { toast } from "react-toastify";

const GENDERS = ["Male", "Female", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function toDateInputValue(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function ProfileForm({
  initialValues,
  userId,
  email,
  submitLabel = "Save",
  onSubmitSuccess,
  mode = "onboarding",
}) {
  const [submitting, setSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [aadharFile, setAadharFile] = useState(null);
  const [panFile, setPanFile] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: initialValues?.name || "",
      phone: initialValues?.phone || "",
      alternatePhone: initialValues?.alternatePhone || "",
      dateOfBirth: toDateInputValue(initialValues?.dateOfBirth),
      gender: initialValues?.gender || "",
      address: initialValues?.address || "",
      bloodGroup: initialValues?.bloodGroup || "",
      aadharNumber: initialValues?.aadharNumber || "",
      panNumber: initialValues?.panNumber || "",
      linkedin: initialValues?.socialMedia?.linkedin || "",
      instagram: initialValues?.socialMedia?.instagram || "",
      facebook: initialValues?.socialMedia?.facebook || "",
    },
  });

  const handleFormSubmit = async (values) => {
    setSubmitting(true);
    try {
      const uploadedFiles = {};
      if (avatarFile?.[0]) uploadedFiles.avatar = avatarFile[0];
      if (aadharFile?.[0]) uploadedFiles.aadhar = aadharFile[0];
      if (panFile?.[0]) uploadedFiles.pan = panFile[0];

      let s3Uploads = {};
      if (Object.keys(uploadedFiles).length) {
        const { uploads, failures } = await uploadFormFilesViaPresigned(
          uploadedFiles,
          {
            uploadFolder: "users",
            formFields: { userId },
          },
        );
        s3Uploads = uploads;
        if (failures.length) {
          toast.warn(
            failures.map((f) => `${f.fileName}: ${f.message}`).join("; "),
          );
        }
      }

      const payload = {
        name: values.name?.trim(),
        phone: values.phone?.trim(),
        alternatePhone: values.alternatePhone?.trim() || undefined,
        dateOfBirth: values.dateOfBirth,
        gender: values.gender,
        address: values.address?.trim(),
        bloodGroup: values.bloodGroup || undefined,
        aadharNumber: values.aadharNumber?.trim() || undefined,
        panNumber: values.panNumber?.trim() || undefined,
        linkedin: values.linkedin?.trim() || undefined,
        instagram: values.instagram?.trim() || undefined,
        facebook: values.facebook?.trim() || undefined,
      };

      await onSubmitSuccess({ id: userId, data: payload, s3Uploads });
    } catch (err) {
      toast.error(err?.message || "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  const required = mode === "onboarding";

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(handleFormSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Name"
            {...register("name", { required: required && "Name is required" })}
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Email" value={email || ""} disabled />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone"
            {...register("phone", {
              required: required && "Phone is required",
            })}
            error={Boolean(errors.phone)}
            helperText={errors.phone?.message}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Alternate phone"
            {...register("alternatePhone")}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="date"
            label="Date of birth"
            InputLabelProps={{ shrink: true }}
            {...register("dateOfBirth", {
              required: required && "Date of birth is required",
            })}
            error={Boolean(errors.dateOfBirth)}
            helperText={errors.dateOfBirth?.message}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller
            name="gender"
            control={control}
            rules={{ required: required && "Gender is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                fullWidth
                label="Gender"
                error={Boolean(errors.gender)}
                helperText={errors.gender?.message}
              >
                {GENDERS.map((g) => (
                  <MenuItem key={g} value={g}>
                    {g}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller
            name="bloodGroup"
            control={control}
            render={({ field }) => (
              <TextField {...field} select fullWidth label="Blood group">
                <MenuItem value="">—</MenuItem>
                {BLOOD_GROUPS.map((bg) => (
                  <MenuItem key={bg} value={bg}>
                    {bg}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Address"
            {...register("address", {
              required: required && "Address is required",
            })}
            error={Boolean(errors.address)}
            helperText={errors.address?.message}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Aadhar number" {...register("aadharNumber")} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="PAN number" {...register("panNumber")} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FileUploadField
            label="Profile photo"
            accept="image/*"
            multiple={false}
            value={avatarFile || []}
            onChange={setAvatarFile}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FileUploadField
            label="Aadhar (optional)"
            accept="image/*,.pdf"
            multiple={false}
            value={aadharFile || []}
            onChange={setAadharFile}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FileUploadField
            label="PAN (optional)"
            accept="image/*,.pdf"
            multiple={false}
            value={panFile || []}
            onChange={setPanFile}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Social links (optional)
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="LinkedIn" {...register("linkedin")} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="Instagram" {...register("instagram")} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="Facebook" {...register("facebook")} />
        </Grid>
      </Grid>

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
        <LoadingButton
          type="submit"
          variant="contained"
          loading={submitting}
          sx={{ textTransform: "none" }}
        >
          {submitLabel}
        </LoadingButton>
      </Stack>
    </Box>
  );
}

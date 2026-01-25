import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Breadcrumbs,
  Link as MuiLink,
  Stack,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import { LoadingButton } from "@mui/lab";
import { toast } from "react-toastify";
import CandidateForm from "./CandidateForm";
import {
  createCandidateAsync,
  updateCandidateByIdAsync,
  fetchCandidateByIdAsync,
  selectCreateStatus,
  selectUpdateStatus,
  resetStatuses,
} from "../CandidateSlice";

export const CandidateFormPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams(); // For edit mode
  
  const createStatus = useSelector(selectCreateStatus);
  const updateStatus = useSelector(selectUpdateStatus);
  
  const [candidateData, setCandidateData] = useState(null);
  const [loading, setLoading] = useState(false);

  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      dispatch(fetchCandidateByIdAsync(id))
        .unwrap()
        .then((data) => {
          setCandidateData(data);
          setLoading(false);
        })
        .catch((error) => {
          toast.error("Failed to load candidate data");
          setLoading(false);
          navigate("/candidates");
        });
    }
  }, [id, isEditMode, dispatch, navigate]);

  useEffect(() => {
    if (createStatus === "fulfilled") {
      toast.success("Candidate created successfully");
      dispatch(resetStatuses());
      navigate("/candidates");
    }

    if (createStatus === "rejected") {
      toast.error("Failed to create candidate");
      dispatch(resetStatuses());
    }
  }, [createStatus, dispatch, navigate]);

  useEffect(() => {
    if (updateStatus === "fulfilled") {
      toast.success("Candidate updated successfully");
      dispatch(resetStatuses());
      navigate("/candidates");
    }

    if (updateStatus === "rejected") {
      toast.error("Failed to update candidate");
      dispatch(resetStatuses());
    }
  }, [updateStatus, dispatch, navigate]);

  const handleBack = () => {
    navigate("/candidates");
  };

  const handleSubmit = async (formData, uploadedFiles) => {
    try {
      const data = new FormData();
      data.append("uploadFolder", "candidates");

      // Append form data
      Object.entries(formData).forEach(([key, val]) => {
        if (val === undefined || val === null || val === "") return;
        
        // Handle nested objects (like address, nextOfKin)
        if (typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
          data.append(key, JSON.stringify(val));
        } else {
          data.append(key, val);
        }
      });

      // Append uploaded files
      Object.entries(uploadedFiles).forEach(([fieldName, file]) => {
        if (file) {
          data.append(fieldName, file);
        }
      });

      if (isEditMode) {
        data.append("_id", candidateData._id);
        await dispatch(updateCandidateByIdAsync(data)).unwrap();
      } else {
        await dispatch(createCandidateAsync(data)).unwrap();
      }
    } catch (error) {
      console.error("Candidate submit error:", error);
    }
  };

  const pageTitle = isEditMode ? "Edit Candidate" : "Add New Candidate";
  const isSubmitting = createStatus === "pending" || updateStatus === "pending";

  if (isEditMode && loading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
        <Typography>Loading candidate data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      {/* Header with Breadcrumbs */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={handleBack} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Breadcrumbs>
          <MuiLink
            underline="hover"
            color="inherit"
            onClick={handleBack}
            sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <PersonIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Candidates
          </MuiLink>
          <Typography color="text.primary">{pageTitle}</Typography>
        </Breadcrumbs>
      </Stack>

      {/* Form Paper */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {pageTitle}
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <CandidateForm
          formId="candidate-form"
          initialData={candidateData}
          onSubmit={handleSubmit}
          onCancel={handleBack}
          isEditMode={isEditMode}
          isSubmitting={isSubmitting}
        />

        {/* Action Buttons */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          sx={{ mt: 4, pt: 3, borderTop: "1px solid #e0e0e0" }}
        >
          <Button variant="outlined" onClick={handleBack} disabled={isSubmitting}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            form="candidate-form"
            variant="contained"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isEditMode ? "Update Candidate" : "Create Candidate"}
          </LoadingButton>
        </Stack>
      </Paper>
    </Box>
  );
};

export default CandidateFormPage;
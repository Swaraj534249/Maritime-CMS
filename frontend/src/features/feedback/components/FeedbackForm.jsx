import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import FileUploadField from "../../../components/FileUpload/FileUploadField";
import {
  submitFeedbackAsync,
  resetFeedbackStatuses,
} from "../FeedbackSlice";

const CATEGORIES = [
  "General Feedback / Suggestion",
  "Bug / Technical Issue",
];

export function FeedbackForm({ open, onClose, onSubmitted }) {
  const dispatch = useDispatch();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setCategory(CATEGORIES[0]);
    setTitle("");
    setDescription("");
    setAttachments([]);
  };

  const handleClose = () => {
    resetForm();
    dispatch(resetFeedbackStatuses());
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      attachments.forEach((file) => formData.append("attachments", file));

      await dispatch(submitFeedbackAsync(formData)).unwrap();
      toast.success("Feedback submitted successfully");
      onSubmitted?.();
      handleClose();
    } catch (err) {
      toast.error(err?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Submit Feedback
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
          disabled={submitting}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              select
              label="Feedback Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              fullWidth
              disabled={submitting}
            >
              {CATEGORIES.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Feedback Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              disabled={submitting}
              inputProps={{ maxLength: 250 }}
            />
            <TextField
              label="Feedback Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              fullWidth
              multiline
              minRows={4}
              disabled={submitting}
              inputProps={{ maxLength: 2000 }}
            />
            <FileUploadField
              label="ADD ATTACHMENT (OPTIONAL)"
              accept="*"
              multiple
              helperText="PDF, images, documents (Max 10MB each, up to 5 files)"
              disabled={submitting}
              value={attachments}
              onChange={setAttachments}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={submitting}
            disabled={submitting}
          >
            Submit
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

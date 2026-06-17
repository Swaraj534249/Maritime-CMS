import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Stack,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";

/**
 * Small add/edit modal with a single name field. Kept as its own dialog so
 * extra fields can be added later without crowding the table.
 */
export function AssetForm({
  open,
  onClose,
  onSubmit,
  initialValue = "",
  fieldLabel,
  entityLabel,
  submitting = false,
}) {
  const [name, setName] = useState(initialValue);
  const isEdit = Boolean(initialValue);

  useEffect(() => {
    if (open) setName(initialValue || "");
  }, [open, initialValue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (err) {
      toast.error(err?.message || `Failed to save ${entityLabel.toLowerCase()}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        {isEdit ? `Edit ${entityLabel}` : `Add ${entityLabel}`}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
          disabled={submitting}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              label={fieldLabel}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus
              disabled={submitting}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={submitting}
            disabled={!name.trim() || submitting}
          >
            {isEdit ? "Update" : "Create"}
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

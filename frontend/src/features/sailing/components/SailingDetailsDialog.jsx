import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Stack,
  Box,
  Typography,
  Chip,
  Divider,
  TextField,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import { signOffSailing } from "../SailingApi";
import { getErrorMessage } from "../../../utils/getErrorMessage";

const toDateInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function DetailItem({ label, value, strong }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", lineHeight: 1.2 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={strong ? 700 : 500} noWrap>
        {value || "—"}
      </Typography>
    </Box>
  );
}

export function SailingDetailsDialog({ open, sailing, onClose, onUpdated }) {
  const [signOffDate, setSignOffDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sailing) return;
    setSignOffDate(toDateInput(sailing.actualSignOffDate));
    setArrivalDate(toDateInput(sailing.arrivalDate));
  }, [sailing]);

  if (!sailing) return null;

  const isSignedOff = sailing.status === "Signed Off";

  const handleSave = async () => {
    if (!signOffDate) {
      toast.error("Please enter the sign-off date");
      return;
    }
    setSaving(true);
    try {
      await signOffSailing({
        id: sailing._id,
        actualSignOffDate: signOffDate,
        arrivalDate: arrivalDate || undefined,
      });
      toast.success("Sailing signed off");
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to sign off"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        {sailing.candidateName}
        <Typography variant="body2" color="text.secondary">
          {sailing.vacancyCode} · {sailing.rank}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
          disabled={saving}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Candidate
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
            gap: 1.5,
            mb: 2,
          }}
        >
          <DetailItem label="INDOS" value={sailing.indosNumber} strong />
          <DetailItem label="Passport" value={sailing.passportNumber} />
          <DetailItem label="CDC" value={sailing.cdcNumber} />
          <DetailItem label="Company" value={sailing.vesselOwnerName} />
          <DetailItem label="Vessel" value={sailing.vesselName} />
          <DetailItem
            label="Contract"
            value={
              sailing.contractDurationMonths
                ? `${sailing.contractDurationMonths} months`
                : null
            }
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Schedule
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(2, 1fr)" },
            gap: 1.5,
            mb: 2,
          }}
        >
          <DetailItem label="Date of Leaving" value={fmtDate(sailing.leavingDate)} />
          <DetailItem label="Sign-on Date" value={fmtDate(sailing.signOnDate)} />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Typography variant="subtitle2">Sign-off</Typography>
          {isSignedOff && (
            <Chip label="Signed Off" size="small" color="default" />
          )}
        </Stack>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <TextField
            label="Sign-off Date"
            type="date"
            value={signOffDate}
            onChange={(e) => setSignOffDate(e.target.value)}
            size="small"
            required
            disabled={saving}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: "100%", sm: 200 } }}
          />
          <TextField
            label="Date of Arrival"
            type="date"
            value={arrivalDate}
            onChange={(e) => setArrivalDate(e.target.value)}
            size="small"
            disabled={saving}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: "100%", sm: 200 } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <LoadingButton variant="contained" loading={saving} onClick={handleSave}>
          {isSignedOff ? "Update Sign-off" : "Confirm Sign-off"}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

export default SailingDetailsDialog;

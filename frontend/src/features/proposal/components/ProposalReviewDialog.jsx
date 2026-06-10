import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
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
  Divider,
  Chip,
  Grid,
  Paper,
  CircularProgress,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import CloseIcon from "@mui/icons-material/Close";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { toast } from "react-toastify";
import {
  CHECKLIST_STEPS,
  updateProposalChecklistAsync,
  selectProposalAsync,
  rejectProposalAsync,
} from "../ProposalSlice";
import { getErrorMessage } from "../../../utils/getErrorMessage";

const fmtDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
};

const ageFrom = (dob) => {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
};

const Field = ({ label, value }) => (
  <Grid item xs={6} sm={4}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: "break-word" }}>
      {value || "-"}
    </Typography>
  </Grid>
);

const SectionHeader = ({ icon, title }) => (
  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
    {icon}
    <Typography variant="subtitle2" fontWeight={700}>
      {title}
    </Typography>
  </Stack>
);

export function ProposalReviewDialog({ open, proposal, onClose, onDecided }) {
  const dispatch = useDispatch();
  const [checklist, setChecklist] = useState({
    shortlisted: false,
    verified: false,
    interviewDone: false,
  });
  const [savingKey, setSavingKey] = useState(null);
  const [deciding, setDeciding] = useState(false);

  const isEditable = proposal?.status === "Proposed";

  useEffect(() => {
    if (proposal) {
      const cl = proposal.selectionChecklist || {};
      setChecklist({
        shortlisted: !!cl.shortlisted,
        verified: !!cl.verified,
        interviewDone: !!cl.interviewDone,
      });
    }
  }, [proposal]);

  const allChecked = useMemo(
    () => CHECKLIST_STEPS.every((s) => checklist[s.key]),
    [checklist],
  );

  const candidate = proposal?.candidate || {};
  const vacancy = proposal?.vacancy || {};
  const candidateName =
    proposal?.candidateName ||
    [candidate.firstName, candidate.middleName, candidate.lastName]
      .filter(Boolean)
      .join(" ");
  const age = ageFrom(candidate.dateOfBirth);

  const handleToggle = async (key) => {
    if (!isEditable) return;
    const next = { ...checklist, [key]: !checklist[key] };
    setChecklist(next);
    setSavingKey(key);
    try {
      await dispatch(
        updateProposalChecklistAsync({ id: proposal._id, ...next }),
      ).unwrap();
    } catch (err) {
      setChecklist(checklist);
      toast.error(getErrorMessage(err, "Failed to update checklist"));
    } finally {
      setSavingKey(null);
    }
  };

  const handleSelect = async () => {
    setDeciding(true);
    try {
      await dispatch(selectProposalAsync(proposal._id)).unwrap();
      toast.success("Candidate selected");
      onDecided?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to select candidate"));
    } finally {
      setDeciding(false);
    }
  };

  const handleReject = async () => {
    setDeciding(true);
    try {
      await dispatch(rejectProposalAsync(proposal._id)).unwrap();
      toast.success("Candidate rejected");
      onDecided?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to reject candidate"));
    } finally {
      setDeciding(false);
    }
  };

  if (!proposal) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Review Candidate
        <Chip
          label={proposal.status}
          size="small"
          sx={{ ml: 1 }}
          color={proposal.status === "Selected" ? "success" : "default"}
        />
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
          disabled={deciding}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Vacancy first */}
        <SectionHeader
          icon={<WorkOutlineIcon color="primary" fontSize="small" />}
          title="Vacancy Details"
        />
        <Grid container rowSpacing={1.5} columnSpacing={2} sx={{ mb: 2 }}>
          <Field label="Vacancy ID" value={vacancy.vacancyId} />
          <Field label="Rank" value={vacancy.rank} />
          <Field label="Vessel" value={vacancy.vessel?.vesselname} />
          <Field label="Vessel Type" value={vacancy.vesselType} />
          <Field label="Flag" value={vacancy.flag} />
          <Field
            label="Openings"
            value={`${vacancy.filledCount ?? 0}/${vacancy.openings ?? "-"}`}
          />
          <Field label="Salary" value={vacancy.salary} />
          <Field
            label="Contract"
            value={
              vacancy.contractDurationMonths
                ? `${vacancy.contractDurationMonths} months`
                : "-"
            }
          />
          <Field label="Sign-on Date" value={fmtDate(vacancy.signOnDate)} />
        </Grid>

        <Divider />

        {/* Candidate next */}
        <Box sx={{ mt: 2 }}>
          <SectionHeader
            icon={<PersonOutlineIcon color="primary" fontSize="small" />}
            title="Candidate Details"
          />
          <Grid container rowSpacing={1.5} columnSpacing={2} sx={{ mb: 2 }}>
            <Field label="Name" value={candidateName} />
            <Field label="Rank" value={candidate.rank} />
            <Field label="Vessel Type" value={candidate.vesselType} />
            <Field label="Current Status" value={candidate.currentStatus} />
            <Field label="Nationality" value={candidate.nationality} />
            <Field label="Gender" value={candidate.gender} />
            <Field label="Age" value={age ? `${age} yrs` : "-"} />
            <Field label="Available From" value={fmtDate(candidate.availableFrom)} />
            <Field label="INDOS No." value={candidate.indosNumber} />
            <Field label="CDC No." value={candidate.cdcNumber} />
            <Field label="Passport No." value={candidate.passportNumber} />
            <Field label="Seaman Book" value={candidate.seamanBookNumber} />
            <Field label="Email" value={candidate.email} />
            <Field label="Phone" value={candidate.phone} />
          </Grid>
        </Box>

        <Divider />

        {/* Checklist as 3 cards */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            Selection Checklist
          </Typography>
          <Grid container spacing={2}>
            {CHECKLIST_STEPS.map((step) => {
              const done = checklist[step.key];
              const saving = savingKey === step.key;
              const disabled = !isEditable || saving;
              return (
                <Grid item xs={12} sm={4} key={step.key}>
                  <Paper
                    variant="outlined"
                    onClick={() => !disabled && handleToggle(step.key)}
                    sx={{
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      cursor: disabled ? "default" : "pointer",
                      borderColor: done ? "success.main" : "divider",
                      bgcolor: done ? "rgba(46,125,50,0.08)" : "transparent",
                      transition: "all 0.15s",
                      "&:hover": disabled
                        ? {}
                        : { borderColor: "success.light", bgcolor: "action.hover" },
                    }}
                  >
                    {saving ? (
                      <CircularProgress size={18} />
                    ) : done ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <RadioButtonUncheckedIcon
                        sx={{ color: "grey.400" }}
                        fontSize="small"
                      />
                    )}
                    <Typography
                      variant="body2"
                      fontWeight={done ? 600 : 400}
                      color={done ? "text.primary" : "text.secondary"}
                    >
                      {step.label}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
          {isEditable && !allChecked && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Complete all checklist items to enable selection.
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {isEditable ? (
          <>
            <Button color="error" onClick={handleReject} disabled={deciding}>
              Reject
            </Button>
            <Box sx={{ flex: 1 }} />
            <LoadingButton
              variant="contained"
              color="success"
              onClick={handleSelect}
              loading={deciding}
              disabled={!allChecked}
            >
              Select
            </LoadingButton>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default ProposalReviewDialog;

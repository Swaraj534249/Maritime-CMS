import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Stack,
  Typography,
  Box,
  CircularProgress,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  TextField,
  InputAdornment,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "react-toastify";
import { fetchEligibleCandidates } from "../ProposalApi";
import { proposeCandidatesAsync } from "../ProposalSlice";
import { getErrorMessage } from "../../../utils/getErrorMessage";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

const ageFrom = (dob) => {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const age = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  return age > 0 && age < 120 ? `${age} yrs` : null;
};

export function ProposeDialog({ open, vacancy, onClose, onProposed }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [remainingSlots, setRemainingSlots] = useState(0);
  const [selected, setSelected] = useState({});
  const [search, setSearch] = useState("");

  const vacancyId = vacancy?._id;

  useEffect(() => {
    if (!open || !vacancyId) return;
    let active = true;
    setLoading(true);
    setSelected({});
    setSearch("");
    (async () => {
      try {
        const data = await fetchEligibleCandidates(vacancyId);
        if (!active) return;
        setCandidates(data?.candidates || []);
        setRemainingSlots(data?.remainingSlots ?? 0);
      } catch (err) {
        if (active) toast.error(getErrorMessage(err, "Failed to load candidates"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, vacancyId]);

  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const selectedCount = selectedIds.length;

  const toggle = (id) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        if (selectedCount >= remainingSlots) {
          toast.warning(`You can propose at most ${remainingSlots} more candidate(s)`);
          return prev;
        }
        next[id] = true;
      }
      return next;
    });
  };

  const filtered = candidates.filter((c) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      c.fullName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.rank?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async () => {
    if (selectedCount === 0) return;
    setSubmitting(true);
    try {
      await dispatch(
        proposeCandidatesAsync({ vacancyId, candidateIds: selectedIds }),
      ).unwrap();
      toast.success(`Proposed ${selectedCount} candidate(s)`);
      onProposed?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to propose candidates"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Propose Candidates
        {vacancy?.vacancyId && (
          <Typography variant="body2" color="text.secondary">
            {vacancy.vacancyId} · {vacancy.rank} ·{" "}
            {vacancy.filledCount ?? 0}/{vacancy.openings} filled
          </Typography>
        )}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
          disabled={submitting}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Alert severity="info" sx={{ py: 0.5 }}>
            Selected {selectedCount} / {remainingSlots} available slot(s).
            Only <strong>Available</strong> candidates matching this vacancy's
            rank are shown.
          </Alert>

          <TextField
            size="small"
            placeholder="Search candidates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : filtered.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", py: 4 }}
            >
              No eligible candidates found for this vacancy.
            </Typography>
          ) : (
            <List dense sx={{ maxHeight: 460, overflow: "auto" }}>
              {filtered.map((c) => {
                const details = [
                  ["Rank", c.rank],
                  ["Email", c.email],
                  ["Phone", c.phone],
                  ["Nationality", c.nationality],
                  ["Age", ageFrom(c.dateOfBirth)],
                  ["CDC", c.cdcNumber],
                  ["Available", fmtDate(c.availableFrom)],
                ].filter(([, v]) => v);
                return (
                  <ListItem
                    key={c._id}
                    disablePadding
                    divider
                    secondaryAction={
                      c.vesselType ? (
                        <Chip
                          label={c.vesselType}
                          size="small"
                          variant="outlined"
                        />
                      ) : null
                    }
                  >
                    <ListItemButton
                      onClick={() => toggle(c._id)}
                      disabled={remainingSlots === 0}
                      sx={{ alignItems: "flex-start", py: 1.25 }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                        <Checkbox
                          edge="start"
                          checked={!!selected[c._id]}
                          tabIndex={-1}
                          disableRipple
                        />
                      </ListItemIcon>
                      <ListItemText
                        disableTypography
                        primary={
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ pr: 6 }}
                          >
                            <Typography variant="subtitle2" fontWeight={700}>
                              {c.fullName}
                            </Typography>
                            <Chip
                              size="small"
                              color="primary"
                              label={`INDOS: ${c.indosNumber || "—"}`}
                              sx={{ fontWeight: 700 }}
                            />
                          </Stack>
                        }
                        secondary={
                          <Box
                            sx={{
                              mt: 0.75,
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr 1fr",
                                sm: "repeat(3, minmax(0, 1fr))",
                                md: "repeat(4, minmax(0, 1fr))",
                              },
                              columnGap: 2,
                              rowGap: 0.75,
                              pr: 6,
                            }}
                          >
                            {details.map(([label, value]) => (
                              <Box key={label} sx={{ minWidth: 0 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "block", lineHeight: 1.2 }}
                                >
                                  {label}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  noWrap
                                  title={String(value)}
                                >
                                  {value}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSubmit}
          loading={submitting}
          disabled={selectedCount === 0}
        >
          Propose {selectedCount > 0 ? `(${selectedCount})` : ""}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

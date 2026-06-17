import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Stack,
  Box,
  Typography,
  Chip,
  Paper,
  Divider,
  TextField,
  Checkbox,
  FormControlLabel,
  Link,
  LinearProgress,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { toast } from "react-toastify";
import { getFileURL, getFileSizeError } from "../../../utils/fileUtils";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { uploadFileViaPresigned } from "../../../utils/s3PresignedUpload";
import { getDocumentationById, verifyDocument } from "../DocumentationApi";
import { finalizeSailing } from "../../sailing/SailingApi";

const fmtDisplay = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const addMonths = (date, months) => {
  if (!date || !months) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + Number(months));
  return d;
};

const DOC_CONFIG = [
  {
    key: "passport",
    label: "Passport",
    candidateFileKey: "passport",
    fields: [
      { name: "issueDate", label: "Issue Date", type: "date" },
      { name: "expiryDate", label: "Expiry Date", type: "date" },
    ],
  },
  {
    key: "cdc",
    label: "CDC",
    candidateFileKey: "cdc",
    fields: [
      { name: "issueDate", label: "Issue Date", type: "date" },
      { name: "expiryDate", label: "Expiry Date", type: "date" },
    ],
  },
  {
    key: "ppe",
    label: "PPE",
    fields: [
      { name: "receivedDate", label: "Received Date", type: "date" },
      { name: "receivedBy", label: "Received By", type: "text" },
    ],
  },
  {
    key: "medical",
    label: "Medical Certificate",
    fields: [
      { name: "issueDate", label: "Issue Date", type: "date" },
      { name: "expiryDate", label: "Expiry Date", type: "date" },
      { name: "doctorName", label: "Doctor Name", type: "text" },
    ],
  },
  {
    key: "contractLetter",
    label: "Contract Letter",
    requiredFields: true,
    fields: [
      { name: "leavingDate", label: "Date of Leaving", type: "date" },
      { name: "signOnDate", label: "Sign-on Date", type: "date" },
    ],
  },
];

const toDateInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

const hasFile = (f) => Boolean(f && (f.path || f.filename));

function existingFileFor(doc, cfg) {
  const docFile = doc?.documents?.[cfg.key]?.file?.main;
  if (hasFile(docFile)) return docFile;
  if (cfg.candidateFileKey) {
    const candFile = doc?.candidate?.documents?.[cfg.candidateFileKey]?.main;
    if (hasFile(candFile)) return candFile;
  }
  return null;
}

function DocSection({ doc, cfg, onSaved }) {
  const saved = doc?.documents?.[cfg.key] || {};
  const verified = !!saved.verified;
  const existing = existingFileFor(doc, cfg);

  const isPpe = cfg.key === "ppe";
  const [fields, setFields] = useState({});
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [noPpe, setNoPpe] = useState(false);
  const [noPpeReason, setNoPpeReason] = useState("");

  useEffect(() => {
    const init = {};
    cfg.fields.forEach((f) => {
      const v = saved[f.name];
      init[f.name] = f.type === "date" ? toDateInput(v) : v || "";
    });
    // Contract letter: prefill sign-on date from the vacancy if not set yet.
    if (cfg.key === "contractLetter" && !init.signOnDate) {
      init.signOnDate = toDateInput(doc?.vacancy?.signOnDate);
    }
    setFields(init);
    setFiles([]);
    setNoPpe(!!saved.noPpe);
    setNoPpeReason(saved.noPpeReason || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  const setField = (name, value) =>
    setFields((prev) => ({ ...prev, [name]: value }));

  const indos = doc?.candidate?.indosNumber;

  const handleSave = async () => {
    if (cfg.requiredFields) {
      for (const f of cfg.fields) {
        if (!fields[f.name]) {
          toast.error(`${f.label} is required`);
          return;
        }
      }
    }
    const newFile = files[0];
    // PPE can be verified without a file if a "No PPE" reason is given.
    if (isPpe && noPpe) {
      if (!noPpeReason.trim()) {
        toast.error("Please enter a reason for no PPE");
        return;
      }
    } else if (!newFile && !existing) {
      toast.error("Please upload the document file");
      return;
    }

    setSaving(true);
    try {
      let fileMeta;
      if (newFile) {
        fileMeta = await uploadFileViaPresigned(newFile, {
          uploadFolder: "candidates",
          formFields: indos ? { indosNumber: indos } : {},
          fieldname: cfg.key,
        });
      }
      await verifyDocument({
        id: doc._id,
        docType: cfg.key,
        ...fields,
        ...(isPpe
          ? { noPpe, noPpeReason: noPpe ? noPpeReason.trim() : "" }
          : {}),
        ...(fileMeta ? { file: fileMeta } : {}),
      });
      toast.success(`${cfg.label} verified`);
      onSaved?.();
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to verify ${cfg.label}`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        borderColor: verified ? "success.main" : "divider",
        bgcolor: verified ? "rgba(46,125,50,0.04)" : "background.paper",
      }}
    >
      {/* Line 1: status + name + chip, file controls, action */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        flexWrap="wrap"
        useFlexGap
        sx={{ rowGap: 1 }}
      >
        {verified ? (
          <CheckCircleIcon color="success" fontSize="small" />
        ) : (
          <RadioButtonUncheckedIcon sx={{ color: "grey.400" }} fontSize="small" />
        )}
        <Typography fontWeight={600}>{cfg.label}</Typography>
        <Chip
          size="small"
          label={verified ? "Verified" : "Pending"}
          color={verified ? "success" : "default"}
          variant={verified ? "filled" : "outlined"}
        />

        <Box sx={{ flex: 1 }} />

        {/* File: filename first, then upload/re-upload button */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {files[0] ? (
            <Chip
              label={files[0].name}
              onDelete={saving ? undefined : () => setFiles([])}
              size="small"
              color="primary"
              sx={{ maxWidth: 220 }}
            />
          ) : existing ? (
            <Link
              href={getFileURL(existing.path, existing)}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontSize: 13,
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {existing.originalName || existing.filename || "View file"}
            </Link>
          ) : (
            <Typography variant="caption" color="text.secondary">
              No file
            </Typography>
          )}
          <input
            id={`docfile-${cfg.key}`}
            type="file"
            accept=".pdf,.doc,.docx,image/png,image/jpeg"
            style={{ display: "none" }}
            disabled={saving}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const sizeErr = getFileSizeError(f);
              if (sizeErr) {
                toast.error(sizeErr);
                return;
              }
              setFiles([f]);
            }}
          />
          <label htmlFor={`docfile-${cfg.key}`}>
            <Button
              variant="outlined"
              component="span"
              size="small"
              startIcon={<CloudUploadIcon />}
              disabled={saving}
            >
              {existing ? "Re-upload" : "Upload"}
            </Button>
          </label>
        </Stack>

        <LoadingButton
          variant="contained"
          color="success"
          size="small"
          onClick={handleSave}
          loading={saving}
        >
          {verified ? "Re-verify" : "Save & Verify"}
        </LoadingButton>
      </Stack>

      <Divider sx={{ my: 1.5 }} />

      {/* Line 2: only the fields */}
      <Stack
        direction="row"
        spacing={2}
        flexWrap="wrap"
        useFlexGap
        sx={{ rowGap: 1.5 }}
      >
        {cfg.fields.map((f) => (
          <TextField
            key={f.name}
            label={f.label}
            type={f.type}
            value={fields[f.name] || ""}
            onChange={(e) => setField(f.name, e.target.value)}
            size="small"
            required={!!cfg.requiredFields}
            disabled={isPpe && noPpe}
            sx={{ width: { xs: "100%", sm: 200 } }}
            InputLabelProps={f.type === "date" ? { shrink: true } : undefined}
          />
        ))}

        {isPpe && (
          <>
            <FormControlLabel
              control={
                <Checkbox
                  checked={noPpe}
                  onChange={(e) => setNoPpe(e.target.checked)}
                  disabled={saving}
                />
              }
              label="No PPE"
            />
            {noPpe && (
              <TextField
                label="Reason for no PPE"
                value={noPpeReason}
                onChange={(e) => setNoPpeReason(e.target.value)}
                size="small"
                required
                disabled={saving}
                placeholder="e.g. PPE to be issued on board"
                sx={{ width: { xs: "100%", sm: 320 } }}
              />
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}

export const DocumentationVerify = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signOnDialogOpen, setSignOnDialogOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const load = async () => {
    try {
      const data = await getDocumentationById(id);
      setDoc(data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load documentation"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const verifiedCount = useMemo(
    () =>
      DOC_CONFIG.filter((c) => doc?.documents?.[c.key]?.verified).length,
    [doc],
  );
  const allVerified = verifiedCount === DOC_CONFIG.length;
  const isFinalized = doc?.status === "Contract Finalized";

  const contract = doc?.documents?.contractLetter || {};
  const signOnDate = contract.signOnDate || doc?.vacancy?.signOnDate || null;
  const leavingDate = contract.leavingDate || null;
  const tentativeSignOff = addMonths(
    signOnDate,
    doc?.vacancy?.contractDurationMonths,
  );

  const handleFinalize = async () => {
    setFinalizing(true);
    try {
      await finalizeSailing({ documentationId: id });
      toast.success("Contract approved — candidate signed on");
      setSignOnDialogOpen(false);
      navigate("/sailings");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to finalize sign-on"));
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!doc) return null;

  const candidateName =
    doc.candidateName ||
    [doc.candidate?.firstName, doc.candidate?.lastName].filter(Boolean).join(" ");

  return (
    <Stack sx={{ width: "100%" }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/documentation")}
        sx={{ alignSelf: "flex-start", mb: 1, textTransform: "none" }}
      >
        Back to Documentation
      </Button>

      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h5" fontWeight={600}>
            {candidateName}
          </Typography>
          <Chip
            size="small"
            label={doc.status}
            color={doc.status === "In Documentation" ? "info" : "success"}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {doc.vacancyCode} · {doc.rank}
          {doc.vacancy?.vessel?.vesselname
            ? ` · ${doc.vacancy.vessel.vesselname}`
            : ""}
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography variant="body2" fontWeight={600}>
            Verification progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {verifiedCount}/{DOC_CONFIG.length} verified
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={(verifiedCount / DOC_CONFIG.length) * 100}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      {DOC_CONFIG.map((cfg) => (
        <DocSection key={cfg.key} doc={doc} cfg={cfg} onSaved={load} />
      ))}

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
        <LoadingButton
          variant="contained"
          color="success"
          disabled={!allVerified || isFinalized}
          onClick={() => setSignOnDialogOpen(true)}
        >
          {isFinalized ? "Signed On" : "Proceed to Sign-on"}
        </LoadingButton>
      </Stack>

      <Dialog
        open={signOnDialogOpen}
        onClose={() => !finalizing && setSignOnDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Sign-on</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Approve the contract and sign on <strong>{candidateName}</strong> for{" "}
            <strong>{doc.vacancyCode}</strong>. The candidate and all agency
            staff will be notified by email.
          </Typography>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Date of Leaving
              </Typography>
              <Typography variant="body2">{fmtDisplay(leavingDate)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Sign-on Date
              </Typography>
              <Typography variant="body2">{fmtDisplay(signOnDate)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Tentative Sign-off
              </Typography>
              <Typography variant="body2">
                {fmtDisplay(tentativeSignOff)}
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignOnDialogOpen(false)} disabled={finalizing}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            color="success"
            loading={finalizing}
            onClick={handleFinalize}
          >
            Confirm Sign-on
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default DocumentationVerify;

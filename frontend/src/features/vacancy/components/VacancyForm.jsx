import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import { fetchVesselOwners } from "../../vesselOwner/VesselOwnerApi";
import { fetchVessels } from "../../vessel/VesselApi";
import { fetchRanks } from "../../assets/rank/RankApi";
import {
  createVacancyAsync,
  updateVacancyByIdAsync,
} from "../VacancySlice";
import { getErrorMessage } from "../../../utils/getErrorMessage";

const toDateInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const ownerId = (owner) =>
  typeof owner === "object" && owner !== null ? owner._id : owner;

const VacancyForm = ({ formId = "vacancy-form", initialData, onSubmitted }) => {
  const dispatch = useDispatch();
  const isEditMode = Boolean(initialData?._id);

  const [owners, setOwners] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [vesselsLoading, setVesselsLoading] = useState(false);

  const [form, setForm] = useState({
    vesselOwner: ownerId(initialData?.vesselOwner) || "",
    vessel: ownerId(initialData?.vessel) || "",
    vesselType: initialData?.vesselType || "",
    flag: initialData?.flag || "",
    rank: initialData?.rank || "",
    openings: initialData?.openings || 1,
    salary: initialData?.salary || "",
    signOnDate: toDateInput(initialData?.signOnDate),
    contractDurationMonths: initialData?.contractDurationMonths ?? "",
    remarks: initialData?.remarks || "",
  });

  const setField = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  // Load owners + ranks once.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [ownersRes, ranksRes] = await Promise.all([
          fetchVesselOwners({ limit: 1000 }),
          fetchRanks({ all: "true", activeOnly: "true" }),
        ]);
        if (!active) return;
        setOwners(ownersRes?.data || []);
        setRanks((ranksRes?.data || []).map((r) => r.rankName));
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to load form data"));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Load vessels whenever the selected owner changes.
  useEffect(() => {
    if (!form.vesselOwner) {
      setVessels([]);
      return;
    }
    let active = true;
    setVesselsLoading(true);
    (async () => {
      try {
        const res = await fetchVessels({
          vesselOwnerId: form.vesselOwner,
          limit: 1000,
        });
        if (active) setVessels(res?.data || []);
      } catch (err) {
        if (active) toast.error(getErrorMessage(err, "Failed to load vessels"));
      } finally {
        if (active) setVesselsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [form.vesselOwner]);

  const rankOptions = useMemo(() => {
    const opts = [...ranks];
    if (form.rank && !opts.includes(form.rank)) opts.unshift(form.rank);
    return opts;
  }, [ranks, form.rank]);

  const handleOwnerChange = (value) => {
    setForm((prev) => ({
      ...prev,
      vesselOwner: value,
      // Reset the vessel and its derived fields when owner changes.
      vessel: "",
      vesselType: "",
      flag: "",
    }));
  };

  const handleVesselChange = (value) => {
    const vessel = vessels.find((v) => v._id === value);
    setForm((prev) => ({
      ...prev,
      vessel: value,
      vesselType: vessel?.vesseltype || "",
      flag: vessel?.flag || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.vesselOwner) return toast.error("Vessel owner is required");
    if (!form.vessel) return toast.error("Vessel is required");
    if (!form.rank) return toast.error("Rank is required");

    const payload = {
      vesselOwner: form.vesselOwner,
      vessel: form.vessel,
      vesselType: form.vesselType,
      flag: form.flag,
      rank: form.rank,
      openings: Number(form.openings) || 1,
      salary: form.salary,
      signOnDate: form.signOnDate || null,
      contractDurationMonths:
        form.contractDurationMonths === ""
          ? ""
          : Number(form.contractDurationMonths),
      remarks: form.remarks,
    };

    try {
      if (isEditMode) {
        await dispatch(
          updateVacancyByIdAsync({ id: initialData._id, ...payload }),
        ).unwrap();
        toast.success("Vacancy updated successfully");
      } else {
        await dispatch(createVacancyAsync(payload)).unwrap();
        toast.success("Vacancy created successfully");
      }
      onSubmitted?.();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save vacancy"));
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Vessel Owner"
            value={form.vesselOwner}
            onChange={(e) => handleOwnerChange(e.target.value)}
            fullWidth
            size="small"
            required
          >
            {owners.length === 0 && (
              <MenuItem value="" disabled>
                No vessel owners found
              </MenuItem>
            )}
            {owners.map((o) => (
              <MenuItem key={o._id} value={o._id}>
                {`${o.company_shortname || ""} ${o.company_name || ""}`.trim() ||
                  o.company_name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Vessel"
            value={form.vessel}
            onChange={(e) => handleVesselChange(e.target.value)}
            fullWidth
            size="small"
            required
            disabled={!form.vesselOwner || vesselsLoading}
            helperText={
              !form.vesselOwner ? "Select a vessel owner first" : undefined
            }
            InputProps={{
              endAdornment: vesselsLoading ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : null,
            }}
          >
            {vessels.length === 0 && (
              <MenuItem value="" disabled>
                No vessels for this owner
              </MenuItem>
            )}
            {vessels.map((v) => (
              <MenuItem key={v._id} value={v._id}>
                {v.vesselname}
                {v.imo_Number ? ` (IMO ${v.imo_Number})` : ""}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Vessel Type"
            value={form.vesselType}
            onChange={(e) => setField("vesselType", e.target.value)}
            fullWidth
            size="small"
            helperText="Auto-filled from vessel, editable"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Flag"
            value={form.flag}
            onChange={(e) => setField("flag", e.target.value)}
            fullWidth
            size="small"
            helperText="Auto-filled from vessel, editable"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Rank"
            value={form.rank}
            onChange={(e) => setField("rank", e.target.value)}
            fullWidth
            size="small"
            required
          >
            {rankOptions.length === 0 && (
              <MenuItem value="" disabled>
                No ranks found
              </MenuItem>
            )}
            {rankOptions.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Number of Openings"
            type="number"
            value={form.openings}
            onChange={(e) => setField("openings", e.target.value)}
            fullWidth
            size="small"
            required
            inputProps={{ min: 1 }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Salary"
            value={form.salary}
            onChange={(e) => setField("salary", e.target.value)}
            fullWidth
            size="small"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Sign-on Date"
            type="date"
            value={form.signOnDate}
            onChange={(e) => setField("signOnDate", e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Contract Duration (months)"
            type="number"
            value={form.contractDurationMonths}
            onChange={(e) => setField("contractDurationMonths", e.target.value)}
            fullWidth
            size="small"
            inputProps={{ min: 0 }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Remarks"
            value={form.remarks}
            onChange={(e) => setField("remarks", e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
          />
        </Grid>
      </Grid>
    </form>
  );
};

export default VacancyForm;

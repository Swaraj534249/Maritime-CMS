import React from "react";
import { TextField, MenuItem } from "@mui/material";

/**
 * Reusable status / enum filter dropdown for list pages.
 *
 * Props:
 *  - value: current selected value ("" means all)
 *  - onChange: (value) => void
 *  - options: array of strings OR { label, value }
 *  - label: field label (default "Status")
 *  - allLabel: label for the "show everything" option (default "All")
 *  - sx: style overrides (default fixed width)
 */
const StatusFilter = ({
  value = "",
  onChange = () => {},
  options = [],
  label = "Status",
  allLabel = "All",
  counts = null,
  allCount = null,
  sx = { width: 200 },
}) => {
  const withCount = (text, n) =>
    n === null || n === undefined ? text : `${text} (${n})`;

  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={sx}
    >
      <MenuItem value="">{withCount(allLabel, allCount)}</MenuItem>
      {options.map((opt) => {
        const optValue = typeof opt === "object" ? opt.value : opt;
        const optLabel = typeof opt === "object" ? opt.label : opt;
        const n = counts ? counts[optValue] ?? 0 : null;
        return (
          <MenuItem key={optValue} value={optValue}>
            {withCount(optLabel, n)}
          </MenuItem>
        );
      })}
    </TextField>
  );
};

export default StatusFilter;

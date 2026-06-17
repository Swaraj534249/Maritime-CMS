import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";

const fmt = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const nameOf = (ref) =>
  ref && typeof ref === "object" ? ref.name : undefined;
const idOf = (ref) =>
  ref && typeof ref === "object" ? ref._id : ref;

/**
 * Shows who added a record + when, and (if edited) the last editor.
 * - Same agent edited  -> show only "Updated <date>"
 * - Different agent     -> show "<name> · <date>"
 *
 * Props: addedBy, createdAt, updatedBy, updatedAt (last edited timestamp)
 */
export function AddedByCell({ addedBy, createdAt, updatedBy, updatedAt }) {
  const addedName = nameOf(addedBy) || "-";
  const wasEdited = Boolean(updatedAt);
  const sameEditor =
    wasEdited && idOf(updatedBy) && idOf(addedBy)
      ? String(idOf(updatedBy)) === String(idOf(addedBy))
      : false;

  return (
    <Box sx={{ lineHeight: 1.3, py: 0.5 }}>
      <Typography variant="body2" fontWeight={500} noWrap>
        {addedName}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap display="block">
        {fmt(createdAt)}
      </Typography>

      {wasEdited && (
        <Tooltip title="Last edited" arrow>
          <Typography
            variant="caption"
            color="primary"
            noWrap
            display="block"
            sx={{ mt: 0.25 }}
          >
            {sameEditor
              ? `Updated ${fmt(updatedAt)}`
              : `${nameOf(updatedBy) || "Someone"} · ${fmt(updatedAt)}`}
          </Typography>
        </Tooltip>
      )}
    </Box>
  );
}

export default AddedByCell;

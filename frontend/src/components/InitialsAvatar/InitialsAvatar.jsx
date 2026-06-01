import { Avatar } from "@mui/material";

function initialsFromLabel(label) {
  if (!label) return "?";
  const parts = String(label).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return String(label).slice(0, 2).toUpperCase();
}

/** Name-based avatar only — no S3 / image fetch. */
export default function InitialsAvatar({ label, sx, variant = "rounded" }) {
  return (
    <Avatar sx={{ bgcolor: "primary.main", ...sx }} variant={variant}>
      {initialsFromLabel(label)}
    </Avatar>
  );
}

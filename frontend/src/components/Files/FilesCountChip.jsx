import { Chip } from "@mui/material";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

export default function FilesCountChip({ count, onClick, emptyLabel = "No files" }) {
  if (!count || count < 1) {
    return (
      <span style={{ color: "#999", fontSize: 12 }}>{emptyLabel}</span>
    );
  }

  return (
    <Chip
      icon={<InsertDriveFileIcon />}
      label={`${count} File${count > 1 ? "s" : ""}`}
      size="small"
      color="primary"
      onClick={onClick}
      sx={{ cursor: onClick ? "pointer" : "default" }}
    />
  );
}

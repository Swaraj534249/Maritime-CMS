// components/documents/DocumentSection.jsx
import {
  Box,
  Stack,
  Typography,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Badge,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DownloadIcon from "@mui/icons-material/Download";
import { getFileIcon, isPDF } from "../../utils/fileUtils";
import { useDocumentActions } from "../../hooks/useDocumentActions";

const FileItem = ({ file, label, borderColor, bgColor }) => {
  const { openDocument } = useDocumentActions();

  if (!file?.filename) return null;

  return (
    <ListItemButton
      onClick={() => openDocument(file, process.env.REACT_APP_API_URL)}
      sx={{
        border: `1px solid ${borderColor}`,
        borderRadius: 1,
        mb: 1,
        backgroundColor: bgColor,
        "&:hover": { backgroundColor: "action.hover" },
      }}
    >
      <ListItemIcon>{getFileIcon(file)}</ListItemIcon>

      <ListItemText
        primary={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Badge
              badgeContent={label}
              color={label === "Main" ? "success" : "default"}
            />
            <Typography variant="body2">
              {file.originalName || file.filename}
            </Typography>
          </Stack>
        }
        secondary={`${(file.size / 1024).toFixed(2)} KB • ${new Date(
          file.uploadedAt,
        ).toLocaleDateString()}`}
      />

      <Tooltip title={isPDF(file) ? "Open in new tab" : "Download"}>
        <IconButton edge="end" size="small">
          {isPDF(file) ? (
            <OpenInNewIcon fontSize="small" />
          ) : (
            <DownloadIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </ListItemButton>
  );
};

const DocumentSection = ({ title, icon, documents }) => {
  if (!documents?.main?.filename && !documents?.old?.filename) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        {icon}
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
      </Stack>

      <FileItem
        file={documents.main}
        label="Main"
        borderColor="#4caf50"
        bgColor="#f1f8f4"
      />

      <FileItem
        file={documents.old}
        label="Old"
        borderColor="#e0e0e0"
        bgColor="transparent"
      />
    </Box>
  );
};

export default DocumentSection;

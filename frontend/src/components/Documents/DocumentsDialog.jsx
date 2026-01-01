// components/documents/DocumentsDialog.jsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DocumentSection from "./DocumentSection";

const DocumentsDialog = ({
  open,
  onClose,
  title = "Documents",
  sections = [],
  emptyMessage = "No documents available",
}) => {
  const hasAnyDocs = sections.some(
    (s) => s.documents?.main?.filename || s.documents?.old?.filename,
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {title}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {sections.map((section) => (
          <DocumentSection key={section.key} {...section} />
        ))}

        {!hasAnyDocs && (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ py: 3 }}
          >
            {emptyMessage}
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentsDialog;

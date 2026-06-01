import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DocumentSection from "./DocumentSection";
import { sectionHasFiles } from "../../utils/documentSections";

const DocumentsDialog = ({
  open,
  onClose,
  title = "Files",
  sections = [],
  emptyMessage = "No files available",
}) => {
  const hasAnyFiles = sections.some((s) => sectionHasFiles(s.documents));

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

        {!hasAnyFiles && (
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

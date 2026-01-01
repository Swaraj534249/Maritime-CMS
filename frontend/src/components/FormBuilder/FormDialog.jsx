import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const FormDialog = ({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitText = "Save",
  maxWidth = "md",
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle sx={{ position: "sticky", top: 0, zIndex: 2 }}>
        {title}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ maxHeight: "70vh", overflowY: "auto", pb: 10 }}
      >
        {children}
      </DialogContent>

      <DialogActions
        sx={{
          position: "sticky",
          bottom: 0,
          borderTop: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
          px: 3,
          py: 2,
        }}
      >
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          {submitText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormDialog;

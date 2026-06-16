import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";
import { toast } from "react-toastify";
import DataTable from "../../../components/DataTable/DataTable";
import Search from "../../../components/Search/Search";
import StatusFilter from "../../../components/StatusFilter/StatusFilter";
import { useStatusCounts } from "../../../hooks/useStatusCounts";
import DocumentsDialog from "../../../components/Documents/DocumentsDialog";
import FilesCountChip from "../../../components/Files/FilesCountChip";
import { ListPageHeader } from "../../navigation/components/ListPageHeader";
import FileUploadField from "../../../components/FileUpload/FileUploadField";
import { selectUserRole } from "../../auth/AuthSlice";
import {
  fetchFeedbacksAsync,
  getFeedbackByIdAsync,
  updateFeedbackByIdAsync,
  selectFeedbacks,
  selectFeedbacksTotalCount,
  selectFeedbackFetchStatus,
  selectFeedbackUpdateStatus,
  selectFeedbackPaginationModel,
  selectFeedbackSortModel,
  selectFeedbackSearchValue,
  selectFeedbackStatusFilter,
  setFeedbackPaginationModel,
  setFeedbackSortModel,
  setFeedbackSearchValue,
  setFeedbackStatusFilter,
  selectSelectedFeedback,
  clearSelectedFeedback,
  FEEDBACK_STATUS_OPTIONS,
} from "../FeedbackSlice";
import {
  countFeedbackDocuments,
  feedbackDocumentSections,
  formatStatusLabel,
} from "../feedbackFiles";
import { FeedbackThreadView } from "./FeedbackThreadView";

const ADMIN_STATUS_OPTIONS = [
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const REMINDER_OPTION = { value: "reminder", label: "Send reminder" };

const AGENT_STATUS_OPTIONS = [
  { value: "closed", label: "Close — issue is fixed" },
  { value: "reopened", label: "Re-open — not resolved" },
];

function formatCreatedAt(value) {
  if (!value) return "—";
  const d = new Date(value);
  return `${d.toISOString().slice(0, 10)} • ${d.toTimeString().slice(0, 5)}`;
}

function statusColor(status) {
  switch (status) {
    case "open":
      return "warning";
    case "in_progress":
      return "info";
    case "resolved":
      return "success";
    case "closed":
      return "default";
    case "reopened":
      return "error";
    default:
      return "default";
  }
}

export default function FeedbacksTable() {
  const dispatch = useDispatch();
  const userRole = useSelector(selectUserRole);
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  const feedbacks = useSelector(selectFeedbacks);
  const totalCount = useSelector(selectFeedbacksTotalCount);
  const fetchStatus = useSelector(selectFeedbackFetchStatus);
  const updateStatus = useSelector(selectFeedbackUpdateStatus);
  const paginationModel = useSelector(selectFeedbackPaginationModel);
  const sortModel = useSelector(selectFeedbackSortModel);
  const searchValue = useSelector(selectFeedbackSearchValue);
  const statusFilter = useSelector(selectFeedbackStatusFilter);
  const selected = useSelector(selectSelectedFeedback);

  const {
    total: statusTotal,
    byStatus: statusByCount,
    refetch: refetchStatusCounts,
  } = useStatusCounts("feedbacks", {
    params: searchValue ? { searchValue } : {},
  });

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [docsFeedback, setDocsFeedback] = useState(null);

  const [updateStatusValue, setUpdateStatusValue] = useState("in_progress");
  const [updateNote, setUpdateNote] = useState("");
  const [updateFiles, setUpdateFiles] = useState([]);

  const sortFieldMap = useMemo(
    () => ({
      ticketId: "ticketId",
      title: "title",
      category: "category",
      email: "submittedBy.email",
      createdAt: "createdAt",
      agency: "agencyName",
    }),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    const page1 = paginationModel.page + 1;
    const limit = paginationModel.pageSize;
    const sort = sortModel[0];
    const params = { page: page1, limit };
    if (sort) {
      params.sortField = sortFieldMap[sort.field] || sort.field;
      params.sortOrder = sort.sort;
    }
    if (searchValue) params.searchValue = searchValue;
    if (statusFilter) params.status = statusFilter;

    dispatch(fetchFeedbacksAsync({ params, signal: controller.signal }));
    return () => controller.abort();
  }, [
    dispatch,
    paginationModel.page,
    paginationModel.pageSize,
    sortModel,
    searchValue,
    statusFilter,
    sortFieldMap,
  ]);

  const rows = useMemo(
    () =>
      feedbacks.map((f) => ({
        id: f._id,
        ticketId: f.ticketId,
        title: f.title,
        category: f.category,
        email: f.submittedBy?.email || "—",
        agency: f.agencyShortName || f.agencyName || "—",
        status: f.status,
        createdAt: f.createdAt,
        _raw: f,
      })),
    [feedbacks],
  );

  const handleMenuOpen = (e, row) => {
    setAnchorEl(e.currentTarget);
    setMenuRow(row);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };

  const openView = async () => {
    const id = menuRow?.id;
    handleMenuClose();
    try {
      await dispatch(getFeedbackByIdAsync(id)).unwrap();
      setViewOpen(true);
    } catch (err) {
      toast.error(err?.message || "Failed to load feedback");
    }
  };

  const openUpdate = async () => {
    const row = menuRow;
    handleMenuClose();
    try {
      const feedback = await dispatch(getFeedbackByIdAsync(row.id)).unwrap();
      if (isSuperAdmin) {
        setUpdateStatusValue(
          feedback.status === "resolved" ? "reminder" : "in_progress",
        );
      } else {
        setUpdateStatusValue("closed");
      }
      setUpdateNote("");
      setUpdateFiles([]);
      setUpdateOpen(true);
    } catch (err) {
      toast.error(err?.message || "Failed to load feedback");
    }
  };

  const openDocs = (feedback) => {
    setDocsFeedback(feedback);
    setDocsOpen(true);
  };

  const handleUpdateSave = async () => {
    if (!selected?._id) return;
    if (updateStatusValue === "resolved" && !updateNote.trim()) {
      toast.error("Please describe what was fixed");
      return;
    }
    if (updateStatusValue === "reopened" && !updateNote.trim()) {
      toast.error("Please explain why the issue is not resolved");
      return;
    }
    try {
      await dispatch(
        updateFeedbackByIdAsync({
          id: selected._id,
          status: updateStatusValue,
          note: updateNote.trim(),
          files: updateFiles,
        }),
      ).unwrap();
      toast.success(isReminderUpdate ? "Reminder sent" : "Feedback updated");
      setUpdateOpen(false);
      setUpdateNote("");
      setUpdateFiles([]);
      dispatch(clearSelectedFeedback());
      refetchStatusCounts();
      dispatch(
        fetchFeedbacksAsync({
          params: {
            page: paginationModel.page + 1,
            limit: paginationModel.pageSize,
          },
        }),
      );
    } catch (err) {
      toast.error(err?.message || "Failed to update feedback");
    }
  };

  const showAgentUpdate =
    menuRow && !isSuperAdmin && menuRow.status === "resolved";

  const renderDocsCell = ({ row }) => (
    <FilesCountChip
      count={countFeedbackDocuments(row._raw)}
      onClick={() => openDocs(row._raw)}
    />
  );

  const columns = useMemo(() => {
    const cols = [
      { field: "ticketId", headerName: "Id", flex: 0.8, minWidth: 110 },
      { field: "title", headerName: "Title", flex: 1.4, minWidth: 180 },
      {
        field: "category",
        headerName: "Feedback Category",
        flex: 1.2,
        minWidth: 160,
      },
      {
        field: "email",
        headerName: "Submitted By",
        flex: 1.2,
        minWidth: 180,
      },
    ];
    if (isSuperAdmin) {
      cols.push({
        field: "agency",
        headerName: "Agency",
        flex: 0.9,
        minWidth: 120,
      });
    }
    cols.push(
      {
        field: "files",
        headerName: "Files",
        flex: 0.8,
        minWidth: 110,
        sortable: false,
        renderCell: renderDocsCell,
      },
      {
        field: "status",
        headerName: "Status",
        flex: 0.7,
        minWidth: 110,
        renderCell: ({ value }) => (
          <Chip
            label={formatStatusLabel(value)}
            size="small"
            color={statusColor(value)}
          />
        ),
      },
      {
        field: "createdAt",
        headerName: "Created On",
        flex: 1,
        minWidth: 150,
        valueFormatter: ({ value }) => formatCreatedAt(value),
      },
      {
        field: "actions",
        headerName: "",
        width: 56,
        sortable: false,
        filterable: false,
        align: "center",
        renderCell: ({ row }) => (
          <IconButton size="small" onClick={(e) => handleMenuOpen(e, row)}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        ),
      },
    );
    return cols;
  }, [isSuperAdmin]);

  const statusOptions = isSuperAdmin
    ? selected?.status === "resolved"
      ? [REMINDER_OPTION]
      : ADMIN_STATUS_OPTIONS
    : AGENT_STATUS_OPTIONS;

  const isReminderUpdate = updateStatusValue === "reminder";

  return (
    <Stack sx={{ width: "100%" }}>
      <ListPageHeader
        actions={
          <>
            <StatusFilter
              value={statusFilter}
              onChange={(v) => {
                dispatch(setFeedbackStatusFilter(v));
                dispatch(
                  setFeedbackPaginationModel({
                    ...paginationModel,
                    page: 0,
                  }),
                );
              }}
              options={FEEDBACK_STATUS_OPTIONS}
              counts={statusByCount}
              allCount={statusTotal}
            />
            <Search
              value={searchValue}
              onDebouncedChange={(v) => dispatch(setFeedbackSearchValue(v))}
              delay={800}
              placeholder="Search feedback..."
              sx={{ width: { xs: 140, sm: 220, md: 320 } }}
            />
          </>
        }
      />

      <DataTable
        rows={rows}
        columns={columns}
        loading={fetchStatus === "pending"}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={(m) => dispatch(setFeedbackPaginationModel(m))}
        rowCount={totalCount}
        sortingMode="server"
        sortingModel={sortModel}
        onSortModelChange={(m) => dispatch(setFeedbackSortModel(m))}
        showToolbar={false}
      />

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={openView}>View feedback</MenuItem>
        {isSuperAdmin && (
          <MenuItem onClick={openUpdate}>
            {menuRow?.status === "resolved" ? "Send reminder" : "Update feedback"}
          </MenuItem>
        )}
        {showAgentUpdate && (
          <MenuItem onClick={openUpdate}>Respond to feedback</MenuItem>
        )}
      </Menu>

      <DocumentsDialog
        open={docsOpen}
        onClose={() => {
          setDocsOpen(false);
          setDocsFeedback(null);
        }}
        title="Feedback Files"
        sections={feedbackDocumentSections(docsFeedback)}
        emptyMessage="No files attached"
      />

      <Dialog
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          dispatch(clearSelectedFeedback());
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          View feedback — {selected?.ticketId}
          <IconButton
            onClick={() => {
              setViewOpen(false);
              dispatch(clearSelectedFeedback());
            }}
            sx={{ position: "absolute", right: 12, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2">
                <strong>Title:</strong> {selected?.title}
              </Typography>
              <Typography variant="body2">
                <strong>Category:</strong> {selected?.category}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {formatStatusLabel(selected?.status)}
              </Typography>
              <Typography variant="body2">
                <strong>Submitted by:</strong> {selected?.submittedBy?.name} (
                {selected?.submittedBy?.email})
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Activity
              </Typography>
              <FeedbackThreadView feedback={selected} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setViewOpen(false);
              dispatch(clearSelectedFeedback());
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={updateOpen} onClose={() => setUpdateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          {isSuperAdmin
            ? isReminderUpdate
              ? "Send reminder"
              : "Update feedback"
            : "Respond to feedback"}
          <IconButton
            onClick={() => setUpdateOpen(false)}
            sx={{ position: "absolute", right: 12, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              select
              label="Status"
              value={updateStatusValue}
              onChange={(e) => setUpdateStatusValue(e.target.value)}
              fullWidth
            >
              {statusOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            {(isSuperAdmin && updateStatusValue === "resolved") ||
            !isSuperAdmin ? (
              <TextField
                label={
                  isSuperAdmin
                    ? "What was fixed?"
                    : updateStatusValue === "reopened"
                      ? "Why is this not resolved?"
                      : "Notes (optional)"
                }
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                required={
                  (isSuperAdmin && updateStatusValue === "resolved") ||
                  updateStatusValue === "reopened"
                }
              />
            ) : isReminderUpdate ? (
              <TextField
                label="Reminder message (optional)"
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                fullWidth
                multiline
                minRows={3}
              />
            ) : null}
            {((isSuperAdmin && updateStatusValue === "resolved") ||
              updateStatusValue === "reopened" ||
              isReminderUpdate) && (
              <FileUploadField
                label="ADD ATTACHMENT (OPTIONAL)"
                accept="*"
                multiple
                value={updateFiles}
                onChange={setUpdateFiles}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateOpen(false)}>Cancel</Button>
          <LoadingButton
            variant="contained"
            loading={updateStatus === "pending"}
            onClick={handleUpdateSave}
          >
            {isReminderUpdate ? "Send reminder" : "Save"}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

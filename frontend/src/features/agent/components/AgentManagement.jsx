import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  resetStatuses,
  selectTotalCount,
  selectUpdateStatus,
  selectAgents,
  selectAgentsAggregates,
  selectPaginationModel,
  selectSortModel,
  selectSearchValue,
  setPaginationModel,
  setSortModel,
  setSearchValue,
  fetchAgentsAsync,
  toggleAgentStatusAsync,
  resetAgentTableState,
  selectAgentsContext,
  selectCreateStatus,
} from "../AgentSlice";
import {
  Button,
  IconButton,
  Stack,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton as MuiIconButton,
  Chip,
  Box,
  Avatar,
  Typography,
  Paper,
  DialogActions,
  TextField,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import LockIcon from "@mui/icons-material/Lock";
import { toast } from "react-toastify";
import DataTable from "../../../components/DataTable/DataTable";
import Search from "../../../components/Search/Search";
import AgentForm from "./AgentForm";
import { useRowActions } from "../../../hooks/useRowActions";
import { LoadingButton } from "@mui/lab";

export const AgentManagement = () => {
  const dispatch = useDispatch();

  const agents = useSelector(selectAgents);
  const totalCount = useSelector(selectTotalCount);
  const updateStatus = useSelector(selectUpdateStatus);
    const createStatus = useSelector(selectCreateStatus);
  const aggregates = useSelector(selectAgentsAggregates);
  const agency = useSelector(selectAgentsContext);
  const paginationModel = useSelector(selectPaginationModel);
  const sortModel = useSelector(selectSortModel);
  const searchValue = useSelector(selectSearchValue);

  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [selectedAgentForPassword, setSelectedAgentForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const { anchorEl, open, selectedRowId, handleMenuOpen, handleMenuClose } =
    useRowActions();

  const sortFieldMap = useMemo(
    () => ({
      name: "name",
      email: "email",
      userType: "userType",
      id: "_id",
    }),
    []
  );

  const fetchPage = (
    pageOneBased,
    limit,
    sortField,
    sortOrder,
    searchValue,
    controller
  ) => {
    const params = { page: pageOneBased, limit };
    if (sortField) params.sortField = sortField;
    if (sortOrder) params.sortOrder = sortOrder;
    if (searchValue) params.searchValue = searchValue;
    dispatch(fetchAgentsAsync({ params, signal: controller }));
  };

  useEffect(() => {
    const controller = new AbortController();
    const page1 = paginationModel.page + 1;
    const limit = paginationModel.pageSize;
    const sort = sortModel[0];
    const sortField = sort ? sortFieldMap[sort.field] || sort.field : undefined;
    const sortOrder = sort ? sort.sort : undefined;

    fetchPage(
      page1,
      limit,
      sortField,
      sortOrder,
      searchValue,
      controller.signal
    );

    return () => {
      controller.abort();
    };
  }, [paginationModel, sortModel, searchValue, refreshKey]);

  useEffect(() => {
    if (updateStatus === "fulfilled") {
      toast.success("Agent status updated successfully");
      dispatch(resetStatuses());
    }

    if (updateStatus === "rejected") {
      toast.error("Failed to update agent status");
      dispatch(resetStatuses());
    }
  }, [updateStatus, dispatch]);

  const handleAddNew = () => {
    setEditData(null);
    setOpenModal(true);
  };

  const handleEdit = () => {
    const agent = agents.find((v) => v._id === selectedRowId);
    setEditData(agent);
    setOpenModal(true);
    handleMenuClose();
  };

  const handleToggleStatus = () => {
    dispatch(toggleAgentStatusAsync(selectedRowId));
    handleMenuClose();
  };

  const handleResetPassword = () => {
    const agent = agents.find((v) => v._id === selectedRowId);
    setSelectedAgentForPassword(agent);
    setOpenPasswordDialog(true);
    handleMenuClose();
  };

  const handlePasswordReset = () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    // You can dispatch resetAgentPasswordAsync here
    toast.success("Password reset functionality to be implemented");
    setOpenPasswordDialog(false);
    setNewPassword("");
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditData(null);
  };

  const handlePaginationModelChange = (model) => {
    if (model.pageSize !== paginationModel.pageSize) {
      dispatch(setPaginationModel({ page: 0, pageSize: model.pageSize }));
    } else {
      dispatch(setPaginationModel(model));
    }
  };

  const handleSortModelChange = (newModel) => {
    dispatch(setSortModel(newModel));
    dispatch(setPaginationModel({ ...paginationModel, page: 0 }));
  };

  const handleSearch = (text) => {
    if (text === searchValue) return;
    dispatch(setSearchValue(text));
    dispatch(setPaginationModel({ ...paginationModel, page: 0 }));
  };

  // Render cell functions
  const renderNameCell = (params) => {
    const { name, email } = params.row;
    const initial = name?.charAt(0).toUpperCase() || "A";

    return (
      <Tooltip title={name} arrow>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar
            sx={{ width: 32, height: 32, bgcolor: "primary.main" }}
            variant="rounded"
          >
            {initial}
          </Avatar>
          <div
            style={{
              cursor: "pointer",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1,
            }}
          >
            {name}
          </div>
        </Box>
      </Tooltip>
    );
  };

  const renderEmailCell = (params) => {
    return (
      <Tooltip title={params.row.email} arrow>
        <div
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {params.row.email}
        </div>
      </Tooltip>
    );
  };

  const renderUserTypeCell = (params) => {
    const userType = params.row.userType || "N/A";
    return (
      <Chip
        label={userType}
        size="small"
        variant="outlined"
        color="default"
      />
    );
  };

  const renderStatusCell = (params) => {
    const { isActive, isVerified } = params.row._raw;
    return (
      <Stack direction="row" spacing={0.5}>
        <Chip
          label={isActive ? "Active" : "Inactive"}
          size="small"
          color={isActive ? "success" : "default"}
          variant="filled"
        />
        {isVerified && (
          <Tooltip title="Verified" arrow>
            <CheckIcon color="success" fontSize="small" />
          </Tooltip>
        )}
      </Stack>
    );
  };

  const renderActionsCell = (params) => {
    const id = params.row.id;

    return (
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Tooltip title="More actions" arrow>
          <IconButton
            size="small"
            onClick={(event) => handleMenuOpen(event, id)}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  };

  const rows = agents.map((agent) => ({
    id: agent._id,
    name: agent.name,
    email: agent.email,
    userType: agent.userType,
    isActive: agent.isActive,
    isVerified: agent.isVerified,
    _raw: agent,
  }));

  const columns = [
    {
      field: "name",
      headerName: "Name",
      flex: 1.5,
      minWidth: 180,
      sortable: true,
      renderCell: renderNameCell,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 2,
      minWidth: 220,
      sortable: true,
      renderCell: renderEmailCell,
    },
    {
      field: "userType",
      headerName: "User Type",
      flex: 1.2,
      minWidth: 140,
      sortable: true,
      renderCell: renderUserTypeCell,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 120,
      sortable: false,
      filterable: false,
      renderCell: renderStatusCell,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.6,
      minWidth: 80,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: renderActionsCell,
    },
  ];

  return (
    <Stack justifyContent={"center"} alignItems={"center"}>
      <Stack mt={0} mb={0} sx={{ width: "100%" }}>
        {/* Agency Info */}
        {agency && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Agency: <strong>{agency.name}</strong>
            </Typography>
          </Paper>
        )}

        {/* Header */}
        <Stack
          mb={1}
          direction="row"
          width="100%"
          justifyContent="space-between"
          alignItems="center"
          sx={{ px: 1 }}
        >
          <Typography variant="h6">Agent Management</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Search
              value={searchValue}
              onDebouncedChange={(val) => handleSearch(val)}
              delay={800}
              placeholder="Search agents..."
              sx={{ width: { xs: "140px", sm: "220px", md: "320px" } }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
              sx={{ textTransform: "none" }}
            >
              Add Agent
            </Button>
          </Stack>
        </Stack>

        {/* Data Table */}
        <DataTable
          rows={rows}
          columns={columns}
          sx={{ maxWidth: "100%" }}
          showToolbar={false}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          rowCount={totalCount}
          paginationMode="server"
          sortingMode="server"
          sortingModel={sortModel}
          onSortModelChange={handleSortModelChange}
        />

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEdit}>
            <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleToggleStatus}>
            <LockIcon fontSize="small" sx={{ mr: 1 }} />
            {agents.find((a) => a._id === selectedRowId)?.isActive
              ? "Deactivate"
              : "Activate"}
          </MenuItem>
          <MenuItem onClick={handleResetPassword}>
            <LockIcon fontSize="small" sx={{ mr: 1 }} />
            Reset Password
          </MenuItem>
        </Menu>

        {/* Create/Edit Dialog */}
        <Dialog
          open={openModal}
          onClose={handleCloseModal}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editData ? "Edit Agent" : "Add New Agent"}
            <MuiIconButton
              onClick={handleCloseModal}
              sx={{ position: "absolute", right: 8, top: 8 }}
            >
              <CloseIcon />
            </MuiIconButton>
          </DialogTitle>
          <DialogContent
            sx={{
              maxHeight: "70vh",
              overflowY: "auto",
              p: 2,
              scrollbarWidth: "thin",
            }}
            dividers
          >
            <AgentForm
              formId="agent-form"
              initialData={editData}
              onClose={handleCloseModal}
            />
          </DialogContent>
          <DialogActions
            sx={{
              position: "sticky",
              bottom: 0,
              background: "#fff",
              borderTop: "1px solid #e0e0e0",
              px: 3,
              py: 2,
            }}
          >
            <Button variant="outlined" onClick={handleCloseModal}>
              Cancel
            </Button>
            <LoadingButton
                          type="submit"
                          form="agent-form"
                          variant="contained"
                          loading={createStatus === "pending"}
                          disabled={createStatus === "pending"}
                        >
                          {editData ? "Update" : "Create"}
                        </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Password Reset Dialog */}
        <Dialog
          open={openPasswordDialog}
          onClose={() => setOpenPasswordDialog(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Reset Password</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Reset password for: <strong>{selectedAgentForPassword?.name}</strong>
            </Typography>
            <TextField
              fullWidth
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Minimum 6 characters"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handlePasswordReset}>
              Reset Password
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Stack>
  );
};
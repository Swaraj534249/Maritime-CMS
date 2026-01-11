import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  IconButton,
  Breadcrumbs,
  Link as MuiLink,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BusinessIcon from "@mui/icons-material/Business";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
import LockResetIcon from "@mui/icons-material/LockReset";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import { LoadingButton } from "@mui/lab";
import { toast } from "react-toastify";
import DataTable from "../../../components/DataTable/DataTable";
import Search from "../../../components/Search/Search";
import AgentForm from "./AgentForm";
import { useRowActions } from "../../../hooks/useRowActions";
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
  selectCreateStatus,
  selectAgency,
} from "../AgentSlice";

export const AgentManagement = () => {
  const { agencyId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const agents = useSelector(selectAgents);
  const totalCount = useSelector(selectTotalCount);
  const updateStatus = useSelector(selectUpdateStatus);
  const createStatus = useSelector(selectCreateStatus);
  const aggregates = useSelector(selectAgentsAggregates);
  const agencyContext = useSelector(selectAgency);
  const paginationModel = useSelector(selectPaginationModel);
  const sortModel = useSelector(selectSortModel);
  const searchValue = useSelector(selectSearchValue);

  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { anchorEl, selectedRowId, handleMenuOpen, handleMenuClose } =
    useRowActions();

  const isViewingSpecificAgency = !!agencyId;

  const sortFieldMap = useMemo(
    () => ({
      name: "name",
      email: "email",
      userType: "userType",
      id: "_id",
    }),
    [],
  );

  const fetchPage = (
    pageOneBased,
    limit,
    sortField,
    sortOrder,
    searchValue,
    controller,
  ) => {
    const params = { page: pageOneBased, limit };
    if (sortField) params.sortField = sortField;
    if (sortOrder) params.sortOrder = sortOrder;
    if (searchValue) params.searchValue = searchValue;

    if (agencyId) {
      params.agencyId = agencyId;
    }

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
      controller.signal,
    );

    return () => {
      controller.abort();
    };
  }, [paginationModel, sortModel, searchValue, refreshKey, agencyId]);

  useEffect(() => {
    if (updateStatus === "fulfilled") {
      toast.success("Agent status updated successfully");
      dispatch(resetStatuses());
      setRefreshKey((prev) => prev + 1);
    }

    if (updateStatus === "rejected") {
      toast.error("Failed to update agent status");
      dispatch(resetStatuses());
    }
  }, [updateStatus, dispatch]);

  useEffect(() => {
    if (createStatus === "fulfilled") {
      toast.success("Agent created successfully");
      dispatch(resetStatuses());
      setRefreshKey((prev) => prev + 1);
      handleCloseModal();
    }

    if (createStatus === "rejected") {
      toast.error("Failed to create agent");
      dispatch(resetStatuses());
    }
  }, [createStatus, dispatch]);

  // const handleBack = () => {
  //   navigate("/super-admin/agencies");
  // };

  const handleAddNew = () => {
    setEditData(null);
    setOpenModal(true);
  };

  const handleEdit = () => {
    const agent = agents.find((a) => a._id === selectedRowId);
    setEditData(agent);
    setOpenModal(true);
    handleMenuClose();
  };

  const handleToggleStatus = () => {
    dispatch(toggleAgentStatusAsync(selectedRowId));
    handleMenuClose();
  };

  const handleResetPassword = () => {
    console.log("Reset password for:", selectedRowId);
    handleMenuClose();
    toast.info("Password reset functionality to be implemented");
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

  const renderNameCell = (params) => {
    const { name, email } = params.row;
    const initial = name?.charAt(0).toUpperCase() || "A";

    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
          {initial}
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {email}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderUserTypeCell = (params) => {
    const { userType } = params.row;
    return (
      <Chip
        label={userType || "N/A"}
        size="small"
        variant="outlined"
        color="primary"
      />
    );
  };

  const renderRoleCell = (params) => {
    const role = params.row._raw?.role;
    const roleColors = {
      AGENCY_ADMIN: "warning",
      AGENT: "info",
    };

    return (
      <Chip
        label={role === "AGENCY_ADMIN" ? "Admin" : "Agent"}
        size="small"
        color={roleColors[role] || "default"}
        variant="filled"
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
        {!isVerified && (
          <Chip
            label="Unverified"
            size="small"
            color="warning"
            variant="outlined"
          />
        )}
      </Stack>
    );
  };

  const renderActionsCell = (params) => {
    const id = params.row.id;

    return (
      <IconButton size="small" onClick={(event) => handleMenuOpen(event, id)}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
    );
  };

  const rows = agents.map((agent) => ({
    id: agent._id,
    name: agent.name,
    email: agent.email,
    userType: agent.userType,
    isActive: agent.isActive,
    _raw: agent,
  }));

  const columns = [
    {
      field: "name",
      headerName: "Agent",
      flex: 1.5,
      minWidth: 200,
      sortable: true,
      renderCell: renderNameCell,
    },
    {
      field: "userType",
      headerName: "Type",
      flex: 0.8,
      minWidth: 100,
      sortable: true,
      align: "center",
      headerAlign: "center",
      renderCell: renderUserTypeCell,
    },
    {
      field: "role",
      headerName: "Role",
      flex: 0.8,
      minWidth: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: renderRoleCell,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 140,
      sortable: false,
      align: "center",
      headerAlign: "center",
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

  const pageTitle = `Agents - ${agencyContext?.name || "Loading..."}`;

  return (
    <Stack spacing={2}>
      {/* {isViewingSpecificAgency && (
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={handleBack} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Breadcrumbs>
            <MuiLink
              underline="hover"
              color="inherit"
              onClick={handleBack}
              sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <BusinessIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Agencies
            </MuiLink>
            <Typography color="text.primary">
              {agencyContext?.name || "..."}
            </Typography>
          </Breadcrumbs>
        </Stack>
      )} */}

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 1 }}
      >
        <Typography variant="h6">{pageTitle}</Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          {agencyContext && (
            <>
              <Chip
                label={`${aggregates?.counts?.total || 0}/${
                  agencyContext.maxAgents
                }`}
                size="small"
                variant="outlined"
                color="primary"
              />
              <Chip
                label={agencyContext.isActive ? "Active" : "Inactive"}
                size="small"
                color={agencyContext.isActive ? "success" : "default"}
              />
            </>
          )}

          <Search
            value={searchValue}
            onDebouncedChange={(val) => handleSearch(val)}
            delay={800}
            placeholder="Search agents..."
            sx={{ width: { xs: "140px", sm: "220px", md: "280px" } }}
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

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleToggleStatus}>
          <ListItemIcon>
            {agents.find((a) => a._id === selectedRowId)?.isActive ? (
              <ToggleOffIcon fontSize="small" />
            ) : (
              <ToggleOnIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {agents.find((a) => a._id === selectedRowId)?.isActive
              ? "Deactivate"
              : "Activate"}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleResetPassword}>
          <ListItemIcon>
            <LockResetIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reset Password</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editData ? "Edit Agent" : "Add New Agent"}
          <IconButton
            onClick={handleCloseModal}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
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
            agencyId={agencyId}
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
    </Stack>
  );
};

import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  resetStatuses,
  selectTotalCount,
  selectUpdateStatus,
  selectAgencies,
  selectAgenciesAggregates,
  selectPaginationModel,
  selectSortModel,
  selectSearchValue,
  setPaginationModel,
  setSortModel,
  setSearchValue,
  fetchAgenciesAsync,
  toggleAgencyStatusAsync,
} from "../AgencySlice";
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
  DialogActions,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import { toast } from "react-toastify";
import DataTable from "../../../components/DataTable/DataTable";
import Search from "../../../components/Search/Search";
import AgencyForm from "./AgencyForm";
import { useRowActions } from "../../../hooks/useRowActions";

export const AgencyManagement = () => {
  const dispatch = useDispatch();

  const agencies = useSelector(selectAgencies);
  const totalCount = useSelector(selectTotalCount);
  const updateStatus = useSelector(selectUpdateStatus);
  const aggregates = useSelector(selectAgenciesAggregates);
  const paginationModel = useSelector(selectPaginationModel);
  const sortModel = useSelector(selectSortModel);
  const searchValue = useSelector(selectSearchValue);

  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { anchorEl, open, selectedRowId, handleMenuOpen, handleMenuClose } =
    useRowActions();

  const sortFieldMap = useMemo(
    () => ({
      name: "name",
      email: "email",
      contactPerson: "contactPerson",
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
    dispatch(fetchAgenciesAsync({ params, signal: controller }));
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
      toast.success("Agency status updated successfully");
      dispatch(resetStatuses());
    }

    if (updateStatus === "rejected") {
      toast.error("Failed to update agency status");
      dispatch(resetStatuses());
    }
  }, [updateStatus, dispatch]);

  const handleAddNew = () => {
    setEditData(null);
    setOpenModal(true);
  };

  const handleEdit = () => {
    const agency = agencies.find((v) => v._id === selectedRowId);
    setEditData(agency);
    setOpenModal(true);
    handleMenuClose();
  };

  const handleToggleStatus = () => {
    dispatch(toggleAgencyStatusAsync(selectedRowId));
    handleMenuClose();
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
    const { name } = params.row;
    const initial = name?.charAt(0).toUpperCase() || "A";

    return (
      <Tooltip title={name} arrow>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar
            sx={{ width: 32, height: 32, bgcolor: "primary.main" }}
            variant="rounded"
          >
            <BusinessIcon fontSize="small" />
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

  const renderContactCell = (params) => {
    const { contactPerson, phone, email } = params.row;
    return (
      <Box>
        <Typography variant="body2" fontWeight={500}>
          {contactPerson}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {phone}
        </Typography>
      </Box>
    );
  };

  const renderAdminCell = (params) => {
    const admin = params.row._raw?.admin;
    if (!admin) return <Typography variant="body2">-</Typography>;

    return (
      <Box>
        <Typography variant="body2" fontWeight={500}>
          {admin.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {admin.email}
        </Typography>
      </Box>
    );
  };

  const renderAgentsCell = (params) => {
    const agentCount = params.row.agentCount || 0;
    const maxAgents = params.row._raw?.maxAgents || 0;

    return (
      <Chip
        icon={<PeopleIcon />}
        label={`${agentCount}/${maxAgents}`}
        size="small"
        color={agentCount < maxAgents ? "success" : "warning"}
        variant="outlined"
      />
    );
  };

  const renderStatusCell = (params) => {
    const { isActive } = params.row._raw;
    return (
      <Chip
        label={isActive ? "Active" : "Inactive"}
        size="small"
        color={isActive ? "success" : "default"}
        variant="filled"
      />
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

  const rows = agencies.map((agency) => ({
    id: agency._id,
    name: agency.name,
    email: agency.email,
    contactPerson: agency.contactPerson,
    phone: agency.phone,
    agentCount: agency.agentCount || 0,
    isActive: agency.isActive,
    _raw: agency,
  }));

  const columns = [
    {
      field: "name",
      headerName: "Agency Name",
      flex: 1.5,
      minWidth: 200,
      sortable: true,
      renderCell: renderNameCell,
    },
    {
      field: "contactPerson",
      headerName: "Contact",
      flex: 1.5,
      minWidth: 180,
      sortable: true,
      renderCell: renderContactCell,
    },
    {
      field: "admin",
      headerName: "Admin",
      flex: 1.5,
      minWidth: 180,
      sortable: false,
      renderCell: renderAdminCell,
    },
    {
      field: "agents",
      headerName: "Agents",
      flex: 0.8,
      minWidth: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: renderAgentsCell,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      minWidth: 100,
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

  return (
    <Stack justifyContent={"center"} alignItems={"center"}>
      <Stack mt={0} mb={0} sx={{ width: "100%" }}>
        {/* Header */}
        <Stack
          mb={1}
          direction="row"
          width="100%"
          justifyContent="space-between"
          alignItems="center"
          sx={{ px: 1 }}
        >
          <Typography variant="h6">Agency Management</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Search
              value={searchValue}
              onDebouncedChange={(val) => handleSearch(val)}
              delay={800}
              placeholder="Search agencies..."
              sx={{ width: { xs: "140px", sm: "220px", md: "320px" } }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
              sx={{ textTransform: "none" }}
            >
              Add Agency
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
            {agencies.find((a) => a._id === selectedRowId)?.isActive
              ? "Deactivate"
              : "Activate"}
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
            {editData ? "Edit Agency" : "Add New Agency"}
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
            <AgencyForm
              formId="agency-form"
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
            <Button type="submit" form="agency-form" variant="contained">
              {editData ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Stack>
  );
};
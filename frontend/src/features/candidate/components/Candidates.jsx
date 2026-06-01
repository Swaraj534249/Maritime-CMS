import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchCandidatesAsync,
  toggleCandidateStatusAsync,
  selectTotalCount,
  selectUpdateStatus,
  selectCandidates,
  selectCandidatesAggregates,
  selectPaginationModel,
  selectSortModel,
  selectSearchValue,
  resetStatuses,
  setPaginationModel,
  setSortModel,
  setSearchValue,
} from "../../candidate/CandidateSlice";
import {
  Stack,
  Button,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Box,
  Chip,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import ArticleIcon from "@mui/icons-material/Article";
import BadgeIcon from "@mui/icons-material/Badge";
import DataTable from "../../../components/DataTable/DataTable";
import Search from "../../../components/Search/Search";
import DocumentsDialog from "../../../components/Documents/DocumentsDialog";
import FilesCountChip from "../../../components/Files/FilesCountChip";
import InitialsAvatar from "../../../components/InitialsAvatar/InitialsAvatar";
import { ListPageHeader } from "../../navigation/components/ListPageHeader";
import { toast } from "react-toastify";
import { useRowActions } from "../../../hooks/useRowActions";
import {
  buildCandidateDocumentSections,
  countCandidateFiles,
} from "../../../utils/documentSections";

export const Candidates = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const candidates = useSelector(selectCandidates);
  const totalCount = useSelector(selectTotalCount);
  const updateStatus = useSelector(selectUpdateStatus);
  const aggregates = useSelector(selectCandidatesAggregates);
  const paginationModel = useSelector(selectPaginationModel);
  const sortModel = useSelector(selectSortModel);
  const searchValue = useSelector(selectSearchValue);

  const [openDocumentsDialog, setOpenDocumentsDialog] = useState(false);
  const [documentsForDialog, setDocumentsForDialog] = useState(null);

  const candidateDocIconMap = useMemo(
    () => ({
      resume: <ArticleIcon color="primary" fontSize="small" />,
      photo: <BadgeIcon color="primary" fontSize="small" />,
      passport: <ArticleIcon color="primary" fontSize="small" />,
      cdc: <ArticleIcon color="primary" fontSize="small" />,
      indos: <ArticleIcon color="primary" fontSize="small" />,
      visa: <ArticleIcon color="primary" fontSize="small" />,
      seamanBook: <ArticleIcon color="primary" fontSize="small" />,
      aadhar: <BadgeIcon color="primary" fontSize="small" />,
      pan: <BadgeIcon color="primary" fontSize="small" />,
      medicalCertificate: <ArticleIcon color="primary" fontSize="small" />,
    }),
    [],
  );

  const candidateFileSections = useMemo(
    () =>
      buildCandidateDocumentSections(documentsForDialog, candidateDocIconMap),
    [documentsForDialog, candidateDocIconMap],
  );

  const { anchorEl, selectedRowId, handleMenuOpen, handleMenuClose } =
    useRowActions();

  const sortFieldMap = useMemo(
    () => ({
      name: "firstName",
      email: "email",
      rank: "rank",
      status: "currentStatus",
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
    dispatch(fetchCandidatesAsync({ params, signal: controller }));
  };

  useEffect(() => {
    const controller = new AbortController();
    const page1 = paginationModel.page + 1;
    const limit = paginationModel.pageSize;
    const sort = sortModel[0];
    const sortField = sort ? sortFieldMap[sort.field] || sort.field : undefined;
    const sortOrder = sort ? sort.sort : undefined;

    fetchPage(page1, limit, sortField, sortOrder, searchValue, controller.signal);

    return () => {
      controller.abort();
    };
  }, [paginationModel, sortModel, searchValue]);

  useEffect(() => {
    if (updateStatus === "fulfilled") {
      toast.success("Candidate status updated successfully");
      dispatch(resetStatuses());
    }

    if (updateStatus === "rejected") {
      toast.error("Failed to update candidate status");
      dispatch(resetStatuses());
    }
  }, [updateStatus, dispatch]);

  const handleAddNew = () => {
    navigate("/candidates/add");
  };

  const handleEdit = () => {
    navigate(`/candidates/edit/${selectedRowId}`);
    handleMenuClose();
  };

  const handleToggleStatus = () => {
    dispatch(toggleCandidateStatusAsync(selectedRowId));
    handleMenuClose();
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

  const handleOpenDocuments = (candidate) => {
    setDocumentsForDialog(candidate?.documents || null);
    setOpenDocumentsDialog(true);
  };

  // Check if candidate is active
  const isCandidateActive = (candidateId) => {
    const candidate = candidates.find((c) => c._id === candidateId);
    return candidate?.isActive !== false;
  };

  // Render Cells
  const renderNameCell = (params) => {
    const { firstName, lastName, middleName } = params.row;
    const fullName = `${firstName} ${middleName || ""} ${lastName}`.trim();

    return (
      <Tooltip title={fullName} arrow>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <InitialsAvatar label={fullName} sx={{ width: 32, height: 32 }} />
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.email}
            </Typography>
          </Box>
        </Box>
      </Tooltip>
    );
  };

  const renderRankCell = (params) => {
    return (
      <Chip
        label={params.row.rank}
        size="small"
        variant="outlined"
        color="primary"
      />
    );
  };

  const renderStatusCell = (params) => {
    const status = params.row.currentStatus;
    const statusColors = {
      Available: "success",
      Onboard: "info",
      "On Leave": "warning",
      "In Pool": "default",
      "Not Available": "error",
    };

    return (
      <Chip
        label={status}
        size="small"
        color={statusColors[status] || "default"}
        variant="filled"
      />
    );
  };

  const renderContactCell = (params) => {
    return (
      <Box>
        <Typography variant="body2">{params.row.phone}</Typography>
        {params.row.alternatePhone && (
          <Typography variant="caption" color="text.secondary">
            {params.row.alternatePhone}
          </Typography>
        )}
      </Box>
    );
  };

  const renderDocumentsCell = (params) => {
    const rawData = params.row._raw;
    const fileCount = countCandidateFiles(rawData?.documents);

    return (
      <FilesCountChip
        count={fileCount}
        onClick={() => handleOpenDocuments(rawData)}
      />
    );
  };

  const renderActionsCell = (params) => {
    const id = params.row.id;
    return (
      <Tooltip title="More actions" arrow>
        <IconButton size="small" onClick={(event) => handleMenuOpen(event, id)}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  // Rows & Columns
  const rows = candidates.map((c) => ({
    id: c._id,
    firstName: c.firstName,
    middleName: c.middleName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    alternatePhone: c.alternatePhone,
    rank: c.rank,
    currentStatus: c.currentStatus,
    _raw: c,
  }));

  const columns = [
    {
      field: "name",
      headerName: "Candidate",
      flex: 2,
      minWidth: 220,
      sortable: true,
      renderCell: renderNameCell,
    },
    {
      field: "rank",
      headerName: "Rank",
      flex: 1,
      minWidth: 120,
      sortable: true,
      align: "center",
      headerAlign: "center",
      renderCell: renderRankCell,
    },
    {
      field: "contact",
      headerName: "Contact",
      flex: 1.2,
      minWidth: 140,
      sortable: false,
      renderCell: renderContactCell,
    },
    {
      field: "documents",
      headerName: "Files",
      flex: 1,
      minWidth: 120,
      sortable: false,
      filterable: false,
      renderCell: renderDocumentsCell,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 120,
      sortable: true,
      align: "center",
      headerAlign: "center",
      renderCell: renderStatusCell,
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      minWidth: 120,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: renderActionsCell,
    },
  ];

  return (
    <Stack justifyContent="center" alignItems="center">
      <Stack mt={0} mb={0} sx={{ width: "100%" }}>
        <ListPageHeader
          actions={
            <>
              {aggregates && (
                <>
                  <Chip
                    label={`Total: ${aggregates.counts.total || 0}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Available: ${aggregates.counts.available || 0}`}
                    size="small"
                    color="success"
                  />
                  <Chip
                    label={`Onboard: ${aggregates.counts.onboard || 0}`}
                    size="small"
                    color="info"
                  />
                </>
              )}
              <Search
                value={searchValue}
                onDebouncedChange={(v) => handleSearch(v)}
                delay={800}
                placeholder="Search candidates..."
                sx={{ width: { xs: 140, sm: 220, md: 320 } }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddNew}
                sx={{ textTransform: "none" }}
              >
                Add Candidate
              </Button>
            </>
          }
        />

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
          <MenuItem 
            onClick={handleEdit}
            disabled={!isCandidateActive(selectedRowId)}
          >
            <ListItemIcon>
              <EditOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleToggleStatus}>
            <ListItemIcon>
              {candidates.find((c) => c._id === selectedRowId)?.isActive ? (
                <ToggleOffIcon fontSize="small" />
              ) : (
                <ToggleOnIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText>
              {candidates.find((c) => c._id === selectedRowId)?.isActive
                ? "Deactivate"
                : "Activate"}
            </ListItemText>
          </MenuItem>
        </Menu>

        <DocumentsDialog
          open={openDocumentsDialog}
          onClose={() => {
            setOpenDocumentsDialog(false);
            setDocumentsForDialog(null);
          }}
          title="Candidate Files"
          sections={candidateFileSections}
        />
      </Stack>
    </Stack>
  );
};

export default Candidates;
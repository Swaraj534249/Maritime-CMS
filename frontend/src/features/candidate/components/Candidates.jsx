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
  Avatar,
  Chip,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ArticleIcon from "@mui/icons-material/Article";
import BadgeIcon from "@mui/icons-material/Badge";
import DataTable from "../../../components/DataTable/DataTable";
import Search from "../../../components/Search/Search";
import DocumentsDialog from "../../../components/Documents/DocumentsDialog";
import { toast } from "react-toastify";
import { useRowActions } from "../../../hooks/useRowActions";
import { getFileURL, getFileIcon, isPDF } from "../../../utils/fileUtils";
import { useDocumentActions } from "../../../hooks/useDocumentActions";

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
  const [selectedDocuments, setSelectedDocuments] = useState({
    photo: null,
    passport: null,
    cdc: null,
    indos: null,
    visa: null,
    seamanBook: null,
    aadhar: null,
    pan: null,
    medicalCertificate: null,
    resume: null,
  });

  const { anchorEl, selectedRowId, handleMenuOpen, handleMenuClose } =
    useRowActions();

  const { openDocument } = useDocumentActions();

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
    setSelectedDocuments({
      photo: candidate?.documents?.photo || null,
      passport: candidate?.documents?.passport || null,
      cdc: candidate?.documents?.cdc || null,
      indos: candidate?.documents?.indos || null,
      visa: candidate?.documents?.visa || null,
      seamanBook: candidate?.documents?.seamanBook || null,
      aadhar: candidate?.documents?.aadhar || null,
      pan: candidate?.documents?.pan || null,
      medicalCertificate: candidate?.documents?.medicalCertificate || null,
      resume: candidate?.documents?.resume || null,
    });
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
    const rawData = params.row._raw;
    const photoURL = rawData?.documents?.photo?.path
      ? getFileURL(rawData.documents.photo.path)
      : null;
    const initial = firstName?.charAt(0).toUpperCase() || "C";

    return (
      <Tooltip title={fullName} arrow>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {photoURL ? (
            <Avatar src={photoURL} alt={fullName} sx={{ width: 32, height: 32 }} />
          ) : (
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
              {initial}
            </Avatar>
          )}
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
    const docs = rawData?.documents || {};
    
    const docCount = Object.keys(docs).filter(
      (key) => docs[key]?.main?.filename || docs[key]?.old?.filename || docs[key]?.path
    ).length;

    return (
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
        {docCount > 0 ? (
          <Chip
            icon={<InsertDriveFileIcon />}
            label={`${docCount} Doc${docCount > 1 ? "s" : ""}`}
            size="small"
            color="primary"
            onClick={() => handleOpenDocuments(rawData)}
            sx={{ cursor: "pointer" }}
          />
        ) : (
          <span style={{ color: "#999", fontSize: 12 }}>No files</span>
        )}
      </Box>
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
      headerName: "Documents",
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
        <Stack
          mb={1}
          direction="row"
          width="100%"
          justifyContent="space-between"
          alignItems="center"
          sx={{ px: 1 }}
        >
          <Typography variant="h6">Candidates</Typography>

          <Stack direction="row" spacing={1} alignItems="center">
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
          onClose={() => setOpenDocumentsDialog(false)}
          title="Candidate Documents"
          sections={[
            {
              key: "photo",
              title: "Photograph",
              icon: <BadgeIcon color="primary" />,
              documents: selectedDocuments.photo,
              openDocument,
              getFileIcon,
              isPDF,
            },
            {
              key: "passport",
              title: "Passport",
              icon: <ArticleIcon color="primary" />,
              documents: selectedDocuments.passport,
              openDocument,
              getFileIcon,
              isPDF,
            },
            {
              key: "cdc",
              title: "CDC",
              icon: <ArticleIcon color="primary" />,
              documents: selectedDocuments.cdc,
              openDocument,
              getFileIcon,
              isPDF,
            },
            {
              key: "indos",
              title: "INDOS",
              icon: <ArticleIcon color="primary" />,
              documents: selectedDocuments.indos,
              openDocument,
              getFileIcon,
              isPDF,
            },
            {
              key: "visa",
              title: "Visa",
              icon: <ArticleIcon color="primary" />,
              documents: selectedDocuments.visa,
              openDocument,
              getFileIcon,
              isPDF,
            },
            {
              key: "seamanBook",
              title: "Seaman Book",
              icon: <ArticleIcon color="primary" />,
              documents: selectedDocuments.seamanBook,
              openDocument,
              getFileIcon,
              isPDF,
            },
            {
              key: "aadhar",
              title: "Aadhar Card",
              icon: <BadgeIcon color="primary" />,
              documents: selectedDocuments.aadhar,
              openDocument,
              getFileIcon,
              isPDF,
            },
            {
              key: "pan",
              title: "PAN Card",
              icon: <BadgeIcon color="primary" />,
              documents: selectedDocuments.pan,
              openDocument,
              getFileIcon,
              isPDF,
            },
            {
              key: "medicalCertificate",
              title: "Medical Certificate",
              icon: <ArticleIcon color="primary" />,
              documents: selectedDocuments.medicalCertificate,
              openDocument,
              getFileIcon,
              isPDF,
            },
            {
              key: "resume",
              title: "Resume/CV",
              icon: <ArticleIcon color="primary" />,
              documents: selectedDocuments.resume,
              openDocument,
              getFileIcon,
              isPDF,
            },
          ]}
        />
      </Stack>
    </Stack>
  );
};

export default Candidates;
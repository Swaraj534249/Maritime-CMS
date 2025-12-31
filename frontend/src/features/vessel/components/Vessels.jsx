import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllVesselsAsync,
  selectTotalCount,
  selectUpdateStatus,
  selectVesselOwnerContext,
  selectVessels,
} from "../../vessel/VesselSlice";
import {
  Stack,
  Button,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Chip,
  IconButton as MuiIconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArticleIcon from "@mui/icons-material/Article";
import BadgeIcon from "@mui/icons-material/Badge";
import DataTable from "../../../components/DataTable/DataTable";
import Search from "../../../components/Search/Search";
import VesselForm from "./VesselForm";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useRowActions } from "../../../hooks/useRowActions";
import { useDocumentActions } from "../../../hooks/useDocumentActions";
import { getFileIcon, getFileURL, isPDF } from "../../../utils/fileUtils";
import DocumentSection from "../../../components/Documents/DocumentSection";
import DocumentsDialog from "../../../components/Documents/DocumentsDialog";

export const Vessels = () => {
  const { id: vesselOwnerId } = useParams();
  const dispatch = useDispatch();
  const vessels = useSelector(selectVessels);
  const totalCount = useSelector(selectTotalCount);
  const updateStatus = useSelector(selectUpdateStatus);
  const owner = useSelector(selectVesselOwnerContext);

  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState([]);
  const [openDocumentsDialog, setOpenDocumentsDialog] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState({
    vessel_documents: null,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const { anchorEl, open, selectedRowId, handleMenuOpen, handleMenuClose } =
    useRowActions();

  const { openDocument } = useDocumentActions();

  const sortFieldMap = useMemo(
    () => ({
      vessel: "vesselname",
      category: "vessel_category",
      specs: "imo_Number",
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
    vesselOwnerId,
    controller,
  ) => {
    const params = { page: pageOneBased, limit };
    if (sortField) params.sortField = sortField;
    if (sortOrder) params.sortOrder = sortOrder;
    if (searchValue) params.searchValue = searchValue;
    if (vesselOwnerId) params.vesselOwnerId = vesselOwnerId;
    dispatch(getAllVesselsAsync({ params, signal: controller }));
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
      vesselOwnerId,
      controller.signal,
    );

    return () => {
      controller.abort();
    };
  }, [paginationModel, sortModel, searchValue, refreshKey, vesselOwnerId]);

  const handleAddNew = () => {
    setEditData(null);
    setOpenModal(true);
  };

  const handleEdit = () => {
    const vessel = vessels.find((v) => v._id === selectedRowId);
    setEditData(vessel);
    setOpenModal(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    toast.info("Delete functionality not yet implemented");
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

  const handleOpenDocuments = (vessel) => {
    setSelectedDocuments({
      vessel_documents: vessel.vessel_documents || null,
    });
    setOpenDocumentsDialog(true);
  };

  // render cell functions
  const renderVesselCell = (params) => {
    const fullName = `${params.row.vesselname || ""}`.trim();
    const rawData = params.row._raw;
    const imageURL = rawData?.vessel_image?.path
      ? getFileURL(rawData.vessel_image.path)
      : null;

    return (
      <Tooltip title={fullName} arrow>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {imageURL ? (
            <Avatar
              src={imageURL}
              alt={fullName}
              sx={{ width: 32, height: 32 }}
              variant="rounded"
            />
          ) : (
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: "primary.main" }}
              variant="rounded"
            >
              {fullName.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <div
            style={{
              cursor: "pointer",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1,
            }}
          >
            {fullName}
          </div>
        </Box>
      </Tooltip>
    );
  };

  const renderCategoryCell = (params) => {
    const { vessel_category, vesseltype } = params.row;
    return (
      <Tooltip title={`${vessel_category} | ${vesseltype}`} arrow>
        <div
          style={{
            cursor: "pointer",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1,
          }}
        >
          {vessel_category} | {vesseltype}
        </div>
      </Tooltip>
    );
  };

  const renderFilesCell = (params) => {
    const rawData = params.row._raw;
    const hasVessel_documents =
      rawData?.vessel_documents?.main?.filename ||
      rawData?.vessel_documents?.old?.filename;
    const docsCount = hasVessel_documents ? 1 : 0;

    return (
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
        {docsCount > 0 ? (
          <Chip
            icon={<InsertDriveFileIcon />}
            label={`${docsCount} Doc${docsCount > 1 ? "s" : ""}`}
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

  // rows & columns
  const rows = vessels.map((v) => ({
    id: v._id,
    vesselname: v.vesselname,
    vessel_category: v.vessel_category,
    vesseltype: v.vesseltype,
    imo_Number: v.imo_Number,
    grt: v.grt,
    bhp: v.bhp,
    bhp2: v.bhp2,
    flag: v.flag,
    vesselOwnerName: v.vesselOwner?.company_name ?? "",
    _raw: v,
  }));

  const columns = [
    {
      field: "vessel",
      headerName: "Vessel",
      flex: 2,
      minWidth: 220,
      sortable: true,
      valueGetter: (params) => params.row.vesselname,
      renderCell: renderVesselCell,
    },
    {
      field: "category",
      headerName: "Category | Type",
      flex: 1.6,
      minWidth: 160,
      sortable: true,
      valueGetter: (params) => params.row.vessel_category ?? "",
      renderCell: renderCategoryCell,
    },
    {
      field: "specs",
      headerName: "IMO / GRT / BHP",
      flex: 1.6,
      minWidth: 160,
      sortable: true,
      valueGetter: (params) =>
        `${params.row.imo_Number || ""} ${
          params.row.grt ? " / " + params.row.grt : ""
        } ${params.row.bhp ? " / " + params.row.bhp : ""}`.trim(),
    },
    {
      field: "files",
      headerName: "Documents",
      flex: 1,
      minWidth: 120,
      sortable: false,
      filterable: false,
      renderCell: renderFilesCell,
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
          {owner && (
            <Typography variant="h6">
              Vessels of {owner.shortName || owner.name}
            </Typography>
          )}
          <Stack direction="row" spacing={1} alignItems="center">
            <Search
              value={searchValue}
              onDebouncedChange={(v) => handleSearch(v)}
              delay={800}
              placeholder="Search vessels..."
              sx={{ width: { xs: 140, sm: 220, md: 320 } }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
              sx={{ textTransform: "none" }}
            >
              Add Vessel
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
            <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={handleDelete}>
            <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>

        <DocumentsDialog
          open={openDocumentsDialog}
          onClose={() => setOpenDocumentsDialog(false)}
          title="Documents"
          sections={[
            {
              key: "vesselDocs",
              title: "Vessel Documents",
              icon: <ArticleIcon color="primary" />,
              documents: selectedDocuments.vessel_documents,
              openDocument,
              getFileIcon,
              isPDF,
            },
          ]}
        />

        <Dialog
          open={openModal}
          onClose={handleCloseModal}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editData ? "Edit Vessel" : "Add New Vessel"}
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
            <VesselForm
              formId="vessel-form"
              initialData={editData}
              vesselOwnerId={vesselOwnerId}
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

            <Button type="submit" form="vessel-form" variant="contained">
              {editData ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Stack>
  );
};

export default Vessels;

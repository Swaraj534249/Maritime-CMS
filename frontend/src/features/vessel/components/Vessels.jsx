import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchVesselsAsync,
  toggleVesselStatusAsync,
  selectTotalCount,
  selectCreateStatus,
  selectUpdateStatus,
  selectVesselOwnerContext,
  selectVessels,
  selectPaginationModel,
  selectSortModel,
  selectSearchValue,
  resetStatuses,
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
  Chip,
  IconButton as MuiIconButton,
  DialogActions,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useFormSubmitting } from "../../../hooks/useFormSubmitting";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
import ArticleIcon from "@mui/icons-material/Article";
import DataTable from "../../../components/DataTable/DataTable";
import Search from "../../../components/Search/Search";
import VesselForm from "./VesselForm";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useRowActions } from "../../../hooks/useRowActions";
import DocumentsDialog from "../../../components/Documents/DocumentsDialog";
import InitialsAvatar from "../../../components/InitialsAvatar/InitialsAvatar";
import FilesCountChip from "../../../components/Files/FilesCountChip";
import { ListPageHeader } from "../../navigation/components/ListPageHeader";
import {
  buildVesselDocumentSections,
  countVesselFiles,
} from "../../../utils/documentSections";
import {
  setPaginationModel,
  setSearchValue,
  setSortModel,
} from "../../vessel/VesselSlice";
import { usePageTitle } from "../../navigation/PageTitleContext";

export const Vessels = () => {
  const { id: vesselOwnerId } = useParams();
  const dispatch = useDispatch();
  const vessels = useSelector(selectVessels);
  const totalCount = useSelector(selectTotalCount);
  const updateStatus = useSelector(selectUpdateStatus);
  const createStatus = useSelector(selectCreateStatus);
  const owner = useSelector(selectVesselOwnerContext);
  const paginationModel = useSelector(selectPaginationModel);
  const sortModel = useSelector(selectSortModel);
  const searchValue = useSelector(selectSearchValue);

  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const [openDocumentsDialog, setOpenDocumentsDialog] = useState(false);
  const [entityForFilesDialog, setEntityForFilesDialog] = useState(null);
  const formSubmitting = useFormSubmitting("vessel-form");
  const { anchorEl, open, selectedRowId, handleMenuOpen, handleMenuClose } =
    useRowActions();

  const vesselPageTitle = useMemo(() => {
    if (!vesselOwnerId) return "Vessels";
    const label = owner?.shortName || owner?.name;
    return label ? `Vessels of ${label}` : "Vessels";
  }, [vesselOwnerId, owner?.shortName, owner?.name]);
  usePageTitle(vesselPageTitle);

  const vesselFileSections = useMemo(
    () =>
      buildVesselDocumentSections(entityForFilesDialog, {
        vessel_image: <ArticleIcon color="primary" fontSize="small" />,
        vessel_documents: <ArticleIcon color="primary" fontSize="small" />,
      }),
    [entityForFilesDialog],
  );

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
    dispatch(fetchVesselsAsync({ params, signal: controller }));
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
  }, [paginationModel, sortModel, searchValue, vesselOwnerId]);

  useEffect(() => {
    if (updateStatus === "fulfilled") {
      toast.success("Vessel status updated successfully");
      dispatch(resetStatuses());
    }

    if (updateStatus === "rejected") {
      toast.error("Failed to update vessel status");
      dispatch(resetStatuses());
    }
  }, [updateStatus, dispatch]);

  useEffect(() => {
    dispatch(setSearchValue(""));
    dispatch(setSortModel([]));
    dispatch(
      setPaginationModel({
        page: 0,
        pageSize: paginationModel.pageSize, // read from store
      }),
    );
  }, [vesselOwnerId]);

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

  const handleToggleStatus = () => {
    dispatch(toggleVesselStatusAsync(selectedRowId));
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
    setEntityForFilesDialog(vessel);
    setOpenDocumentsDialog(true);
  };

  // render cell functions
  const renderVesselCell = (params) => {
    const fullName = `${params.row.vesselname || ""}`.trim();
    const rawData = params.row._raw;

    return (
      <Tooltip title={fullName} arrow>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <InitialsAvatar label={fullName} sx={{ width: 32, height: 32 }} variant="rounded" />
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
    const fileCount = countVesselFiles(rawData);

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
      headerName: "Files",
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
        <ListPageHeader
          actions={
            <>
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
          <MenuItem onClick={handleEdit}>
            <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem disabled onClick={handleToggleStatus}>
            {vessels.find((v) => v._id === selectedRowId)?.isDeleted
              ? "Restore"
              : "Deactivate"}
          </MenuItem>
        </Menu>

        <DocumentsDialog
          open={openDocumentsDialog}
          onClose={() => {
            setOpenDocumentsDialog(false);
            setEntityForFilesDialog(null);
          }}
          title="Vessel Files"
          sections={vesselFileSections}
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
            <Button variant="outlined" onClick={handleCloseModal} disabled={formSubmitting}>
              Cancel
            </Button>

            <LoadingButton
              type="submit"
              form="vessel-form"
              variant="contained"
              loading={formSubmitting}
              disabled={formSubmitting}
            >
              {editData ? "Update" : "Create"}
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Stack>
    </Stack>
  );
};

export default Vessels;

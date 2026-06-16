import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Stack,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton as MuiIconButton,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import { toast } from "react-toastify";
import DataTable from "../../../components/DataTable/DataTable";
import Search from "../../../components/Search/Search";
import { useRowActions } from "../../../hooks/useRowActions";
import { ListPageHeader } from "../../navigation/components/ListPageHeader";
import { AddedByCell } from "../../../components/AddedByCell/AddedByCell";
import StatusFilter from "../../../components/StatusFilter/StatusFilter";
import { selectLoggedInUser } from "../../auth/AuthSlice";
import VacancyForm from "./VacancyForm";
import { ProposeDialog } from "../../proposal/components/ProposeDialog";
import {
  fetchVacanciesAsync,
  closeVacancyAsync,
  selectVacancies,
  selectVacanciesTotalCount,
  selectVacancyFetchStatus,
  selectVacancyCreateStatus,
  selectVacancyUpdateStatus,
  selectVacancyPaginationModel,
  selectVacancySortModel,
  selectVacancySearchValue,
  selectVacancyStatusFilter,
  setVacancyPaginationModel,
  setVacancySortModel,
  setVacancySearchValue,
  setVacancyStatusFilter,
  selectVacancyStatusCounts,
  VACANCY_STATUS_OPTIONS,
} from "../VacancySlice";

const STATUS_COLORS = {
  Open: "info",
  "Partially Filled": "warning",
  Filled: "success",
  Closed: "default",
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const ownerLabel = (owner) => {
  if (!owner || typeof owner !== "object") return "-";
  return (
    `${owner.company_shortname || ""} ${owner.company_name || ""}`.trim() || "-"
  );
};

export const Vacancies = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loggedInUser = useSelector(selectLoggedInUser);

  const vacancies = useSelector(selectVacancies);
  const totalCount = useSelector(selectVacanciesTotalCount);
  const fetchStatus = useSelector(selectVacancyFetchStatus);
  const createStatus = useSelector(selectVacancyCreateStatus);
  const updateStatus = useSelector(selectVacancyUpdateStatus);
  const paginationModel = useSelector(selectVacancyPaginationModel);
  const sortModel = useSelector(selectVacancySortModel);
  const searchValue = useSelector(selectVacancySearchValue);
  const statusFilter = useSelector(selectVacancyStatusFilter);

  const { total: statusTotal, byStatus: statusByCount } = useSelector(
    selectVacancyStatusCounts,
  );

  const [openModal, setOpenModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [proposeVacancy, setProposeVacancy] = useState(null);

  const { anchorEl, selectedRowId, handleMenuOpen, handleMenuClose } =
    useRowActions();

  const saving = createStatus === "pending" || updateStatus === "pending";

  const canManage = (vacancy) => {
    if (!vacancy || !loggedInUser) return false;
    if (["AGENCY_ADMIN", "SUPER_ADMIN"].includes(loggedInUser.role)) return true;
    const addedById =
      typeof vacancy.addedBy === "object" ? vacancy.addedBy?._id : vacancy.addedBy;
    return String(addedById) === String(loggedInUser._id);
  };

  const sortFieldMap = useMemo(
    () => ({
      vacancyId: "vacancyId",
      rank: "rank",
      status: "status",
      signOnDate: "signOnDate",
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

    dispatch(fetchVacanciesAsync({ params, signal: controller.signal }));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, sortModel, searchValue, statusFilter, refreshKey]);

  const handleAddNew = () => {
    setEditData(null);
    setOpenModal(true);
  };

  const handleEdit = () => {
    const vacancy = vacancies.find((v) => v._id === selectedRowId);
    setEditData(vacancy);
    setOpenModal(true);
    handleMenuClose();
  };

  const handleCloseToggle = async () => {
    const id = selectedRowId;
    handleMenuClose();
    try {
      await dispatch(closeVacancyAsync(id)).unwrap();
      toast.success("Vacancy status updated");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.message || "Failed to update vacancy");
    }
  };

  const handleViewProposed = () => {
    const vacancy = vacancies.find((v) => v._id === selectedRowId);
    handleMenuClose();
    if (!vacancy) return;
    navigate(
      `/proposed?vacancyId=${vacancy._id}&code=${encodeURIComponent(
        vacancy.vacancyId || "",
      )}`,
    );
  };

  const openPropose = (vacancy) => {
    if (vacancy?.status === "Filled" || vacancy?.status === "Closed") {
      toast.info(`Vacancy is ${vacancy.status.toLowerCase()}`);
      return;
    }
    setProposeVacancy(vacancy);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditData(null);
  };

  const handleSubmitted = () => {
    handleCloseModal();
    setRefreshKey((k) => k + 1);
  };

  const handlePaginationModelChange = (model) => {
    if (model.pageSize !== paginationModel.pageSize) {
      dispatch(setVacancyPaginationModel({ page: 0, pageSize: model.pageSize }));
    } else {
      dispatch(setVacancyPaginationModel(model));
    }
  };

  const handleSortModelChange = (newModel) => {
    dispatch(setVacancySortModel(newModel));
    dispatch(setVacancyPaginationModel({ ...paginationModel, page: 0 }));
  };

  const handleSearch = (text) => {
    if (text === searchValue) return;
    dispatch(setVacancySearchValue(text));
    dispatch(setVacancyPaginationModel({ ...paginationModel, page: 0 }));
  };

  const handleStatusFilter = (value) => {
    dispatch(setVacancyStatusFilter(value));
    dispatch(setVacancyPaginationModel({ ...paginationModel, page: 0 }));
  };

  const rows = vacancies.map((v) => ({
    id: v._id,
    vacancyId: v.vacancyId,
    owner: ownerLabel(v.vesselOwner),
    vessel: v.vessel?.vesselname || "-",
    vesselType: v.vesselType || "-",
    rank: v.rank,
    openings: `${v.filledCount ?? 0}/${v.openings}`,
    signOnDate: v.signOnDate,
    contract: v.contractDurationMonths ? `${v.contractDurationMonths} mo` : "-",
    status: v.status,
    _raw: v,
  }));

  const selectedRow = vacancies.find((v) => v._id === selectedRowId);

  const columns = [
    { field: "vacancyId", headerName: "Vacancy ID", flex: 1.2, minWidth: 140 },
    { field: "owner", headerName: "Vessel Owner", flex: 1.5, minWidth: 160 },
    { field: "vessel", headerName: "Vessel", flex: 1.2, minWidth: 140 },
    {
      field: "vesselType",
      headerName: "Vessel Type",
      flex: 1,
      minWidth: 120,
      sortable: false,
    },
    { field: "rank", headerName: "Rank", flex: 1, minWidth: 120 },
    {
      field: "openings",
      headerName: "Filled",
      flex: 0.6,
      minWidth: 90,
      sortable: false,
    },
    {
      field: "signOnDate",
      headerName: "Sign-on",
      flex: 1,
      minWidth: 110,
      renderCell: (params) => formatDate(params.row.signOnDate),
    },
    {
      field: "contract",
      headerName: "Contract",
      flex: 0.7,
      minWidth: 100,
      sortable: false,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Chip
          label={params.row.status}
          size="small"
          color={STATUS_COLORS[params.row.status] || "default"}
          variant={params.row.status === "Closed" ? "outlined" : "filled"}
        />
      ),
    },
    {
      field: "addedBy",
      headerName: "Added By",
      flex: 1.4,
      minWidth: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const v = params.row._raw;
        return (
          <AddedByCell
            addedBy={v.addedBy}
            createdAt={v.createdAt}
            updatedBy={v.updatedBy}
            updatedAt={v.lastEditedAt}
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.9,
      minWidth: 120,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Tooltip title="Propose candidates" arrow>
            <span>
              <Chip
                label="Propose"
                size="small"
                icon={<HowToRegOutlinedIcon />}
                onClick={() => openPropose(params.row._raw)}
                color="primary"
                variant="outlined"
                disabled={["Filled", "Closed"].includes(params.row.status)}
                sx={{ cursor: "pointer" }}
              />
            </span>
          </Tooltip>
          <Tooltip title="More actions" arrow>
            <IconButton
              size="small"
              onClick={(event) => handleMenuOpen(event, params.row.id)}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Stack sx={{ width: "100%" }}>
      <ListPageHeader
        actions={
          <>
            <StatusFilter
              value={statusFilter}
              onChange={handleStatusFilter}
              options={VACANCY_STATUS_OPTIONS}
              counts={statusByCount}
              allCount={statusTotal}
            />
            <Search
              value={searchValue}
              onDebouncedChange={handleSearch}
              delay={800}
              placeholder="Search vacancies..."
              sx={{ width: { xs: "140px", sm: "220px", md: "320px" } }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
              sx={{ textTransform: "none" }}
            >
              Add Vacancy
            </Button>
          </>
        }
      />

      <DataTable
        rows={rows}
        columns={columns}
        loading={fetchStatus === "pending"}
        sx={{
          maxWidth: "100%",
          "& .MuiDataGrid-cell": {
            display: "flex",
            alignItems: "center",
            py: 0.5,
          },
        }}
        getRowHeight={() => "auto"}
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
        <MenuItem onClick={handleViewProposed}>
          <FormatListBulletedIcon fontSize="small" sx={{ mr: 1 }} />
          View Proposed
        </MenuItem>
        <MenuItem onClick={handleEdit} disabled={!canManage(selectedRow)}>
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={handleCloseToggle}
          disabled={!canManage(selectedRow)}
        >
          {selectedRow?.status === "Closed" ? (
            <>
              <LockOpenOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
              Reopen
            </>
          ) : (
            <>
              <LockOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
              Close
            </>
          )}
        </MenuItem>
      </Menu>

      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editData ? "Edit Vacancy" : "Add New Vacancy"}
          <MuiIconButton
            onClick={handleCloseModal}
            sx={{ position: "absolute", right: 8, top: 8 }}
            disabled={saving}
          >
            <CloseIcon />
          </MuiIconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          <VacancyForm
            formId="vacancy-form"
            initialData={editData}
            onSubmitted={handleSubmitted}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={handleCloseModal} disabled={saving}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            form="vacancy-form"
            variant="contained"
            loading={saving}
            disabled={saving}
          >
            {editData ? "Update" : "Create"}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <ProposeDialog
        open={Boolean(proposeVacancy)}
        vacancy={proposeVacancy}
        onClose={() => setProposeVacancy(null)}
        onProposed={() => setRefreshKey((k) => k + 1)}
      />
    </Stack>
  );
};

export default Vacancies;

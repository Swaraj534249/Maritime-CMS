import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Stack, Chip, Typography, Button, Tooltip, Box } from "@mui/material";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import DataTable from "../../../components/DataTable/DataTable";
import Search from "../../../components/Search/Search";
import StatusFilter from "../../../components/StatusFilter/StatusFilter";
import { ListPageHeader } from "../../navigation/components/ListPageHeader";
import { AddedByCell } from "../../../components/AddedByCell/AddedByCell";
import {
  fetchDocumentationsAsync,
  selectDocumentations,
  selectDocumentationsTotalCount,
  selectDocumentationFetchStatus,
  selectDocumentationPaginationModel,
  selectDocumentationSortModel,
  selectDocumentationSearchValue,
  selectDocumentationStatusFilter,
  selectDocumentationStatusCounts,
  setDocumentationPaginationModel,
  setDocumentationSortModel,
  setDocumentationSearchValue,
  setDocumentationStatusFilter,
  DOCUMENTATION_STATUS_OPTIONS,
} from "../DocumentationSlice";

const STATUS_COLORS = {
  "In Documentation": "info",
  Verified: "warning",
  "Contract Finalized": "success",
};

const DOC_KEYS = ["passport", "cdc", "ppe", "medical", "contractLetter"];

const verifiedCountOf = (documents = {}) =>
  DOC_KEYS.filter((k) => documents?.[k]?.verified).length;

export const Documentations = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const docs = useSelector(selectDocumentations);
  const totalCount = useSelector(selectDocumentationsTotalCount);
  const fetchStatus = useSelector(selectDocumentationFetchStatus);
  const paginationModel = useSelector(selectDocumentationPaginationModel);
  const sortModel = useSelector(selectDocumentationSortModel);
  const searchValue = useSelector(selectDocumentationSearchValue);
  const statusFilter = useSelector(selectDocumentationStatusFilter);
  const { total: statusTotal, byStatus: statusByCount } = useSelector(
    selectDocumentationStatusCounts,
  );

  const sortFieldMap = useMemo(
    () => ({
      candidateName: "candidateName",
      vacancyCode: "vacancyCode",
      rank: "rank",
      status: "status",
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

    dispatch(fetchDocumentationsAsync({ params, signal: controller.signal }));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, sortModel, searchValue, statusFilter]);

  const handlePaginationModelChange = (model) => {
    if (model.pageSize !== paginationModel.pageSize) {
      dispatch(
        setDocumentationPaginationModel({ page: 0, pageSize: model.pageSize }),
      );
    } else {
      dispatch(setDocumentationPaginationModel(model));
    }
  };

  const handleSortModelChange = (newModel) => {
    dispatch(setDocumentationSortModel(newModel));
    dispatch(setDocumentationPaginationModel({ ...paginationModel, page: 0 }));
  };

  const handleSearch = (text) => {
    if (text === searchValue) return;
    dispatch(setDocumentationSearchValue(text));
    dispatch(setDocumentationPaginationModel({ ...paginationModel, page: 0 }));
  };

  const handleStatusFilter = (value) => {
    dispatch(setDocumentationStatusFilter(value));
    dispatch(setDocumentationPaginationModel({ ...paginationModel, page: 0 }));
  };

  const rows = docs.map((d) => ({
    id: d._id,
    candidateName: d.candidateName || "-",
    indosNumber: d.indosNumber || "",
    rank: d.rank || "-",
    vacancyCode: d.vacancyCode || "-",
    vessel: d.vesselName || "-",
    assignedTo: d.assignedTo?.name || "-",
    status: d.status,
    _raw: d,
  }));

  const columns = [
    {
      field: "candidateName",
      headerName: "Candidate",
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {params.row.candidateName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            INDOS: {params.row.indosNumber || "—"}
          </Typography>
        </Box>
      ),
    },
    { field: "rank", headerName: "Rank", flex: 1, minWidth: 120 },
    { field: "vacancyCode", headerName: "Vacancy ID", flex: 1.2, minWidth: 150 },
    {
      field: "vessel",
      headerName: "Vessel",
      flex: 1.2,
      minWidth: 140,
      sortable: false,
    },
    {
      field: "assignedTo",
      headerName: "Assigned To",
      flex: 1.2,
      minWidth: 150,
      sortable: false,
    },
    {
      field: "docs",
      headerName: "Documents",
      flex: 0.8,
      minWidth: 110,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const count = verifiedCountOf(params.row._raw.documents);
        return (
          <Chip
            label={`${count}/${DOC_KEYS.length}`}
            size="small"
            color={count === DOC_KEYS.length ? "success" : "default"}
            variant={count === DOC_KEYS.length ? "filled" : "outlined"}
          />
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1.3,
      minWidth: 160,
      renderCell: (params) => (
        <Chip
          label={params.row.status}
          size="small"
          color={STATUS_COLORS[params.row.status] || "default"}
          variant={params.row.status === "Contract Finalized" ? "filled" : "outlined"}
        />
      ),
    },
    {
      field: "addedBy",
      headerName: "Assigned By",
      flex: 1.4,
      minWidth: 180,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const d = params.row._raw;
        return (
          <AddedByCell
            addedBy={d.addedBy}
            createdAt={d.createdAt}
            updatedBy={d.updatedBy}
            updatedAt={d.lastEditedAt}
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
        <Tooltip title="Verify documents" arrow>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FactCheckOutlinedIcon />}
            onClick={() => navigate(`/documentation/${params.row.id}/verify`)}
            sx={{ textTransform: "none" }}
          >
            Verify
          </Button>
        </Tooltip>
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
              options={DOCUMENTATION_STATUS_OPTIONS}
              counts={statusByCount}
              allCount={statusTotal}
              sx={{ width: 220 }}
            />
            <Search
              value={searchValue}
              onDebouncedChange={handleSearch}
              delay={800}
              placeholder="Search documentation..."
              sx={{ width: { xs: "140px", sm: "220px", md: "280px" } }}
            />
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
    </Stack>
  );
};

export default Documentations;

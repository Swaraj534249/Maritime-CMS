import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Stack,
  IconButton,
  Tooltip,
  Chip,
  Typography,
  Box,
} from "@mui/material";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import DataTable from "../../../components/DataTable/DataTable";
import Search from "../../../components/Search/Search";
import StatusFilter from "../../../components/StatusFilter/StatusFilter";
import { ListPageHeader } from "../../navigation/components/ListPageHeader";
import { ProposalReviewDialog } from "./ProposalReviewDialog";
import {
  fetchProposalsAsync,
  selectProposals,
  selectProposalsTotalCount,
  selectProposalFetchStatus,
  selectProposalPaginationModel,
  selectProposalSortModel,
  selectProposalSearchValue,
  selectProposalStatusFilter,
  selectProposalStatusCounts,
  setProposalPaginationModel,
  setProposalSortModel,
  setProposalSearchValue,
  setProposalStatusFilter,
  CHECKLIST_STEPS,
} from "../ProposalSlice";

const STATUS_OPTIONS = [
  "Proposed",
  "Selected",
  "Rejected",
  "Selected on different vacancy",
  "Vacancy filled",
];

const STATUS_COLORS = {
  Proposed: "info",
  Selected: "success",
  Rejected: "default",
  "Selected on different vacancy": "warning",
  "Vacancy filled": "default",
};

export const Proposals = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const vacancyIdParam = searchParams.get("vacancyId") || "";
  const vacancyCodeParam = searchParams.get("code") || "";

  const proposals = useSelector(selectProposals);
  const totalCount = useSelector(selectProposalsTotalCount);
  const fetchStatus = useSelector(selectProposalFetchStatus);
  const paginationModel = useSelector(selectProposalPaginationModel);
  const sortModel = useSelector(selectProposalSortModel);
  const searchValue = useSelector(selectProposalSearchValue);
  const statusFilter = useSelector(selectProposalStatusFilter);

  const [refreshKey, setRefreshKey] = useState(0);
  const [reviewProposal, setReviewProposal] = useState(null);

  const { total: statusTotal, byStatus: statusByCount } = useSelector(
    selectProposalStatusCounts,
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
    if (vacancyIdParam) params.vacancyId = vacancyIdParam;

    dispatch(fetchProposalsAsync({ params, signal: controller.signal }));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    paginationModel,
    sortModel,
    searchValue,
    statusFilter,
    vacancyIdParam,
    refreshKey,
  ]);

  const handlePaginationModelChange = (model) => {
    if (model.pageSize !== paginationModel.pageSize) {
      dispatch(setProposalPaginationModel({ page: 0, pageSize: model.pageSize }));
    } else {
      dispatch(setProposalPaginationModel(model));
    }
  };

  const handleSortModelChange = (newModel) => {
    dispatch(setProposalSortModel(newModel));
    dispatch(setProposalPaginationModel({ ...paginationModel, page: 0 }));
  };

  const handleSearch = (text) => {
    if (text === searchValue) return;
    dispatch(setProposalSearchValue(text));
    dispatch(setProposalPaginationModel({ ...paginationModel, page: 0 }));
  };

  const handleStatusFilter = (value) => {
    dispatch(setProposalStatusFilter(value));
    dispatch(setProposalPaginationModel({ ...paginationModel, page: 0 }));
  };

  const rows = proposals.map((p) => ({
    id: p._id,
    candidateName: p.candidateName || "-",
    indosNumber: p.indosNumber || "",
    rank: p.rank || "-",
    vacancyCode: p.vacancyCode || "-",
    vessel: p.vesselName || "-",
    status: p.status,
    _raw: p,
  }));

  const renderChecklistCell = (params) => {
    const p = params.row._raw;
    const cl = p.selectionChecklist || {};
    return (
      <Stack spacing={0.25} sx={{ py: 0.5 }}>
        {CHECKLIST_STEPS.map((step) => {
          const done = !!cl[step.key];
          return (
            <Stack
              key={step.key}
              direction="row"
              spacing={0.75}
              alignItems="center"
            >
              {done ? (
                <CheckCircleIcon sx={{ fontSize: 14 }} color="success" />
              ) : (
                <RadioButtonUncheckedIcon
                  sx={{ fontSize: 14, color: "grey.400" }}
                />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: done ? "text.primary" : "text.disabled",
                  textDecoration: done ? "none" : "none",
                }}
              >
                {step.label}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    );
  };

  const renderCandidateCell = (params) => (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" fontWeight={600} noWrap>
        {params.row.candidateName}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap>
        INDOS: {params.row.indosNumber || "—"}
      </Typography>
    </Box>
  );

  const columns = [
    {
      field: "candidateName",
      headerName: "Candidate",
      flex: 1.5,
      minWidth: 180,
      renderCell: renderCandidateCell,
    },
    { field: "rank", headerName: "Rank", flex: 1, minWidth: 120 },
    { field: "vacancyCode", headerName: "Vacancy ID", flex: 1.2, minWidth: 140 },
    {
      field: "vessel",
      headerName: "Vessel",
      flex: 1.2,
      minWidth: 140,
      sortable: false,
    },
    {
      field: "checklist",
      headerName: "Selection",
      flex: 1.2,
      minWidth: 150,
      sortable: false,
      filterable: false,
      renderCell: renderChecklistCell,
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1.3,
      minWidth: 170,
      renderCell: (params) => (
        <Chip
          label={params.row.status}
          size="small"
          color={STATUS_COLORS[params.row.status] || "default"}
          variant={
            ["Proposed", "Selected"].includes(params.row.status)
              ? "filled"
              : "outlined"
          }
        />
      ),
    },
    {
      field: "actions",
      headerName: "Review",
      flex: 0.6,
      minWidth: 90,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Tooltip title="Review candidate" arrow>
          <IconButton
            size="small"
            color="primary"
            onClick={() => setReviewProposal(params.row._raw)}
          >
            <RateReviewOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Stack sx={{ width: "100%" }}>
      <ListPageHeader
        actions={
          <>
            {vacancyIdParam && (
              <Chip
                color="primary"
                variant="outlined"
                label={`Vacancy: ${vacancyCodeParam || vacancyIdParam}`}
                onDelete={() => setSearchParams({})}
              />
            )}
            <StatusFilter
              value={statusFilter}
              onChange={handleStatusFilter}
              options={STATUS_OPTIONS}
              counts={statusByCount}
              allCount={statusTotal}
            />
            <Search
              value={searchValue}
              onDebouncedChange={handleSearch}
              delay={800}
              placeholder="Search proposals..."
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

      <ProposalReviewDialog
        open={Boolean(reviewProposal)}
        proposal={reviewProposal}
        onClose={() => setReviewProposal(null)}
        onDecided={() => {
          setRefreshKey((k) => k + 1);
        }}
      />
    </Stack>
  );
};

export default Proposals;

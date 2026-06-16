import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Stack, Chip, Typography, Box, IconButton, Tooltip } from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DataTable from "../../../components/DataTable/DataTable";
import Search from "../../../components/Search/Search";
import StatusFilter from "../../../components/StatusFilter/StatusFilter";
import { ListPageHeader } from "../../navigation/components/ListPageHeader";
import { SailingDetailsDialog } from "./SailingDetailsDialog";
import {
  fetchSailingsAsync,
  selectSailings,
  selectSailingsTotalCount,
  selectSailingFetchStatus,
  selectSailingPaginationModel,
  selectSailingSortModel,
  selectSailingSearchValue,
  selectSailingStatusFilter,
  selectSailingStatusCounts,
  setSailingPaginationModel,
  setSailingSortModel,
  setSailingSearchValue,
  setSailingStatusFilter,
  SAILING_STATUS_OPTIONS,
} from "../SailingSlice";

const STATUS_COLORS = {
  Onboard: "success",
  "Signed Off": "default",
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

export const Sailings = () => {
  const dispatch = useDispatch();
  const [detailSailing, setDetailSailing] = useState(null);

  const sailings = useSelector(selectSailings);
  const totalCount = useSelector(selectSailingsTotalCount);
  const fetchStatus = useSelector(selectSailingFetchStatus);
  const paginationModel = useSelector(selectSailingPaginationModel);
  const sortModel = useSelector(selectSailingSortModel);
  const searchValue = useSelector(selectSailingSearchValue);
  const statusFilter = useSelector(selectSailingStatusFilter);
  const { total: statusTotal, byStatus: statusByCount } = useSelector(
    selectSailingStatusCounts,
  );

  const sortFieldMap = useMemo(
    () => ({
      candidateName: "candidateName",
      vacancyCode: "vacancyCode",
      rank: "rank",
      signOnDate: "signOnDate",
      status: "status",
    }),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    const params = {
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
    };
    const sort = sortModel[0];
    if (sort) {
      params.sortField = sortFieldMap[sort.field] || sort.field;
      params.sortOrder = sort.sort;
    }
    if (searchValue) params.searchValue = searchValue;
    if (statusFilter) params.status = statusFilter;

    dispatch(fetchSailingsAsync({ params, signal: controller.signal }));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, sortModel, searchValue, statusFilter]);

  const handlePaginationModelChange = (model) => {
    if (model.pageSize !== paginationModel.pageSize) {
      dispatch(setSailingPaginationModel({ page: 0, pageSize: model.pageSize }));
    } else {
      dispatch(setSailingPaginationModel(model));
    }
  };

  const handleSortModelChange = (newModel) => {
    dispatch(setSailingSortModel(newModel));
    dispatch(setSailingPaginationModel({ ...paginationModel, page: 0 }));
  };

  const handleSearch = (text) => {
    if (text === searchValue) return;
    dispatch(setSailingSearchValue(text));
    dispatch(setSailingPaginationModel({ ...paginationModel, page: 0 }));
  };

  const handleStatusFilter = (value) => {
    dispatch(setSailingStatusFilter(value));
    dispatch(setSailingPaginationModel({ ...paginationModel, page: 0 }));
  };

  const refetch = () => {
    const params = {
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
    };
    const sort = sortModel[0];
    if (sort) {
      params.sortField = sortFieldMap[sort.field] || sort.field;
      params.sortOrder = sort.sort;
    }
    if (searchValue) params.searchValue = searchValue;
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchSailingsAsync({ params }));
  };

  const rows = sailings.map((s) => ({
    id: s._id,
    candidateName: s.candidateName || "-",
    indosNumber: s.indosNumber || "",
    rank: s.rank || "-",
    vacancyCode: s.vacancyCode || "-",
    vessel: s.vesselName || "-",
    leavingDate: s.leavingDate,
    signOnDate: s.signOnDate,
    tentativeSignOffDate: s.tentativeSignOffDate,
    actualSignOffDate: s.actualSignOffDate,
    status: s.status,
    _raw: s,
  }));

  const columns = [
    {
      field: "candidateName",
      headerName: "Candidate",
      flex: 1.5,
      minWidth: 170,
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
    { field: "rank", headerName: "Rank", flex: 1, minWidth: 110 },
    { field: "vacancyCode", headerName: "Vacancy ID", flex: 1.1, minWidth: 140 },
    {
      field: "vessel",
      headerName: "Vessel",
      flex: 1,
      minWidth: 110,
      sortable: false,
    },
    {
      field: "leavingDate",
      headerName: "Leaving",
      flex: 0.9,
      minWidth: 105,
      sortable: false,
      renderCell: (params) => fmtDate(params.row.leavingDate),
    },
    {
      field: "signOnDate",
      headerName: "Sign-on",
      flex: 0.9,
      minWidth: 105,
      renderCell: (params) => fmtDate(params.row.signOnDate),
    },
    {
      field: "signOff",
      headerName: "Sign-off",
      flex: 0.9,
      minWidth: 110,
      sortable: false,
      renderCell: (params) =>
        params.row.actualSignOffDate ? (
          fmtDate(params.row.actualSignOffDate)
        ) : (
          <Typography variant="caption" color="text.secondary" noWrap>
            ~ {fmtDate(params.row.tentativeSignOffDate)}
          </Typography>
        ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.9,
      minWidth: 115,
      renderCell: (params) => (
        <Chip
          label={params.row.status}
          size="small"
          color={STATUS_COLORS[params.row.status] || "default"}
          variant={params.row.status === "Onboard" ? "filled" : "outlined"}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Action",
      width: 80,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const signedOff = params.row.status === "Signed Off";
        return (
          <Tooltip title={signedOff ? "Signed off" : "View / sign off"} arrow>
            <span>
              <IconButton
                size="small"
                color="primary"
                disabled={signedOff}
                onClick={() => setDetailSailing(params.row._raw)}
              >
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        );
      },
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
              options={SAILING_STATUS_OPTIONS}
              counts={statusByCount}
              allCount={statusTotal}
              sx={{ width: 200 }}
            />
            <Search
              value={searchValue}
              onDebouncedChange={handleSearch}
              delay={800}
              placeholder="Search sailings..."
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

      <SailingDetailsDialog
        open={!!detailSailing}
        sailing={detailSailing}
        onClose={() => setDetailSailing(null)}
        onUpdated={refetch}
      />
    </Stack>
  );
};

export default Sailings;

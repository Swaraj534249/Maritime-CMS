import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Stack,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Chip,
  Box,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import { toast } from "react-toastify";
import DataTable from "../../../components/DataTable/DataTable";
import Search from "../../../components/Search/Search";
import { useRowActions } from "../../../hooks/useRowActions";
import { AssetForm } from "./AssetForm";

/**
 * Generic list tab for a simple agency-scoped asset (rank / vessel type).
 * All entity-specific wiring is passed through `config`.
 */
export function AssetTab({ config }) {
  const {
    entityLabel,
    fieldLabel,
    columnHeader,
    searchPlaceholder,
    nameField,
    sortFieldMap = {},
    selectors,
    actions,
  } = config;

  const dispatch = useDispatch();

  const items = useSelector(selectors.selectItems);
  const totalCount = useSelector(selectors.selectTotalCount);
  const fetchStatus = useSelector(selectors.selectFetchStatus);
  const createStatus = useSelector(selectors.selectCreateStatus);
  const updateStatus = useSelector(selectors.selectUpdateStatus);
  const paginationModel = useSelector(selectors.selectPaginationModel);
  const sortModel = useSelector(selectors.selectSortModel);
  const searchValue = useSelector(selectors.selectSearchValue);

  const [openModal, setOpenModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { anchorEl, selectedRowId, handleMenuOpen, handleMenuClose } =
    useRowActions();

  const saving = createStatus === "pending" || updateStatus === "pending";

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

    dispatch(actions.fetchAsync({ params, signal: controller.signal }));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, sortModel, searchValue, refreshKey]);

  const handleAddNew = () => {
    setEditRow(null);
    setOpenModal(true);
  };

  const handleEdit = () => {
    const row = items.find((i) => i._id === selectedRowId);
    setEditRow(row);
    setOpenModal(true);
    handleMenuClose();
  };

  const handleToggleStatus = async () => {
    const id = selectedRowId;
    handleMenuClose();
    try {
      await dispatch(actions.toggleStatusAsync(id)).unwrap();
      toast.success(`${entityLabel} status updated`);
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleSubmit = async (value) => {
    if (editRow) {
      await dispatch(
        actions.updateAsync({ id: editRow._id, [nameField]: value }),
      ).unwrap();
      toast.success(`${entityLabel} updated`);
    } else {
      await dispatch(actions.createAsync({ [nameField]: value })).unwrap();
      toast.success(`${entityLabel} added`);
    }
    setRefreshKey((k) => k + 1);
  };

  const handlePaginationModelChange = (model) => {
    if (model.pageSize !== paginationModel.pageSize) {
      dispatch(actions.setPaginationModel({ page: 0, pageSize: model.pageSize }));
    } else {
      dispatch(actions.setPaginationModel(model));
    }
  };

  const handleSortModelChange = (newModel) => {
    dispatch(actions.setSortModel(newModel));
    dispatch(actions.setPaginationModel({ ...paginationModel, page: 0 }));
  };

  const handleSearch = (text) => {
    if (text === searchValue) return;
    dispatch(actions.setSearchValue(text));
    dispatch(actions.setPaginationModel({ ...paginationModel, page: 0 }));
  };

  const rows = items.map((item) => ({
    id: item._id,
    name: item[nameField],
    isActive: item.isActive,
  }));

  const selectedRow = items.find((i) => i._id === selectedRowId);

  const columns = useMemo(
    () => [
      {
        field: "name",
        headerName: columnHeader,
        flex: 2,
        minWidth: 220,
        sortable: true,
      },
      {
        field: "status",
        headerName: "Status",
        flex: 1,
        minWidth: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Chip
            label={params.row.isActive ? "Active" : "Inactive"}
            size="small"
            color={params.row.isActive ? "success" : "default"}
            variant={params.row.isActive ? "filled" : "outlined"}
          />
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 0.6,
        minWidth: 90,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Tooltip title="More actions" arrow>
            <IconButton
              size="small"
              onClick={(event) => handleMenuOpen(event, params.row.id)}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnHeader],
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="flex-end"
        flexWrap="wrap"
        sx={{ mb: 2, flexShrink: 0 }}
      >
        <Search
          value={searchValue}
          onDebouncedChange={handleSearch}
          delay={800}
          placeholder={searchPlaceholder}
          sx={{ width: { xs: "140px", sm: "220px", md: "320px" } }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddNew}
          sx={{ textTransform: "none" }}
        >
          Add {entityLabel}
        </Button>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <DataTable
          rows={rows}
          columns={columns}
          loading={fetchStatus === "pending"}
          sx={{ maxWidth: "100%" }}
          height="100%"
          showToolbar={false}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          rowCount={totalCount}
          paginationMode="server"
          sortingMode="server"
          sortingModel={sortModel}
          onSortModelChange={handleSortModelChange}
        />
      </Box>

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
          {selectedRow?.isActive ? (
            <>
              <ToggleOffIcon fontSize="small" sx={{ mr: 1 }} />
              Deactivate
            </>
          ) : (
            <>
              <ToggleOnIcon fontSize="small" sx={{ mr: 1 }} />
              Activate
            </>
          )}
        </MenuItem>
      </Menu>

      <AssetForm
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setEditRow(null);
        }}
        onSubmit={handleSubmit}
        initialValue={editRow ? editRow[nameField] : ""}
        fieldLabel={fieldLabel}
        entityLabel={entityLabel}
        submitting={saving}
      />
    </Box>
  );
}

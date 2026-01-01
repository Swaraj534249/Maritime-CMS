import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";

const NoRowsOverlay = () => (
  <Stack height="100%" alignItems="center" justifyContent="center">
    <Typography fontSize={16} color="text.secondary">
      No results found
    </Typography>
  </Stack>
);

const DataTable = ({
  rows = [],
  columns = [],
  loading = false,
  checkboxSelection = false,
  getRowId = (row) => row.id ?? row._id,
  sx = {},
  slotProps = {},
  rowsPerPageOptions = [5, 10, 25, 50],
  height,
  showToolbar = true,
  // server-side props
  paginationModel,
  onPaginationModelChange,
  rowCount,
  paginationMode = "client", // 'server' when parent manages pages
  sortingModel,
  onSortModelChange,
  sortingMode = "client",
}) => {
  const containerHeight = height || "calc(100vh - 145px)";

  return (
    <Box sx={{ width: "100%", height: containerHeight, ...sx }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        pageSizeOptions={rowsPerPageOptions}
        // checkboxSelection={checkboxSelection}
        // slots={showToolbar ? { toolbar: GridToolbar } : undefined}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 200 },
            ...slotProps?.toolbar,
          },
          ...slotProps,
        }}
        getRowId={getRowId}
        // disableRowSelectionOnClick
        columnHeaderHeight={56}
        paginationMode={paginationMode}
        sortingMode={sortingMode}
        sortModel={sortingModel}
        onSortModelChange={onSortModelChange}
        rowCount={rowCount}
        disableColumnMenu={true}
        slots={{
          noRowsOverlay: NoRowsOverlay, // <-- 🔥 CUSTOM "NO DATA" MESSAGE
        }}
        sx={{
          border: "none",
          "& .MuiDataGrid-virtualScroller": {
            overflow: "auto",
          },
          "& .MuiDataGrid-columnHeader": {
            backgroundColor: "#f5f5f5",
            fontWeight: 600,
          },
        }}
      />
    </Box>
  );
};

export default DataTable;

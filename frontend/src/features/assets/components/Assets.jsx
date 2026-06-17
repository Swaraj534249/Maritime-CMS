import React, { useState } from "react";
import { Stack, Tabs, Tab, Box } from "@mui/material";
import { ListPageHeader } from "../../navigation/components/ListPageHeader";
import { AssetTab } from "./AssetTab";
import {
  fetchRanksAsync,
  createRankAsync,
  updateRankAsync,
  toggleRankStatusAsync,
  setRankPaginationModel,
  setRankSortModel,
  setRankSearchValue,
  selectRanks,
  selectRanksTotalCount,
  selectRankFetchStatus,
  selectRankCreateStatus,
  selectRankUpdateStatus,
  selectRankPaginationModel,
  selectRankSortModel,
  selectRankSearchValue,
} from "../rank/RankSlice";
import {
  fetchVesselTypesAsync,
  createVesselTypeAsync,
  updateVesselTypeAsync,
  toggleVesselTypeStatusAsync,
  setVesselTypePaginationModel,
  setVesselTypeSortModel,
  setVesselTypeSearchValue,
  selectVesselTypes,
  selectVesselTypesTotalCount,
  selectVesselTypeFetchStatus,
  selectVesselTypeCreateStatus,
  selectVesselTypeUpdateStatus,
  selectVesselTypePaginationModel,
  selectVesselTypeSortModel,
  selectVesselTypeSearchValue,
} from "../vesselType/VesselTypeSlice";

const rankConfig = {
  entityLabel: "Rank",
  fieldLabel: "Rank Name",
  columnHeader: "Rank Name",
  searchPlaceholder: "Search ranks...",
  nameField: "rankName",
  sortFieldMap: { name: "rankName" },
  selectors: {
    selectItems: selectRanks,
    selectTotalCount: selectRanksTotalCount,
    selectFetchStatus: selectRankFetchStatus,
    selectCreateStatus: selectRankCreateStatus,
    selectUpdateStatus: selectRankUpdateStatus,
    selectPaginationModel: selectRankPaginationModel,
    selectSortModel: selectRankSortModel,
    selectSearchValue: selectRankSearchValue,
  },
  actions: {
    fetchAsync: fetchRanksAsync,
    createAsync: createRankAsync,
    updateAsync: updateRankAsync,
    toggleStatusAsync: toggleRankStatusAsync,
    setPaginationModel: setRankPaginationModel,
    setSortModel: setRankSortModel,
    setSearchValue: setRankSearchValue,
  },
};

const vesselTypeConfig = {
  entityLabel: "Vessel Type",
  fieldLabel: "Vessel Type Name",
  columnHeader: "Vessel Type Name",
  searchPlaceholder: "Search vessel types...",
  nameField: "typeName",
  sortFieldMap: { name: "typeName" },
  selectors: {
    selectItems: selectVesselTypes,
    selectTotalCount: selectVesselTypesTotalCount,
    selectFetchStatus: selectVesselTypeFetchStatus,
    selectCreateStatus: selectVesselTypeCreateStatus,
    selectUpdateStatus: selectVesselTypeUpdateStatus,
    selectPaginationModel: selectVesselTypePaginationModel,
    selectSortModel: selectVesselTypeSortModel,
    selectSearchValue: selectVesselTypeSearchValue,
  },
  actions: {
    fetchAsync: fetchVesselTypesAsync,
    createAsync: createVesselTypeAsync,
    updateAsync: updateVesselTypeAsync,
    toggleStatusAsync: toggleVesselTypeStatusAsync,
    setPaginationModel: setVesselTypePaginationModel,
    setSortModel: setVesselTypeSortModel,
    setSearchValue: setVesselTypeSearchValue,
  },
};

export const Assets = () => {
  const [tab, setTab] = useState(0);

  return (
    <Stack
      sx={{
        width: "100%",
        height: "calc(100vh - 96px)",
        minHeight: 0,
      }}
    >
      <ListPageHeader title="Assets" />

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2, px: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Ranks" />
          <Tab label="Vessel Types" />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {tab === 0 && <AssetTab config={rankConfig} />}
        {tab === 1 && <AssetTab config={vesselTypeConfig} />}
      </Box>
    </Stack>
  );
};

export default Assets;

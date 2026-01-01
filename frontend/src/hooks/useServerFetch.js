import { useEffect } from "react";
import { useDispatch } from "react-redux";

export const useServerFetch = ({
  thunk,
  paginationModel,
  sortModel,
  searchValue,
  sortFieldMap,
  refreshKey,
}) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const controller = new AbortController();

    const page = paginationModel.page + 1;
    const limit = paginationModel.pageSize;

    const sort = sortModel?.[0];
    const sortField = sort
      ? sortFieldMap?.[sort.field] || sort.field
      : undefined;
    const sortOrder = sort?.sort;

    const params = {
      page,
      limit,
      ...(sortField && { sortField }),
      ...(sortOrder && { sortOrder }),
      ...(searchValue && { searchValue }),
    };

    dispatch(thunk({ params, signal: controller.signal }));

    return () => controller.abort();
  }, [
    dispatch,
    thunk,
    paginationModel.page,
    paginationModel.pageSize,
    sortModel,
    searchValue,
    refreshKey,
  ]);
};

exports.buildListResponse = ({
  data,
  page,
  pageSize,
  totalRecords,
  searchValue,
  sortField,
  sortOrder,
  aggregates = {},
  context = {},
}) => {
  const totalPages = Math.ceil(totalRecords / pageSize);

  return {
    result: {
      data,
      meta: {
        pagination: {
          page,
          pageSize,
          totalRecords,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        searchValue,
        sortField,
        sortOrder,
      },
      aggregates,
      context,
    },
  };
};

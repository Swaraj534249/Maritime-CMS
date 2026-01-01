exports.buildListQuery = ({
  filter = {},
  searchValue,
  searchFields = [],
  page = 1,
  pageSize = 10,
  sortField = "_id",
  sortOrder = "asc",
  extraFilter = {},
}) => {
  const andConditions = [];

  if (filter && Object.keys(filter).length) {
    andConditions.push(filter);
  }

  if (extraFilter && Object.keys(extraFilter).length) {
    andConditions.push(extraFilter);
  }

  if (searchValue && searchFields.length) {
    const re = new RegExp(
      searchValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );

    andConditions.push({
      $or: searchFields.map((field) => ({ [field]: re })),
    });
  }

  const queryFilter =
    andConditions.length > 0 ? { $and: andConditions } : {};

  const skip = pageSize * (page - 1);
  const sort = { [sortField]: sortOrder === "desc" ? -1 : 1 };

  return { queryFilter, skip, limit: pageSize, sort };
};

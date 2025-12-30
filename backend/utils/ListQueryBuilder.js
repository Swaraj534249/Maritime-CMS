exports.buildListQuery = ({
  Model,
  filter = {},
  searchValue,
  searchFields = [],
  page = 1,
  pageSize = 10,
  sortField = '_id',
  sortOrder = 'asc',
  extraFilter = {}
}) => {
  const queryFilter = { ...filter, ...extraFilter }

  if (searchValue && searchFields.length) {
    const re = new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    queryFilter.$or = searchFields.map(field => ({ [field]: re }))
  }

  const skip = pageSize * (page - 1)
  const sort = { [sortField]: sortOrder === 'desc' ? -1 : 1 }

  return { queryFilter, skip, limit: pageSize, sort }
}

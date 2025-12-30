import { useDispatch } from 'react-redux'

export const useServerTableUI = ({
  paginationModel,
  setPaginationModel,
  setSortModel,
  setSearchValue
}) => {
  const dispatch = useDispatch()

  const handlePaginationModelChange = (model) => {
    if (model.pageSize !== paginationModel.pageSize) {
      dispatch(setPaginationModel({ page: 0, pageSize: model.pageSize }))
    } else {
      dispatch(setPaginationModel(model))
    }
  }

  const handleSortModelChange = (newModel) => {
    dispatch(setSortModel(newModel))
    dispatch(setPaginationModel({ ...paginationModel, page: 0 }))
  }

  const handleSearch = (value) => {
    dispatch(setSearchValue(value))
    dispatch(setPaginationModel({ ...paginationModel, page: 0 }))
  }

  return {
    handlePaginationModelChange,
    handleSortModelChange,
    handleSearch
  }
}

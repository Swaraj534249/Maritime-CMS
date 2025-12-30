import React, { useEffect, useState, useRef } from 'react'
import { TextField, InputAdornment, IconButton } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'

const Search = ({ value = '', onDebouncedChange = () => {}, placeholder = 'Search...',delay = 500, sx = {} }) => {
  const [searchText, setSearchText] = useState(value)
  const isFirstRun = useRef(true)

  useEffect(() => {
    setSearchText(value)
  }, [value])

    useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    const handler = setTimeout(() => {
      onDebouncedChange(searchText.trim())
    }, delay)

    return () => clearTimeout(handler)
  }, [searchText, delay, onDebouncedChange])

  return (
    <TextField
      size="small"
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      placeholder={placeholder}
      variant="outlined"
      sx={sx}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
        endAdornment: searchText ? (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => setSearchText('')}>
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
      inputProps={{ 'aria-label': 'search' }}
    />
  )
}

export default Search
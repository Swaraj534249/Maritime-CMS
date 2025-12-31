import { useState } from "react";

export const useRowActions = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);

  const open = Boolean(anchorEl);

  const handleMenuOpen = (event, rowId) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowId(rowId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowId(null);
  };

  return {
    anchorEl,
    open,
    selectedRowId,
    handleMenuOpen,
    handleMenuClose,
  };
};

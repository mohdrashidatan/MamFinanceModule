import { useState, useCallback } from 'react';

export const useRowSelection = ({
  initialSelected = [],
  multiPage = false,
  rowIdKey = "id",
} = {}) => {
  const [selectedRows, setSelectedRows] = useState(initialSelected);

  const getRowId = useCallback((rowOrId) => {
    if (typeof rowOrId === "object" && rowOrId !== null) {
      return rowOrId[rowIdKey];
    }
    return rowOrId;
  }, [rowIdKey]);

  const handleSelectRow = useCallback((rowOrId) => {
    const rowId = getRowId(rowOrId);
    setSelectedRows(prev =>
      prev.includes(rowId)
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    );
  }, [getRowId]);

  const handleSelectAll = useCallback((checked, currentPageRows) => {
    const currentIds = currentPageRows.map(row => getRowId(row));

    if (checked) {
      if (multiPage) {
        setSelectedRows(prev => [...new Set([...prev, ...currentIds])]);
      } else {
        setSelectedRows(currentIds);
      }
    } else {
      setSelectedRows(prev => prev.filter(id => !currentIds.includes(id)));
    }
  }, [multiPage, getRowId]);

  const clearSelection = useCallback(() => {
    setSelectedRows([]);
  }, []);

  const setSelection = useCallback((rowIds) => {
    setSelectedRows(rowIds.map(id => getRowId(id)));
  }, [getRowId]);

  const isRowSelected = useCallback((rowOrId) => {
    const rowId = getRowId(rowOrId);
    return selectedRows.includes(rowId);
  }, [selectedRows, getRowId]);

  const getSelectedCount = useCallback(() => {
    return selectedRows.length;
  }, [selectedRows]);

  const toggleMultiple = useCallback((rows) => {
    const rowIds = rows.map(row => getRowId(row));

    setSelectedRows(prev => {
      const allSelected = rowIds.every(id => prev.includes(id));

      if (allSelected) {
        return prev.filter(id => !rowIds.includes(id));
      } else {
        return [...new Set([...prev, ...rowIds])];
      }
    });
  }, [getRowId]);

  return {
    selectedRows,
    handleSelectRow,
    handleSelectAll,
    clearSelection,
    setSelection,
    isRowSelected,
    getSelectedCount,
    toggleMultiple,
  };
};

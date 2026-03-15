import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const DataTable = ({
  columns = [],
  data = [],
  pagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10,
  },
  onPageChange,
  onSizeChange,
  pageSizeOptions = [5, 10, 25, 50, 100],
  showPagination = true,
  showNumber = true,
  isLoading = false,
  className = "",
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  rowIdKey = "id",
}) => {
  const { currentPage, totalPages, totalItems, pageSize } = pagination;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && onPageChange) {
      onPageChange(page);
    }
  };

  const handleSizeChange = (value) => {
    if (onSizeChange) {
      onSizeChange(Number(value));
    }
  };

  const handleSelectRow = (rowId) => {
    if (onSelectRow) {
      onSelectRow(rowId);
    }
  };

  const handleSelectAll = (checked) => {
    if (onSelectAll) {
      const currentPageIds = data.map((row) => row[rowIdKey]);
      onSelectAll(checked, currentPageIds);
    }
  };

  const isRowSelected = (rowId) => {
    return selectedRows.includes(rowId);
  };

  const isAllSelected = () => {
    if (data.length === 0) return false;
    return data.every((row) => selectedRows.includes(row[rowIdKey]));
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const startRowNumber = (currentPage - 1) * pageSize + 1;

  const processedColumns = [
    ...(selectable ?
      [
        {
          header: (
            <Checkbox
              checked={isAllSelected()}
              onCheckedChange={handleSelectAll}
              aria-label="Select all rows"
              className="data-[state=checked]:bg-blue-500 data-[state=checked]:text-white border-black bg-white"
            />
          ),
          accessorKey: "__checkbox",
          width: "50px",
          align: "center",
          cell: (row) => (
            <Checkbox
              checked={isRowSelected(row[rowIdKey])}
              onCheckedChange={() => handleSelectRow(row[rowIdKey])}
              aria-label={`Select row ${row[rowIdKey]}`}
              className="data-[state=checked]:bg-blue-500"
            />
          ),
        },
      ]
    : []),
    ...(showNumber ?
      [
        {
          header: "No.",
          accessorKey: "__rowNumber",
          width: "60px",
          cell: (_, idx) => startRowNumber + idx,
        },
      ]
    : []),
    ...columns,
  ];

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }

    return pages;
  };

  const LoadingSkeleton = () => (
    <div className="h-4 bg-muted rounded animate-pulse" />
  );

  const getAlignClass = (align) => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-700 hover:bg-gray-700">
                {processedColumns.map((column, idx) => (
                  <TableHead
                    key={idx}
                    className={`text-white font-semibold p-4 ${getAlignClass(
                      column.align,
                    )} ${column.headerClassName || ""}`}
                    style={{ width: column.width }}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* LOADING */}
              {isLoading ?
                Array.from({ length: Math.min(pageSize, 5) }).map((_, idx) => (
                  <TableRow key={idx}>
                    {processedColumns.map((_, ci) => (
                      <TableCell key={ci} className="p-4">
                        <LoadingSkeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : data.length === 0 ?
                <TableRow>
                  <TableCell
                    colSpan={processedColumns.length}
                    className="h-24 text-center text-muted-foreground p-4"
                  >
                    No data available
                  </TableCell>
                </TableRow>
              : data.map((row, rowIdx) => (
                  <TableRow
                    key={rowIdx}
                    className={`border-b hover:bg-gray-50 ${
                      selectable && isRowSelected(row[rowIdKey]) ? "bg-blue-50"
                      : ""
                    }`}
                  >
                    {processedColumns.map((column, colIdx) => (
                      <TableCell
                        key={colIdx}
                        className={`p-4 ${getAlignClass(column.align)} ${
                          column.cellClassName || ""
                        }`}
                      >
                        {column.cell ?
                          column.cell(row, rowIdx)
                        : column.accessorKey ?
                          row[column.accessorKey]
                        : null}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </div>
      </div>

      {/** PAGINATION */}
      {showPagination && totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 py-4 bg-background border border-t-0 rounded-b-lg">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing <b>{startItem}</b> - <b>{endItem}</b> of{" "}
              <b>{totalItems}</b> entries
              {selectable && selectedRows.length > 0 && (
                <span className="ml-2 text-blue-600">
                  ({selectedRows.length} selected)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Per page:</span>
              <Select value={String(pageSize)} onValueChange={handleSizeChange}>
                <SelectTrigger className="h-8 w-17.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, idx) =>
                page === "..." ?
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-muted-foreground"
                  >
                    ...
                  </span>
                : <Button
                    key={`page-${idx}-${page}`}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 min-w-8 px-2"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>,
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

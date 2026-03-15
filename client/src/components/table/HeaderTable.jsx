import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const HeaderTable = ({
  title,
  subtitle,
  searchQuery = "",
  searchPlaceholder,
  onSearchChange,
  onAddNew,
  additionalActions,
  renderCustomActions,
  children,
  showSearch = true,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const previousSearchRef = useRef(searchQuery);

  useEffect(() => {
    if (searchQuery !== previousSearchRef.current) {
      setLocalSearch(searchQuery);
      previousSearchRef.current = searchQuery;
    }
  }, [searchQuery]);

  useEffect(() => {
    if (localSearch.length > 0 && localSearch.length < 3) return;
    if (localSearch === previousSearchRef.current) return;

    const timer = setTimeout(() => {
      onSearchChange?.(localSearch);
      previousSearchRef.current = localSearch;
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  return (
    <div className="space-y-4 mb-6">
      {/* Title and Subtitle */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-700">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>

        {/* Actions Container */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Search Bar */}
          {showSearch && (
            <div className="relative w-full sm:w-auto min-w-auto md:min-w-90">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Search className="h-4 w-4" />
              </div>
              <Input
                type="search"
                placeholder={searchPlaceholder || "Search..."}
                className="pl-9 w-full bg-white border-gray-300 h-10 text-sm focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                maxLength={50}
              />
            </div>
          )}

          {/* Add New Button */}
          {onAddNew && (
            <Button
              onClick={onAddNew}
              className="w-full sm:w-auto h-10 bg-gray-700 hover:bg-gray-800 text-white font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          )}

          {/* Additional Actions */}
          {additionalActions?.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              variant={action.variant || "outline"}
              className={`w-full sm:w-auto h-10 ${
                action.variant === "outline" ?
                  "border-gray-300 hover:bg-gray-50 text-gray-700"
                : ""
              }`}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          ))}

          {/* Custom Actions Render Function */}
          {renderCustomActions && renderCustomActions()}

          {/* Children */}
          {children}
        </div>
      </div>
    </div>
  );
};

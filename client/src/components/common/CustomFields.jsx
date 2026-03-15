import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, ChevronDown, X, Check, Loader } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";

export const InputField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  isRequired = false,
  error,
  onError,
  disabled = false,
  readOnly = false,
  maxLength = 50,
  className = "",
  labelClassName = "",
  inputClassName = "",
  dir,
  validate,
  name,
  step,
  decimalPlaces = 2,
  icon: Icon,
  iconPosition = "left",
  iconClassName = "",
  ...props
}) => {
  const handleChange = (e) => {
    let newValue = e.target.value;

    if (type === "number") {
      if (step && parseFloat(step) < 1) {
        newValue = newValue.replace(/[^\d.]/g, "");

        const parts = newValue.split(".");
        if (parts.length > 2) {
          newValue = parts[0] + "." + parts.slice(1).join("");
        }

        if (parts.length === 2 && parts[1].length > decimalPlaces) {
          newValue = parts[0] + "." + parts[1].slice(0, decimalPlaces);
        }
      } else {
        newValue = newValue.replace(/\D/g, "");
      }

      if (maxLength && newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength);
      }

      if (error && onError) onError(null);

      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: newValue,
          name: name || e.target.name,
        },
      };

      onChange?.(syntheticEvent);
      return;
    }

    if (error && onError) onError(null);

    onChange?.(e);
  };

  const handleBlur = (e) => {
    let newValue = e.target.value;

    if (type === "number" && step && parseFloat(step) < 1 && newValue) {
      const num = parseFloat(newValue);
      if (!isNaN(num)) {
        newValue = num.toFixed(decimalPlaces);

        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: newValue,
            name: name || e.target.name,
          },
        };
        onChange?.(syntheticEvent);
      }
    }

    if (isRequired && !newValue.trim() && onError) {
      onError(`${label} is required`);
    } else if (validate) {
      const validationError = validate(newValue);
      if (validationError && onError) onError(validationError);
    }
  };

  const inputType = type === "number" ? "text" : type;
  const inputMode =
    type === "number" ?
      step && parseFloat(step) < 1 ?
        "decimal"
      : "numeric"
    : undefined;
  const pattern =
    type === "number" ?
      step && parseFloat(step) < 1 ?
        "[0-9]*\\.?[0-9]*"
      : "[0-9]*"
    : undefined;

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className={labelClassName}>
        {label} {isRequired && <span className="text-red-500">*</span>}
      </Label>

      <div className="relative">
        {Icon && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Icon className={`w-4 h-4 ${iconClassName}`} />
          </div>
        )}

        <Input
          id={id}
          type={inputType}
          inputMode={inputMode}
          pattern={pattern}
          value={value ?? ""}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          dir={dir}
          name={name}
          className={`h-12 ${error ? "border-red-500" : ""} ${
            Icon && iconPosition === "left" ? "pl-10" : ""
          } ${Icon && iconPosition === "right" ? "pr-10" : ""} ${inputClassName}`}
          {...props}
        />

        {Icon && iconPosition === "right" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Icon className={`w-4 h-4 ${iconClassName}`} />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export const InputRadio = ({
  label,
  value,
  onChange,
  options = [],
  isRequired = false,
  error,
  onError,
  disabled = false,
  className = "",
  labelClassName = "",
  optionsLayout = "horizontal",
  ...props
}) => {
  const handleChange = (newValue) => {
    if (error && onError) {
      onError(null);
    }

    onChange(newValue);
  };

  const handleBlur = () => {
    if (isRequired && !value && onError) {
      onError(`${label} is required`);
    }
  };

  const layoutClass =
    optionsLayout === "horizontal" ?
      "flex flex-wrap gap-4"
    : "flex flex-col space-y-3";

  return (
    <div className={`space-y-2 ${className}`} onBlur={handleBlur}>
      <Label className={labelClassName}>
        {label} {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <RadioGroup
        value={value}
        onValueChange={handleChange}
        disabled={disabled}
        {...props}
      >
        <div className={layoutClass}>
          {options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem
                value={option.value}
                id={option.id || option.value}
                disabled={disabled}
              />
              <Label
                htmlFor={option.id || option.value}
                className="cursor-pointer font-normal"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export const InputTextArea = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  isRequired = false,
  error,
  onError,
  disabled = false,
  readOnly = false,
  maxLength,
  rows = 4,
  className = "",
  labelClassName = "",
  textareaClassName = "",
  validate,
  showCharCount = false,
  ...props
}) => {
  const handleChange = (e) => {
    const newValue = e.target.value;

    if (error && onError) {
      onError(null);
    }

    if (validate) {
      const validationError = validate(newValue);
      if (validationError && onError) {
        onError(validationError);
      }
    }

    onChange(e);
  };

  const handleBlur = (e) => {
    const newValue = e.target.value;

    if (isRequired && !newValue.trim() && onError) {
      onError(`${label} is required`);
    } else if (validate) {
      const validationError = validate(newValue);
      if (validationError && onError) {
        onError(validationError);
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <Label htmlFor={id} className={labelClassName}>
          {label} {isRequired && <span className="text-red-500">*</span>}
        </Label>
        {showCharCount && maxLength && (
          <span className="text-sm text-gray-500">
            {value?.length || 0}/{maxLength}
          </span>
        )}
      </div>
      <Textarea
        id={id}
        value={value || ""}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        rows={rows}
        className={`${error ? "border-red-500" : ""} ${textareaClassName}`}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export const SearchableDropdown = ({
  id,
  name,
  label,
  value,
  onChange,
  onSearch,
  options = [],
  isLoading = false,
  disabled = false,
  error = null,
  isRequired = false,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
  icon: Icon = Search,
  defaultOption = null,
  minSearchLength = 2,
  className = "",
  isManualSearch = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef(null);

  const displayOptions = useMemo(() => {
    if (isManualSearch) {
      if (!hasSearched && defaultOption && value === defaultOption.value) {
        return [defaultOption];
      }
      if (defaultOption && value === defaultOption.value) {
        const existsInOptions = options.some((opt) => opt.value === value);
        if (!existsInOptions) {
          return [defaultOption, ...options];
        }
      }
      return options;
    }

    if (!defaultOption || !value) return options;
    const existsInOptions = options.some((opt) => opt.value === value);
    if (existsInOptions || defaultOption.value !== value) {
      return options;
    }
    return [defaultOption, ...options];
  }, [isManualSearch, hasSearched, defaultOption, value, options]);

  const filteredOptions = useMemo(() => {
    if (onSearch) return displayOptions;
    if (!searchTerm) return displayOptions;
    const lowerSearch = searchTerm.toLowerCase();
    return displayOptions.filter((option) =>
      option.label.toLowerCase().includes(lowerSearch),
    );
  }, [displayOptions, searchTerm, onSearch]);

  const selectedOption = filteredOptions.find((opt) => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : "";

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (onSearch) {
      if (value.length >= minSearchLength) {
        searchTimeoutRef.current = setTimeout(() => {
          onSearch(value);
          setHasSearched(true);
        }, 300);
      } else if (value.length === 0) {
        searchTimeoutRef.current = setTimeout(() => {
          onSearch("");
          setHasSearched(true);
        }, 300);
      }
    }
  };

  const handleSelect = (selectedValue) => {
    const selectedOption = filteredOptions.find(
      (opt) => opt.value === selectedValue,
    );

    const syntheticEvent = {
      target: {
        name: name,
        value: selectedValue === value ? null : selectedValue,
        label: selectedValue === value ? null : selectedOption?.label,
      },
    };

    onChange(syntheticEvent);
    setOpen(false);
    setSearchTerm("");
    setHasSearched(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();

    const syntheticEvent = {
      target: {
        name: name,
        value: null,
        label: null,
      },
    };

    onChange(syntheticEvent);
    setSearchTerm("");
    setHasSearched(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchTerm("");
      setHasSearched(false);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  };

  useEffect(() => {
    if (!isManualSearch && onSearch) {
      onSearch("");
    }
  }, [isManualSearch, onSearch]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const getEmptyMessage = () => {
    if (isManualSearch && !hasSearched) {
      return `Type at least ${minSearchLength} characters to search`;
    }
    if (searchTerm && searchTerm.length < minSearchLength) {
      return `Type at least ${minSearchLength} characters to search`;
    }
    return searchTerm ? emptyMessage : "Start typing to search...";
  };

  return (
    <div className="space-y-2 w-full">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between bg-gray-50 border-gray-300 hover:bg-gray-100 h-11",
              error && "border-red-500 focus:ring-2 focus:ring-red-200",
              !displayValue && "text-gray-600",
              className,
            )}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Icon className="w-5 h-5 shrink-0 text-gray-600" />
              <span className="truncate">{displayValue || placeholder}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {value && !disabled && (
                <div
                  onClick={handleClear}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </div>
              )}
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-gray-600 transition-transform",
                  open && "rotate-180",
                )}
              />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
        >
          <div className="flex flex-col">
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearchChange}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 px-0"
              />
            </div>

            {isLoading ?
              <div className="px-4 py-8 text-center text-gray-500">
                <Loader className="inline-block animate-spin h-6 w-6" />
                <p className="mt-2 text-sm">Loading...</p>
              </div>
            : filteredOptions.length > 0 ?
              <ScrollArea
                className="max-h-50 overflow-y-auto"
                onWheel={(e) => {
                  e.stopPropagation();
                }}
              >
                <div className="py-1">
                  {filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none mx-1",
                        "hover:bg-gray-100 focus:bg-gray-100",
                        value === option.value && "bg-gray-100",
                      )}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="flex-1 wrap-break-word">
                        {option.label}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            : <div className="px-4 py-8 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">{getEmptyMessage()}</p>
              </div>
            }
          </div>
        </PopoverContent>
      </Popover>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

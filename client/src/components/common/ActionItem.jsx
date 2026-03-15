import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ActionItem = ({
  label,
  icon: Icon,
  onClick,
  className = "",
  disabled = false,
  active = false,
  variant = "ghost",
  size = "sm",
  orientation = "horizontal",
}) => {
  const isVertical = orientation === "vertical";

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      size={size}
      className={cn(
        "flex items-center gap-2 transition-all duration-200",
        isVertical ?
          "flex-col justify-center h-auto py-3 px-3 min-w-15"
        : "flex-row justify-start h-auto py-2 px-3",
        active && "bg-blue-50 text-blue-600 hover:bg-blue-100",
        className,
      )}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span
        className={cn(
          "font-medium text-center truncate",
          isVertical ?
            "text-xs w-full max-w-15 sm:max-w-20"
          : "text-sm max-w-25 sm:max-w-30",
        )}
      >
        {label}
      </span>
    </Button>
  );
};

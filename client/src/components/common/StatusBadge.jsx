import { Badge } from "@/components/ui/badge";

export const StatusBadge = ({ label, variant = "default", size = "sm" }) => {
  const variantStyles = {
    green: "bg-green-600 hover:bg-green-600 text-white",
    red: "bg-red-500 hover:bg-red-500 text-white",
    yellow: "bg-yellow-400 hover:bg-yellow-400 text-yellow-900",
    blue: "bg-blue-500 hover:bg-blue-500 text-white",
    gray: "bg-gray-500 hover:bg-gray-500 text-white",
    orange: "bg-orange-500 hover:bg-orange-500 text-white",
    slate: "bg-slate-600 hover:bg-slate-600 text-white",
    default: "bg-gray-400 hover:bg-gray-400 text-white",
  };

  const sizeStyles = {
    xs: "px-2 py-0.5 text-xs rounded",
    sm: "px-4 py-1 text-sm rounded-md",
    md: "px-6 py-2 text-base rounded-lg",
    lg: "px-8 py-3 text-lg rounded-xl",
  };

  return (
    <Badge
      className={`font-medium ${sizeStyles[size]} ${variantStyles[variant]}`}
    >
      {label}
    </Badge>
  );
};

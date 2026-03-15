import React from "react";
import { MoreVertical } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const ActionMenu = ({ actions }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="h-8 w-8 rounded-md p-0 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
          aria-label="Open menu"
        >
          <MoreVertical className="h-4 w-4 mx-auto" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-0"
        align="end"
        side="bottom"
        sideOffset={5}
      >
        <div className="py-1">
          {actions.map((action, index) => (
            <React.Fragment key={action.label}>
              <button
                onClick={action.onClick}
                disabled={action.disabled}
                className={`
                  w-full text-left px-4 py-2.5 flex items-center gap-3
                  ${
                    action.disabled ?
                      "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100"
                  }
                  ${action.className || ""}
                `}
              >
                {action.icon}
                <span className="font-medium">{action.label}</span>
              </button>
              {index < actions.length - 1 && (
                <div className="h-px bg-gray-200" />
              )}
            </React.Fragment>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

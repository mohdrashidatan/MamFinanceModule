import { useState } from "react";
import { Button } from "@/components/ui/button";

export const TruncatedText = ({ title = "Note", text, maxLength = 100 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  if (text.length <= maxLength) return <span>{text}</span>;

  const displayText = isExpanded ? text : text.slice(0, maxLength) + "...";

  return (
    <div className="group relative">
      <div>
        <span className="text-sm">{displayText}</span>
        <Button
          variant="link"
          className="text-blue-500 hover:text-blue-700 p-0 h-auto ml-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </Button>
      </div>
    </div>
  );
};

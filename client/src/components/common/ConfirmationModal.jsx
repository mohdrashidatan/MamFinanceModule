import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

export const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  isLoading = false,
  confirmCheckbox = null,
}) => {
  const isConfirmDisabled =
    isLoading || (confirmCheckbox ? !confirmCheckbox.checked : false);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle className="text-gray-700">{title}</DialogTitle>
        </DialogHeader>

        <DialogDescription className="text-gray-600">
          {message}
        </DialogDescription>

        {confirmCheckbox ?
          <div className="flex items-start gap-3">
            <Checkbox
              id="confirmCheckbox"
              checked={confirmCheckbox.checked}
              onCheckedChange={confirmCheckbox.onChange}
              className="data-[state=checked]:bg-gray-700"
            />
            <Label
              htmlFor="confirmCheckbox"
              className="text-sm leading-tight cursor-pointer"
            >
              {confirmCheckbox.label ||
                "I confirm and understand if this action can't be undone."}
            </Label>
          </div>
        : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="h-10"
            >
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              variant="default"
              onClick={onConfirm}
              disabled={isConfirmDisabled}
              className="bg-gray-700 h-10"
            >
              {isLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

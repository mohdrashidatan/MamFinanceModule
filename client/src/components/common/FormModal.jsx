import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputField, InputRadio, InputTextArea } from "./CustomFields";

export const FormModal = ({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  fields = [],
  initialValues = {},
  onCancel,
  size = "md",
  closeOnSubmit = true,
  layoutConfig = null,
}) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setFormData(initialValues);
      setErrors({});
    }
  }, [open, initialValues]);

  const handleFieldChange = (fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleFieldError = (fieldName, error) => {
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    fields.forEach((field) => {
      const value = formData[field.name];

      if (field.isRequired) {
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          (typeof value === "string" && !value.trim())
        ) {
          newErrors[field.name] = `${field.label} is required`;
          isValid = false;
        }
      }

      if (field.validate && value) {
        const validationError = field.validate(value);
        if (validationError) {
          newErrors[field.name] = validationError;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);

      if (closeOnSubmit) {
        onOpenChange(false);
        // Reset form after closing
        setTimeout(() => {
          setFormData(initialValues);
          setErrors({});
        }, 200);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
    setTimeout(() => {
      setFormData(initialValues);
      setErrors({});
    }, 200);
  };

  const renderField = (field) => {
    if (field.type === "custom" && field.render) {
      return (
        <div key={field.name} className={field.className || ""}>
          {field.render({
            value: formData[field.name],
            onChange: (value) => handleFieldChange(field.name, value),
            error: errors[field.name],
            onError: (error) => handleFieldError(field.name, error),
            disabled: field.disabled || isSubmitting,
            formData,
            setFormData,
          })}
        </div>
      );
    }

    const commonProps = {
      id: field.name,
      label: field.label,
      value: formData[field.name],
      isRequired: field.isRequired,
      error: errors[field.name],
      onError: (error) => handleFieldError(field.name, error),
      disabled: field.disabled || isSubmitting,
      readOnly: field.readOnly,
      placeholder: field.placeholder,
      validate: field.validate,
      className: field.className || "",
      labelClassName: field.labelClassName,
    };

    switch (field.type) {
      case "textarea":
        return (
          <InputTextArea
            key={field.name}
            {...commonProps}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            rows={field.rows}
            maxLength={field.maxLength}
            showCharCount={field.showCharCount}
            textareaClassName={field.inputClassName}
          />
        );

      case "radio":
        return (
          <InputRadio
            key={field.name}
            {...commonProps}
            onChange={(value) => handleFieldChange(field.name, value)}
            options={field.options}
            optionsLayout={field.optionsLayout}
          />
        );

      case "text":
      case "email":
      case "number":
      case "tel":
      case "password":
      default:
        return (
          <InputField
            key={field.name}
            {...commonProps}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            type={field.type || "text"}
            maxLength={field.maxLength}
            inputClassName={field.inputClassName}
            dir={field.dir}
            name={field.name}
          />
        );
    }
  };

  const renderFields = () => {
    if (!layoutConfig) {
      return fields.map((field) => renderField(field));
    }

    const fieldMap = fields.reduce((acc, field) => {
      acc[field.name] = field;
      return acc;
    }, {});

    return layoutConfig.map((row, rowIndex) => {
      if (row.length === 1) {
        const field = fieldMap[row[0]];
        return field ? <div key={rowIndex}>{renderField(field)}</div> : null;
      }

      return (
        <div
          key={rowIndex}
          className={`grid gap-4`}
          style={{
            gridTemplateColumns: `repeat(${row.length}, 1fr)`,
          }}
        >
          {row.map((fieldName) => {
            const field = fieldMap[fieldName];
            return field ? (
              <div key={fieldName}>{renderField(field)}</div>
            ) : null;
          })}
        </div>
      );
    });
  };

  const sizeClasses = {
    sm: "sm:max-w-[425px]",
    md: "sm:max-w-[525px]",
    lg: "sm:max-w-[725px]",
    xl: "sm:max-w-[925px]",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={sizeClasses[size]}>
        <DialogHeader>
          <DialogTitle className="text-gray-700">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto px-1 -mt-2">
            {renderFields()}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="h-10"
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-10 bg-gray-700"
            >
              {isSubmitting ? "Submitting..." : submitLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

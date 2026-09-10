"use client";

import { get, useFormContext } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

import { Checkbox } from "@/components/ui/checkbox";

interface CheckboxOption {
  label: string;
  value: string;
}

interface FormCheckboxProps {
  name: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  options?: CheckboxOption[];
}

export function FormCheckbox({
  name,
  label,
  description,
  disabled = false,
  options,
}: FormCheckboxProps) {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const error = get(errors, name)?.message as string | undefined;

  const value = watch(name);

  // Multiple Checkbox Mode
  if (options?.length) {
    const selectedValues: string[] = value || [];

    return (
      <Field>
        {label && <FieldLabel>{label}</FieldLabel>}

        <div className="flex flex-wrap gap-4">
          {options.map((option) => {
            const checked = selectedValues.includes(option.value);

            return (
              <div
                key={option.value}
                className="flex items-center gap-2"
              >
                <Checkbox
                  id={`${name}-${option.value}`}
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(isChecked) => {
                    const updated = isChecked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter(
                          (item) => item !== option.value
                        );

                    setValue(name, updated, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />

                <FieldLabel
                  htmlFor={`${name}-${option.value}`}
                  className="cursor-pointer font-normal"
                >
                  {option.label}
                </FieldLabel>
              </div>
            );
          })}
        </div>

        {description && (
          <FieldDescription>{description}</FieldDescription>
        )}

        {error && <FieldError>{error}</FieldError>}
      </Field>
    );
  }

  // Single Checkbox Mode
  return (
    <Field>
      <div className="flex items-start gap-3">
        <Checkbox
          id={name}
          checked={!!value}
          disabled={disabled}
          onCheckedChange={(checked) =>
            setValue(name, !!checked, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
          className="mt-1"
        />

        <div className="space-y-1">
          <FieldLabel
            htmlFor={name}
            className="cursor-pointer"
          >
            {label}
          </FieldLabel>

          {description && (
            <FieldDescription>
              {description}
            </FieldDescription>
          )}

          {error && (
            <FieldError>{error}</FieldError>
          )}
        </div>
      </div>
    </Field>
  );
}
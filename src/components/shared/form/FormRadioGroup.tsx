"use client";

import { Controller, get, useFormContext } from "react-hook-form";

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface RadioOption {
  label: string;
  value: string;
}

interface FormRadioGroupProps {
  name: string;
  label: string;
  options: RadioOption[];
  disabled?: boolean;
}

export function FormRadioGroup({
  name,
  label,
  options,
  disabled = false,
}: FormRadioGroupProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = get(errors, name)?.message as string | undefined;

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>

      <FieldContent>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
              className="flex flex-wrap gap-6"
            >
              {options.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2"
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`${name}-${option.value}`}
                  />

                  <Label
                    htmlFor={`${name}-${option.value}`}
                    className="cursor-pointer font-normal"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
      </FieldContent>

      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
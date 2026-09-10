"use client";

import { useState } from "react";

import { useFormContext, get } from "react-hook-form";

import { format } from "date-fns";

import { CalendarIcon } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Button } from "@/components/ui/button";

import { Calendar } from "@/components/ui/calendar";

import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";

import { cn } from "@/lib/utils";

interface FormDatePickerProps {
  name: string;
  label: string;
  description?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function FormDatePicker({
  name,
  label,
  description,
  disabled = false,
  placeholder = "Pick a date",
}: FormDatePickerProps) {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const error = get(errors, name)?.message as
    | string
    | undefined;

  const value = watch(name);

  const [open, setOpen] = useState(false);

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>

      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger >
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-between text-left font-normal h-12 bg-white",
              !value &&
                "text-muted-foreground"
            )}
          >
            <span>
              {value
                ? format(
                    new Date(value),
                    "PPP"
                  )
                : placeholder}
            </span>

            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={
              value
                ? new Date(value)
                : undefined
            }
            onSelect={(date) => {
              setValue(name, date, {
                shouldValidate: true,
              });

              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      {description && (
        <FieldDescription>
          {description}
        </FieldDescription>
      )}

      {error && (
        <FieldError>{error}</FieldError>
      )}
    </Field>
  );
}
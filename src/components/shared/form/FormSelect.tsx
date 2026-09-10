import { useFormContext, Controller, get } from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectOption {
  label: string;
  value: string;
}

interface FormSelectProps {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  options: SelectOption[];
  disabled?: boolean;
}

export function FormSelect({
  name,
  label,
  placeholder = "Select an option",
  description,
  options,
  disabled = false,
}: FormSelectProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  // 🔥 FIX: nested + array safe error
  const error = get(errors, name)?.message as string | undefined;

  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>

      <FieldContent>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Select
              value={field.value || ""}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger
                id={name}
                ref={field.ref}
                className="bg-white h-12! w-full"
              >
                <SelectValue>
                  {options.find((option) => option.value === field.value)
                    ?.label || placeholder}
                </SelectValue>
              </SelectTrigger>

              <SelectContent>
                {options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="p-2"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FieldContent>

      {description && <FieldDescription>{description}</FieldDescription>}

      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

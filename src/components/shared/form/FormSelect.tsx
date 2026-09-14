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
  required?: boolean;
}

const EMPTY_FORM_VALUE = "__EMPTY__";

export function FormSelect({
  name,
  label,
  placeholder = "Select an option",
  description,
  options = [],
  disabled = false,
}: FormSelectProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  // 🔥 FIX: nested + array safe error
  const error = get(errors, name)?.message as string | undefined;

  // Radix UI invariant: <SelectItem /> cannot have value=""
  const safeOptions = (options || []).map((opt) => ({
    ...opt,
    value: !opt.value || opt.value === "" ? EMPTY_FORM_VALUE : opt.value,
  }));

  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>

      <FieldContent>
        <Controller
          name={name}
          control={control}
          render={({ field }) => {
            const hasEmptyOption = safeOptions.some(
              (o) => o.value === EMPTY_FORM_VALUE
            );
            const selectValue =
              !field.value || field.value === ""
                ? hasEmptyOption
                  ? EMPTY_FORM_VALUE
                  : undefined
                : field.value;

            return (
              <Select
                value={selectValue}
                onValueChange={(val) => {
                  if (val === EMPTY_FORM_VALUE) {
                    field.onChange("");
                  } else {
                    field.onChange(val);
                  }
                }}
                disabled={disabled}
              >
                <SelectTrigger
                  id={name}
                  ref={field.ref}
                  className="bg-white dark:bg-card h-12! w-full"
                >
                  <SelectValue>
                    {safeOptions.find((option) => option.value === selectValue)
                      ?.label || placeholder}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  {safeOptions.map((option) => (
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
            );
          }}
        />
      </FieldContent>

      {description && <FieldDescription>{description}</FieldDescription>}

      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

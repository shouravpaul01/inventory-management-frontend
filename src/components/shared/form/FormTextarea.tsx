import { useFormContext, get } from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

interface FormTextareaProps {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  rows?: number;
  disabled?: boolean;
}

export function FormTextarea({
  name,
  label,
  placeholder,
  description,
  rows = 4,
  disabled = false,
}: FormTextareaProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  // 🔥 FIX: nested error support
  const error = get(errors, name)?.message as string | undefined;

  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>

      <FieldContent>
        <Textarea
          id={name}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          {...register(name)}
          className="bg-white"
        />
      </FieldContent>

      {description && (
        <FieldDescription>{description}</FieldDescription>
      )}

      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
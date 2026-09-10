"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  label: string;
  value: string;
  description?: string;
}

interface FilterSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: Option[];
  includeAllOption?: boolean;
}

export default function FilterSelect({
  value,
  onChange,
  placeholder = "Select",
  options,
  includeAllOption = false,
}: FilterSelectProps) {
  const finalOptions = includeAllOption
    ? [{ label: "All", value: "all" }, ...options]
    : options;

  const selectedOption = finalOptions.find((opt) => opt.value === value);

  return (
    <Select
      value={value || undefined}
      onValueChange={(val) => {
        if (val === "all") {
          onChange("");
        } else {
          onChange(val as string);
        }
      }}
    >
      <SelectTrigger className="h-11! bg-white w-full">
        <SelectValue placeholder={placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {finalOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex flex-col">
              <span className="font-medium">{option.label}</span>
              {option.description && (
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
}

interface FilterSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: FilterOption[];
  includeAllOption?: boolean;
  allLabel?: string;
  className?: string;
  disabled?: boolean;
}

const ALL_FILTER_VALUE = "__ALL__";

export default function FilterSelect({
  value,
  onChange,
  placeholder = "Select",
  options,
  includeAllOption = false,
  allLabel,
  className,
  disabled = false,
}: FilterSelectProps) {
  const finalOptions: FilterOption[] = React.useMemo(() => {
    if (!includeAllOption) return options;
    const defaultAllLabel =
      allLabel ||
      (placeholder !== "Select" ? `All ${placeholder}s` : "All");
    return [{ label: defaultAllLabel, value: ALL_FILTER_VALUE }, ...options];
  }, [options, includeAllOption, allLabel, placeholder]);

  // If value is empty or undefined and includeAllOption is true, select the "All" item
  const selectedValue = React.useMemo(() => {
    if ((!value || value === "") && includeAllOption) {
      return ALL_FILTER_VALUE;
    }
    return value || undefined;
  }, [value, includeAllOption]);

  const selectedOption = finalOptions.find((opt) => opt.value === selectedValue);

  return (
    <Select
      value={selectedValue}
      onValueChange={(val) => {
        if (val === ALL_FILTER_VALUE) {
          onChange("");
        } else {
          onChange(val);
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          "h-11! bg-card hover:bg-accent/40 border-border/80 text-xs w-full shadow-2xs transition-colors rounded-lg font-normal text-foreground",
          className
        )}
      >
        <SelectValue placeholder={placeholder}>
          {selectedOption ? (
            <span className="flex items-center gap-1.5 truncate">
              {selectedOption.icon}
              <span>{selectedOption.label}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>

      <SelectContent className="max-h-72">
        {finalOptions.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs">
            <div className="flex items-center gap-2">
              {option.icon}
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{option.label}</span>
                {option.description && (
                  <span className="text-[10px] text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

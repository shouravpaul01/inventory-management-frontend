"use client";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
  disabled = false,
}: SearchInputProps) {
  return (
    <InputGroup className={cn("h-11 bg-card border-border/80 shadow-2xs rounded-lg transition-colors", className)}>
      {/* ICON */}
      <InputGroupAddon className="text-muted-foreground pl-3">
        <Search className="w-4 h-4" />
      </InputGroupAddon>

      {/* INPUT */}
      <InputGroupInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="text-xs text-foreground placeholder:text-muted-foreground"
      />

      {/* CLEAR BUTTON */}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="pr-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </InputGroup>
  );
}
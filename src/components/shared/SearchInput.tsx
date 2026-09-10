"use client";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Search } from "lucide-react";
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
    <InputGroup className={cn("h-11 bg-white", className)}>

      {/* ICON */}
      <InputGroupAddon className="text-muted-foreground">
        <Search className="w-4 h-4" />
      </InputGroupAddon>

      {/* INPUT */}
      <InputGroupInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="text-sm"
      />

    </InputGroup>
  );
}
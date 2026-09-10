"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value?: string | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export function ImageUploader({
  value,
  onChange,
  onRemove,
  label = "Upload Image",
  description = "PNG, JPG, WEBP up to 5MB",
  className,
  disabled = false,
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size must be less than 5MB.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    onChange(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onChange(null);
    if (onRemove) onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-xs font-semibold text-foreground">{label}</label>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {previewUrl ? (
        <div className="relative group rounded-xl border bg-muted/30 overflow-hidden aspect-video max-h-56 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-contain"
          />

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs h-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              className="size-8"
              onClick={handleClear}
              disabled={disabled}
              title="Remove image"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors bg-muted/20 text-center hover:bg-muted/40",
            isDragOver && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
        >
          <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-2">
            <UploadCloud className="size-5" />
          </div>
          <span className="text-xs font-semibold text-foreground">
            Click to upload or drag & drop
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            {description}
          </span>
        </div>
      )}
    </div>
  );
}

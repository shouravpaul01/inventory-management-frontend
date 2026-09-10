"use client";

import { useFormContext, Controller } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { UploadCloud, X } from "lucide-react";
import clsx from "clsx";
import { useRef } from "react";

interface FileUploadProps {
  name: string;
  label: string;
  description?: string;

  disabled?: boolean;
  multiple?: boolean;

  mode?: "image" | "video" | "all";
  maxSizeMB?: number;

  height?: string;
  className?: string;
}

export function FormFileUpload({
  name,
  label,
  description,
  disabled = false,
  multiple = false,
  mode = "image",
  maxSizeMB = 10,
  height = "h-44",
  className,
}: FileUploadProps) {
  const {
    control,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext();

  const inputRef = useRef<HTMLInputElement | null>(null);

  const error = errors[name]?.message as string | undefined;

  // 🔥 ACCEPT TYPE
  const getAccept = () => {
    if (mode === "image") return "image/*";
    if (mode === "video") return "video/*";

    return "image/*,video/*";
  };

  // 🔥 FILE TYPE VALIDATION
  const isValidType = (file: File) => {
    if (mode === "image") {
      return file.type.startsWith("image/");
    }

    if (mode === "video") {
      return file.type.startsWith("video/");
    }

    return (
      file.type.startsWith("image/") ||
      file.type.startsWith("video/")
    );
  };

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>

      <Controller
        name={name}
        control={control}
        defaultValue={multiple ? [] : null}
        render={({ field }) => {
          // ✅ SUPPORT BOTH FILE + URL STRING
          const files: any[] = multiple
            ? field.value || []
            : field.value
            ? [field.value]
            : [];

          // 🔥 HANDLE FILES
          const handleFiles = (selectedFiles: File[]) => {
            const validFiles: File[] = [];

            selectedFiles.forEach((file) => {
              // type validation
              if (!isValidType(file)) {
                setError(name, {
                  type: "manual",
                  message: "Invalid file type",
                });

                return;
              }

              // size validation
              if (file.size > maxSizeMB * 1024 * 1024) {
                setError(name, {
                  type: "manual",
                  message: `File must be less than ${maxSizeMB}MB`,
                });

                return;
              }

              validFiles.push(file);
            });

            if (validFiles.length > 0) {
              clearErrors(name);

              if (multiple) {
                field.onChange([
                  ...(files || []),
                  ...validFiles,
                ]);
              } else {
                field.onChange(validFiles[0]);
              }
            }
          };

          return (
            <>
              {/* INPUT */}
              <input
                ref={inputRef}
                type="file"
                accept={getAccept()}
                multiple={multiple}
                className="hidden"
                disabled={disabled}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.files || []
                  );

                  handleFiles(selected);
                }}
              />

              {/* DROP ZONE */}
              <div
                onClick={() =>
                  !disabled && inputRef.current?.click()
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();

                  const dropped = Array.from(
                    e.dataTransfer.files || []
                  );

                  handleFiles(dropped);
                }}
                className={clsx(
                  "flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl cursor-pointer transition bg-white",
                  "hover:border-primary hover:bg-muted/30",
                  height,
                  className,
                  error && "border-red-500",
                  disabled &&
                    "opacity-50 cursor-not-allowed"
                )}
              >
                <UploadCloud className="w-7 h-7 text-muted-foreground" />

                <p className="text-sm text-muted-foreground">
                  Click or Drag to Upload
                </p>

                <p className="text-xs text-muted-foreground">
                  {mode === "image" && "Images only"}
                  {mode === "video" && "Videos only"}
                  {mode === "all" &&
                    "Images & Videos"}
                </p>
              </div>

              {/* PREVIEW */}
              {files.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {files.map((file, index) => {
                    // ✅ support File + URL string
                    const isFile = file instanceof File;

                    const url = isFile
                      ? URL.createObjectURL(file)
                      : file;

                    const isImage = isFile
                      ? file.type.startsWith("image/")
                      : typeof file === "string";

                    const isVideo = isFile
                      ? file.type.startsWith("video/")
                      : false;

                    return (
                      <div
                        key={index}
                        className="relative bg-muted rounded-lg p-2"
                      >
                        {/* IMAGE */}
                        {isImage && (
                          <img
                            src={url}
                            alt="preview"
                            className="w-full h-32 object-cover rounded-md"
                          />
                        )}

                        {/* VIDEO */}
                        {isVideo && (
                          <video
                            src={url}
                            controls
                            className="w-full h-32 object-cover rounded-md"
                          />
                        )}

                        {/* REMOVE */}
                        <X
                          className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full p-1 cursor-pointer"
                          onClick={() => {
                            const updated =
                              files.filter(
                                (_, i) => i !== index
                              );

                            field.onChange(
                              multiple ? updated : null
                            );
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        }}
      />

      {description && (
        <FieldDescription>
          {description}
        </FieldDescription>
      )}

      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
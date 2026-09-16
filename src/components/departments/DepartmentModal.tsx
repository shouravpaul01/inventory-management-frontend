"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/shared/form/FormInput";
import { FormTextarea } from "@/components/shared/form/FormTextarea";
import {
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
} from "@/redux/api/departmentApi";
import {
  departmentFormSchema,
  TDepartmentFormInput,
} from "@/validation/department.validation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { TDepartment } from "@/type";
import { handleMutationResult } from "@/lib/notifyMutation";

interface DepartmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: TDepartment | null;
}

export default function DepartmentModal({
  open,
  onOpenChange,
  department,
}: DepartmentModalProps) {
  const isEdit = Boolean(department);

  const [createDepartment, { isLoading: isCreating }] =
    useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdating }] =
    useUpdateDepartmentMutation();
  const isLoading = isCreating || isUpdating;

  const methods = useForm<TDepartmentFormInput>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });

  const { reset } = methods;

  useEffect(() => {
    if (!open) return;

    if (department) {
      reset({
        name: department.name,
        code: department.code,
        description: department.description || "",
      });
    } else {
      reset({
        name: "",
        code: "",
        description: "",
      });
    }
  }, [department?.id, open, reset]);

  const onSubmit = async (data: TDepartmentFormInput) => {
    try {
      if (isEdit && department) {
        const res = await updateDepartment({
          id: department.id,
          body: {
            name: data.name.trim(),
            description: data.description?.trim(),
          },
        }).unwrap();
        handleMutationResult(res, "Department updated successfully 🎉");
      } else {
        const res = await createDepartment({
          name: data.name.trim(),
          code: data.code.trim().toUpperCase(),
          description: data.description?.trim(),
        }).unwrap();
        handleMutationResult(res, "Department created successfully 🎉");
      }
      onOpenChange(false);
      methods.reset();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save department");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <DialogTitle>
            {isEdit ? "Edit Department" : "Add New Department"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of the academic or administrative department."
              : "Register a new department in the university inventory directory."}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <FormInput
                name="name"
                label="Department Name"
                placeholder="e.g. Computer Science & Engineering"
                disabled={isLoading}
                required
              />

              <FormInput
                name="code"
                label="Department Code"
                placeholder="e.g. CSE"
                disabled={isLoading || isEdit}
                required
              />

              <FormTextarea
                name="description"
                label="Description (Optional)"
                placeholder="Brief details about the department or responsibilities"
                disabled={isLoading}
                rows={3}
              />
            </div>

            <DialogFooter className="p-4 border-t bg-card shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  "Save Changes"
                ) : (
                  "Create Department"
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

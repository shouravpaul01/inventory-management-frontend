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

  useEffect(() => {
    if (department) {
      methods.reset({
        name: department.name,
        code: department.code,
        description: department.description || "",
      });
    } else {
      methods.reset({
        name: "",
        code: "",
        description: "",
      });
    }
  }, [department, open, methods]);

  const onSubmit = async (data: TDepartmentFormInput) => {
    try {
      if (isEdit && department) {
        await updateDepartment({
          id: department.id,
          body: {
            name: data.name.trim(),
            description: data.description?.trim(),
          },
        }).unwrap();
        toast.success("Department updated successfully 🎉");
      } else {
        await createDepartment({
          name: data.name.trim(),
          code: data.code.trim().toUpperCase(),
          description: data.description?.trim(),
        }).unwrap();
        toast.success("Department created successfully 🎉");
      }
      onOpenChange(false);
      methods.reset();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save department");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
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
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
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

            <DialogFooter className="pt-2">
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

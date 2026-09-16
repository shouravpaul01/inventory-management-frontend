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
import { FormSelect } from "@/components/shared/form/FormSelect";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useGetCategoriesQuery,
} from "@/redux/api/categoryApi";
import {
  categoryFormSchema,
  TCategoryFormInput,
} from "@/validation/category.validation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { TCategory } from "@/type";
import { handleMutationResult } from "@/lib/notifyMutation";

interface CategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: TCategory | null;
}

export default function CategoryModal({
  open,
  onOpenChange,
  category,
}: CategoryModalProps) {
  const isEdit = Boolean(category);

  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();
  const isLoading = isCreating || isUpdating;

  const { data: categoriesData } = useGetCategoriesQuery({ limit: 100 });
  const parentOptions = (categoriesData?.data || [])
    .filter((cat) => !category || cat.id !== category.id)
    .map((cat) => ({
      value: cat.id,
      label: `${cat.name} (${cat.code})`,
    }));

  const methods = useForm<TCategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      parentId: "",
    },
  });

  const { reset } = methods;

  useEffect(() => {
    if (!open) return;

    if (category) {
      reset({
        name: category.name,
        code: category.code,
        description: category.description || "",
        parentId: category.parentId || "",
      });
    } else {
      reset({
        name: "",
        code: "",
        description: "",
        parentId: "",
      });
    }
  }, [category?.id, open, reset]);

  const onSubmit = async (data: TCategoryFormInput) => {
    try {
      if (isEdit && category) {
        const res = await updateCategory({
          id: category.id,
          body: {
            name: data.name.trim(),
            description: data.description?.trim(),
            parentId: data.parentId || null,
          },
        }).unwrap();
        handleMutationResult(res, "Category updated successfully 🎉");
      } else {
        const res = await createCategory({
          name: data.name.trim(),
          code: data.code.trim().toUpperCase(),
          description: data.description?.trim(),
          parentId: data.parentId || null,
        }).unwrap();
        handleMutationResult(res, "Category created successfully 🎉");
      }
      onOpenChange(false);
      methods.reset();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save category");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
          <DialogTitle >
            {isEdit ? "Edit Category" : "Create Inventory Category"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update category details or reorganize under a parent group."
              : "Group inventory items into hierarchical categories."}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <FormInput
                name="name"
                label="Category Name"
                placeholder="e.g. Computer Hardware, Lab Reagents"
                disabled={isLoading}
                required
              />

              <FormInput
                name="code"
                label="Category Code"
                placeholder="e.g. COMP_HW"
                disabled={isLoading || isEdit}
                required
              />

              <FormSelect
                name="parentId"
                label="Parent Category (Optional)"
                placeholder="Select parent (Leave empty for root)"
                options={[
                  { value: "", label: "None (Top Level Root Category)" },
                  ...parentOptions,
                ]}
                disabled={isLoading}
              />

              <FormTextarea
                name="description"
                label="Description (Optional)"
                placeholder="Classification notes or usage description"
                disabled={isLoading}
                rows={3}
              />
            </div>

            <DialogFooter className="p-4 border-t bg-card shrink-0 flex items-center justify-end gap-2">
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
                  "Create Category"
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

---
name: senior-frontend-developer
description: >
  Enforces senior-level frontend coding standards for this Next.js + shadcn/ui + Tailwind CSS project.
  Covers: component reuse (especially shared form components), Next.js 16 App Router best practices,
  shadcn/ui v4 + Tailwind CSS v4 patterns, Zod v4 validation, RTK Query API slices, and
  production-grade TypeScript conventions. Read this skill BEFORE writing any code.
---

# Senior Frontend Developer — Coding Standards

> **Purpose**: This skill eliminates repeated analysis. Follow these rules on EVERY code task — no exceptions.

---

## 1. Component Reuse — NEVER Duplicate

### 1.1 Shared Form Components (MANDATORY)

This project has **ready-to-use form components** in `src/components/shared/form/`. You MUST use them for ALL form fields.

| Component | File | Use For |
|-----------|------|---------|
| `FormInput` | `src/components/shared/form/FormInput.tsx` | Text, email, password, number inputs. Supports `startIcon`, `endIcon` with click handlers. |
| `FormSelect` | `src/components/shared/form/FormSelect.tsx` | Dropdown select. Takes `options: { label, value }[]`. |
| `FormTextarea` | `src/components/shared/form/FormTextarea.tsx` | Multi-line text input. |
| `FormCheckbox` | `src/components/shared/form/FormCheckbox.tsx` | Single boolean checkbox OR multi-checkbox with `options[]`. |
| `FormRadioGroup` | `src/components/shared/form/FormRadioGroup.tsx` | Radio button groups. Takes `options: { label, value }[]`. |
| `FormDatePicker` | `src/components/shared/form/FormDatePicker.tsx` | Date picker with popover calendar. |
| `FormFileUpload` | `src/components/shared/form/FormFileUpload.tsx` | File/image/video upload with drag-drop, preview, and remove. Supports `mode: "image" \| "video" \| "all"`. |

**Rules:**
- ❌ NEVER create a new form field component if one of these covers the use case.
- ❌ NEVER use raw `<input>`, `<select>`, `<textarea>` in forms — always use the shared wrappers.
- ✅ If a shared component is CLOSE but not exact, EXTEND the existing component with new props instead of creating a duplicate.
- ✅ Only create a NEW form component if the requirement is fundamentally different from ALL existing ones.

### 1.2 Shared UI Components (CHECK FIRST)

Before creating any new component, check if one already exists in `src/components/shared/`:

| Component | Use For |
|-----------|---------|
| `SectionHeader` | Page/section titles with optional badge, description, and right-slot. |
| `Pagination` | Table/list pagination with limit selector and page numbers. |
| `SearchInput` | Debounced search input. |
| `FilterSelect` | Filter dropdown for lists/tables. |
| `EmptyState` | Empty state placeholder. |
| `TableEmpty` | Empty state specifically for tables. |
| `TableLoading` | Loading skeleton for tables. |
| `DasboardSkeletonLoading` | Dashboard page skeleton loading. |
| `Logo` | App logo. |
| `Icon` | Custom SVG icon wrapper. |


**Rules:**
- ✅ ALWAYS search `src/components/shared/` and `src/components/ui/` FIRST.
- ❌ NEVER recreate a component that already exists.
- ✅ If a design requirement is UNIQUE and no existing component applies → create a new one, but place it in the correct directory (see Section 6).

### 1.3 shadcn/ui Components (CHECK `src/components/ui/`)

Already installed shadcn components:

```
avatar, breadcrumb, button, calendar, checkbox, collapsible,
dropdown-menu, field, input-group, input, label, pagination,
popover, select, separator, sheet, sidebar, skeleton, table,
textarea, tooltip
```

**Rules:**
- ✅ Check `src/components/ui/` before installing any new shadcn component.
- ✅ If a component is NOT installed but needed → install it first with `npx shadcn@latest add <component>`, then use it.
- ❌ NEVER manually create a component that shadcn already provides.
- ❌ NEVER modify files in `src/components/ui/` unless absolutely necessary (these are shadcn-managed).

---

## 2. Form Handling Pattern

### 2.1 Form Architecture

Every form in this project follows this exact pattern:

```tsx
"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { FieldGroup, FieldSet, FieldSeparator } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

// 1. Import the Zod schema
import { mySchema } from "@/validation/my.validation";

// 2. Infer type from schema
type FormValues = z.infer<typeof mySchema>;

export default function MyForm() {
  // 3. API mutation hook (if applicable)
  const [createItem, { isLoading }] = useCreateItemMutation();

  // 4. Setup form with zodResolver
  const methods = useForm<FormValues>({
    resolver: zodResolver(mySchema),
    defaultValues: {
      // Always provide ALL default values matching the schema
    },
  });

  // 5. Submit handler with proper error handling
  const onSubmit = async (data: FormValues) => {
    try {
      await createItem(data).unwrap();
      toast.success("Created successfully 🎉");
      methods.reset();
    } catch (error: any) {
      const apiError = error?.data;

      // Handle field-level validation errors from API
      if (apiError?.error) {
        Object.values(apiError.error).forEach((messages: any) => {
          if (Array.isArray(messages)) {
            messages.forEach((msg) => toast.error(msg));
          }
        });
        return;
      }

      toast.error(apiError?.message || "Something went wrong ❌");
    }
  };

  // 6. Render with FormProvider wrapper
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <FieldSet>
          <FieldGroup>
            {/* Use shared form components here */}
            <FormInput name="title" label="Title" placeholder="Enter title" />
            <FormSelect name="category" label="Category" options={[...]} />
          </FieldGroup>
          <FieldSeparator />
        </FieldSet>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </form>
    </FormProvider>
  );
}
```

### 2.2 Form Rules

- ✅ Always use `FormProvider` + `useFormContext` pattern (NOT `register` passed as props).
- ✅ Always use `zodResolver` for validation — never manual validation.
- ✅ Always provide `defaultValues` for every field.
- ✅ Always use `z.infer<typeof schema>` for form type.
- ✅ Always wrap form fields in `<FieldSet>` → `<FieldGroup>`.
- ✅ Use `toast` from `sonner` for success/error notifications.
- ✅ Handle API errors gracefully (field-level + fallback message).
- ✅ Disable submit button during loading with `isLoading` from mutation hook.

---

## 3. Next.js 16 — Best Practices

> ⚠️ **CRITICAL**: This project uses **Next.js 16.2.4** with **React 19.2.4**. Always read `node_modules/next/dist/docs/` before using any API. APIs may differ from your training data.

### 3.1 App Router Rules

- ✅ Use App Router (`src/app/`) — NO Pages Router.
- ✅ Server Components by default. Only add `"use client"` when you need:
  - `useState`, `useEffect`, `useRef` or any React hooks
  - Event handlers (`onClick`, `onChange`, etc.)
  - Browser APIs (`window`, `document`, etc.)
  - Third-party client libraries (form, redux, etc.)
- ✅ Keep Server Components as the outer shell, push `"use client"` to the smallest leaf component possible.
- ✅ Use `layout.tsx` for shared layouts, `page.tsx` for route pages, `loading.tsx` for suspense loading, `error.tsx` for error boundaries.
- ❌ NEVER use `"use client"` on `layout.tsx` or `page.tsx` unless absolutely unavoidable.
- ❌ NEVER import server-only code in client components.

### 3.2 Route Groups

This project uses route groups for layout separation:
```
src/app/
├── (auth)/           → Auth pages (login, register, etc.)
├── (dashboard-layout)/ → Dashboard pages with sidebar
├── (default-layout)/   → Public pages with navbar/footer
```

- ✅ Place new pages in the correct route group.
- ✅ Each group has its own `layout.tsx` — respect the layout hierarchy.

### 3.3 Data Fetching

- ✅ Use RTK Query for all API calls (see Section 5).
- ✅ For server-side data, use `async` Server Components with `fetch`.
- ❌ NEVER use `getServerSideProps` or `getStaticProps` (Pages Router APIs).

### 3.4 Navigation

- ✅ Use `next/link` for client-side navigation.
- ✅ Use `next/navigation` hooks: `useRouter`, `useSearchParams`, `usePathname`.
- ❌ NEVER use `next/router` (Pages Router).

### 3.5 Images & Fonts

- ✅ Use `next/image` for all images with proper `width`, `height`, and `alt`.
- ✅ Use `next/font/google` for fonts (already configured with `Inter`).

### 3.6 Metadata

- ✅ Export `metadata` from Server Component `page.tsx` or `layout.tsx` for SEO.
- ❌ NEVER use `<Head>` component (Pages Router).

---

## 4. shadcn/ui v4 + Tailwind CSS v4

### 4.1 shadcn/ui Configuration

```json
{
  "style": "radix-nova",
  "rsc": true,
  "tsx": true,
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "utils": "@/lib/utils",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 4.2 shadcn Component Installation

When a new shadcn component is needed:

```bash
# ✅ Correct — install first, then use
npx shadcn@latest add dialog
npx shadcn@latest add toast
npx shadcn@latest add tabs

# ❌ NEVER manually create component files that shadcn provides
```

**Install BEFORE import** — if you reference a shadcn component that isn't installed, the build will fail.

### 4.3 Tailwind CSS v4 Rules

This project uses **Tailwind CSS v4** with `@tailwindcss/postcss`.

- ✅ Use Tailwind utility classes for styling.
- ✅ Use `cn()` from `@/lib/utils` (which uses `clsx` + `tailwind-merge`) for conditional classes.
- ✅ Use CSS variables defined in `globals.css` for theming (e.g., `bg-primary`, `text-muted-foreground`).
- ✅ Use responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`.
- ❌ NEVER write inline `style={{}}` unless absolutely necessary (e.g., dynamic values).
- ❌ NEVER mix Tailwind with custom CSS files per component — use utilities or `cn()`.

### 4.4 When shadcn Doesn't Fit

If a design requirement cannot be met by shadcn components:

1. ✅ First try to **compose** multiple shadcn primitives together.
2. ✅ If that doesn't work, build a custom component using Tailwind + Radix primitives.
3. ✅ Style with Tailwind utilities, following the project's existing design tokens.
4. ❌ NEVER install a random third-party UI library without asking the user.

### 4.5 Icons

- ✅ Use `lucide-react` for all icons (project standard).
- ✅ Import individual icons: `import { Mail, Lock } from "lucide-react"`.
- ✅ For custom SVGs, use the `Icon` component in `src/components/shared/Icon.tsx`.

---

## 5. RTK Query — API Layer

### 5.1 Base API Setup

The project uses RTK Query with `baseApi` (`src/redux/api/baseApi.ts`):

- Base URL from `NEXT_PUBLIC_BASE_URL`
- Auto auth header injection via `prepareHeaders`
- Auto 401 refresh token flow
- Tag-based cache invalidation

### 5.2 Creating New API Slices

```tsx
// src/redux/api/productApi.ts
import { baseApi } from "@/redux/api/baseApi";

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => ({
        url: "/products",
        params,
      }),
      providesTags: ["Product"],
    }),

    createProduct: builder.mutation({
      query: (data) => ({
        url: "/products",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),
  }),
});

export const { useGetProductsQuery, useCreateProductMutation } = productApi;
```

**Rules:**
- ✅ Always use `baseApi.injectEndpoints()` — NEVER create a new `createApi()`.
- ✅ Always add new tag types to `baseApi.ts` → `tagTypes` array.
- ✅ Always use `providesTags` for queries and `invalidatesTags` for mutations.
- ✅ Use `.unwrap()` when calling mutations in components for proper error handling.
- ✅ Export generated hooks using the naming convention: `use[Name]Query`, `use[Name]Mutation`.
- ✅ Place API files in `src/redux/api/`.

### 5.3 Redux State Slices

For client-side state (not API data):

- ✅ Place in `src/redux/features/`.
- ✅ Use `createSlice` from `@reduxjs/toolkit`.
- ✅ Use typed hooks: `useAppDispatch`, `useAppSelector` from `src/redux/hooks.ts`.

---

## 6. Zod v4 — Validation

> This project uses **Zod v4** (`zod@^4.3.6`). Follow Zod v4 API.

### 6.1 Schema File Naming

```
src/validation/
├── auth.validation.ts      → Auth-related schemas
├── product.validation.ts   → Product schemas
├── user.validation.ts      → User schemas
└── [feature].validation.ts → Feature-specific schemas
```

### 6.2 Schema Patterns

```tsx
import z from "zod";

// ✅ Basic schema
export const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  price: z.number().positive("Price must be positive"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
});

// ✅ With refinement
export const passwordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string().nonempty("Confirm password is required"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

// ✅ Type inference
export type ProductFormValues = z.infer<typeof productSchema>;
```

### 6.3 Validation Rules

- ✅ Define ALL schemas in `src/validation/[feature].validation.ts`.
- ✅ Use `z.infer<typeof schema>` for TypeScript types — NEVER manually duplicate types.
- ✅ Provide meaningful error messages for every validation rule.
- ✅ Use `.refine()` for cross-field validations (e.g., password confirmation).
- ✅ Use `.optional()` for optional fields, `.nonempty()` for required strings.
- ❌ NEVER do manual validation in components — always use Zod schemas.
- ❌ NEVER use `any` type for form data — always infer from schema.

---

## 7. Project Structure & Naming

### 7.1 Directory Structure

```
src/
├── app/                          → Next.js App Router (pages, layouts)
│   ├── (auth)/                   → Auth route group
│   ├── (dashboard-layout)/       → Dashboard route group
│   ├── (default-layout)/         → Public route group
│   ├── globals.css               → Global styles + Tailwind + CSS variables
│   └── layout.tsx                → Root layout
├── components/
│   ├── ui/                       → shadcn/ui components (DON'T modify)
│   ├── shared/                   → Reusable shared components
│   │   ├── form/                 → Shared form field components
│   │   └── navbar/               → Navigation components
│   ├── auth/                     → Auth-specific components
│   └── [feature]/                → Feature-specific components
├── constant/                     → Static data, nav links, enums
├── hooks/                        → Custom React hooks
├── lib/                          → Utility functions (cn, helpers)
├── redux/
│   ├── api/                      → RTK Query API slices
│   │   ├── baseApi.ts            → Base API configuration
│   │   └── [feature]Api.ts       → Feature API endpoints
│   ├── features/                 → Redux state slices
│   ├── hooks.ts                  → Typed useAppDispatch, useAppSelector
│   └── store.ts                  → Store configuration
├── type/                         → Shared TypeScript types/interfaces
└── validation/                   → Zod validation schemas
```

### 7.2 File Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Pages | `page.tsx` (App Router) | `src/app/(dashboard-layout)/products/page.tsx` |
| Layouts | `layout.tsx` | `src/app/(dashboard-layout)/layout.tsx` |
| Components | PascalCase | `ProductForm.tsx`, `UserCard.tsx` |
| Hooks | camelCase with `use` prefix | `useDebounce.ts`, `usePagination.ts` |
| API Slices | camelCase with `Api` suffix | `productApi.ts`, `orderApi.ts` |
| Validation | snake_case with `.validation.ts` | `product.validation.ts` |
| Types | PascalCase with `T` prefix | `TProduct`, `TUser` |
| Constants | camelCase or UPPER_CASE | `navLinks`, `API_ROUTES` |

### 7.3 Import Alias

Always use the `@/` alias:
```tsx
// ✅ Correct
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/shared/form/FormInput";

// ❌ Wrong
import { Button } from "../../components/ui/button";
```

---

## 8. Production-Grade Code Standards

### 8.1 TypeScript

- ✅ Use strict TypeScript — NEVER use `any` (use `unknown` if type is truly unknown).
- ✅ Define interfaces/types for ALL props, API responses, and function parameters.
- ✅ Use `type` for object shapes, `interface` for component props that may be extended.
- ✅ Export types from `src/type/index.ts` or feature-specific type files.
- ✅ Use generic types where appropriate (`T[]` instead of `Array<T>`).

### 8.2 Component Design

- ✅ Single Responsibility — one component does one thing well.
- ✅ Keep components under 200 lines. If larger, break into sub-components.
- ✅ Props interface at the top of the file, right after imports.
- ✅ Named exports for reusable components, default exports for page-level components.
- ✅ Memoize expensive computations with `useMemo`, callbacks with `useCallback`.
- ❌ NEVER use `useEffect` for things that can be derived from state/props.
- ❌ NEVER store derived data in state — compute it during render.

### 8.3 Error Handling

- ✅ Always handle loading, error, and empty states.
- ✅ Use `try/catch` with specific error types in async operations.
- ✅ Show user-friendly error messages via `toast` from `sonner`.
- ✅ Log errors to console in development only.

### 8.4 Performance

- ✅ Use `loading.tsx` for route-level suspense.
- ✅ Lazy load heavy components with `dynamic()` from `next/dynamic`.
- ✅ Use `next/image` with proper sizing to avoid layout shift.
- ✅ Avoid unnecessary re-renders — profile with React DevTools if needed.

### 8.5 Accessibility

- ✅ Use semantic HTML (`<main>`, `<nav>`, `<section>`, `<article>`).
- ✅ All interactive elements must be keyboard accessible.
- ✅ All images must have descriptive `alt` text.
- ✅ Use `aria-label` for icon-only buttons.

---

## 9. Pre-Flight Checklist (Before Writing ANY Code)

Run through this mental checklist BEFORE writing code:

```
□ Does a shared component already exist for this? → REUSE IT
□ Does a shadcn/ui component cover this? → USE IT (install if needed)
□ Is the Zod schema defined? → DEFINE IT FIRST in validation/
□ Is the API endpoint defined? → CREATE the RTK Query slice FIRST
□ Am I in the right route group? → (auth) / (dashboard-layout) / (default-layout)
□ Is this a Server or Client Component? → Default to Server, add "use client" only if needed
□ Am I using TypeScript types? → NO `any` — EVER
□ Am I importing with @/ alias? → YES, always
```

---

## 10. Quick Reference — Import Cheatsheet

```tsx
// === Form Components ===
import { FormInput } from "@/components/shared/form/FormInput";
import { FormSelect } from "@/components/shared/form/FormSelect";
import { FormTextarea } from "@/components/shared/form/FormTextarea";
import { FormCheckbox } from "@/components/shared/form/FormCheckbox";
import { FormRadioGroup } from "@/components/shared/form/FormRadioGroup";
import { FormDatePicker } from "@/components/shared/form/FormDatePicker";
import { FormFileUpload } from "@/components/shared/form/FormFileUpload";

// === Form Setup ===
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// === UI Primitives ===
import { Button } from "@/components/ui/button";
import { FieldSet, FieldGroup, FieldSeparator } from "@/components/ui/field";

// === Shared Components ===
import SectionHeader from "@/components/shared/SectionHeader";
import Pagination from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";

// === Redux ===
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

// === Navigation ===
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// === Notifications ===
import { toast } from "sonner";

// === Icons ===
import { Mail, Lock, Eye, EyeOff, Plus, Trash2 } from "lucide-react";

// === Utilities ===
import { cn } from "@/lib/utils";
```

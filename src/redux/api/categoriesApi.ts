import { baseApi } from "@/redux/api/baseApi";
import { ApiResponse, ICategory } from "@/types";

export interface CreateCategoryPayload {
  name: string;
  code: string;
  description?: string;
  parentId?: string | null;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  parentId?: string | null;
}

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllCategories: builder.query<ApiResponse<ICategory[]>, Record<string, any> | void>({
      query: (params) => ({
        url: "/categories",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Category"],
    }),

    getCategoryTree: builder.query<ApiResponse<ICategory[]>, void>({
      query: () => ({
        url: "/categories/tree",
        method: "GET",
      }),
      providesTags: ["Category"],
    }),

    getCategoryById: builder.query<ApiResponse<ICategory>, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "GET",
      }),
      providesTags: ["Category"],
    }),

    createCategory: builder.mutation<ApiResponse<ICategory>, CreateCategoryPayload>({
      query: (body) => ({
        url: "/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Category"],
    }),

    updateCategory: builder.mutation<ApiResponse<ICategory>, { id: string; body: UpdateCategoryPayload }>({
      query: ({ id, body }) => ({
        url: `/categories/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Category", "InventoryItem"],
    }),

    deleteCategory: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category", "InventoryItem"],
    }),
  }),
});

export const {
  useGetAllCategoriesQuery,
  useGetCategoryTreeQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;

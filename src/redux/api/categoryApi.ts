import { baseApi } from "@/redux/api/baseApi";
import { TApiResponse, TCategory } from "@/type";

export type TCategoryQueryParams = {
  searchTerm?: string;
  parentId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<
      TApiResponse<TCategory[]>,
      TCategoryQueryParams | void
    >({
      query: (params) => ({
        url: "/categories",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Category"],
    }),

    getCategoryTree: builder.query<TApiResponse<TCategory[]>, void>({
      query: () => ({
        url: "/categories/tree",
        method: "GET",
      }),
      providesTags: ["Category"],
    }),

    getCategoryById: builder.query<TApiResponse<TCategory>, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "GET",
      }),
      providesTags: ["Category"],
    }),

    createCategory: builder.mutation<
      TApiResponse<TCategory>,
      { name: string; code: string; description?: string; parentId?: string | null }
    >({
      query: (body) => ({
        url: "/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Category"],
    }),

    updateCategory: builder.mutation<
      TApiResponse<TCategory>,
      {
        id: string;
        body: { name?: string; description?: string; parentId?: string | null };
      }
    >({
      query: ({ id, body }) => ({
        url: `/categories/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Category"],
    }),

    deleteCategory: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryTreeQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;

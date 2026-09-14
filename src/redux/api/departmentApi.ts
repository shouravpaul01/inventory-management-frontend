import { baseApi } from "@/redux/api/baseApi";
import { TApiResponse, TDepartment, TMeta } from "@/type";

export type TDepartmentQueryParams = {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const departmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<
      TApiResponse<TDepartment[]>,
      TDepartmentQueryParams | void
    >({
      query: (params) => ({
        url: "/departments",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Department"],
    }),

    getDepartmentById: builder.query<TApiResponse<TDepartment>, string>({
      query: (id) => ({
        url: `/departments/${id}`,
        method: "GET",
      }),
      providesTags: ["Department"],
    }),

    createDepartment: builder.mutation<
      TApiResponse<TDepartment>,
      { name: string; code: string; description?: string }
    >({
      query: (body) => ({
        url: "/departments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Department"],
    }),

    updateDepartment: builder.mutation<
      TApiResponse<TDepartment>,
      { id: string; body: { name?: string; description?: string } }
    >({
      query: ({ id, body }) => ({
        url: `/departments/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Department"],
    }),

    deleteDepartment: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({
        url: `/departments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Department"],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentApi;

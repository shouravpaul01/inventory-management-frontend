import { baseApi } from "@/redux/api/baseApi";
import { ApiResponse, IDepartment } from "@/types";

export interface CreateDepartmentPayload {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
  description?: string;
}

export const departmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllDepartments: builder.query<ApiResponse<IDepartment[]>, Record<string, any> | void>({
      query: (params) => ({
        url: "/departments",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Department"],
    }),

    getDepartmentById: builder.query<ApiResponse<IDepartment>, string>({
      query: (id) => ({
        url: `/departments/${id}`,
        method: "GET",
      }),
      providesTags: ["Department"],
    }),

    createDepartment: builder.mutation<ApiResponse<IDepartment>, CreateDepartmentPayload>({
      query: (body) => ({
        url: "/departments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Department"],
    }),

    updateDepartment: builder.mutation<ApiResponse<IDepartment>, { id: string; body: UpdateDepartmentPayload }>({
      query: ({ id, body }) => ({
        url: `/departments/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Department"],
    }),

    deleteDepartment: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/departments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Department"],
    }),
  }),
});

export const {
  useGetAllDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentsApi;

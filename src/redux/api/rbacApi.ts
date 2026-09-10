import { baseApi } from "@/redux/api/baseApi";
import { ApiResponse, IPermission, IRole } from "@/types";

export interface CreateRolePayload {
  name: string;
  code: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
}

export const rbacApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllPermissions: builder.query<ApiResponse<IPermission[]>, Record<string, any> | void>({
      query: (params) => ({
        url: "/rbac/permissions",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Permission"],
    }),

    getAllRoles: builder.query<ApiResponse<IRole[]>, Record<string, any> | void>({
      query: (params) => ({
        url: "/rbac/roles",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Role"],
    }),

    getRoleById: builder.query<ApiResponse<IRole>, string>({
      query: (id) => ({
        url: `/rbac/roles/${id}`,
        method: "GET",
      }),
      providesTags: ["Role"],
    }),

    createRole: builder.mutation<ApiResponse<IRole>, CreateRolePayload>({
      query: (body) => ({
        url: "/rbac/roles",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Role"],
    }),

    updateRole: builder.mutation<ApiResponse<IRole>, { id: string; body: UpdateRolePayload }>({
      query: ({ id, body }) => ({
        url: `/rbac/roles/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Role"],
    }),

    deleteRole: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/rbac/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Role"],
    }),

    assignRolePermissions: builder.mutation<ApiResponse<IRole>, { id: string; permissionIds: string[] }>({
      query: ({ id, permissionIds }) => ({
        url: `/rbac/roles/${id}/permissions`,
        method: "POST",
        body: { permissionIds },
      }),
      invalidatesTags: ["Role", "User"],
    }),
  }),
});

export const {
  useGetAllPermissionsQuery,
  useGetAllRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useAssignRolePermissionsMutation,
} = rbacApi;

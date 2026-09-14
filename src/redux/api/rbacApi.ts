import { baseApi } from "@/redux/api/baseApi";
import { TApiResponse, TPermission, TRole } from "@/type";

export type TPermissionQueryParams = {
  searchTerm?: string;
  module?: string;
  code?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type TRoleQueryParams = {
  searchTerm?: string;
  code?: string;
  isSystemRole?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const rbacApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPermissions: builder.query<
      TApiResponse<TPermission[]>,
      TPermissionQueryParams | void
    >({
      query: (params) => ({
        url: "/rbac/permissions",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Permission"],
    }),

    getRoles: builder.query<
      TApiResponse<TRole[]>,
      TRoleQueryParams | void
    >({
      query: (params) => ({
        url: "/rbac/roles",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Role"],
    }),

    getRoleById: builder.query<TApiResponse<TRole>, string>({
      query: (id) => ({
        url: `/rbac/roles/${id}`,
        method: "GET",
      }),
      providesTags: ["Role"],
    }),

    createRole: builder.mutation<
      TApiResponse<TRole>,
      {
        name: string;
        code: string;
        description?: string;
        permissionIds?: string[];
      }
    >({
      query: (body) => ({
        url: "/rbac/roles",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Role", "Permission"],
    }),

    updateRole: builder.mutation<
      TApiResponse<TRole>,
      { id: string; body: { name?: string; description?: string } }
    >({
      query: ({ id, body }) => ({
        url: `/rbac/roles/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Role"],
    }),

    assignRolePermissions: builder.mutation<
      TApiResponse<TRole>,
      { id: string; permissionIds: string[] }
    >({
      query: ({ id, permissionIds }) => ({
        url: `/rbac/roles/${id}/permissions`,
        method: "POST",
        body: { permissionIds },
      }),
      invalidatesTags: ["Role", "Permission"],
    }),

    deleteRole: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({
        url: `/rbac/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Role"],
    }),
  }),
});

export const {
  useGetPermissionsQuery,
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useAssignRolePermissionsMutation,
  useDeleteRoleMutation,
} = rbacApi;

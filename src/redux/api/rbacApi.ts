import { baseApi } from "@/redux/api/baseApi";
import { TApiResponse, TPermission, TRole } from "@/type";

export const rbacApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPermissions: builder.query<TApiResponse<TPermission[]>, void>({
      query: () => ({
        url: "/rbac/permissions",
        method: "GET",
      }),
      providesTags: ["Permission"],
    }),

    getRoles: builder.query<TApiResponse<TRole[]>, void>({
      query: () => ({
        url: "/rbac/roles",
        method: "GET",
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

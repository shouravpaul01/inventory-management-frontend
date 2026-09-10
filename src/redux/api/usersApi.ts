import { baseApi } from "@/redux/api/baseApi";
import { ApiResponse, IUser, UserStatus } from "@/types";

export interface CreateUserPayload {
  employeeId: string;
  username: string;
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  departmentId: string;
  password: string;
  roleIds?: string[];
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  departmentId?: string;
}

export interface PermissionOverrideInput {
  permissionId: string;
  effect: "GRANT" | "REVOKE";
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllUsers: builder.query<ApiResponse<IUser[]>, Record<string, any> | void>({
      query: (params) => ({
        url: "/users",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["User"],
    }),

    getUserById: builder.query<ApiResponse<IUser>, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    createUser: builder.mutation<ApiResponse<IUser>, CreateUserPayload>({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    updateUser: builder.mutation<ApiResponse<IUser>, { id: string; body: UpdateUserPayload }>({
      query: ({ id, body }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    updateUserStatus: builder.mutation<ApiResponse<IUser>, { id: string; status: UserStatus }>({
      query: ({ id, status }) => ({
        url: `/users/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["User"],
    }),

    assignUserRoles: builder.mutation<ApiResponse<IUser>, { id: string; roleIds: string[] }>({
      query: ({ id, roleIds }) => ({
        url: `/users/${id}/roles`,
        method: "POST",
        body: { roleIds },
      }),
      invalidatesTags: ["User"],
    }),

    overrideUserPermissions: builder.mutation<ApiResponse<IUser>, { id: string; overrides: PermissionOverrideInput[] }>({
      query: ({ id, overrides }) => ({
        url: `/users/${id}/permissions`,
        method: "POST",
        body: { overrides },
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useAssignUserRolesMutation,
  useOverrideUserPermissionsMutation,
} = usersApi;

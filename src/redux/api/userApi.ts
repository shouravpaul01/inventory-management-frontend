import { baseApi } from "@/redux/api/baseApi";
import { TApiResponse, TUser, TUserStatus } from "@/type";

export type TUserQueryParams = {
  searchTerm?: string;
  departmentId?: string;
  status?: TUserStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<TApiResponse<TUser[]>, TUserQueryParams | void>({
      query: (params) => ({
        url: "/users",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["User"],
    }),

    getUserById: builder.query<TApiResponse<TUser>, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    createUser: builder.mutation<
      TApiResponse<TUser>,
      {
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
    >({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    updateUser: builder.mutation<
      TApiResponse<TUser>,
      {
        id: string;
        body: {
          firstName?: string;
          lastName?: string;
          phone?: string;
          departmentId?: string;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    updateUserStatus: builder.mutation<
      TApiResponse<TUser>,
      { id: string; status: TUserStatus }
    >({
      query: ({ id, status }) => ({
        url: `/users/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["User"],
    }),

    assignUserRoles: builder.mutation<
      TApiResponse<TUser>,
      { id: string; roleIds: string[] }
    >({
      query: ({ id, roleIds }) => ({
        url: `/users/${id}/roles`,
        method: "POST",
        body: { roleIds },
      }),
      invalidatesTags: ["User"],
    }),

    overrideUserPermissions: builder.mutation<
      TApiResponse<any>,
      {
        id: string;
        overrides: { permissionId: string; effect: "GRANT" | "REVOKE" }[];
      }
    >({
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
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useAssignUserRolesMutation,
  useOverrideUserPermissionsMutation,
} = userApi;

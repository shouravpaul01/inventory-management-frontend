import { baseApi } from "@/redux/api/baseApi";
import { TApiResponse, TCurrentUser } from "@/type";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      TApiResponse<{
        user: TCurrentUser;
        accessToken: string;
        refreshToken: string;
      }>,
      { identifier: string; password: string }
    >({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: {
          email: credentials.identifier,
          username: credentials.identifier,
          password: credentials.password,
        },
      }),
      invalidatesTags: ["User", "Auth"],
    }),

    getMe: builder.query<TApiResponse<TCurrentUser>, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      providesTags: ["User", "Auth"],
    }),

    changePassword: builder.mutation<
      TApiResponse<null>,
      { oldPassword: string; newPassword: string }
    >({
      query: (data) => ({
        url: "/auth/change-password",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User", "Auth"],
    }),

    forgotPassword: builder.mutation<TApiResponse<null>, { email: string }>({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),

    verifyResetOtp: builder.mutation<
      TApiResponse<{ resetToken: string }>,
      { email: string; otp: string }
    >({
      query: (data) => ({
        url: "/auth/verify-reset-otp",
        method: "POST",
        body: data,
      }),
    }),

    resetPassword: builder.mutation<
      TApiResponse<null>,
      { resetToken: string; newPassword: string }
    >({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),

    updateProfile: builder.mutation<TApiResponse<TCurrentUser>, Partial<TCurrentUser>>({
      query: (data) => ({
        url: "/users/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User", "Auth"],
    }),

    logoutApi: builder.mutation<TApiResponse<null>, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User", "Auth"],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useVerifyResetOtpMutation,
  useResetPasswordMutation,
  useUpdateProfileMutation,
  useLogoutApiMutation,
} = authApi;

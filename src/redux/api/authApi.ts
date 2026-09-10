import { baseApi } from "@/redux/api/baseApi";
import { ApiResponse, IAuthUser } from "@/types";

export interface LoginResponseData {
  user: IAuthUser;
  accessToken: string;
  refreshToken: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<LoginResponseData>, { email?: string; username?: string; password: string }>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    getMe: builder.query<ApiResponse<IAuthUser>, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      providesTags: ["Auth", "User"],
    }),

    changePassword: builder.mutation<ApiResponse<null>, { oldPassword: string; newPassword: string }>({
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
      }),
    }),

    forgotPassword: builder.mutation<ApiResponse<{ expiresIn: string }>, { email: string }>({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),

    verifyResetOtp: builder.mutation<ApiResponse<{ resetToken: string; expiresIn: string }>, { email: string; otp: string }>({
      query: (body) => ({
        url: "/auth/verify-reset-otp",
        method: "POST",
        body,
      }),
    }),

    resetPassword: builder.mutation<ApiResponse<null>, { resetToken: string; newPassword: string }>({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),

    logoutApi: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth", "User"],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useVerifyResetOtpMutation,
  useResetPasswordMutation,
  useLogoutApiMutation,
} = authApi;

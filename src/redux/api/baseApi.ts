import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { logout, setCredentials } from "../features/authSlice";
import { RootState } from "../store";
import Cookies from "js-cookie";

const getBaseUrl = () => {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== "undefined"
      ? "http://localhost:5000/api/v1"
      : "http://localhost:5000/api/v1")
  );
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token =
      (getState() as RootState).auth.token ||
      (typeof window !== "undefined" ? Cookies.get("accessToken") : null);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    const state = api.getState() as RootState;
    const refreshToken =
      state.auth.refresh_token ||
      (typeof window !== "undefined" ? Cookies.get("refreshToken") : null);

    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        {
          url: "/auth/refresh-token",
          method: "POST",
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      const data = refreshResult.data as any;
      if (data?.success && data?.data?.accessToken) {
        api.dispatch(
          setCredentials({
            token: data.data.accessToken,
            refreshToken: data.data.refreshToken || refreshToken,
          })
        );
        // Retry original request
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "User",
    "Role",
    "Permission",
    "Department",
    "Building",
    "Floor",
    "RoomType",
    "Room",
    "StockLocation",
    "Category",
    "InventoryItem",
    "InventoryUnit",
    "StockBalance",
    "StockMovement",
    "CodeSequence",
    "Requisition",
    "Distribution",
    "Return",
    "ApprovalPolicy",
    "ApprovalRequest",
    "AuditLog",
    "Notification",
    "Report",
  ],
  endpoints: () => ({}),
});

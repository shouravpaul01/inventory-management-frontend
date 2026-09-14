import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout } from "../features/authSlice";
import { RootState } from "../store";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000/api/v1";

const baseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
  credentials: "include",
});

const baseQueryWithReauth: ReturnType<typeof fetchBaseQuery> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    // try refresh token
    const refreshResult = await baseQuery(
      { url: "/auth/refresh-token", method: "POST" },
      api,
      extraOptions,
    );

    if (refreshResult.data) {
      // retry original request
      result = await baseQuery(args, api, extraOptions);
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
    "User",
    "Auth",
    "Role",
    "Permission",
    "Department",
    "Location",
    "Category",
    "InventoryItem",
    "InventoryUnit",
    "Stock",
    "StockLedger",
    "Requisition",
    "Distribution",
    "Return",
    "Approval",
    "AuditLog",
    "Notification",
    "Report",
    "CodeSequence",
  ],
  endpoints: (builder) => ({}),
});

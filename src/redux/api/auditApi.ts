import { baseApi } from "@/redux/api/baseApi";
import { TApiResponse, TAuditLog } from "@/type";

export type TAuditQueryParams = {
  action?: string;
  module?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<
      TApiResponse<TAuditLog[]>,
      TAuditQueryParams | void
    >({
      query: (params) => ({
        url: "/audit-logs",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["AuditLog"],
    }),

    getAuditLogById: builder.query<TApiResponse<TAuditLog>, string>({
      query: (id) => ({
        url: `/audit-logs/${id}`,
        method: "GET",
      }),
      providesTags: ["AuditLog"],
    }),
  }),
});

export const { useGetAuditLogsQuery, useGetAuditLogByIdQuery } = auditApi;

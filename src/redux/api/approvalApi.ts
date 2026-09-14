import { baseApi } from "@/redux/api/baseApi";
import {
  TApiResponse,
  TApprovalRequest,
  TApprovalStatus,
} from "@/type";

export type TApprovalQueryParams = {
  requestNumber?: string;
  status?: TApprovalStatus;
  entityType?: string;
  entityId?: string;
  permissionCode?: string;
  requestedById?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const approvalApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getApprovalRequests: builder.query<
      TApiResponse<TApprovalRequest[]>,
      TApprovalQueryParams | void
    >({
      query: (params) => ({
        url: "/approvals/requests",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Approval"],
    }),

    getApprovalRequestById: builder.query<TApiResponse<TApprovalRequest>, string>({
      query: (id) => ({
        url: `/approvals/requests/${id}`,
        method: "GET",
      }),
      providesTags: ["Approval"],
    }),

    actionApprovalRequest: builder.mutation<
      TApiResponse<TApprovalRequest>,
      {
        id: string;
        decision: "APPROVE" | "REJECT" | "REQUEST_CHANGE";
        comments?: string;
      }
    >({
      query: ({ id, decision, comments }) => ({
        url: `/approvals/requests/${id}/action`,
        method: "POST",
        body: { decision, comments },
      }),
      invalidatesTags: ["Approval", "Requisition", "Stock"],
    }),

    getApprovalPolicies: builder.query<TApiResponse<any[]>, void>({
      query: () => ({
        url: "/approvals/policies",
        method: "GET",
      }),
      providesTags: ["Approval"],
    }),
  }),
});

export const {
  useGetApprovalRequestsQuery,
  useGetApprovalRequestByIdQuery,
  useActionApprovalRequestMutation,
  useGetApprovalPoliciesQuery,
} = approvalApi;

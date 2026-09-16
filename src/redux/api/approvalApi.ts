import { baseApi } from "@/redux/api/baseApi";
import {
  TApiResponse,
  TApprovalPolicy,
  TApprovalRequest,
  TApprovalStatus,
  TExemptionSummary,
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
      invalidatesTags: ["Approval", "Requisition", "Stock", "InventoryItem", "Category", "Department"],
    }),

    resubmitApprovalRequest: builder.mutation<
      TApiResponse<TApprovalRequest>,
      {
        id: string;
        updatedPayload: Record<string, any>;
        resubmitReason?: string;
      }
    >({
      query: ({ id, updatedPayload, resubmitReason }) => ({
        url: `/approvals/requests/${id}/resubmit`,
        method: "PATCH",
        body: { updatedPayload, resubmitReason },
      }),
      invalidatesTags: ["Approval", "Requisition", "Stock", "InventoryItem", "Category"],
    }),

    getExemptionSummary: builder.query<TApiResponse<TExemptionSummary>, void>({
      query: () => ({
        url: "/approvals/policies/summary/exemptions",
        method: "GET",
      }),
      providesTags: ["Approval"],
    }),

    getApprovalPolicies: builder.query<
      TApiResponse<TApprovalPolicy[]>,
      Record<string, any> | void
    >({
      query: (params) => ({
        url: "/approvals/policies",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Approval"],
    }),

    createPolicy: builder.mutation<
      TApiResponse<TApprovalPolicy | TApprovalPolicy[]>,
      {
        permissionCode?: string;
        permissionCodes?: string[];
        requirement?: "REQUIRED" | "NOT_REQUIRED";
        scope?: "ROLE" | "USER" | "SYSTEM";
        roleId?: string;
        userId?: string;
        condition?: any;
        approvalLevelCount?: number;
        allowSelfApproval?: boolean;
      }
    >({
      query: (body) => ({
        url: "/approvals/policies",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Approval"],
    }),

    updatePolicy: builder.mutation<
      TApiResponse<TApprovalPolicy>,
      {
        id: string;
        permissionCode?: string;
        permissionCodes?: string[];
        requirement?: "REQUIRED" | "NOT_REQUIRED";
        scope?: "ROLE" | "USER" | "SYSTEM";
        roleId?: string | null;
        userId?: string | null;
        condition?: any;
        isActive?: boolean;
        approvalLevelCount?: number;
        allowSelfApproval?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/approvals/policies/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Approval"],
    }),

    deletePolicy: builder.mutation<TApiResponse<any>, string>({
      query: (id) => ({
        url: `/approvals/policies/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Approval"],
    }),
  }),
});

export const {
  useGetApprovalRequestsQuery,
  useGetApprovalRequestByIdQuery,
  useActionApprovalRequestMutation,
  useResubmitApprovalRequestMutation,
  useGetExemptionSummaryQuery,
  useGetApprovalPoliciesQuery,
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
  useDeletePolicyMutation,
} = approvalApi;

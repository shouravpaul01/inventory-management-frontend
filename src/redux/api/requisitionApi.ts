import { baseApi } from "@/redux/api/baseApi";
import {
  TApiResponse,
  TRequisition,
  TRequisitionStatus,
} from "@/type";

export type TRequisitionQueryParams = {
  requestNumber?: string;
  status?: TRequisitionStatus;
  type?: "REQUISITION" | "ORDER";
  departmentId?: string;
  requesterId?: string;
  isTemporary?: boolean;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const requisitionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRequisitions: builder.query<
      TApiResponse<TRequisition[]>,
      TRequisitionQueryParams | void
    >({
      query: (params) => ({
        url: "/requisitions",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Requisition"],
    }),

    getRequisitionById: builder.query<TApiResponse<TRequisition>, string>({
      query: (id) => ({
        url: `/requisitions/${id}`,
        method: "GET",
      }),
      providesTags: ["Requisition"],
    }),

    createRequisition: builder.mutation<
      TApiResponse<TRequisition>,
      {
        type?: "REQUISITION" | "ORDER";
        departmentId: string;
        purpose: string;
        remarks?: string;
        isTemporary?: boolean;
        requiredFrom?: string;
        requiredUntil?: string;
        lines: Array<{
          inventoryItemId: string;
          requestedQty: number;
          requestedIssuePolicy?: "PERMANENT" | "TEMPORARY" | "GIFT";
          remarks?: string;
        }>;
      }
    >({
      query: (body) => ({
        url: "/requisitions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Requisition"],
    }),

    updateRequisition: builder.mutation<
      TApiResponse<TRequisition>,
      {
        id: string;
        body: {
          purpose?: string;
          remarks?: string;
          isTemporary?: boolean;
          requiredFrom?: string;
          requiredUntil?: string;
          lines?: Array<{
            id?: string;
            inventoryItemId: string;
            requestedQty: number;
            requestedIssuePolicy?: "PERMANENT" | "TEMPORARY" | "GIFT";
            remarks?: string;
          }>;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/requisitions/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Requisition"],
    }),

    submitRequisition: builder.mutation<TApiResponse<TRequisition>, string>({
      query: (id) => ({
        url: `/requisitions/${id}/submit`,
        method: "POST",
      }),
      invalidatesTags: ["Requisition", "Approval"],
    }),

    reviewRequisition: builder.mutation<
      TApiResponse<TRequisition>,
      {
        id: string;
        body: {
          decision: "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED";
          comments?: string;
          lines: Array<{
            lineId: string;
            approvedQty: number;
            status: "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED";
            remarks?: string;
          }>;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/requisitions/${id}/review`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Requisition", "Approval", "Stock"],
    }),

    cancelRequisition: builder.mutation<
      TApiResponse<TRequisition>,
      { id: string; reason?: string }
    >({
      query: ({ id, reason }) => ({
        url: `/requisitions/${id}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["Requisition", "Approval"],
    }),

    deleteRequisition: builder.mutation<TApiResponse<TRequisition>, string>({
      query: (id) => ({
        url: `/requisitions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Requisition"],
    }),
  }),
});

export const {
  useGetRequisitionsQuery,
  useGetRequisitionByIdQuery,
  useCreateRequisitionMutation,
  useUpdateRequisitionMutation,
  useSubmitRequisitionMutation,
  useReviewRequisitionMutation,
  useCancelRequisitionMutation,
  useDeleteRequisitionMutation,
} = requisitionApi;

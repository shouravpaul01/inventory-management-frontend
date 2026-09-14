import { baseApi } from "@/redux/api/baseApi";
import {
  TApiResponse,
  TDistribution,
  TDistributionStatus,
  TDeliveryStatus,
} from "@/type";

export type TDistributionQueryParams = {
  distributionNo?: string;
  status?: TDistributionStatus;
  deliveryStatus?: TDeliveryStatus;
  requisitionId?: string;
  receiverId?: string;
  issueMode?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const distributionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDistributions: builder.query<
      TApiResponse<TDistribution[]>,
      TDistributionQueryParams | void
    >({
      query: (params) => ({
        url: "/distributions",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Distribution"],
    }),

    getDistributionById: builder.query<TApiResponse<TDistribution>, string>({
      query: (id) => ({
        url: `/distributions/${id}`,
        method: "GET",
      }),
      providesTags: ["Distribution"],
    }),

    createDistribution: builder.mutation<
      TApiResponse<TDistribution>,
      {
        requisitionId: string;
        receiverId: string;
        issueMode?: "PERMANENT" | "TEMPORARY" | "GIFT";
        handoverMethod?: "SELF_COLLECTION" | "DELIVERED_BY_STAFF" | "COURIER" | "OTHER";
        expectedReturnAt?: string;
        remarks?: string;
        lines: Array<{
          requisitionLineId?: string;
          inventoryItemId: string;
          inventoryUnitId?: string;
          locationId: string;
          quantity: number;
          issueMode?: "PERMANENT" | "TEMPORARY" | "GIFT";
          condition?: string;
          expectedReturnAt?: string;
          remarks?: string;
        }>;
      }
    >({
      query: (body) => ({
        url: "/distributions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Distribution", "Requisition", "Stock", "InventoryUnit"],
    }),

    confirmDelivery: builder.mutation<
      TApiResponse<TDistribution>,
      { id: string; body: FormData | any }
    >({
      query: ({ id, body }) => {
        let finalBody = body;
        if (!(body instanceof FormData)) {
          const formData = new FormData();
          formData.append("data", JSON.stringify(body));
          finalBody = formData;
        }
        return {
          url: `/distributions/${id}/confirm-delivery`,
          method: "POST",
          body: finalBody,
        };
      },
      invalidatesTags: ["Distribution", "Requisition"],
    }),
  }),
});

export const {
  useGetDistributionsQuery,
  useGetDistributionByIdQuery,
  useCreateDistributionMutation,
  useConfirmDeliveryMutation,
} = distributionApi;

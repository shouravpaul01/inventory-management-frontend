import { baseApi } from "@/redux/api/baseApi";
import {
  TApiResponse,
  TReturn,
  TReturnTransactionStatus,
} from "@/type";

export type TReturnQueryParams = {
  returnNumber?: string;
  status?: TReturnTransactionStatus;
  distributionId?: string;
  processedById?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const returnApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReturns: builder.query<
      TApiResponse<TReturn[]>,
      TReturnQueryParams | void
    >({
      query: (params) => ({
        url: "/returns",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Return"],
    }),

    getReturnById: builder.query<TApiResponse<TReturn>, string>({
      query: (id) => ({
        url: `/returns/${id}`,
        method: "GET",
      }),
      providesTags: ["Return"],
    }),

    processReturn: builder.mutation<
      TApiResponse<TReturn>,
      FormData | any
    >({
      query: (body) => {
        let finalBody = body;
        if (!(body instanceof FormData)) {
          const formData = new FormData();
          formData.append("data", JSON.stringify(body));
          finalBody = formData;
        }
        return {
          url: "/returns",
          method: "POST",
          body: finalBody,
        };
      },
      invalidatesTags: ["Return", "Distribution", "Requisition", "Stock", "InventoryUnit"],
    }),
  }),
});

export const {
  useGetReturnsQuery,
  useGetReturnByIdQuery,
  useProcessReturnMutation,
} = returnApi;

import { baseApi } from "@/redux/api/baseApi";
import {
  TApiResponse,
  TStockBalance,
  TStockMovement,
  TStockMovementType,
} from "@/type";

export type TStockBalanceQueryParams = {
  inventoryItemId?: string;
  locationId?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type TStockMovementQueryParams = {
  movementNumber?: string;
  type?: TStockMovementType;
  inventoryItemId?: string;
  inventoryUnitId?: string;
  fromLocationId?: string;
  toLocationId?: string;
  performedById?: string;
  referenceType?: string;
  referenceId?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const stockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStockBalances: builder.query<
      TApiResponse<TStockBalance[]>,
      TStockBalanceQueryParams | void
    >({
      query: (params) => ({
        url: "/stock/balances",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Stock"],
    }),

    getStockMovements: builder.query<
      TApiResponse<TStockMovement[]>,
      TStockMovementQueryParams | void
    >({
      query: (params) => ({
        url: "/stock/movements",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["StockLedger"],
    }),

    stockIn: builder.mutation<
      TApiResponse<{ balance: TStockBalance; movement: TStockMovement }>,
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
          url: "/stock/in",
          method: "POST",
          body: finalBody,
        };
      },
      invalidatesTags: ["Stock", "StockLedger", "InventoryItem"],
    }),

    stockOut: builder.mutation<
      TApiResponse<{ balance: TStockBalance; movement: TStockMovement }>,
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
          url: "/stock/out",
          method: "POST",
          body: finalBody,
        };
      },
      invalidatesTags: ["Stock", "StockLedger", "InventoryItem"],
    }),

    transferStock: builder.mutation<
      TApiResponse<{ balance?: TStockBalance; movement: TStockMovement }>,
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
          url: "/stock/transfer",
          method: "POST",
          body: finalBody,
        };
      },
      invalidatesTags: ["Stock", "StockLedger", "InventoryItem", "InventoryUnit"],
    }),

    adjustStock: builder.mutation<
      TApiResponse<{ balance: TStockBalance; movement: TStockMovement }>,
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
          url: "/stock/adjust",
          method: "POST",
          body: finalBody,
        };
      },
      invalidatesTags: ["Stock", "StockLedger", "InventoryItem"],
    }),
  }),
});

export const {
  useGetStockBalancesQuery,
  useGetStockMovementsQuery,
  useStockInMutation,
  useStockOutMutation,
  useTransferStockMutation,
  useAdjustStockMutation,
} = stockApi;

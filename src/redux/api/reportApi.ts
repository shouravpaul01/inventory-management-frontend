import { baseApi } from "@/redux/api/baseApi";
import { TApiResponse, TInventoryUnit, TStockMovement } from "@/type";

export type TDashboardOverview = {
  catalog: {
    totalItems: number;
    departments: number;
  };
  serializedAssets: {
    total: number;
    inStock: number;
    issued: number;
    damaged: number;
    maintenance: number;
  };
  bulkStock: {
    totalQuantity: number;
    availableQuantity: number;
    reservedQuantity: number;
  };
  requisitions: {
    pendingReview: number;
    approvedPendingIssue: number;
  };
};

export type TLowStockItem = {
  itemId: string;
  itemCode: string;
  itemName: string;
  category: string;
  minimumStock: number;
  reorderLevel: number;
  totalAvailable: number;
  totalOnHand: number;
  deficit: number;
  needsReorder: boolean;
  locations: Array<{
    locationId: string;
    locationName: string;
    quantity: number;
    availableQuantity: number;
  }>;
};

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardOverview: builder.query<TApiResponse<TDashboardOverview>, void>({
      query: () => ({
        url: "/reports/dashboard",
        method: "GET",
      }),
      providesTags: ["Report", "Stock", "Requisition", "InventoryItem"],
    }),

    getLowStockReport: builder.query<
      TApiResponse<{ totalAlerts: number; data: TLowStockItem[] }>,
      void
    >({
      query: () => ({
        url: "/reports/low-stock",
        method: "GET",
      }),
      providesTags: ["Report", "Stock"],
    }),

    getMyAssignedAssets: builder.query<TApiResponse<TInventoryUnit[]>, void>({
      query: () => ({
        url: "/reports/my-assets",
        method: "GET",
      }),
      providesTags: ["Report", "InventoryUnit"],
    }),

    getOverdueReturns: builder.query<TApiResponse<any[]>, void>({
      query: () => ({
        url: "/reports/overdue-returns",
        method: "GET",
      }),
      providesTags: ["Report", "Return"],
    }),

    getMovementLedgerReport: builder.query<
      TApiResponse<TStockMovement[]>,
      Record<string, unknown> | void
    >({
      query: (params) => ({
        url: "/reports/movements-ledger",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Report", "StockLedger"],
    }),
  }),
});

export const {
  useGetDashboardOverviewQuery,
  useGetLowStockReportQuery,
  useGetMyAssignedAssetsQuery,
  useGetOverdueReturnsQuery,
  useGetMovementLedgerReportQuery,
} = reportApi;

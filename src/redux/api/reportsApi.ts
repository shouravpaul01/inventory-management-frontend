import { baseApi } from "@/redux/api/baseApi";
import { ApiResponse, IInventoryUnit, IStockMovement } from "@/types";

export interface DashboardOverviewData {
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
}

export interface LowStockReportItem {
  id: string;
  name: string;
  code: string;
  sku?: string | null;
  unitName: string;
  categoryName?: string;
  trackingType: "SERIALIZED" | "BULK";
  minimumStock: number;
  reorderLevel: number;
  currentStock: number;
  deficit: number;
  needsReorder: boolean;
  locationsBreakdown?: Array<{
    locationId: string;
    locationName: string;
    locationCode: string;
    quantity: number;
    availableQuantity: number;
  }>;
}

export interface OverdueReturnRecord {
  id: string;
  code: string;
  issueMode: string;
  expectedReturnAt: string;
  receiver: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
    username: string;
    employeeId: string;
  };
  lines: Array<{
    id: string;
    quantity: number;
    inventoryItem?: {
      id: string;
      name: string;
      code: string;
    };
    inventoryUnit?: {
      id: string;
      uniqueCode: string;
      serialNumber?: string | null;
    };
  }>;
  requisition?: {
    id: string;
    code: string;
    purpose: string;
  };
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardOverview: builder.query<ApiResponse<DashboardOverviewData>, void>({
      query: () => ({
        url: "/reports/dashboard",
        method: "GET",
      }),
      providesTags: ["Report", "InventoryItem", "InventoryUnit", "StockBalance", "Requisition"],
    }),

    getLowStockReport: builder.query<ApiResponse<{ totalAlerts: number; data: LowStockReportItem[] }>, void>({
      query: () => ({
        url: "/reports/low-stock",
        method: "GET",
      }),
      providesTags: ["Report", "StockBalance", "InventoryItem"],
    }),

    getMyAssignedAssets: builder.query<ApiResponse<IInventoryUnit[]>, Record<string, any> | void>({
      query: (params) => ({
        url: "/reports/my-assets",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Report", "InventoryUnit"],
    }),

    getUserAssignedAssets: builder.query<ApiResponse<IInventoryUnit[]>, { userId: string; params?: Record<string, any> }>({
      query: ({ userId, params }) => ({
        url: `/reports/users/${userId}/assets`,
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Report", "InventoryUnit"],
    }),

    getOverdueReturnsReport: builder.query<ApiResponse<{ totalOverdue: number; data: OverdueReturnRecord[] }>, void>({
      query: () => ({
        url: "/reports/overdue-returns",
        method: "GET",
      }),
      providesTags: ["Report", "Distribution", "Return"],
    }),

    getMovementLedger: builder.query<ApiResponse<IStockMovement[]>, Record<string, any> | void>({
      query: (params) => ({
        url: "/reports/movements-ledger",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Report", "StockMovement"],
    }),
  }),
});

export const {
  useGetDashboardOverviewQuery,
  useGetLowStockReportQuery,
  useGetMyAssignedAssetsQuery,
  useGetUserAssignedAssetsQuery,
  useGetOverdueReturnsReportQuery,
  useGetMovementLedgerQuery,
} = reportsApi;

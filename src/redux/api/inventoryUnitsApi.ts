import { baseApi } from "@/redux/api/baseApi";
import { ApiResponse, IInventoryUnit } from "@/types";

export interface CreateInventoryUnitPayload {
  inventoryItemId: string;
  uniqueCode?: string;
  serialNumber?: string;
  barcode?: string;
  condition?: string;
  locationId?: string;
  purchaseDate?: string;
  warrantyEndDate?: string;
  notes?: string;
}

export interface BatchCreateUnitsPayload {
  inventoryItemId: string;
  count: number;
  locationId?: string;
  condition?: string;
  notes?: string;
  purchaseDate?: string;
  warrantyEndDate?: string;
}

export interface UpdateInventoryUnitPayload {
  serialNumber?: string;
  barcode?: string;
  condition?: string;
  locationId?: string;
  notes?: string;
  warrantyEndDate?: string;
}

export const inventoryUnitsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllInventoryUnits: builder.query<ApiResponse<IInventoryUnit[]>, Record<string, any> | void>({
      query: (params) => ({
        url: "/inventory-units",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["InventoryUnit"],
    }),

    getInventoryUnitById: builder.query<ApiResponse<IInventoryUnit>, string>({
      query: (id) => ({
        url: `/inventory-units/${id}`,
        method: "GET",
      }),
      providesTags: ["InventoryUnit"],
    }),

    lookupUnitByCode: builder.query<ApiResponse<IInventoryUnit>, string>({
      query: (code) => ({
        url: `/inventory-units/lookup/${encodeURIComponent(code)}`,
        method: "GET",
      }),
      providesTags: ["InventoryUnit"],
    }),

    createInventoryUnit: builder.mutation<ApiResponse<IInventoryUnit>, CreateInventoryUnitPayload>({
      query: (body) => ({
        url: "/inventory-units",
        method: "POST",
        body,
      }),
      invalidatesTags: ["InventoryUnit", "InventoryItem", "StockBalance", "StockLocation", "Report"],
    }),

    batchCreateUnits: builder.mutation<ApiResponse<{ count: number; units: IInventoryUnit[] }>, BatchCreateUnitsPayload>({
      query: (body) => ({
        url: "/inventory-units/batch",
        method: "POST",
        body,
      }),
      invalidatesTags: ["InventoryUnit", "InventoryItem", "StockBalance", "StockLocation", "Report"],
    }),

    updateInventoryUnit: builder.mutation<ApiResponse<IInventoryUnit>, { id: string; body: UpdateInventoryUnitPayload }>({
      query: ({ id, body }) => ({
        url: `/inventory-units/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["InventoryUnit", "InventoryItem", "StockLocation"],
    }),
  }),
});

export const {
  useGetAllInventoryUnitsQuery,
  useGetInventoryUnitByIdQuery,
  useLookupUnitByCodeQuery,
  useLazyLookupUnitByCodeQuery,
  useCreateInventoryUnitMutation,
  useBatchCreateUnitsMutation,
  useUpdateInventoryUnitMutation,
} = inventoryUnitsApi;

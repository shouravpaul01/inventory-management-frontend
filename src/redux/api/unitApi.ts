import { baseApi } from "@/redux/api/baseApi";
import { TApiResponse, TInventoryUnit, TUnitCondition, TUnitStatus } from "@/type";

export type TUnitQueryParams = {
  inventoryItemId?: string;
  status?: TUnitStatus;
  condition?: TUnitCondition;
  locationId?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const unitApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUnits: builder.query<
      TApiResponse<TInventoryUnit[]>,
      TUnitQueryParams | void
    >({
      query: (params) => ({
        url: "/inventory-units",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["InventoryUnit"],
    }),

    getUnitById: builder.query<TApiResponse<TInventoryUnit>, string>({
      query: (id) => ({
        url: `/inventory-units/${id}`,
        method: "GET",
      }),
      providesTags: ["InventoryUnit"],
    }),

    lookupByCode: builder.query<TApiResponse<TInventoryUnit>, string>({
      query: (code) => ({
        url: `/inventory-units/lookup/${encodeURIComponent(code)}`,
        method: "GET",
      }),
      providesTags: ["InventoryUnit"],
    }),

    createUnit: builder.mutation<
      TApiResponse<TInventoryUnit>,
      {
        inventoryItemId: string;
        uniqueCode?: string;
        serialNumber?: string;
        barcode?: string;
        condition?: TUnitCondition;
        locationId?: string;
        purchaseDate?: string;
        warrantyEndDate?: string;
        notes?: string;
      }
    >({
      query: (body) => ({
        url: "/inventory-units",
        method: "POST",
        body,
      }),
      invalidatesTags: ["InventoryUnit", "InventoryItem"],
    }),

    batchCreateUnits: builder.mutation<
      TApiResponse<TInventoryUnit[]>,
      {
        inventoryItemId: string;
        count: number;
        locationId?: string;
        condition?: TUnitCondition;
        notes?: string;
        purchaseDate?: string;
        warrantyEndDate?: string;
      }
    >({
      query: (body) => ({
        url: "/inventory-units/batch",
        method: "POST",
        body,
      }),
      invalidatesTags: ["InventoryUnit", "InventoryItem"],
    }),

    updateUnit: builder.mutation<
      TApiResponse<TInventoryUnit>,
      {
        id: string;
        body: {
          serialNumber?: string;
          barcode?: string;
          condition?: TUnitCondition;
          locationId?: string;
          notes?: string;
          warrantyEndDate?: string;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/inventory-units/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["InventoryUnit"],
    }),
  }),
});

export const {
  useGetUnitsQuery,
  useGetUnitByIdQuery,
  useLazyLookupByCodeQuery,
  useCreateUnitMutation,
  useBatchCreateUnitsMutation,
  useUpdateUnitMutation,
} = unitApi;

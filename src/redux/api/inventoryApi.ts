import { baseApi } from "@/redux/api/baseApi";
import {
  ApiResponse,
  IInventoryItem,
  ICodeSequence,
} from "@/types";

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── ITEMS ─────────────────────────────────────────────────
    getAllInventoryItems: builder.query<ApiResponse<IInventoryItem[]>, Record<string, any> | void>({
      query: (params) => ({
        url: "/inventory/items",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["InventoryItem"],
    }),

    getInventoryItemById: builder.query<ApiResponse<IInventoryItem>, string>({
      query: (id) => ({
        url: `/inventory/items/${id}`,
        method: "GET",
      }),
      providesTags: ["InventoryItem"],
    }),

    createInventoryItem: builder.mutation<ApiResponse<IInventoryItem>, FormData | Record<string, any>>({
      query: (body) => ({
        url: "/inventory/items",
        method: "POST",
        body,
      }),
      invalidatesTags: ["InventoryItem", "Category", "Report"],
    }),

    updateInventoryItem: builder.mutation<ApiResponse<IInventoryItem>, { id: string; body: FormData | Record<string, any> }>({
      query: ({ id, body }) => ({
        url: `/inventory/items/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["InventoryItem", "Category", "Report"],
    }),

    deleteInventoryItem: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/inventory/items/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["InventoryItem", "Category", "StockBalance", "InventoryUnit", "Report"],
    }),

    // ── CODE SEQUENCES ────────────────────────────────────────
    getAllCodeSequences: builder.query<ApiResponse<ICodeSequence[]>, Record<string, any> | void>({
      query: (params) => ({
        url: "/inventory/code-sequences",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["CodeSequence"],
    }),

    getCodeSequenceById: builder.query<ApiResponse<ICodeSequence>, string>({
      query: (id) => ({
        url: `/inventory/code-sequences/${id}`,
        method: "GET",
      }),
      providesTags: ["CodeSequence"],
    }),

    createCodeSequence: builder.mutation<ApiResponse<ICodeSequence>, Record<string, any>>({
      query: (body) => ({
        url: "/inventory/code-sequences",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CodeSequence"],
    }),

    updateCodeSequence: builder.mutation<ApiResponse<ICodeSequence>, { id: string; body: Record<string, any> }>({
      query: ({ id, body }) => ({
        url: `/inventory/code-sequences/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["CodeSequence"],
    }),
  }),
});

export const {
  useGetAllInventoryItemsQuery,
  useGetInventoryItemByIdQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,

  useGetAllCodeSequencesQuery,
  useGetCodeSequenceByIdQuery,
  useCreateCodeSequenceMutation,
  useUpdateCodeSequenceMutation,
} = inventoryApi;

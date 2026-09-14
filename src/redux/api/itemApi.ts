import { baseApi } from "@/redux/api/baseApi";
import { TApiResponse, TInventoryItem, TTrackingType, TIssuePolicy } from "@/type";

export type TItemQueryParams = {
  searchTerm?: string;
  categoryId?: string;
  trackingType?: TTrackingType;
  isReturnable?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const itemApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getItems: builder.query<
      TApiResponse<TInventoryItem[]>,
      TItemQueryParams | void
    >({
      query: (params) => ({
        url: "/inventory/items",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["InventoryItem"],
    }),

    getItemById: builder.query<TApiResponse<TInventoryItem>, string>({
      query: (id) => ({
        url: `/inventory/items/${id}`,
        method: "GET",
      }),
      providesTags: ["InventoryItem"],
    }),

    createItem: builder.mutation<TApiResponse<TInventoryItem>, FormData | any>({
      query: (body) => ({
        url: "/inventory/items",
        method: "POST",
        body,
      }),
      invalidatesTags: ["InventoryItem"],
    }),

    updateItem: builder.mutation<
      TApiResponse<TInventoryItem>,
      { id: string; body: FormData | any }
    >({
      query: ({ id, body }) => ({
        url: `/inventory/items/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["InventoryItem"],
    }),

    deleteItem: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({
        url: `/inventory/items/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["InventoryItem"],
    }),

    getCodeSequences: builder.query<TApiResponse<any[]>, void>({
      query: () => ({
        url: "/inventory/code-sequences",
        method: "GET",
      }),
      providesTags: ["CodeSequence"],
    }),
  }),
});

export const {
  useGetItemsQuery,
  useGetItemByIdQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
  useGetCodeSequencesQuery,
} = itemApi;

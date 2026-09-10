import { baseApi } from "@/redux/api/baseApi";
import {
  ApiResponse,
  IBuilding,
  IFloor,
  IRoomType,
  IRoom,
  IStockLocation,
} from "@/types";

export const locationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── 1. BUILDINGS ──────────────────────────────────────────
    getAllBuildings: builder.query<ApiResponse<IBuilding[]>, Record<string, any> | void>({
      query: (params) => ({
        url: "/locations/buildings",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Building"],
    }),

    getBuildingById: builder.query<ApiResponse<IBuilding>, string>({
      query: (id) => ({
        url: `/locations/buildings/${id}`,
        method: "GET",
      }),
      providesTags: ["Building"],
    }),

    createBuilding: builder.mutation<ApiResponse<IBuilding>, FormData | Record<string, any>>({
      query: (body) => ({
        url: "/locations/buildings",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Building"],
    }),

    updateBuilding: builder.mutation<ApiResponse<IBuilding>, { id: string; body: FormData | Record<string, any> }>({
      query: ({ id, body }) => ({
        url: `/locations/buildings/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Building"],
    }),

    deleteBuilding: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/locations/buildings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Building", "Floor", "Room", "StockLocation"],
    }),

    // ── 2. FLOORS ─────────────────────────────────────────────
    getAllFloors: builder.query<ApiResponse<IFloor[]>, Record<string, any> | void>({
      query: (params) => ({
        url: "/locations/floors",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Floor"],
    }),

    getFloorById: builder.query<ApiResponse<IFloor>, string>({
      query: (id) => ({
        url: `/locations/floors/${id}`,
        method: "GET",
      }),
      providesTags: ["Floor"],
    }),

    createFloor: builder.mutation<ApiResponse<IFloor>, FormData | Record<string, any>>({
      query: (body) => ({
        url: "/locations/floors",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Floor", "Building"],
    }),

    updateFloor: builder.mutation<ApiResponse<IFloor>, { id: string; body: FormData | Record<string, any> }>({
      query: ({ id, body }) => ({
        url: `/locations/floors/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Floor", "Building"],
    }),

    deleteFloor: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/locations/floors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Floor", "Building", "Room", "StockLocation"],
    }),

    // ── 3. ROOM TYPES ─────────────────────────────────────────
    getAllRoomTypes: builder.query<ApiResponse<IRoomType[]>, Record<string, any> | void>({
      query: (params) => ({
        url: "/locations/room-types",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["RoomType"],
    }),

    getRoomTypeById: builder.query<ApiResponse<IRoomType>, string>({
      query: (id) => ({
        url: `/locations/room-types/${id}`,
        method: "GET",
      }),
      providesTags: ["RoomType"],
    }),

    createRoomType: builder.mutation<ApiResponse<IRoomType>, { name: string; code: string; description?: string }>({
      query: (body) => ({
        url: "/locations/room-types",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RoomType"],
    }),

    updateRoomType: builder.mutation<ApiResponse<IRoomType>, { id: string; body: { name?: string; description?: string } }>({
      query: ({ id, body }) => ({
        url: `/locations/room-types/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["RoomType", "Room"],
    }),

    deleteRoomType: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/locations/room-types/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["RoomType"],
    }),

    // ── 4. ROOMS ──────────────────────────────────────────────
    getAllRooms: builder.query<ApiResponse<IRoom[]>, Record<string, any> | void>({
      query: (params) => ({
        url: "/locations/rooms",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Room"],
    }),

    getRoomById: builder.query<ApiResponse<IRoom>, string>({
      query: (id) => ({
        url: `/locations/rooms/${id}`,
        method: "GET",
      }),
      providesTags: ["Room"],
    }),

    createRoom: builder.mutation<ApiResponse<IRoom>, FormData | Record<string, any>>({
      query: (body) => ({
        url: "/locations/rooms",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Room", "Floor"],
    }),

    updateRoom: builder.mutation<ApiResponse<IRoom>, { id: string; body: FormData | Record<string, any> }>({
      query: ({ id, body }) => ({
        url: `/locations/rooms/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Room", "Floor"],
    }),

    deleteRoom: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/locations/rooms/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Room", "Floor", "StockLocation"],
    }),

    // ── 5. STOCK LOCATIONS ────────────────────────────────────
    getAllStockLocations: builder.query<ApiResponse<IStockLocation[]>, Record<string, any> | void>({
      query: (params) => ({
        url: "/locations/stock-locations",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["StockLocation"],
    }),

    getStockLocationById: builder.query<ApiResponse<IStockLocation>, string>({
      query: (id) => ({
        url: `/locations/stock-locations/${id}`,
        method: "GET",
      }),
      providesTags: ["StockLocation"],
    }),

    createStockLocation: builder.mutation<ApiResponse<IStockLocation>, FormData | Record<string, any>>({
      query: (body) => ({
        url: "/locations/stock-locations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["StockLocation", "Room"],
    }),

    updateStockLocation: builder.mutation<ApiResponse<IStockLocation>, { id: string; body: FormData | Record<string, any> }>({
      query: ({ id, body }) => ({
        url: `/locations/stock-locations/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["StockLocation", "Room"],
    }),

    deleteStockLocation: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/locations/stock-locations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["StockLocation"],
    }),
  }),
});

export const {
  useGetAllBuildingsQuery,
  useGetBuildingByIdQuery,
  useCreateBuildingMutation,
  useUpdateBuildingMutation,
  useDeleteBuildingMutation,

  useGetAllFloorsQuery,
  useGetFloorByIdQuery,
  useCreateFloorMutation,
  useUpdateFloorMutation,
  useDeleteFloorMutation,

  useGetAllRoomTypesQuery,
  useGetRoomTypeByIdQuery,
  useCreateRoomTypeMutation,
  useUpdateRoomTypeMutation,
  useDeleteRoomTypeMutation,

  useGetAllRoomsQuery,
  useGetRoomByIdQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,

  useGetAllStockLocationsQuery,
  useGetStockLocationByIdQuery,
  useCreateStockLocationMutation,
  useUpdateStockLocationMutation,
  useDeleteStockLocationMutation,
} = locationsApi;

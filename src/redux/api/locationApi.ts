import { baseApi } from "@/redux/api/baseApi";
import {
  TApiResponse,
  TBuilding,
  TFloor,
  TRoom,
  TRoomType,
  TStockLocation,
} from "@/type";

export const locationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Buildings
    getBuildings: builder.query<
      TApiResponse<TBuilding[]>,
      { searchTerm?: string; page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: "/locations/buildings",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Location"],
    }),

    getBuildingById: builder.query<TApiResponse<TBuilding>, string>({
      query: (id) => ({
        url: `/locations/buildings/${id}`,
        method: "GET",
      }),
      providesTags: ["Location"],
    }),

    createBuilding: builder.mutation<
      TApiResponse<TBuilding>,
      { name: string; code: string; description?: string; address?: string }
    >({
      query: (body) => ({
        url: "/locations/buildings",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Location"],
    }),

    updateBuilding: builder.mutation<
      TApiResponse<TBuilding>,
      {
        id: string;
        body: { name?: string; description?: string; address?: string };
      }
    >({
      query: ({ id, body }) => ({
        url: `/locations/buildings/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Location"],
    }),

    deleteBuilding: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({
        url: `/locations/buildings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Location"],
    }),

    // Floors
    getFloors: builder.query<
      TApiResponse<TFloor[]>,
      { buildingId?: string; searchTerm?: string } | void
    >({
      query: (params) => ({
        url: "/locations/floors",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Location"],
    }),

    createFloor: builder.mutation<
      TApiResponse<TFloor>,
      {
        buildingId: string;
        name: string;
        code: string;
        floorNumber?: number;
      }
    >({
      query: (body) => ({
        url: "/locations/floors",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Location"],
    }),

    deleteFloor: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({
        url: `/locations/floors/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Location"],
    }),

    // Room Types
    getRoomTypes: builder.query<TApiResponse<TRoomType[]>, void>({
      query: () => ({
        url: "/locations/room-types",
        method: "GET",
      }),
      providesTags: ["Location"],
    }),

    // Rooms
    getRooms: builder.query<
      TApiResponse<TRoom[]>,
      {
        floorId?: string;
        roomTypeId?: string;
        searchTerm?: string;
        page?: number;
        limit?: number;
      } | void
    >({
      query: (params) => ({
        url: "/locations/rooms",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Location"],
    }),

    createRoom: builder.mutation<
      TApiResponse<TRoom>,
      {
        floorId: string;
        name: string;
        code: string;
        roomTypeId?: string;
        capacity?: number;
        description?: string;
      }
    >({
      query: (body) => ({
        url: "/locations/rooms",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Location"],
    }),

    deleteRoom: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({
        url: `/locations/rooms/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Location"],
    }),

    // Stock Locations (Bins / Shelves / Stores)
    getStockLocations: builder.query<
      TApiResponse<TStockLocation[]>,
      {
        roomId?: string;
        floorId?: string;
        buildingId?: string;
        type?: string;
        searchTerm?: string;
        page?: number;
        limit?: number;
      } | void
    >({
      query: (params) => ({
        url: "/locations/stock-locations",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Location"],
    }),

    createStockLocation: builder.mutation<
      TApiResponse<TStockLocation>,
      {
        name: string;
        code: string;
        type: string;
        description?: string;
        buildingId?: string;
        floorId?: string;
        roomId?: string;
      }
    >({
      query: (body) => ({
        url: "/locations/stock-locations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Location"],
    }),

    updateStockLocation: builder.mutation<
      TApiResponse<TStockLocation>,
      {
        id: string;
        body: {
          name?: string;
          type?: string;
          description?: string;
          buildingId?: string;
          floorId?: string;
          roomId?: string;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/locations/stock-locations/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Location"],
    }),

    deleteStockLocation: builder.mutation<TApiResponse<null>, string>({
      query: (id) => ({
        url: `/locations/stock-locations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Location"],
    }),
  }),
});

export const {
  useGetBuildingsQuery,
  useGetBuildingByIdQuery,
  useCreateBuildingMutation,
  useUpdateBuildingMutation,
  useDeleteBuildingMutation,
  useGetFloorsQuery,
  useCreateFloorMutation,
  useDeleteFloorMutation,
  useGetRoomTypesQuery,
  useGetRoomsQuery,
  useCreateRoomMutation,
  useDeleteRoomMutation,
  useGetStockLocationsQuery,
  useCreateStockLocationMutation,
  useUpdateStockLocationMutation,
  useDeleteStockLocationMutation,
} = locationApi;

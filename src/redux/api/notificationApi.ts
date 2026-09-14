import { baseApi } from "@/redux/api/baseApi";
import { TApiResponse, TNotification, TNotificationType } from "@/type";

export type TNotificationQueryParams = {
  isRead?: boolean;
  type?: TNotificationType;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyNotifications: builder.query<
      TApiResponse<TNotification[]>,
      TNotificationQueryParams | void
    >({
      query: (params) => ({
        url: "/notifications",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Notification"],
    }),

    getUnreadNotificationCount: builder.query<
      TApiResponse<{ unreadCount: number }>,
      void
    >({
      query: () => ({
        url: "/notifications/unread-count",
        method: "GET",
      }),
      providesTags: ["Notification"],
    }),

    markNotificationAsRead: builder.mutation<
      TApiResponse<TNotification>,
      string
    >({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),

    markAllNotificationsAsRead: builder.mutation<
      TApiResponse<{ count: number }>,
      void
    >({
      query: () => ({
        url: "/notifications/mark-all-read",
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} = notificationApi;

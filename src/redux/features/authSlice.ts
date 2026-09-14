import { TCurrentUser } from "@/type";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export interface AuthState {
  token: string | null;
  refresh_token: string | null;
  user: TCurrentUser | null;
}

const initialState: AuthState = {
  token: null,
  refresh_token: null,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{ token: string; user?: TCurrentUser | null }>
    ) => {
      state.token = action.payload.token;
      Cookies.set("accessToken", action.payload.token, { expires: 7 });

      if (action.payload.user) {
        state.user = action.payload.user;
      } else {
        try {
          const decodeData: any = jwtDecode(action.payload.token);
          state.user = {
            id: decodeData?.id || decodeData?.userId || "",
            employeeId: decodeData?.employeeId || "",
            username: decodeData?.username || "",
            email: decodeData?.email || "",
            firstName: decodeData?.firstName || decodeData?.name || "",
            lastName: decodeData?.lastName || "",
            phone: decodeData?.phone || null,
            isSuperAdmin: !!decodeData?.isSuperAdmin,
            status: decodeData?.status || "ACTIVE",
            department: null,
            departmentId: decodeData?.departmentId || null,
            roles: Array.isArray(decodeData?.roles) ? decodeData.roles : [],
            permissions: Array.isArray(decodeData?.permissions)
              ? decodeData.permissions
              : [],
          };
        } catch {
          // Token decode fallback
        }
      }
    },

    setCurrentUser: (state, action: PayloadAction<TCurrentUser>) => {
      state.user = action.payload;
    },

    setRefreshToken: (
      state,
      action: PayloadAction<{ refresh_token: string }>
    ) => {
      state.refresh_token = action.payload.refresh_token;
      Cookies.set("refreshToken", action.payload.refresh_token, { expires: 30 });
    },

    logout: (state) => {
      state.token = null;
      state.refresh_token = null;
      state.user = null;
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
    },
  },
});

export const { setUser, setCurrentUser, setRefreshToken, logout } =
  authSlice.actions;
export default authSlice.reducer;


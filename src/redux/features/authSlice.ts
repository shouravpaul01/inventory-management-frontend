import { IAuthUser } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export interface AuthState {
  token: string | null;
  refresh_token: string | null;
  user: IAuthUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  token: null,
  refresh_token: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,
};

interface JwtPayload {
  id: string;
  employeeId?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isSuperAdmin?: boolean;
  departmentId?: string;
  roles?: string[];
  permissions?: string[];
  exp?: number;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user?: Partial<IAuthUser> | null;
        token: string;
        refreshToken?: string;
      }>
    ) => {
      const { token, refreshToken, user } = action.payload;
      state.token = token;
      state.isAuthenticated = true;
      state.isInitialized = true;

      Cookies.set("accessToken", token, { expires: 1, path: "/" });

      if (refreshToken) {
        state.refresh_token = refreshToken;
        Cookies.set("refreshToken", refreshToken, { expires: 7, path: "/" });
      }

      let decoded: JwtPayload | null = null;
      try {
        decoded = jwtDecode<JwtPayload>(token);
      } catch (e) {
        console.error("Failed to decode token", e);
      }

      state.user = {
        id: user?.id || decoded?.id || "",
        employeeId: user?.employeeId || decoded?.employeeId || "",
        username: user?.username || decoded?.username || "",
        email: user?.email || decoded?.email || "",
        firstName: user?.firstName || decoded?.firstName || "",
        lastName: user?.lastName || decoded?.lastName || "",
        phone: user?.phone || null,
        isSuperAdmin: Boolean(user?.isSuperAdmin ?? decoded?.isSuperAdmin),
        status: (user?.status as any) || "ACTIVE",
        departmentId: user?.departmentId || decoded?.departmentId,
        department: user?.department,
        roles: Array.isArray(user?.roles) ? user.roles : decoded?.roles || [],
        permissions: Array.isArray(user?.permissions)
          ? user.permissions
          : decoded?.permissions || [],
      };
    },

    setUser: (state, action: PayloadAction<{ token: string; user?: Partial<IAuthUser> }>) => {
      const { token, user } = action.payload;
      state.token = token;
      state.isAuthenticated = true;
      state.isInitialized = true;
      Cookies.set("accessToken", token, { expires: 1, path: "/" });

      let decoded: JwtPayload | null = null;
      try {
        decoded = jwtDecode<JwtPayload>(token);
      } catch (e) {
        console.error("Failed to decode token", e);
      }

      state.user = {
        id: user?.id || decoded?.id || "",
        employeeId: user?.employeeId || decoded?.employeeId || "",
        username: user?.username || decoded?.username || "",
        email: user?.email || decoded?.email || "",
        firstName: user?.firstName || decoded?.firstName || "",
        lastName: user?.lastName || decoded?.lastName || "",
        phone: user?.phone || null,
        isSuperAdmin: Boolean(user?.isSuperAdmin ?? decoded?.isSuperAdmin),
        status: (user?.status as any) || "ACTIVE",
        departmentId: user?.departmentId || decoded?.departmentId,
        department: user?.department,
        roles: Array.isArray(user?.roles) ? user.roles : decoded?.roles || [],
        permissions: Array.isArray(user?.permissions)
          ? user.permissions
          : decoded?.permissions || [],
      };
    },

    updateUserProfile: (state, action: PayloadAction<Partial<IAuthUser>>) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
        };
      }
    },

    setRefreshToken: (
      state,
      action: PayloadAction<{ refresh_token: string }>
    ) => {
      state.refresh_token = action.payload.refresh_token;
      Cookies.set("refreshToken", action.payload.refresh_token, { expires: 7, path: "/" });
    },

    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },

    logout: (state) => {
      state.token = null;
      state.refresh_token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      Cookies.remove("accessToken", { path: "/" });
      Cookies.remove("refreshToken", { path: "/" });
    },
  },
});

export const {
  setCredentials,
  setUser,
  updateUserProfile,
  setRefreshToken,
  setInitialized,
  logout,
} = authSlice.actions;

export default authSlice.reducer;

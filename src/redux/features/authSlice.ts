import { TTokenData } from "@/type";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface AuthState {
  token: string | null;
  refresh_token: string | null;
  user: TTokenData | null;
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
    setUser: (state, action: PayloadAction<{ token: string }>) => {
      const decodeData: any = jwtDecode(action.payload.token);

      state.token = action.payload.token;
      state.user = {
        id: decodeData?.id,
        name: decodeData?.name,
        email: decodeData?.email,
        role: decodeData?.role,
        photo: decodeData?.photo,
        phone: decodeData?.phone,
      };
      Cookies.set("accessToken", action.payload.token);
    },

    setRefreshToken: (
      state,
      action: PayloadAction<{ refresh_token: string }>,
    ) => {
      state.refresh_token = action.payload.refresh_token;
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

export const { setUser, setRefreshToken, logout } = authSlice.actions;
export default authSlice.reducer;

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  listings: [],
  notification: {
    message: "",
    type: "", // 'success' or 'error'
    isVisible: false,
  },
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setLogin: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    setLogout: (state) => {
      state.user = null;
      state.token = null;
      state.listings = [];
    },
    setListings: (state, action) => {
      state.listings = action.payload.listings;
    },
    updateUserPreferences: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          lastViewedListings:
            action.payload.lastViewedListings || state.user.lastViewedListings,
          preferredCategories:
            action.payload.preferredCategories ||
            state.user.preferredCategories,
          preferredLocations:
            action.payload.preferredLocations || state.user.preferredLocations,
          viewHistory: action.payload.viewHistory || state.user.viewHistory,
          pricePreferences:
            action.payload.pricePreferences || state.user.pricePreferences,
        };
      }
    },
    setTripList: (state, action) => {
      state.user.tripList = action.payload;
    },
    setWishList: (state, action) => {
      state.user.wishList = action.payload;
    },
    setPropertyList: (state, action) => {
      state.user.propertyList = action.payload;
    },
    setReservationList: (state, action) => {
      state.user.reservationList = action.payload;
    },
    showNotification: (state, action) => {
      state.notification = {
        message: action.payload.message,
        type: action.payload.type,
        isVisible: true,
      };
    },
    hideNotification: (state) => {
      state.notification.isVisible = false;
    },
  },
});

export const {
  setLogin,
  setLogout,
  setListings,
  updateUserPreferences,
  setTripList,
  setWishList,
  setPropertyList,
  setReservationList,
  showNotification,
  hideNotification,
} = userSlice.actions;

export default userSlice.reducer;

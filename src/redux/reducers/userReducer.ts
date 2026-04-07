import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface State {
  user: any;
  isAuthenticated: boolean;
  loading: boolean;
  rememberMe: boolean;
  credentials: any;
  editCheck: boolean;
  recentSearch: any;
  isOnboarding: boolean;
  language: string;
  deviceToken: any;
  userToken: any;
  activeTab: number;
  agreeCheck: boolean;
  employment_questions: any;
  review_questions: any;
  business_types: any;
  emergence_contacts: any;
  userRole: string;
  isReviewAndEdit: boolean;
  onBoardScreenNumber: number;
  snackBar: {
    duration: 3000;
    message: "";
    type: "error";
  };
  kycData: any;
  directoryProfile: any;
  pinLockEnabled: boolean;
}

const initialState: State = {
  user: null,
  isAuthenticated: false,
  loading: true,
  rememberMe: false,
  credentials: {},
  editCheck: false,
  recentSearch: [],
  isOnboarding: false,
  language: "english",
  deviceToken: null,
  activeTab: 0,
  emergence_contacts: [],
  agreeCheck: false,
  userToken: null,
  employment_questions: {},
  business_types: [],
  isReviewAndEdit: false,
  onBoardScreenNumber: 1029,
  review_questions: [],
  userRole: "user",
  snackBar: {
    duration: 3000,
    message: "",
    type: "error",
  },
  kycData: null,
  directoryProfile: null,
  pinLockEnabled: false,
};

export const userReducer = createSlice({
  name: "user",
  initialState,
  reducers: {
    resetUserReducer: (state) => {
      return {
        ...initialState,
        rememberMe: state.rememberMe,
        credentials: state.credentials,
        language: state.language,
      };
    },
    setUser: (state, action) => {
      state.user = action.payload.user;
    },
    setRememberMe: (state, action) => {
      state.rememberMe = action.payload.rememberMe;
    },
    setCredentials: (state, action) => {
      state.credentials = action.payload.credentials;
    },
    setOnBoarding: (state, action) => {
      state.isOnboarding = action.payload.isOnboarding;
    },

    setDeviceToken: (state, action) => {
      state.deviceToken = action.payload.deviceToken;
    },
    setUserToken: (state, action) => {
      state.userToken = action.payload.userToken;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload.activeTab;
    },
    setAgreement: (state, action) => {
      state.agreeCheck = action.payload.agreeCheck;
    },
    setUserRole: (state, action) => {
      state.userRole = action.payload.userRole;
    },
    loginSuccess: (state, action) => {
      state.user = action.payload.user || null;
      state.userToken = action.payload.token;
      state.userRole = action.payload.user?.role || "user";
      state.isAuthenticated = true;
      state.loading = false;
    },
    logout: (
      state,
      action: PayloadAction<{ keepEmail?: boolean } | undefined>,
    ) => {
      state.user = null;
      state.userToken = null;
      state.isAuthenticated = false;
      if (!state.rememberMe && !action.payload?.keepEmail) {
        state.credentials = {};
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload.loading;
    },
    updateProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const getUser = (state: any) => state.entities.user.user;
export const isAuthenticated = (state: any) =>
  state.entities.user.isAuthenticated;
export const isLoading = (state: any) => state.entities.user.loading;
export const rememberMeStatus = (state: any) => state.entities.user.rememberMe;
export const userCredentials = (state: any) => state.entities.user.credentials;
export const editScreenCheck = (state: any) => state.entities.user.editCheck;
export const recentlySearch = (state: any) => state.entities.user.recentSearch;
export const activeLanguage = (state: any) => state.entities.user.language;
export const deviceFcmToken = (state: any) => state.entities.user.deviceToken;
export const userAuthToken = (state: any) => state.entities.user.userToken;
export const activeTabState = (state: any) => state.entities.user.activeTab;
export const agreeState = (state: any) => state.entities.user.agreeCheck;
export const currentUserRole = (state: any) => state.entities.user.userRole;
export const userReviewQuestions = (state: any) =>
  state.entities.user.review_questions;
export const currentScreen = (state: any) =>
  state.entities.user.onBoardScreenNumber;
export const isEdit = (state: any) => state.entities.user.isReviewAndEdit;
export const businessTypesData = (state: any) =>
  state.entities.user.business_types;
export const employment_questions_data = (state: any) =>
  state.entities.user.employment_questions;
export const emergence_contacts_data = (state: any) =>
  state.entities.user.emergence_contacts;

export const isOnBoardingStatus = (state: any) =>
  state.entities.user.isOnboarding;
export const getKycData = (state: any) => state.entities.user.kycData;
export const getDirectoryProfile = (state: any) =>
  state.entities.user.directoryProfile;
export const selectPinLockEnabled = (state: any) =>
  state.entities.user.pinLockEnabled;
export const {
  setUser,
  setRememberMe,
  setCredentials,
  setOnBoarding,
  setActiveTab,
  setAgreement,
  setUserRole,
  setDeviceToken,
  setUserToken,
  resetUserReducer,
  loginSuccess,
  logout,
  setLoading,
  updateProfile,
} = userReducer.actions;

export default userReducer.reducer;

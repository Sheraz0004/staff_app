import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService } from '../../api/apiService';
import { logger } from '../../utils/logger';

/**
 * Reads only local storage (no network) to determine routing state.
 * Fast and offline-safe — the navigator transitions immediately after this.
 */
export const initializeAuth = createAsyncThunk('auth/initialize', async () => {
  let hasSeenOnboarding = false;
  let accessToken = null;

  // --- onboarding flag ---
  try {
    const val = await AsyncStorage.getItem('hasSeenOnboarding');
    if (!val) {
      // Migrate from legacy SecureStore location
      const legacy = await SecureStore.getItemAsync('hasSeenOnboarding');
      if (legacy) {
        await AsyncStorage.setItem('hasSeenOnboarding', legacy);
        hasSeenOnboarding = legacy === 'true';
      }
    } else {
      hasSeenOnboarding = val === 'true';
    }
  } catch (e) {
    logger.error('initializeAuth: error reading onboarding flag', e);
  }

  // --- access token (storage-only, no network) ---
  try {
    accessToken = await SecureStore.getItemAsync('accessToken');
  } catch (e) {
    logger.error('initializeAuth: error reading accessToken', e);
  }

  return { hasSeenOnboarding, accessToken };
});

/**
 * Fetches the user profile from the API and stores it in Redux.
 * Dispatched by MyTabs once the main stack is mounted.
 */
export const fetchUserProfile = createAsyncThunk('auth/fetchUserProfile', async () => {
  const user = await userService.getProfile();
  return user;
});

/**
 * Called after a successful OTP verify / password login.
 * Token is already saved to SecureStore by authService.verifyOtp / authService.login.
 * Also fetches the profile (server is reachable at this point).
 */
export const loginSuccess = createAsyncThunk('auth/loginSuccess', async ({ accessToken }) => {
  let user = null;
  try {
    user = await userService.getProfile();
  } catch (e) {
    logger.error('loginSuccess: error fetching profile', e);
  }
  return { accessToken, user };
});

/**
 * Logs the user out: calls the API, clears SecureStore tokens, resets Redux state.
 */
export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await userService.Userlogout(); // also clears SecureStore internally
  } catch {
    // API call failed — still wipe tokens locally
    await SecureStore.deleteItemAsync('accessToken').catch(() => {});
    await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
  }
});

/**
 * Marks onboarding as complete in persistent storage.
 */
export const setOnboardingComplete = createAsyncThunk(
  'auth/setOnboardingComplete',
  async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    await SecureStore.setItemAsync('hasSeenOnboarding', 'true').catch(() => {});
  },
);

// ---------------------------------------------------------------------------

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    /** 'loading' while initializeAuth runs, then 'authenticated' or 'unauthenticated' */
    status: 'loading',
    hasSeenOnboarding: false,
    user: null,
    accessToken: null,
  },
  reducers: {
    // Sync action used by the API interceptor when a 401 is received
    clearAuth: (state) => {
      state.accessToken = null;
      state.user = null;
      state.status = 'unauthenticated';
    },
  },
  extraReducers: (builder) => {
    builder
      // initializeAuth — storage-only, no network
      .addCase(initializeAuth.fulfilled, (state, action) => {
        const { hasSeenOnboarding, accessToken } = action.payload;
        state.hasSeenOnboarding = hasSeenOnboarding;
        state.accessToken = accessToken;
        state.status = accessToken ? 'authenticated' : 'unauthenticated';
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.status = 'unauthenticated';
      })

      // fetchUserProfile — populates user after entering the main stack
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })

      // loginSuccess — OTP/password login; profile fetched while server is reachable
      .addCase(loginSuccess.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.status = 'authenticated';
      })

      // logoutUser
      .addCase(logoutUser.fulfilled, (state) => {
        state.accessToken = null;
        state.user = null;
        state.status = 'unauthenticated';
      })

      // setOnboardingComplete
      .addCase(setOnboardingComplete.fulfilled, (state) => {
        state.hasSeenOnboarding = true;
      });
  },
});

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;

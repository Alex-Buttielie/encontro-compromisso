import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  onboardingActive: boolean;
  onboardingStep: number;
  onboardingCompleted: boolean;
}

const initialState: UiState = {
  sidebarOpen: false,
  onboardingActive: false,
  onboardingStep: 0,
  onboardingCompleted: typeof localStorage !== 'undefined'
    ? localStorage.getItem('onboarding_completed') === 'true'
    : false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    startOnboarding: (state) => {
      if (!state.onboardingCompleted) {
        state.onboardingActive = true;
        state.onboardingStep = 0;
      }
    },
    setOnboardingStep: (state, action: PayloadAction<number>) => {
      state.onboardingStep = action.payload;
    },
    completeOnboarding: (state) => {
      state.onboardingActive = false;
      state.onboardingCompleted = true;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('onboarding_completed', 'true');
      }
    },
    skipOnboarding: (state) => {
      state.onboardingActive = false;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  startOnboarding,
  setOnboardingStep,
  completeOnboarding,
  skipOnboarding,
} = uiSlice.actions;

export default uiSlice.reducer;

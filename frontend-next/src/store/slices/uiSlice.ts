import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  onboardingActive: boolean;
  onboardingStep: number;
  onboardingCompleted: boolean;
  onboardingEtapa: string | null;
  dismissedEtapas: string[];
}

function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('onboarding_completed') === 'true';
}

function getDismissedEtapas(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('dismissed_etapas') || '[]'); } catch { return []; }
}

const initialState: UiState = {
  sidebarOpen: false,
  onboardingActive: false,
  onboardingStep: 0,
  onboardingCompleted: false,
  onboardingEtapa: null,
  dismissedEtapas: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    hydrateUi: (state) => {
      state.onboardingCompleted = isOnboardingCompleted();
      state.dismissedEtapas = getDismissedEtapas();
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    startOnboarding: (state, action: PayloadAction<string | undefined>) => {
      if (!state.onboardingCompleted) {
        state.onboardingActive = true;
        state.onboardingStep = 0;
        state.onboardingEtapa = action.payload ?? 'canteiro';
      }
    },
    setOnboardingStep: (state, action: PayloadAction<number>) => {
      state.onboardingStep = action.payload;
    },
    setOnboardingEtapa: (state, action: PayloadAction<string>) => {
      state.onboardingEtapa = action.payload;
      state.onboardingStep = 0;
    },
    completeOnboarding: (state) => {
      state.onboardingActive = false;
      state.onboardingCompleted = true;
      if (typeof window !== 'undefined') localStorage.setItem('onboarding_completed', 'true');
    },
    skipOnboarding: (state) => {
      state.onboardingActive = false;
    },
    dismissEtapaHint: (state, action: PayloadAction<string>) => {
      if (!state.dismissedEtapas.includes(action.payload)) {
        state.dismissedEtapas.push(action.payload);
        if (typeof window !== 'undefined') localStorage.setItem('dismissed_etapas', JSON.stringify(state.dismissedEtapas));
      }
    },
  },
});

export const { hydrateUi, toggleSidebar, setSidebarOpen, startOnboarding, setOnboardingStep, setOnboardingEtapa, completeOnboarding, skipOnboarding, dismissEtapaHint } = uiSlice.actions;
export default uiSlice.reducer;

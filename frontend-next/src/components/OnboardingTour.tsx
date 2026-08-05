'use client';

import { useEffect } from 'react';
import { Joyride, type Step, STATUS, EVENTS, type EventData } from 'react-joyride';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  startOnboarding,
  setOnboardingStep,
  completeOnboarding,
} from '@/store/slices/uiSlice';

const steps: Step[] = [
  {
    target: '[data-tour="dashboard"]',
    content: 'Bem-vindo! Este é seu dashboard com o resumo do seu negócio.',
  },
  {
    target: '[data-tour="sidebar-clients"]',
    content: 'Aqui você gerencia seus clientes — cadastro, busca e histórico.',
  },
  {
    target: '[data-tour="sidebar-agenda"]',
    content: 'Sua agenda de agendamentos. Confirme, cancele e conclua atendimentos.',
  },
  {
    target: '[data-tour="sidebar-finance"]',
    content: 'Controle financeiro: receitas, despesas e relatórios.',
  },
  {
    target: '[data-tour="sidebar-works"]',
    content: 'Crie trabalhos personalizados com campos customizados para seus clientes.',
  },
  {
    target: '[data-tour="sidebar-settings"]',
    content: 'Configure seu perfil, profissão e link público.',
  },
];

export function OnboardingTour() {
  const dispatch = useAppDispatch();
  const { onboardingActive, onboardingStep, onboardingCompleted } = useAppSelector((s) => s.ui);
  const { user, initialized } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (initialized && user && !onboardingCompleted && !onboardingActive) {
      dispatch(startOnboarding());
    }
  }, [initialized, user, onboardingCompleted, onboardingActive, dispatch]);

  if (!onboardingActive) return null;

  return (
    <Joyride
      steps={steps}
      run={onboardingActive}
      stepIndex={onboardingStep}
      continuous
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        skip: 'Pular',
      }}
      options={{
        primaryColor: '#1976d2',
        zIndex: 10000,
        skipBeacon: true,
        showProgress: true,
        buttons: ['back', 'close', 'primary', 'skip'],
      }}
      onEvent={(data: EventData) => {
        const { status, index, type } = data;
        if (type === EVENTS.STEP_AFTER && index !== undefined) {
          dispatch(setOnboardingStep(index + 1));
        }
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
          dispatch(completeOnboarding());
        }
      }}
    />
  );
}

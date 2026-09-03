'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Joyride, type Step, STATUS, EVENTS } from 'react-joyride';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { hydrateUi, startOnboarding, setOnboardingStep, completeOnboarding } from '@/store/slices/uiSlice';
import { getEtapaByPath } from '@/config/navigation';

const etapaSteps: Record<string, Step[]> = {
  canteiro: [
    { target: '[data-tour="dashboard"]', content: 'Bem-vindo ao Canteiro. Aqui começa sua Fundação: dashboard e visão geral.' },
    { target: '[data-tour="sidebar-settings"]', content: 'Configure seu Perfil e endereço para desbloquear as próximas etapas.' },
  ],
  captacao: [
    { target: '[data-tour="sidebar-clients"]', content: 'Etapa Captação: gerencie seus clientes — cadastro, busca e histórico.' },
    { target: '[data-tour="sidebar-clients"]', content: 'Use CRM para acompanhar LTV e fidelização. Uma etapa de cada vez.' },
  ],
  obra: [
    { target: '[data-tour="sidebar-agenda"]', content: 'Etapa Obra: sua agenda diária. Confirme, cancele e conclua atendimentos.' },
    { target: '[data-tour="sidebar-works"]', content: 'Crie trabalhos com campos personalizados. Tudo flui da agenda para o acabamento.' },
  ],
  acabamento: [
    { target: '[data-tour="sidebar-finance"]', content: 'Etapa Acabamento: fluxo de caixa, pagamentos e carteira em sequência lógica.' },
  ],
  entrega: [
    { target: '[data-tour="dashboard"]', content: 'Etapa Entrega: Analytics e Automações para escalar o que já está estável.' },
  ],
  fallback: [
    { target: '[data-tour="dashboard"]', content: 'Bem-vindo! Navegue em 5 etapas: Fundação → Captação → Obra → Acabamento → Entrega.' },
    { target: '[data-tour="sidebar-clients"]', content: 'Aqui você gerencia seus clientes.' },
    { target: '[data-tour="sidebar-agenda"]', content: 'Sua agenda de agendamentos.' },
    { target: '[data-tour="sidebar-finance"]', content: 'Controle financeiro em acabamento.' },
    { target: '[data-tour="sidebar-works"]', content: 'Trabalhos personalizados na etapa Obra.' },
    { target: '[data-tour="sidebar-settings"]', content: 'Configure perfil na Fundação.' },
  ],
};

export function OnboardingTour() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { onboardingActive, onboardingStep, onboardingCompleted, onboardingEtapa } = useAppSelector(s => s.ui);
  const { user } = useAppSelector(s => s.auth);
  const activeEtapa = getEtapaByPath(pathname || '')?.id ?? onboardingEtapa ?? 'fallback';
  const steps = etapaSteps[onboardingEtapa || activeEtapa] ?? etapaSteps.fallback;

  useEffect(() => { dispatch(hydrateUi()); }, [dispatch]);

  useEffect(() => {
    if (user && !onboardingCompleted && !onboardingActive) {
      const etapaId = getEtapaByPath(pathname || '')?.id ?? 'canteiro';
      dispatch(startOnboarding(etapaId));
    }
  }, [user, onboardingCompleted, onboardingActive, pathname, dispatch]);

  if (!onboardingActive) return null;
  const clamped = Math.min(onboardingStep, steps.length - 1);

  return (
    <Joyride
      steps={steps}
      run={onboardingActive}
      stepIndex={clamped}
      continuous
      locale={{ back: 'Voltar', close: 'Fechar', last: 'Concluir', next: 'Próximo', skip: 'Pular' }}
      options={{ primaryColor: '#6366f1' }}
      onEvent={(data: unknown) => {
        const d = data as { status?: string; index?: number; type?: string };
        if (d.type === EVENTS.STEP_AFTER && d.index !== undefined) dispatch(setOnboardingStep(d.index + 1));
        if (d.status === STATUS.FINISHED || d.status === STATUS.SKIPPED) dispatch(completeOnboarding());
      }}
    />
  );
}

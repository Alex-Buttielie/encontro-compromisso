'use client';

import { Box, Stepper, Step, StepButton, StepLabel, useMediaQuery, useTheme } from '@mui/material';
import { Check } from 'lucide-react';
import { navEtapas } from '@/config/navigation';

interface Props {
  activeStep: number;
  onStepClick?: (id: string) => void;
}

export function EtapaStepper({ activeStep, onStepClick }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const activeIndex = Math.max(0, navEtapas.findIndex(e => e.step === activeStep));

  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        {navEtapas.map(etapa => {
          const isActive = etapa.step === activeStep;
          const isPast = etapa.step < activeStep;
          return (
            <Box
              key={etapa.id}
              onClick={() => onStepClick?.(etapa.id)}
              role="button"
              tabIndex={0}
              aria-label={`Ir para etapa ${etapa.label}`}
              onKeyDown={e => { if (e.key === 'Enter') onStepClick?.(etapa.id); }}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.5, borderRadius: 999,
                cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 600,
                bgcolor: isActive ? 'primary.main' : isPast ? 'success.light' : 'action.hover',
                color: isActive || isPast ? 'white' : 'text.secondary',
                border: `1px solid ${isActive ? theme.palette.primary.main : 'transparent'}`,
              }}
            >
              {isPast ? <Check size={12} /> : etapa.icon}
              {etapa.label}
            </Box>
          );
        })}
      </Box>
    );
  }

  return (
    <Stepper activeStep={activeIndex} alternativeLabel sx={{ flex: 1, maxWidth: 640 }}>
      {navEtapas.map(etapa => {
        const isPast = etapa.step < activeStep;
        return (
          <Step key={etapa.id} completed={isPast}>
            <StepButton onClick={() => onStepClick?.(etapa.id)} aria-label={`Etapa ${etapa.step}: ${etapa.label}`}>
              <StepLabel StepIconProps={{ style: { color: isPast ? theme.palette.success.main : undefined } }} sx={{ '& .MuiStepLabel-label': { fontSize: 11, fontWeight: 600 } }}>
                {etapa.label}
              </StepLabel>
            </StepButton>
          </Step>
        );
      })}
    </Stepper>
  );
}

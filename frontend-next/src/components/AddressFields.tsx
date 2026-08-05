'use client';

import { useState, useEffect } from 'react';
import { Grid2 as Grid, TextField, CircularProgress, Autocomplete } from '@mui/material';
import { fetchCep, formatCep } from '@/utils/helpers';
import { BRAZILIAN_STATES } from '@/config/autocompletes';

interface AddressFieldsProps {
  values: { cep?: string; rua?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; estado?: string };
  onChange: (field: string, value: string) => void;
}

export function AddressFields({ values, onChange }: AddressFieldsProps) {
  const [loadingCep, setLoadingCep] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const estadoObj = BRAZILIAN_STATES.find(s => s.value === values.estado) || null;

  useEffect(() => {
    if (!values.estado) { setCities([]); return; }
    setLoadingCities(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${values.estado}/municipios`)
      .then(r => r.json())
      .then((data: { nome: string }[]) => setCities(data.map(c => c.nome).sort()))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [values.estado]);

  const handleCepBlur = async () => {
    const cep = values.cep?.replace(/\D/g, '') || '';
    if (cep.length !== 8) return;
    setLoadingCep(true);
    const data = await fetchCep(cep);
    setLoadingCep(false);
    if (!data.erro) {
      if (data.logradouro) onChange('rua', data.logradouro);
      if (data.bairro) onChange('bairro', data.bairro);
      if (data.localidade) onChange('cidade', data.localidade);
      if (data.uf) onChange('estado', data.uf);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField label="CEP" value={formatCep(values.cep || '')} onChange={e => onChange('cep', e.target.value.replace(/\D/g, ''))} onBlur={handleCepBlur} inputProps={{ maxLength: 9 }} InputProps={{ endAdornment: loadingCep ? <CircularProgress size={16} /> : null }} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField label="Rua" value={values.rua || ''} onChange={e => onChange('rua', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 6, sm: 2 }}>
        <TextField label="Número" value={values.numero || ''} onChange={e => onChange('numero', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4 }}>
        <TextField label="Complemento" value={values.complemento || ''} onChange={e => onChange('complemento', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <TextField label="Bairro" value={values.bairro || ''} onChange={e => onChange('bairro', e.target.value)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }}>
        <Autocomplete
          freeSolo
          options={cities}
          loading={loadingCities}
          value={values.cidade || null}
          onChange={(_, v) => onChange('cidade', v || '')}
          onInputChange={(_, v) => onChange('cidade', v)}
          renderInput={params => <TextField {...params} label="Cidade" InputProps={{ ...params.InputProps, endAdornment: <>{params.InputProps.endAdornment}{loadingCities && <CircularProgress size={16} />}</> }} />}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 2 }}>
        <Autocomplete
          options={BRAZILIAN_STATES}
          value={estadoObj}
          onChange={(_, v) => onChange('estado', v?.value || '')}
          getOptionLabel={o => (typeof o === 'string' ? o : o.value)}
          renderOption={(props, option) => <li {...props}>{option.label} ({option.value})</li>}
          renderInput={params => <TextField {...params} label="Estado" inputProps={{ ...params.inputProps, maxLength: 2 }} />}
          isOptionEqualToValue={(a, b) => a.value === b?.value}
        />
      </Grid>
    </Grid>
  );
}

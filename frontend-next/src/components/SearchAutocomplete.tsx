'use client';

import { useState, useEffect, useMemo } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchAutocompleteProps {
  placeholder: string;
  options: { label: string; value?: string | number }[];
  onSearch: (query: string) => void;
  onSelect?: (value: string | number | null) => void;
  loading?: boolean;
  freeSolo?: boolean;
}

export function SearchAutocomplete({ placeholder, options, onSearch, onSelect, loading = false, freeSolo = true }: SearchAutocompleteProps) {
  const [input, setInput] = useState('');
  const debounced = useDebounce(input, 300);

  useEffect(() => { onSearch(debounced); }, [debounced]);

  const filtered = useMemo(() => {
    if (!input.trim()) return options;
    const q = input.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, input]);

  return (
    <Autocomplete
      freeSolo={freeSolo}
      options={filtered}
      loading={loading}
      inputValue={input}
      onInputChange={(_, v) => setInput(v)}
      onChange={(_, v) => {
        if (typeof v === 'string') { onSelect?.(v || null); }
        else if (v && typeof v === 'object') { onSelect?.(v.value ?? v.label); }
        else { onSelect?.(null); }
      }}
      getOptionLabel={o => (typeof o === 'string' ? o : o.label)}
      renderInput={params => (
        <TextField {...params} placeholder={placeholder} aria-label={placeholder}
          InputProps={{ ...params.InputProps, startAdornment: <Search size={18} style={{ marginRight: 8, color: 'grey' }} aria-hidden />, endAdornment: <>{params.InputProps.endAdornment}{loading && <CircularProgress size={16} aria-label="Buscando" />}</> }}
        />
      )}
      sx={{ mb: 2 }}
    />
  );
}

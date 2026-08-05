'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { crmApi } from '@/services/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { CRMClient } from '@/types';

export default function CRMPage() {
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { const r = await crmApi.getClients(); setClients(r.crmClients || []); setLoading(false); })(); }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>CRM</Typography>
      <TableContainer component={Paper}>
        <Table><TableHead><TableRow><TableCell>Nome</TableCell><TableCell>Email</TableCell><TableCell>Status</TableCell><TableCell>Último contato</TableCell><TableCell>LTV</TableCell></TableRow></TableHead>
          <TableBody>{clients.map(c => (<TableRow key={c.id}><TableCell>{c.name}</TableCell><TableCell>{c.email}</TableCell><TableCell><Chip label={c.status} size="small" color={c.status === 'active' ? 'success' : 'default'} /></TableCell><TableCell>{c.lastContact}</TableCell><TableCell>{c.ltv}</TableCell></TableRow>))}</TableBody></Table>
      </TableContainer>
    </Box>
  );
}

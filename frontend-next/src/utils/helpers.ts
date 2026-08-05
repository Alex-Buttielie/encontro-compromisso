export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR').format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d);
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendente', confirmed: 'Confirmado', completed: 'Concluído',
    cancelled: 'Cancelado', scheduled: 'Agendado', accepted: 'Aceito',
    rejected: 'Rejeitado', paid: 'Pago', active: 'Ativo', inactive: 'Inativo',
  };
  return labels[status] || status;
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    beauty: 'Beleza', health: 'Saúde', fitness: 'Fitness', consulting: 'Consultoria',
    education: 'Educação', repair: 'Reparo', other: 'Outro',
  };
  return labels[category] || category;
}

export function formatCep(cep: string): string {
  const digits = cep.replace(/\D/g, '');
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

export async function fetchCep(cep: string): Promise<{ logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean }> {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return {};
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    return await res.json();
  } catch {
    return {};
  }
}

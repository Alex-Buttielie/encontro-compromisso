import React from 'react';
import {
  HardHat, Users, Wrench, DollarSign, Rocket, Shield,
  LayoutDashboard, CalendarDays, Briefcase, ShoppingCart,
  UserCog, FileText, FileCheck, MessageSquare, Newspaper, Bell,
  Boxes, Package, CreditCard, Wallet, Percent, BarChart3, Workflow,
  Megaphone, Gift, Star, Repeat, Share2, Building2, UsersRound, Home as HomeIcon, Bot
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  description?: string;
}

export interface NavEtapa {
  id: string;
  step: number;
  title: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  items: NavItem[];
}

function ic(C: React.ElementType, size = 18) {
  return React.createElement(C, { size });
}

export const navEtapas: NavEtapa[] = [
  {
    id: 'canteiro',
    step: 1,
    title: 'Fundação',
    label: 'Fundação',
    description: 'Prepare seu canteiro de obras',
    icon: ic(HardHat),
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: ic(LayoutDashboard), roles: ['provider'], description: 'Visão geral' },
      { label: 'Início', href: '/home', icon: ic(HomeIcon), roles: ['client'], description: 'Seu painel' },
      { label: 'Perfil', href: '/profile', icon: ic(UserCog), description: 'Seus dados e endereço' },
      { label: 'Serviços', href: '/services', icon: ic(Wrench), roles: ['provider'], description: 'O que você oferece' },
      { label: 'Equipe', href: '/employees', icon: ic(UsersRound), roles: ['provider'], description: 'Quem trabalha com você' },
      { label: 'Unidades', href: '/branches', icon: ic(Building2), roles: ['provider'], description: 'Onde você atende' },
    ],
  },
  {
    id: 'captacao',
    step: 2,
    title: 'Captação',
    label: 'Captação',
    description: 'Conquiste e gerencie clientes',
    icon: ic(Users),
    items: [
      { label: 'Clientes', href: '/clients', icon: ic(Users), roles: ['provider'], description: 'Base de clientes' },
      { label: 'CRM', href: '/crm', icon: ic(UserCog), roles: ['provider'], description: 'Relacionamento e LTV' },
      { label: 'Explorar', href: '/explore', icon: ic(Briefcase), roles: ['client'], description: 'Descubra profissionais' },
      { label: 'Marketing', href: '/marketing', icon: ic(Megaphone), roles: ['provider'], description: 'Campanhas' },
      { label: 'Feed', href: '/social', icon: ic(Newspaper), description: 'Rede e engajamento' },
      { label: 'Chat', href: '/chat', icon: ic(MessageSquare), description: 'Conversas' },
    ],
  },
  {
    id: 'obra',
    step: 3,
    title: 'Obra',
    label: 'Obra',
    description: 'Execução diária',
    icon: ic(Wrench),
    items: [
      { label: 'Agenda', href: '/agenda', icon: ic(CalendarDays), roles: ['provider'], description: 'Agendamentos' },
      { label: 'Domiciliar', href: '/homecare', icon: ic(HomeIcon), roles: ['provider'], description: 'Atendimentos em casa' },
      { label: 'Trabalhos', href: '/works', icon: ic(Briefcase), roles: ['provider'], description: 'Trabalhos personalizados' },
      { label: 'Pedidos', href: '/orders', icon: ic(ShoppingCart), roles: ['provider'], description: 'Pedidos recebidos' },
      { label: 'Meus Pedidos', href: '/my-orders', icon: ic(ShoppingCart), roles: ['client'], description: 'Seus pedidos' },
      { label: 'Orçamentos', href: '/quotes', icon: ic(FileCheck), roles: ['provider'], description: 'Propostas' },
      { label: 'Contratos', href: '/contracts', icon: ic(FileText), roles: ['provider'], description: 'Contratos' },
    ],
  },
  {
    id: 'acabamento',
    step: 4,
    title: 'Acabamento',
    label: 'Acabamento',
    description: 'Financeiro e catálogo',
    icon: ic(DollarSign),
    items: [
      { label: 'Financeiro', href: '/finance', icon: ic(DollarSign), roles: ['provider'], description: 'Fluxo de caixa' },
      { label: 'Pagamentos', href: '/payments', icon: ic(CreditCard), roles: ['provider'], description: 'Cobranças e reembolsos' },
      { label: 'Carteira', href: '/wallet', icon: ic(Wallet), description: 'Saldo e transferências' },
      { label: 'Comissões', href: '/commissions', icon: ic(Percent), roles: ['provider'], description: 'Repasses' },
      { label: 'Estoque', href: '/inventory', icon: ic(Boxes), roles: ['provider'], description: 'Insumos' },
      { label: 'Pacotes', href: '/packages', icon: ic(Package), description: 'Pacotes e sessões' },
    ],
  },
  {
    id: 'entrega',
    step: 5,
    title: 'Entrega',
    label: 'Entrega',
    description: 'Crescimento e fidelização',
    icon: ic(Rocket),
    items: [
      { label: 'Analytics', href: '/analytics', icon: ic(BarChart3), roles: ['provider'], description: 'Métricas' },
      { label: 'Automações', href: '/workflows', icon: ic(Workflow), roles: ['provider'], description: 'Workflows' },
      { label: 'Agentes IA', href: '/ai-agents', icon: ic(Bot), roles: ['provider'], description: 'Assistentes' },
      { label: 'Fidelização', href: '/loyalty', icon: ic(Star), description: 'Pontos e nível' },
      { label: 'Gift Cards', href: '/gift-cards', icon: ic(Gift), description: 'Vales' },
      { label: 'Indicações', href: '/referrals', icon: ic(Share2), description: 'Indique e ganhe' },
      { label: 'Assinaturas', href: '/subscriptions', icon: ic(Repeat), description: 'Recorrência' },
      { label: 'Notificações', href: '/notifications', icon: ic(Bell), description: 'Avisos' },
    ],
  },
];

export const sistemaItems: NavItem[] = [
  { label: 'Admin', href: '/admin', icon: ic(Shield), roles: ['admin'] },
  { label: 'Chaves API', href: '/api-keys', icon: ic(Shield), roles: ['admin'] },
  { label: 'Webhooks', href: '/webhooks', icon: ic(Workflow), roles: ['admin'] },
  { label: 'Feature Flags', href: '/feature-flags', icon: ic(Workflow), roles: ['admin'] },
  { label: 'LGPD', href: '/lgpd', icon: ic(Shield) },
];

export function getEtapaByPath(pathname: string): NavEtapa | undefined {
  return navEtapas.find(e => e.items.some(i => i.href === pathname));
}

export function getNavItemByPath(pathname: string): NavItem | undefined {
  const all = [...navEtapas.flatMap(e => e.items), ...sistemaItems];
  return all.find(i => i.href === pathname);
}

export function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const etapa = getEtapaByPath(pathname);
  const item = getNavItemByPath(pathname);
  const crumbs: { label: string; href?: string }[] = [{ label: 'Início', href: '/dashboard' }];
  if (etapa) crumbs.push({ label: etapa.label, href: undefined });
  if (item) crumbs.push({ label: item.label });
  else if (pathname !== '/dashboard' && pathname !== '/' && pathname !== '/home') {
    const last = pathname.split('/').pop() || pathname;
    crumbs.push({ label: last.charAt(0).toUpperCase() + last.slice(1) });
  }
  return crumbs;
}

export const allNavItems: NavItem[] = [...navEtapas.flatMap(e => e.items), ...sistemaItems];

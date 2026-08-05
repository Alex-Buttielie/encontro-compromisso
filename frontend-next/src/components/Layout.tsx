'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppBar, Box, CssBaseline, Drawer, IconButton, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Typography, Divider, Avatar, Menu, MenuItem,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon, LayoutDashboard, CalendarDays, Users, Wrench, Briefcase, ShoppingCart,
  DollarSign, Wallet, Star, Gift, Package, UserCog, Boxes, Megaphone, BarChart3,
  UsersRound, Percent, Building2, FileText, FileCheck, MessageSquare, Newspaper,
  Bell, Workflow, Home as HomeIcon, CreditCard, Repeat, Share2, Bot, Shield,
  Key, Webhook, Lock, ToggleLeft, LogOut, Globe,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

const DRAWER_WIDTH = 280;

interface NavItem { label: string; href: string; icon: React.ReactNode; roles?: string[]; }
interface NavSection { title: string; items: NavItem[]; }

const navSections: NavSection[] = [
  { title: 'Principal', items: [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['provider'] },
    { label: 'Agenda', href: '/agenda', icon: <CalendarDays size={20} />, roles: ['provider'] },
    { label: 'Clientes', href: '/clients', icon: <Users size={20} />, roles: ['provider'] },
    { label: 'Serviços', href: '/services', icon: <Wrench size={20} />, roles: ['provider'] },
    { label: 'Financeiro', href: '/finance', icon: <DollarSign size={20} />, roles: ['provider'] },
    { label: 'Início', href: '/home', icon: <HomeIcon size={20} />, roles: ['client'] },
    { label: 'Explorar', href: '/explore', icon: <Briefcase size={20} />, roles: ['client'] },
    { label: 'Meus Pedidos', href: '/my-orders', icon: <ShoppingCart size={20} />, roles: ['client'] },
  ]},
  { title: 'Monetização', items: [
    { label: 'Pagamentos', href: '/payments', icon: <CreditCard size={20} />, roles: ['provider'] },
    { label: 'Carteira', href: '/wallet', icon: <Wallet size={20} />, roles: ['provider', 'client'] },
    { label: 'Fidelização', href: '/loyalty', icon: <Star size={20} />, roles: ['provider', 'client'] },
    { label: 'Pacotes', href: '/packages', icon: <Package size={20} />, roles: ['provider', 'client'] },
    { label: 'Gift Cards', href: '/gift-cards', icon: <Gift size={20} />, roles: ['provider', 'client'] },
  ]},
  { title: 'Gestão', items: [
    { label: 'CRM', href: '/crm', icon: <UserCog size={20} />, roles: ['provider'] },
    { label: 'Estoque', href: '/inventory', icon: <Boxes size={20} />, roles: ['provider'] },
    { label: 'Marketing', href: '/marketing', icon: <Megaphone size={20} />, roles: ['provider'] },
    { label: 'Analytics', href: '/analytics', icon: <BarChart3 size={20} />, roles: ['provider'] },
  ]},
  { title: 'Operação', items: [
    { label: 'Trabalhos', href: '/works', icon: <Briefcase size={20} />, roles: ['provider'] },
    { label: 'Pedidos', href: '/orders', icon: <ShoppingCart size={20} />, roles: ['provider'] },
    { label: 'Equipe', href: '/employees', icon: <UsersRound size={20} />, roles: ['provider'] },
    { label: 'Comissões', href: '/commissions', icon: <Percent size={20} />, roles: ['provider'] },
    { label: 'Unidades', href: '/branches', icon: <Building2 size={20} />, roles: ['provider'] },
    { label: 'Contratos', href: '/contracts', icon: <FileText size={20} />, roles: ['provider'] },
    { label: 'Orçamentos', href: '/quotes', icon: <FileCheck size={20} />, roles: ['provider'] },
  ]},
  { title: 'Engajamento', items: [
    { label: 'Chat', href: '/chat', icon: <MessageSquare size={20} /> },
    { label: 'Feed', href: '/social', icon: <Newspaper size={20} /> },
    { label: 'Notificações', href: '/notifications', icon: <Bell size={20} /> },
  ]},
  { title: 'Automação', items: [
    { label: 'Automações', href: '/workflows', icon: <Workflow size={20} />, roles: ['provider'] },
    { label: 'Domiciliar', href: '/homecare', icon: <HomeIcon size={20} />, roles: ['provider'] },
  ]},
  { title: 'Plataforma', items: [
    { label: 'Assinaturas', href: '/subscriptions', icon: <Repeat size={20} /> },
    { label: 'Indicações', href: '/referrals', icon: <Share2 size={20} /> },
    { label: 'Agentes IA', href: '/ai-agents', icon: <Bot size={20} />, roles: ['provider'] },
  ]},
  { title: 'Sistema', items: [
    { label: 'Admin', href: '/admin', icon: <Shield size={20} />, roles: ['admin'] },
    { label: 'Chaves API', href: '/api-keys', icon: <Key size={20} />, roles: ['admin'] },
    { label: 'Webhooks', href: '/webhooks', icon: <Webhook size={20} />, roles: ['admin'] },
    { label: 'LGPD', href: '/lgpd', icon: <Lock size={20} /> },
    { label: 'Feature Flags', href: '/feature-flags', icon: <ToggleLeft size={20} />, roles: ['admin'] },
  ]},
];

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const filteredSections = navSections
    .map(s => ({ ...s, items: s.items.filter(i => !i.roles || (user && i.roles.includes(user.role))) }))
    .filter(s => s.items.length > 0);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Typography variant="h6" fontWeight={700} color="primary">Profissional OS</Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, overflowY: 'auto', px: 1 }} aria-label="Navegação principal">
        {filteredSections.map(section => (
          <Box key={section.title} sx={{ mb: 1 }} component="li">
            <Typography variant="overline" color="text.secondary" sx={{ px: 2, display: 'block' }} component="span">{section.title}</Typography>
            <List disablePadding aria-label={section.title}>
              {section.items.map(item => {
                const tourMap: Record<string, string> = {
                  '/dashboard': 'dashboard',
                  '/clients': 'sidebar-clients',
                  '/agenda': 'sidebar-agenda',
                  '/finance': 'sidebar-finance',
                  '/works': 'sidebar-works',
                  '/profile': 'sidebar-settings',
                };
                const isActive = pathname === item.href;
                return (
                <ListItem key={item.href} disablePadding>
                  <ListItemButton component={Link} href={item.href} selected={isActive}
                    data-tour={tourMap[item.href]}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={item.label}
                    onClick={() => isMobile && setMobileOpen(false)}
                    sx={{ borderRadius: 2, mb: 0.5, '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, '& .MuiListItemIcon-root': { color: 'white' } } }}>
                    <ListItemIcon sx={{ minWidth: 36 }} aria-hidden>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
                  </ListItemButton>
                </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </List>
      <Divider />
      <List sx={{ px: 1, py: 1 }} aria-label="Conta e sessão">
        <ListItem disablePadding>
          <ListItemButton component={Link} href="/profile" selected={pathname === '/profile'}
            data-tour="sidebar-settings"
            aria-current={pathname === '/profile' ? 'page' : undefined}
            aria-label="Perfil"
            onClick={() => isMobile && setMobileOpen(false)} sx={{ borderRadius: 2 }}>
            <ListItemIcon sx={{ minWidth: 36 }} aria-hidden><Users size={20} /></ListItemIcon>
            <ListItemText primary="Perfil" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => { logout(); router.push('/login'); }} aria-label="Sair" sx={{ borderRadius: 2 }}>
            <ListItemIcon sx={{ minWidth: 36 }} aria-hidden><LogOut size={20} /></ListItemIcon>
            <ListItemText primary="Sair" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: -9999,
          top: 0,
          zIndex: 10001,
          padding: '8px 16px',
          background: theme.palette.primary.main,
          color: '#fff',
          borderRadius: 4,
          textDecoration: 'none',
        }}
        onFocus={(e) => { e.currentTarget.style.left = '8px'; }}
        onBlur={(e) => { e.currentTarget.style.left = '-9999px'; }}
      >
        Pular para o conteúdo
      </a>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, bgcolor: 'background.paper', color: 'text.primary', boxShadow: 1 }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileOpen}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} component="h1">
            {filteredSections.flatMap(s => s.items).find(i => i.href === pathname)?.label || 'Profissional OS'}
          </Typography>
          <ThemeToggle />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0 }} aria-label="Menu do usuário" aria-haspopup="menu" aria-expanded={!!anchorEl}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }} role="img" aria-label={user ? `Avatar de ${user.name}` : 'Avatar'}>
              {user ? user.name.charAt(0).toUpperCase() : '?'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <MenuItem onClick={() => { setAnchorEl(null); router.push('/profile'); }} aria-label="Ir para perfil">Perfil</MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); logout(); router.push('/login'); }} aria-label="Sair da conta">Sair</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }} aria-label="Barra lateral">
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}>
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" id="main-content" tabIndex={-1} sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, minHeight: '100vh', bgcolor: 'background.default', outline: 'none' }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

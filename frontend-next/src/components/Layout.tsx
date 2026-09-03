'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppBar, Box, CssBaseline, Drawer, IconButton, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Typography, Divider, Avatar, Menu, MenuItem,
  Collapse, Chip, InputBase, useMediaQuery, useTheme,
} from '@mui/material';
import { Menu as MenuIcon, ChevronDown, ChevronUp, Search, LogOut, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { EtapaStepper } from '@/components/navigation/EtapaStepper';
import { AppBreadcrumb } from '@/components/navigation/AppBreadcrumb';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { navEtapas, sistemaItems, getEtapaByPath, getNavItemByPath } from '@/config/navigation';

const DRAWER_WIDTH = 280;

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const activeEtapa = getEtapaByPath(pathname || '');
  const activeStep = activeEtapa?.step ?? 1;
  const activeLabel = getNavItemByPath(pathname || '')?.label || 'Profissional OS';

  useEffect(() => {
    if (activeEtapa && expanded[activeEtapa.id] === undefined) {
      setExpanded(prev => ({ ...prev, [activeEtapa.id]: true }));
    }
  }, [activeEtapa]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(v => !v);
      }
      if (e.key === '/' && !commandOpen && (e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commandOpen]);

  const toggleEtapa = useCallback((id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const filteredEtapas = navEtapas
    .map(etapa => ({
      ...etapa,
      items: etapa.items.filter(i => !i.roles || (user && i.roles.includes(user.role))),
    }))
    .filter(e => e.items.length > 0);

  const filteredSistema = sistemaItems.filter(i => !i.roles || (user && i.roles?.includes(user.role)));

  const tourMap: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/clients': 'sidebar-clients',
    '/agenda': 'sidebar-agenda',
    '/finance': 'sidebar-finance',
    '/works': 'sidebar-works',
    '/profile': 'sidebar-settings',
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1 }}>
        <Typography variant="h6" fontWeight={800} color="primary" noWrap>Profissional OS</Typography>
        <Chip label={`Etapa ${activeStep}/5`} size="small" color="primary" variant="outlined" sx={{ ml: 'auto', fontSize: 10, height: 20 }} />
      </Toolbar>
      <Divider />
      <Box sx={{ p: 1, display: { xs: 'block', md: 'none' } }}>
        <Box onClick={() => setCommandOpen(true)} role="button" tabIndex={0} aria-label="Buscar navegação"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, borderRadius: 2, bgcolor: 'action.hover', cursor: 'pointer', color: 'text.secondary', fontSize: 13 }}>
          <Search size={16} /> Buscar... <Box component="span" sx={{ ml: 'auto', fontSize: 11, px: 0.75, py: 0.25, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>⌘K</Box>
        </Box>
      </Box>
      <List sx={{ flex: 1, overflowY: 'auto', px: 1, py: 0.5 }} aria-label="Navegação por etapas">
        {filteredEtapas.map(etapa => {
          const isActiveEtapa = activeEtapa?.id === etapa.id;
          const isExpanded = expanded[etapa.id] ?? isActiveEtapa;
          return (
            <Box key={etapa.id} component="li" sx={{ mb: 0.5 }}>
              <ListItemButton onClick={() => toggleEtapa(etapa.id)} aria-expanded={isExpanded} aria-label={`${etapa.label} etapa ${etapa.step}`}
                sx={{
                  borderRadius: 2, py: 0.75, px: 1,
                  bgcolor: isActiveEtapa ? 'primary.main' : 'transparent',
                  color: isActiveEtapa ? 'white' : 'text.primary',
                  '&:hover': { bgcolor: isActiveEtapa ? 'primary.dark' : 'action.hover' },
                  '& .MuiListItemIcon-root': { color: isActiveEtapa ? 'white' : 'text.secondary', minWidth: 30 },
                }}>
                <ListItemIcon sx={{ minWidth: 28 }} aria-hidden>{etapa.icon}</ListItemIcon>
                <ListItemText primary={`${etapa.step}. ${etapa.label}`} secondary={`${etapa.items.length} itens`}
                  primaryTypographyProps={{ fontSize: 13, fontWeight: isActiveEtapa ? 700 : 600 }}
                  secondaryTypographyProps={{ fontSize: 10, color: isActiveEtapa ? 'rgba(255,255,255,0.8)' : 'text.secondary' }} />
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </ListItemButton>
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <List disablePadding sx={{ pl: 1, mt: 0.5 }}>
                  {etapa.items.map(item => {
                    const isActive = pathname === item.href;
                    return (
                      <ListItem key={item.href} disablePadding>
                        <ListItemButton component={Link} href={item.href} selected={isActive}
                          data-tour={tourMap[item.href]}
                          aria-current={isActive ? 'page' : undefined}
                          aria-label={item.label}
                          onClick={() => isMobile && setMobileOpen(false)}
                          sx={{
                            borderRadius: 2, mb: 0.25, py: 0.6, pl: 2.5,
                            '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, '& .MuiListItemIcon-root': { color: 'white' } },
                          }}>
                          <ListItemIcon sx={{ minWidth: 30 }} aria-hidden>{item.icon}</ListItemIcon>
                          <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13 }} />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>
            </Box>
          );
        })}
        {filteredSistema.length > 0 && (
          <Box component="li" sx={{ mt: 1 }}>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="overline" color="text.secondary" sx={{ px: 2, display: 'block', fontSize: 10 }}>Sistema</Typography>
            <List disablePadding aria-label="Sistema">
              {filteredSistema.map(item => {
                const isActive = pathname === item.href;
                return (
                  <ListItem key={item.href} disablePadding>
                    <ListItemButton component={Link} href={item.href} selected={isActive} aria-current={isActive ? 'page' : undefined} aria-label={item.label}
                      onClick={() => isMobile && setMobileOpen(false)} sx={{ borderRadius: 2, mb: 0.25, py: 0.6, '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, '& .MuiListItemIcon-root': { color: 'white' } } }}>
                      <ListItemIcon sx={{ minWidth: 30 }} aria-hidden>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13 }} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}
      </List>
      <Divider />
      <List sx={{ px: 1, py: 1 }} aria-label="Conta e sessão">
        <ListItem disablePadding>
          <ListItemButton component={Link} href="/profile" selected={pathname === '/profile'}
            data-tour="sidebar-settings" aria-current={pathname === '/profile' ? 'page' : undefined} aria-label="Perfil"
            onClick={() => isMobile && setMobileOpen(false)} sx={{ borderRadius: 2 }}>
            <ListItemIcon sx={{ minWidth: 30 }} aria-hidden><Users size={18} /></ListItemIcon>
            <ListItemText primary="Perfil" primaryTypographyProps={{ fontSize: 13 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => { logout(); router.push('/login'); }} aria-label="Sair" sx={{ borderRadius: 2 }}>
            <ListItemIcon sx={{ minWidth: 30 }} aria-hidden><LogOut size={18} /></ListItemIcon>
            <ListItemText primary="Sair" primaryTypographyProps={{ fontSize: 13 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  const etapaForStepperNav = (id: string) => {
    const etapa = filteredEtapas.find(e => e.id === id);
    const first = etapa?.items[0];
    if (first) router.push(first.href);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <a href="#main-content" style={{ position: 'absolute', left: -9999, top: 0, zIndex: 10001, padding: '8px 16px', background: theme.palette.primary.main, color: '#fff', borderRadius: 4, textDecoration: 'none' }}
        onFocus={e => { e.currentTarget.style.left = '8px'; }} onBlur={e => { e.currentTarget.style.left = '-9999px'; }}>
        Pular para o conteúdo
      </a>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, bgcolor: 'background.paper', color: 'text.primary', boxShadow: 1 }}>
        <Toolbar sx={{ gap: 1, minHeight: { xs: 56, md: 64 } }}>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={mobileOpen}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" fontWeight={600} sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0, flexShrink: 0 }} component="h1" noWrap>
            {activeLabel}
          </Typography>
          <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', px: 2 }}>
            <EtapaStepper activeStep={activeStep} onStepClick={etapaForStepperNav} />
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, px: 1, py: 0.5, borderRadius: 999, bgcolor: 'action.hover', cursor: 'pointer', minWidth: 180, maxWidth: 260 }}
            onClick={() => setCommandOpen(true)} role="button" tabIndex={0} aria-label="Abrir busca rápida" onKeyDown={e => { if (e.key === 'Enter') setCommandOpen(true); }}>
            <Search size={14} style={{ opacity: 0.6 }} />
            <InputBase placeholder="Buscar (Ctrl+K)" readOnly sx={{ fontSize: 13, flex: 1, cursor: 'pointer' }} inputProps={{ 'aria-label': 'Buscar navegação' }} />
          </Box>
          <IconButton onClick={() => setCommandOpen(true)} aria-label="Buscar" sx={{ display: { md: 'none' } }}>
            <Search size={18} />
          </IconButton>
          <ThemeToggle />
          <IconButton onClick={e => setAnchorEl(e.currentTarget)} sx={{ p: 0, ml: 0.5 }} aria-label="Menu do usuário" aria-haspopup="menu" aria-expanded={!!anchorEl}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34, fontSize: 13 }} role="img" aria-label={user ? `Avatar de ${user.name}` : 'Avatar'}>
              {user ? user.name.charAt(0).toUpperCase() : '?'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <MenuItem onClick={() => { setAnchorEl(null); router.push('/profile'); }} aria-label="Ir para perfil">Perfil</MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); logout(); router.push('/login'); }} aria-label="Sair da conta">Sair</MenuItem>
          </Menu>
        </Toolbar>
        <Box sx={{ px: { xs: 2, md: 3 }, pb: 1, display: 'flex', alignItems: 'center', gap: 2, borderTop: `1px solid ${theme.palette.divider}`, pt: 1 }}>
          <AppBreadcrumb pathname={pathname || '/'} />
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flex: 1, overflowX: 'auto' }}>
            <EtapaStepper activeStep={activeStep} onStepClick={etapaForStepperNav} />
          </Box>
        </Box>
      </AppBar>
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }} aria-label="Barra lateral por etapas">
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}>
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" id="main-content" tabIndex={-1} sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, minHeight: '100vh', bgcolor: 'background.default', outline: 'none' }}>
        <Toolbar />
        <Toolbar variant="dense" sx={{ minHeight: 40 }} />
        {children}
      </Box>
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </Box>
  );
}

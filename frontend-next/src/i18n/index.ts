'use client';

import { initReactI18next } from 'react-i18next';
import i18next from 'i18next';

const ptBR = {
  translation: {
    common: { save: 'Salvar', cancel: 'Cancelar', delete: 'Excluir', edit: 'Editar', close: 'Fechar', search: 'Buscar', loading: 'Carregando...', confirm: 'Confirmar', back: 'Voltar', next: 'Próximo', previous: 'Anterior', actions: 'Ações', status: 'Status', date: 'Data', value: 'Valor', description: 'Descrição', name: 'Nome', email: 'E-mail', phone: 'Telefone', address: 'Endereço', logout: 'Sair', profile: 'Perfil', settings: 'Configurações', notifications: 'Notificações' },
    nav: { dashboard: 'Dashboard', agenda: 'Agenda', clients: 'Clientes', services: 'Serviços', works: 'Trabalhos', orders: 'Pedidos', finance: 'Financeiro', payments: 'Pagamentos', wallet: 'Carteira', loyalty: 'Fidelização', packages: 'Pacotes', giftCards: 'Gift Cards', crm: 'CRM', inventory: 'Estoque', marketing: 'Marketing', analytics: 'Analytics', employees: 'Equipe', commissions: 'Comissões', branches: 'Unidades', contracts: 'Contratos', quotes: 'Orçamentos', chat: 'Chat', social: 'Feed', workflows: 'Automações', homecare: 'Domiciliar', subscriptions: 'Assinaturas', referrals: 'Indicações', aiAgents: 'Agentes IA', admin: 'Admin', apiKeys: 'Chaves API', webhooks: 'Webhooks', lgpd: 'LGPD', featureFlags: 'Feature Flags', home: 'Início', explore: 'Explorar', myOrders: 'Meus Pedidos' },
    auth: { login: 'Entrar', register: 'Cadastrar', email: 'E-mail', password: 'Senha', name: 'Nome', role: 'Tipo de conta', provider: 'Prestador', client: 'Cliente', profession: 'Profissão', loginSuccess: 'Login realizado com sucesso', registerSuccess: 'Cadastro realizado com sucesso', loginError: 'E-mail ou senha inválidos', registerError: 'Erro ao cadastrar', welcome: 'Bem-vindo de volta', createAccount: 'Criar sua conta' },
    dashboard: { title: 'Dashboard', upcomingAppointments: 'Próximos Agendamentos', recentClients: 'Clientes Recentes', monthlyIncome: 'Receita do Mês', totalClients: 'Total de Clientes', totalServices: 'Serviços Ativos', pendingOrders: 'Pedidos Pendentes', noAppointments: 'Nenhum agendamento próximo', noClients: 'Nenhum cliente ainda' },
  },
};

const enUS = {
  translation: {
    common: { save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', close: 'Close', search: 'Search', loading: 'Loading...', confirm: 'Confirm', back: 'Back', next: 'Next', previous: 'Previous', actions: 'Actions', status: 'Status', date: 'Date', value: 'Value', description: 'Description', name: 'Name', email: 'Email', phone: 'Phone', address: 'Address', logout: 'Logout', profile: 'Profile', settings: 'Settings', notifications: 'Notifications' },
    nav: { dashboard: 'Dashboard', agenda: 'Schedule', clients: 'Clients', services: 'Services', works: 'Works', orders: 'Orders', finance: 'Finance', payments: 'Payments', wallet: 'Wallet', loyalty: 'Loyalty', packages: 'Packages', giftCards: 'Gift Cards', crm: 'CRM', inventory: 'Inventory', marketing: 'Marketing', analytics: 'Analytics', employees: 'Team', commissions: 'Commissions', branches: 'Branches', contracts: 'Contracts', quotes: 'Quotes', chat: 'Chat', social: 'Feed', workflows: 'Workflows', homecare: 'Home Care', subscriptions: 'Subscriptions', referrals: 'Referrals', aiAgents: 'AI Agents', admin: 'Admin', apiKeys: 'API Keys', webhooks: 'Webhooks', lgpd: 'LGPD', featureFlags: 'Feature Flags', home: 'Home', explore: 'Explore', myOrders: 'My Orders' },
    auth: { login: 'Login', register: 'Register', email: 'Email', password: 'Password', name: 'Name', role: 'Account type', provider: 'Provider', client: 'Client', profession: 'Profession', loginSuccess: 'Login successful', registerSuccess: 'Registration successful', loginError: 'Invalid email or password', registerError: 'Registration failed', welcome: 'Welcome back', createAccount: 'Create your account' },
    dashboard: { title: 'Dashboard', upcomingAppointments: 'Upcoming Appointments', recentClients: 'Recent Clients', monthlyIncome: 'Monthly Income', totalClients: 'Total Clients', totalServices: 'Active Services', pendingOrders: 'Pending Orders', noAppointments: 'No upcoming appointments', noClients: 'No clients yet' },
  },
};

const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('profissionalOS_lang') || 'pt-BR' : 'pt-BR';

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: { 'pt-BR': ptBR, 'en-US': enUS },
    lng: savedLang,
    fallbackLng: 'pt-BR',
    interpolation: { escapeValue: false },
  });
}

export default i18next;

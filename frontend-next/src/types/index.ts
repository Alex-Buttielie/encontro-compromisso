export type UserRole = 'provider' | 'client';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isProvider: boolean;
  isClient: boolean;
  profession?: string;
  phone?: string;
  address?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  bio?: string;
  link?: string;
  createdAt?: string;
}

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  notes?: string;
  userId: number;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  priceFormatted?: string;
  duration: number;
  homeAttendance?: boolean;
  category?: string;
  userId: number;
}

export interface Appointment {
  id: number;
  clientId: number;
  serviceId: number;
  date: string;
  time: string;
  status: string;
  notes?: string;
  clientName?: string;
  serviceName?: string;
  userId: number;
}

export interface Transaction {
  id: number;
  type: string;
  category: string;
  description: string;
  amount: number;
  amountFormatted?: string;
  date: string;
  paid: boolean;
  userId: number;
}

export interface FinancialSummary {
  balance: number;
  balanceFormatted?: string;
  monthlyIncome: number;
  monthlyIncomeFormatted?: string;
  monthlyExpense: number;
  monthlyExpenseFormatted?: string;
  pendingPayments: number;
}

export interface CustomField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
}

export interface Work {
  id: number;
  title: string;
  description?: string;
  price: number;
  priceFormatted?: string;
  category?: string;
  customFields: CustomField[];
  userId: number;
}

export interface WorkOrder {
  id: number;
  workId: number;
  workTitle?: string;
  clientUserId: number;
  clientName?: string;
  fieldData: Record<string, string>;
  notes?: string;
  status: string;
  createdAt: string;
}

export interface Payment {
  id: number;
  amount: number;
  amountFormatted?: string;
  method: string;
  description?: string;
  status: string;
  createdAt: string;
}

export interface Wallet {
  balance: number;
  balanceFormatted?: string;
}

export interface WalletTransaction {
  id: number;
  type: string;
  amount: number;
  amountFormatted?: string;
  description: string;
  createdAt: string;
}

export interface LoyaltyAccount {
  points: number;
  tier: string;
}

export interface ServicePackage {
  id: number;
  name: string;
  totalSessions: number;
  usedSessions?: number;
  remainingSessions?: number;
  price: number;
  priceFormatted?: string;
  validityDays?: number;
  expiresAt?: string;
  validUntil?: string;
  status?: string;
  statusLabel?: string;
  description?: string;
}

export interface GiftCard {
  id: number;
  code: string;
  amount: number;
  balance: number;
  status: string;
  statusLabel?: string;
  recipientEmail?: string;
  redeemedBy?: string | null;
  expiresAt?: string;
  validUntil?: string;
}

export interface CRMClient {
  id: number;
  name: string;
  email: string;
  segment: string;
  totalSpent: number;
  lastVisit: string;
  status: string;
  lastContact: string;
  ltv: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  unitPriceFormatted?: string;
  sku?: string;
  supplier?: string;
}

export interface Campaign {
  id: number;
  name: string;
  channel: string;
  segment?: string;
  status: string;
  createdAt: string;
  sentCount: number;
  openCount: number;
}

export interface AnalyticsData {
  revenue: number;
  appointments: number;
  clients: number;
  conversionRate: number;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  branchId?: number;
}

export interface Commission {
  id: number;
  employeeId: number;
  serviceId?: number;
  type: string;
  value: number;
  employeeName?: string;
  status: string;
}

export interface Branch {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  active: boolean;
}

export interface Contract {
  id: number;
  title: string;
  content: string;
  signed: boolean;
  createdAt: string;
}

export interface Quote {
  id: number;
  clientName: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  total: number;
  totalAmount: number;
  totalFormatted?: string;
  status: string;
  validUntil: string;
}

export interface Conversation {
  id: number;
  name: string;
  participantName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface Message {
  id: number;
  conversationId: number;
  content: string;
  type: string;
  sender: string;
  senderId: number;
  createdAt: string;
}

export interface SocialPost {
  id: number;
  authorName: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface Workflow {
  id: number;
  name: string;
  trigger: string;
  actions: string[];
  active: boolean;
}

export interface HomeCareVisit {
  id: number;
  clientName: string;
  address: string;
  distance?: number;
  travelFee?: number;
  travelFeeFormatted?: string;
  scheduledAt: string;
  status: string;
}

export interface Subscription {
  id: number;
  planName: string;
  billingCycle: string;
  status: string;
  createdAt: string;
  nextBillingDate?: string;
}

export interface Referral {
  id: number;
  referredName: string;
  referredEmail: string;
  status: string;
  reward?: string;
  createdAt: string;
}

export interface AIAgent {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
  consent: boolean;
  type: string;
  model: string;
  systemPrompt: string;
  active: boolean;
}

export interface AgentExecution {
  id: number;
  agentId: number;
  prompt: string;
  status: string;
  result?: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  action: string;
  actorId: number;
  actorRole: string;
  details: string;
  createdAt: string;
}

export interface FeatureFlag {
  id: number;
  key: string;
  enabled: boolean;
  description?: string;
}

export interface ApiKey {
  id: number;
  name: string;
  scopes: string[];
  key?: string;
  active: boolean;
  createdAt: string;
}

export interface Webhook {
  id: number;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

export interface DataRequest {
  id: number;
  requestType: string;
  status: string;
  createdAt: string;
}

export interface LGPDRequest {
  id: number;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export interface ApiResponse {
  success: boolean;
  errors?: string[];
  [key: string]: unknown;
}

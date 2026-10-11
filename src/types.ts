export type UserRole = 'SUPER_ADMIN' | 'FIELD_ADMIN' | 'PRODUCER' | 'VISITOR';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  role?: UserRole;
  farmName?: string;
  activity?: string;
  phone?: string;
  status?: 'ativo' | 'suspenso';
  createdAt?: string;
  updatedAt?: string;
}

export interface FieldAdminUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: 'FIELD_ADMIN' | 'SUPER_ADMIN';
  status: 'ativo' | 'suspenso';
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  assignedProducerIds?: string[];
  notes?: string;
  areaName?: string;
  inviteStatus?: 'convite_enviado' | 'convite_aceito' | 'acesso_concluido' | 'pendente';
  inviteLink?: string;
  inviteSentAt?: string;
  createdBy?: string;
  accountCreatedInAuth?: boolean;
}

export interface ProducerRecord {
  id: string;
  ownerAdminUid: string; // FIELD_ADMIN or SUPER_ADMIN responsible for this producer
  name: string;
  cpfCnpj?: string;
  email?: string;
  phone?: string;
  location?: string;
  mainActivity?: string;
  propertyCount?: number;
  status: 'ativo' | 'inativo';
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  notes?: string;
}

export interface AuditLogRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  role: UserRole;
  action: 'login' | 'create' | 'update' | 'delete' | 'status_change' | 'access_denied';
  recordType:
    | 'producer'
    | 'property'
    | 'production'
    | 'cost'
    | 'inventory'
    | 'sale'
    | 'customer'
    | 'supplier'
    | 'admin'
    | 'auth';
  recordId?: string;
  details: string;
  timestamp: string;
  ownerAdminUid?: string;
}

export interface AdminRecord {
  userId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'FIELD_ADMIN';
  status: 'ativo' | 'suspenso';
  createdAt: string;
}

export interface PropertyItem {
  id: string;
  userId: string;
  ownerAdminUid?: string;
  producerId?: string;
  name: string;
  location?: string;
  sizeHectares?: number;
  activityType?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  createdBy?: string;
}

export interface ProductionRecord {
  id: string;
  userId: string;
  ownerAdminUid?: string;
  producerId?: string;
  propertyId?: string;
  product: string;
  date: string;
  quantity: number;
  unit: string;
  areaPlot?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  createdBy?: string;
}

export type CostCategory =
  | 'insumos'
  | 'alimentacao'
  | 'mao_de_obra'
  | 'transporte'
  | 'energia'
  | 'manutencao'
  | 'equipamentos'
  | 'outros';

export interface CostRecord {
  id: string;
  userId: string;
  ownerAdminUid?: string;
  producerId?: string;
  propertyId?: string;
  date: string;
  category: CostCategory;
  description: string;
  amount: number;
  supplier?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  createdBy?: string;
}

export interface InventoryItem {
  id: string;
  userId: string;
  ownerAdminUid?: string;
  producerId?: string;
  propertyId?: string;
  item: string;
  unit: string;
  currentQuantity: number;
  minQuantity: number;
  unitCost?: number;
  supplier?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  createdBy?: string;
}

export type PaymentMethod =
  | 'pix'
  | 'dinheiro'
  | 'transferencia'
  | 'cartao'
  | 'boleto'
  | 'prazo';

export interface SaleRecord {
  id: string;
  userId: string;
  ownerAdminUid?: string;
  producerId?: string;
  propertyId?: string;
  date: string;
  product: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  customer?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  createdBy?: string;
}

export interface CustomerRecord {
  id: string;
  userId: string;
  ownerAdminUid?: string;
  producerId?: string;
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  createdBy?: string;
}

export interface SupplierRecord {
  id: string;
  userId: string;
  ownerAdminUid?: string;
  producerId?: string;
  name: string;
  phone?: string;
  suppliedProduct?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  createdBy?: string;
}

export type ActivePage =
  | 'landing'
  | 'dashboard'
  | 'global_admin'
  | 'produtores'
  | 'producao'
  | 'custos'
  | 'estoque'
  | 'vendas'
  | 'resultado'
  | 'clientes'
  | 'fornecedores'
  | 'relatorios'
  | 'auditoria'
  | 'testes'
  | 'ia'
  | 'configuracoes';

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '—';
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('pt-BR');
  }
  return dateStr;
}

export function formatBRL(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

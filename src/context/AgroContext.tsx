import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  FirebaseUser,
} from '../lib/firebase';
import {
  UserProfile,
  UserRole,
  FieldAdminUser,
  ProducerRecord,
  AuditLogRecord,
  PropertyItem,
  ProductionRecord,
  CostRecord,
  InventoryItem,
  SaleRecord,
  CustomerRecord,
  SupplierRecord,
} from '../types';
import {
  DEMO_PROPERTY,
  getDemoProductions,
  getDemoCosts,
  getDemoInventory,
  getDemoSales,
  getDemoCustomers,
  getDemoSuppliers,
  SEED_FIELD_ADMINS,
  SEED_PRODUCERS,
  SEED_AUDIT_LOGS,
} from '../lib/demoData';

// Pre-authorized administrator email for SUPER_ADMIN exclusively
export const AUTHORIZED_ADMIN_EMAIL = 'juliano.soares.inacio@gmail.com';

export type TestProfileKey =
  | 'SUPER_ADMIN'
  | 'FIELD_ADMIN_1'
  | 'FIELD_ADMIN_2'
  | 'FIELD_ADMIN_3'
  | 'PRODUCER'
  | 'VISITOR';

interface AgroContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  userRole: UserRole;
  isSuperAdmin: boolean;
  isFieldAdmin: boolean;
  isAdmin: boolean;
  isVisitor: boolean;
  isSuspended: boolean;
  property: PropertyItem | null;
  loading: boolean;
  isDemoMode: boolean;
  activeTestProfile: TestProfileKey | null;

  // Multi-tenancy entity lists
  fieldAdmins: FieldAdminUser[];
  producers: ProducerRecord[];
  auditLogs: AuditLogRecord[];

  // Area & Filter Controls
  selectedFieldAdminFilter: string | 'all';
  setSelectedFieldAdminFilter: (id: string | 'all') => void;
  selectedProducerFilter: string | 'all';
  setSelectedProducerFilter: (id: string | 'all') => void;

  // Operational records (Filtered according to role and active area)
  productions: ProductionRecord[];
  costs: CostRecord[];
  inventory: InventoryItem[];
  sales: SaleRecord[];
  customers: CustomerRecord[];
  suppliers: SupplierRecord[];

  // Consolidated records (Always all records for SUPER_ADMIN metrics)
  allProductions: ProductionRecord[];
  allCosts: CostRecord[];
  allInventory: InventoryItem[];
  allSales: SaleRecord[];

  // Auth & Profile Switcher methods
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  loginAdminWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (
    e: string,
    p: string,
    displayName: string,
    farmName?: string,
    activity?: string
  ) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  startInstantDemo: () => void;
  switchTestProfile: (profile: TestProfileKey) => void;

  // SUPER_ADMIN Administration Methods
  createFieldAdmin: (adminData: {
    name: string;
    email: string;
    phone?: string;
    areaName?: string;
    assignedProducerIds?: string[];
    notes?: string;
  }) => Promise<{
    success: boolean;
    message: string;
    admin: FieldAdminUser;
    inviteLink?: string;
    inviteToken?: string;
    accountCreatedInAuth?: boolean;
    adminSdkConfigured?: boolean;
  }>;
  updateFieldAdmin: (adminId: string, partial: Partial<FieldAdminUser>) => Promise<void>;
  suspendFieldAdmin: (adminId: string, reason?: string) => Promise<void>;
  reactivateFieldAdmin: (adminId: string) => Promise<void>;
  assignProducerToAdmin: (producerId: string, targetAdminUid: string) => Promise<void>;
  completeFieldAdminInvite: (params: {
    email: string;
    password: string;
    uid?: string;
    token?: string;
  }) => Promise<any>;
  resendFieldAdminInvite: (email: string) => Promise<{ success: boolean; inviteLink: string }>;

  // Producer Management Methods
  addProducer: (record: Omit<ProducerRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateProducer: (id: string, record: Partial<ProducerRecord>) => Promise<void>;
  deleteProducer: (id: string) => Promise<void>;

  // Audit Logging (Immutably captured)
  logAuditEvent: (
    action: AuditLogRecord['action'],
    recordType: AuditLogRecord['recordType'],
    recordId?: string,
    details?: string,
    ownerAdminUid?: string
  ) => Promise<void>;

  // Operational Entity Actions
  addProduction: (record: Omit<ProductionRecord, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateProduction: (id: string, record: Partial<ProductionRecord>) => Promise<void>;
  deleteProduction: (id: string) => Promise<void>;
  addCost: (record: Omit<CostRecord, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateCost: (id: string, record: Partial<CostRecord>) => Promise<void>;
  deleteCost: (id: string) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  adjustStock: (id: string, change: number, reason?: string) => Promise<void>;
  addSale: (sale: Omit<SaleRecord, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateSale: (id: string, sale: Partial<SaleRecord>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  addCustomer: (cust: Omit<CustomerRecord, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateCustomer: (id: string, cust: Partial<CustomerRecord>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addSupplier: (supp: Omit<SupplierRecord, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateSupplier: (id: string, supp: Partial<SupplierRecord>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  saveProperty: (prop: Partial<PropertyItem>) => Promise<void>;
  loadDemoDataToAccount: () => Promise<void>;
  restoreDemoData: () => Promise<void>;
  clearAccountData: () => Promise<void>;
}

const AgroContext = createContext<AgroContextType | undefined>(undefined);

export const AgroProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('VISITOR');
  const [property, setProperty] = useState<PropertyItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [activeTestProfile, setActiveTestProfile] = useState<TestProfileKey | null>(null);

  // Field Admins, Producers & Audit Logs state
  const [fieldAdmins, setFieldAdmins] = useState<FieldAdminUser[]>(SEED_FIELD_ADMINS as FieldAdminUser[]);
  const [producers, setProducers] = useState<ProducerRecord[]>(SEED_PRODUCERS as ProducerRecord[]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(SEED_AUDIT_LOGS as AuditLogRecord[]);

  // Area Filtering state
  const [selectedFieldAdminFilter, setSelectedFieldAdminFilter] = useState<string | 'all'>('all');
  const [selectedProducerFilter, setSelectedProducerFilter] = useState<string | 'all'>('all');

  // Master Raw Operational Data Records
  const [rawProductions, setRawProductions] = useState<ProductionRecord[]>([]);
  const [rawCosts, setRawCosts] = useState<CostRecord[]>([]);
  const [rawInventory, setRawInventory] = useState<InventoryItem[]>([]);
  const [rawSales, setRawSales] = useState<SaleRecord[]>([]);
  const [rawCustomers, setRawCustomers] = useState<CustomerRecord[]>([]);
  const [rawSuppliers, setRawSuppliers] = useState<SupplierRecord[]>([]);

  // Computed role flags
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isFieldAdmin = userRole === 'FIELD_ADMIN';
  const isAdmin = isSuperAdmin || isFieldAdmin;
  const isVisitor = userRole === 'VISITOR' || isDemoMode;

  // Suspension status check
  const activeAdminObj = fieldAdmins.find(
    (a) => a.userId === (currentUser?.uid || userProfile?.userId)
  );
  const isSuspended = activeAdminObj?.status === 'suspenso' || userProfile?.status === 'suspenso';

  // Audit Logging helper
  const logAuditEvent = async (
    action: AuditLogRecord['action'],
    recordType: AuditLogRecord['recordType'],
    recordId?: string,
    details?: string,
    ownerAdminUid?: string
  ) => {
    const activeUid = currentUser?.uid || userProfile?.userId || 'anonymous';
    const activeEmail = currentUser?.email || userProfile?.email || 'sistema@agrogest.com.br';
    const activeName = userProfile?.displayName || currentUser?.displayName || 'Usuário AgroGest';

    const newLog: AuditLogRecord = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: activeUid,
      userEmail: activeEmail,
      userName: activeName,
      role: userRole,
      action,
      recordType,
      recordId: recordId || 'n/a',
      details: details || `Ação de ${action} em ${recordType}`,
      timestamp: new Date().toISOString(),
      ownerAdminUid: ownerAdminUid || activeUid,
    };

    setAuditLogs((prev) => [newLog, ...prev]);

    // Persist to Firestore /audit_logs collection if authenticated
    try {
      if (currentUser && !isDemoMode) {
        await addDoc(collection(db, 'audit_logs'), newLog);
      }
    } catch (err) {
      console.warn('Persistência de audit_log no Firestore ignorada:', err);
    }
  };

  // Helper to verify admin role on Firebase user
  const verifyAdminRole = async (user: FirebaseUser): Promise<'SUPER_ADMIN' | 'FIELD_ADMIN' | 'PRODUCER'> => {
    try {
      // 1. Direct super admin email check
      if (user.email && user.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        return 'SUPER_ADMIN';
      }

      // 2. Custom claims
      const tokenResult = await user.getIdTokenResult(true);
      if (tokenResult.claims.role === 'SUPER_ADMIN') return 'SUPER_ADMIN';
      if (tokenResult.claims.role === 'FIELD_ADMIN' || tokenResult.claims.admin === true) {
        return 'FIELD_ADMIN';
      }

      // 3. Firestore /admins check
      const adminDocRef = doc(db, 'admins', user.uid);
      const adminSnap = await getDoc(adminDocRef);
      if (adminSnap.exists()) {
        const data = adminSnap.data();
        if (data.role === 'SUPER_ADMIN') return 'SUPER_ADMIN';
        if (data.role === 'FIELD_ADMIN' || data.role === 'ADMIN') return 'FIELD_ADMIN';
      }

      // 4. Memory seed field admin check
      const seedMatch = fieldAdmins.find(
        (a) => a.email.toLowerCase() === (user.email || '').toLowerCase()
      );
      if (seedMatch) return seedMatch.role;
    } catch (err) {
      console.warn('Erro ao verificar papel do usuário:', err);
      if (user.email && user.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        return 'SUPER_ADMIN';
      }
    }
    return 'PRODUCER';
  };

  // Switch test profile seamlessly (for testing the 4 accounts: 1 Super Admin + 3 Field Admins)
  const switchTestProfile = (profileKey: TestProfileKey) => {
    setActiveTestProfile(profileKey);

    if (profileKey === 'SUPER_ADMIN') {
      setIsDemoMode(false);
      setUserRole('SUPER_ADMIN');
      const superAdminUser = fieldAdmins.find((a) => a.role === 'SUPER_ADMIN') || SEED_FIELD_ADMINS[0];
      setUserProfile({
        userId: superAdminUser.userId,
        email: superAdminUser.email,
        displayName: superAdminUser.name,
        role: 'SUPER_ADMIN',
        farmName: 'AgroGest Gestão Central (Consolidado)',
        activity: 'Proprietário & Administrador Principal',
        phone: superAdminUser.phone,
        status: superAdminUser.status,
      });
      setSelectedFieldAdminFilter('all');
      setSelectedProducerFilter('all');
      logAuditEvent('login', 'auth', superAdminUser.userId, 'Acesso autenticado ao Painel Global como SUPER_ADMIN.');
    } else if (profileKey === 'FIELD_ADMIN_1' || profileKey === 'FIELD_ADMIN_2' || profileKey === 'FIELD_ADMIN_3') {
      setIsDemoMode(false);
      setUserRole('FIELD_ADMIN');
      const targetId = profileKey === 'FIELD_ADMIN_1' ? 'field_admin_1' : profileKey === 'FIELD_ADMIN_2' ? 'field_admin_2' : 'field_admin_3';
      const fieldUser = fieldAdmins.find((a) => a.id === targetId || a.userId === targetId) || SEED_FIELD_ADMINS[1];
      setUserProfile({
        userId: fieldUser.userId,
        email: fieldUser.email,
        displayName: fieldUser.name,
        role: 'FIELD_ADMIN',
        farmName: fieldUser.areaName,
        activity: 'Administrador de Campo',
        phone: fieldUser.phone,
        status: fieldUser.status,
      });
      setSelectedFieldAdminFilter(fieldUser.userId);
      setSelectedProducerFilter('all');
      logAuditEvent('login', 'auth', fieldUser.userId, `Login de Administrador de Campo: ${fieldUser.name} (${fieldUser.areaName}).`);
    } else if (profileKey === 'PRODUCER') {
      setIsDemoMode(false);
      setUserRole('PRODUCER');
      setUserProfile({
        userId: 'prod_user_joao',
        email: 'joao.silva@ruralminas.com.br',
        displayName: 'João Batista da Silva',
        role: 'PRODUCER',
        farmName: 'Apiário São José',
        activity: 'Produtor Rural - Apicultura',
        phone: '(35) 98877-6655',
        status: 'ativo',
      });
      setSelectedFieldAdminFilter('all');
      setSelectedProducerFilter('prod_1');
      logAuditEvent('login', 'auth', 'prod_user_joao', 'Acesso de produtor rural à sua propriedade.');
    } else {
      // Visitor demo mode
      startInstantDemo();
    }
  };

  // Instant demo mode (Public visitor: read-only)
  const startInstantDemo = () => {
    setActiveTestProfile('VISITOR');
    setIsDemoMode(true);
    setUserRole('VISITOR');
    setUserProfile({
      userId: 'demo_visitor_user',
      email: 'visitante@agrogest.com.br',
      displayName: 'Visitante (Modo Demonstração)',
      role: 'VISITOR',
      farmName: 'Apiário São José',
      activity: 'Demonstração Pública da Plataforma',
      phone: '(31) 98765-1234',
    });
    setProperty({
      id: 'demo_prop_1',
      userId: 'demo_visitor_user',
      ...DEMO_PROPERTY,
      createdAt: new Date().toISOString(),
    });
    const uid = 'demo_visitor_user';
    setRawProductions(
      getDemoProductions(uid).map((p, idx) => ({ ...p, id: `demo_prod_${idx + 1}`, ownerAdminUid: 'field_admin_1', producerId: 'prod_1' }))
    );
    setRawCosts(
      getDemoCosts(uid).map((c, idx) => ({ ...c, id: `demo_cost_${idx + 1}`, ownerAdminUid: 'field_admin_1', producerId: 'prod_1' }))
    );
    setRawInventory(
      getDemoInventory(uid).map((i, idx) => ({ ...i, id: `demo_inv_${idx + 1}`, ownerAdminUid: 'field_admin_1', producerId: 'prod_1' }))
    );
    setRawSales(
      getDemoSales(uid).map((s, idx) => ({ ...s, id: `demo_sale_${idx + 1}`, ownerAdminUid: 'field_admin_1', producerId: 'prod_1' }))
    );
    setRawCustomers(
      getDemoCustomers(uid).map((c, idx) => ({ ...c, id: `demo_cust_${idx + 1}`, ownerAdminUid: 'field_admin_1', producerId: 'prod_1' }))
    );
    setRawSuppliers(
      getDemoSuppliers(uid).map((s, idx) => ({ ...s, id: `demo_supp_${idx + 1}`, ownerAdminUid: 'field_admin_1', producerId: 'prod_1' }))
    );
  };

  // Populate initial seeded operational data for the 3 field areas
  const initializeSeededAreaRecords = (currentUid: string) => {
    // Generate data for Area 1 (Carlos - Sul de Minas: Mel e Cafe)
    const prods1 = getDemoProductions('field_admin_1').map((p, idx) => ({
      ...p,
      id: `p1_${idx + 1}`,
      ownerAdminUid: 'field_admin_1',
      producerId: 'prod_1',
      propertyId: 'prop_1',
    }));
    const costs1 = getDemoCosts('field_admin_1').map((c, idx) => ({
      ...c,
      id: `c1_${idx + 1}`,
      ownerAdminUid: 'field_admin_1',
      producerId: 'prod_1',
      propertyId: 'prop_1',
    }));
    const inv1 = getDemoInventory('field_admin_1').map((i, idx) => ({
      ...i,
      id: `i1_${idx + 1}`,
      ownerAdminUid: 'field_admin_1',
      producerId: 'prod_1',
      propertyId: 'prop_1',
    }));
    const sales1 = getDemoSales('field_admin_1').map((s, idx) => ({
      ...s,
      id: `s1_${idx + 1}`,
      ownerAdminUid: 'field_admin_1',
      producerId: 'prod_1',
      propertyId: 'prop_1',
    }));
    const cust1 = getDemoCustomers('field_admin_1').map((cu, idx) => ({
      ...cu,
      id: `cu1_${idx + 1}`,
      ownerAdminUid: 'field_admin_1',
      producerId: 'prod_1',
    }));
    const supp1 = getDemoSuppliers('field_admin_1').map((su, idx) => ({
      ...su,
      id: `su1_${idx + 1}`,
      ownerAdminUid: 'field_admin_1',
      producerId: 'prod_1',
    }));

    // Area 2 (Mariana - Triângulo: Hortifrúti e Grãos)
    const prods2: ProductionRecord[] = [
      {
        id: 'p2_1',
        userId: 'field_admin_2',
        ownerAdminUid: 'field_admin_2',
        producerId: 'prod_3',
        product: 'Alface Americana Hidropônica',
        date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        quantity: 1200,
        unit: 'pés',
        areaPlot: 'Estufa 1',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'p2_2',
        userId: 'field_admin_2',
        ownerAdminUid: 'field_admin_2',
        producerId: 'prod_3',
        product: 'Tomate Cereja Orgânico',
        date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        quantity: 450,
        unit: 'kg',
        areaPlot: 'Estufa 3',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'p2_3',
        userId: 'field_admin_2',
        ownerAdminUid: 'field_admin_2',
        producerId: 'prod_4',
        product: 'Milho Verde Espiga',
        date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
        quantity: 800,
        unit: 'dúzias',
        areaPlot: 'Talhão 2',
        createdAt: new Date().toISOString(),
      },
    ];
    const costs2: CostRecord[] = [
      {
        id: 'c2_1',
        userId: 'field_admin_2',
        ownerAdminUid: 'field_admin_2',
        producerId: 'prod_3',
        date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
        category: 'insumos',
        description: 'Nutrientes hidropônicos e sais minerais',
        amount: 850,
        supplier: 'AgroQuímica Triângulo',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'c2_2',
        userId: 'field_admin_2',
        ownerAdminUid: 'field_admin_2',
        producerId: 'prod_4',
        date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
        category: 'energia',
        description: 'Energia elétrica para bombas de irrigação',
        amount: 520,
        supplier: 'Cemig',
        createdAt: new Date().toISOString(),
      },
    ];
    const inv2: InventoryItem[] = [
      {
        id: 'i2_1',
        userId: 'field_admin_2',
        ownerAdminUid: 'field_admin_2',
        producerId: 'prod_3',
        item: 'Caixas plásticas vazadas para hortaliças',
        unit: 'unidades',
        currentQuantity: 80,
        minQuantity: 30,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'i2_2',
        userId: 'field_admin_2',
        ownerAdminUid: 'field_admin_2',
        producerId: 'prod_4',
        item: 'Semente de Milho Híbrido BT',
        unit: 'sacos 20kg',
        currentQuantity: 4,
        minQuantity: 5, // Low stock trigger
        createdAt: new Date().toISOString(),
      },
    ];
    const sales2: SaleRecord[] = [
      {
        id: 's2_1',
        userId: 'field_admin_2',
        ownerAdminUid: 'field_admin_2',
        producerId: 'prod_3',
        date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        product: 'Alface Americana Hidropônica',
        quantity: 1000,
        unit: 'pés',
        unitPrice: 3.5,
        totalAmount: 3500,
        customer: 'Supermercado Central de Uberlândia',
        paymentMethod: 'pix',
        createdAt: new Date().toISOString(),
      },
    ];

    // Area 3 (Roberto - Zona da Mata: Leite e Queijo)
    const prods3: ProductionRecord[] = [
      {
        id: 'p3_1',
        userId: 'field_admin_3',
        ownerAdminUid: 'field_admin_3',
        producerId: 'prod_5',
        product: 'Leite Cru Tipo A',
        date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        quantity: 2400,
        unit: 'litros',
        areaPlot: 'Ordenha Central',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'p3_2',
        userId: 'field_admin_3',
        ownerAdminUid: 'field_admin_3',
        producerId: 'prod_5',
        product: 'Queijo Minas Artesanal Maturado',
        date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
        quantity: 180,
        unit: 'peças',
        areaPlot: 'Queijaria da Fazenda',
        createdAt: new Date().toISOString(),
      },
    ];
    const costs3: CostRecord[] = [
      {
        id: 'c3_1',
        userId: 'field_admin_3',
        ownerAdminUid: 'field_admin_3',
        producerId: 'prod_5',
        date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
        category: 'alimentacao',
        description: 'Ração balanceada 22% proteína e farelo de soja',
        amount: 1950,
        supplier: 'NutriCampo Rações',
        createdAt: new Date().toISOString(),
      },
    ];
    const inv3: InventoryItem[] = [
      {
        id: 'i3_1',
        userId: 'field_admin_3',
        ownerAdminUid: 'field_admin_3',
        producerId: 'prod_5',
        item: 'Sal mineral e núcleos para rebanho',
        unit: 'sacos 30kg',
        currentQuantity: 3,
        minQuantity: 6, // Low stock trigger
        createdAt: new Date().toISOString(),
      },
    ];
    const sales3: SaleRecord[] = [
      {
        id: 's3_1',
        userId: 'field_admin_3',
        ownerAdminUid: 'field_admin_3',
        producerId: 'prod_5',
        date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
        product: 'Queijo Minas Artesanal Maturado',
        quantity: 120,
        unit: 'peças',
        unitPrice: 45,
        totalAmount: 5400,
        customer: 'Empório Mineiro e Queijaria Gourmet',
        paymentMethod: 'transferencia',
        createdAt: new Date().toISOString(),
      },
    ];

    setRawProductions([...prods1, ...prods2, ...prods3]);
    setRawCosts([...costs1, ...costs2, ...costs3]);
    setRawInventory([...inv1, ...inv2, ...inv3]);
    setRawSales([...sales1, ...sales2, ...sales3]);
    setRawCustomers(cust1);
    setRawSuppliers(supp1);
  };

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsDemoMode(false);
        setActiveTestProfile(null);
        const role = await verifyAdminRole(user);
        setUserRole(role);

        // Load profile from Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile({
              ...data,
              role,
            });
          } else {
            const initialProfile: UserProfile = {
              userId: user.uid,
              email: user.email || '',
              displayName:
                user.displayName ||
                (role === 'SUPER_ADMIN'
                  ? 'Juliano Soares Inácio (SUPER_ADMIN)'
                  : role === 'FIELD_ADMIN'
                  ? 'Administrador de Campo'
                  : 'Produtor Rural'),
              role,
              farmName:
                role === 'SUPER_ADMIN'
                  ? 'Painel Global AgroGest'
                  : role === 'FIELD_ADMIN'
                  ? 'Área Operacional de Campo'
                  : 'Minha Propriedade',
              activity: role === 'SUPER_ADMIN' ? 'Administração Geral' : 'Gestão Rural',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);
          }
        } catch (err) {
          console.error('Erro ao ler perfil no Firestore:', err);
        }

        initializeSeededAreaRecords(user.uid);
      } else {
        if (!activeTestProfile) {
          setUserProfile(null);
          setProperty(null);
          setUserRole('VISITOR');
          startInstantDemo();
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtered Operational Data based on user role and area selections
  // IMPORTANT: Strict area separation:
  // - SUPER_ADMIN sees all data (or filtered by selectedFieldAdminFilter / selectedProducerFilter)
  // - FIELD_ADMIN sees ONLY their own data (where ownerAdminUid matches their UID)
  // - PRODUCER sees only records of their producer/property
  const activeUid = currentUser?.uid || userProfile?.userId || 'anonymous';

  const filterRecordByArea = <T extends { ownerAdminUid?: string; producerId?: string; userId?: string }>(
    record: T
  ): boolean => {
    if (isSuperAdmin) {
      if (selectedFieldAdminFilter !== 'all' && record.ownerAdminUid !== selectedFieldAdminFilter) {
        return false;
      }
      if (selectedProducerFilter !== 'all' && record.producerId !== selectedProducerFilter) {
        return false;
      }
      return true;
    }

    if (isFieldAdmin) {
      // Must match field admin's area
      return record.ownerAdminUid === activeUid || record.userId === activeUid;
    }

    if (userRole === 'PRODUCER') {
      return (
        record.userId === activeUid ||
        (selectedProducerFilter !== 'all' && record.producerId === selectedProducerFilter)
      );
    }

    return true; // Visitor sees demo dataset
  };

  const productions = rawProductions.filter(filterRecordByArea);
  const costs = rawCosts.filter(filterRecordByArea);
  const inventory = rawInventory.filter(filterRecordByArea);
  const sales = rawSales.filter(filterRecordByArea);
  const customers = rawCustomers.filter((c) => isSuperAdmin || c.ownerAdminUid === activeUid || !c.ownerAdminUid);
  const suppliers = rawSuppliers.filter((s) => isSuperAdmin || s.ownerAdminUid === activeUid || !s.ownerAdminUid);

  // Consolidated records for SUPER_ADMIN dashboard metrics
  const allProductions = rawProductions;
  const allCosts = rawCosts;
  const allInventory = rawInventory;
  const allSales = rawSales;

  // Security guard for write actions
  const ensureCanWrite = () => {
    if (isVisitor) {
      throw new Error(
        'Operação bloqueada: No modo demonstração, as operações de cadastro, edição e exclusão estão desabilitadas. Faça login como administrador para registrar dados.'
      );
    }
    if (isSuspended) {
      logAuditEvent('access_denied', 'admin', activeUid, 'Tentativa de operação bloqueada: Conta de administrador de campo suspensa.');
      throw new Error(
        'Acesso bloqueado: Sua conta de Administrador de Campo está suspensa pelo Administrador Principal. Novas operações estão congeladas.'
      );
    }
    if (!isAdmin && userRole !== 'PRODUCER') {
      throw new Error('Permissão negada: Usuário não possui privilégio de gravação.');
    }
  };

  // Auth methods
  const loginWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const role = await verifyAdminRole(res.user);
      setUserRole(role);
      logAuditEvent('login', 'auth', res.user.uid, `Login Google realizado com sucesso [${role}].`);
    } catch (err) {
      console.error('Erro no login Google:', err);
      throw err;
    }
  };

  const loginWithEmail = async (e: string, p: string) => {
    const cred = await signInWithEmailAndPassword(auth, e.trim(), p);
    const role = await verifyAdminRole(cred.user);
    setUserRole(role);
    logAuditEvent('login', 'auth', cred.user.uid, `Login com e-mail realizado [${role}].`);
  };

  const loginAdminWithEmail = async (email: string, pass: string) => {
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      // Auto-provision Super Admin on first turn if account does not exist
      if (
        (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') &&
        email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()
      ) {
        try {
          cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
          await updateProfile(cred.user, { displayName: 'Juliano Soares Inácio (SUPER_ADMIN)' });
          await setDoc(doc(db, 'admins', cred.user.uid), {
            userId: cred.user.uid,
            email: email.trim(),
            role: 'SUPER_ADMIN',
            status: 'ativo',
            name: 'Juliano Soares Inácio',
            createdAt: new Date().toISOString(),
          });
        } catch (createErr: any) {
          throw createErr;
        }
      } else {
        // Verificar se é um administrador de campo convidado com senha definida
        try {
          const verifyResp = await fetch('/api/auth/verify-field-admin-credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password: pass }),
          });
          if (verifyResp.ok) {
            const verifyData = await verifyResp.json();
            if (verifyData.valid && verifyData.admin) {
              const fieldProfile: UserProfile = {
                userId: verifyData.admin.id || verifyData.admin.userId,
                email: verifyData.admin.email,
                displayName: verifyData.admin.name,
                role: 'FIELD_ADMIN',
                farmName: verifyData.admin.areaName || 'Área de Campo',
                activity: 'Administração de Campo',
                status: 'ativo',
              };
              setUserRole('FIELD_ADMIN');
              setUserProfile(fieldProfile);
              setIsDemoMode(false);
              await logAuditEvent('login', 'auth', verifyData.admin.id, `Login administrativo autorizado [FIELD_ADMIN]: ${verifyData.admin.name}`);
              return;
            }
          }
        } catch (checkErr) {
          console.warn('Erro ao verificar credencial de administrador de campo:', checkErr);
        }

        throw err;
      }
    }

    const role = await verifyAdminRole(cred.user);
    if (role !== 'SUPER_ADMIN' && role !== 'FIELD_ADMIN') {
      await signOut(auth);
      logAuditEvent('access_denied', 'auth', cred.user.uid, 'Tentativa de acesso administrativo negada.');
      throw new Error(
        'Acesso não autorizado: Esta conta não possui o papel administrativo (SUPER_ADMIN ou FIELD_ADMIN).'
      );
    }

    setUserRole(role);
    setIsDemoMode(false);
    logAuditEvent('login', 'auth', cred.user.uid, `Login administrativo autorizado [${role}].`);
  };

  const registerWithEmail = async (
    e: string,
    p: string,
    displayName: string,
    farmName?: string,
    activity?: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, e.trim(), p);
    await updateProfile(cred.user, { displayName });
    const isOwner = e.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();
    const role: UserRole = isOwner ? 'SUPER_ADMIN' : 'PRODUCER';

    const profile: UserProfile = {
      userId: cred.user.uid,
      email: e.trim(),
      displayName,
      role,
      farmName: farmName || 'Propriedade Rural',
      activity: activity || 'Produtor Rural',
      status: 'ativo',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), profile);
    setUserProfile(profile);
    setUserRole(role);
    logAuditEvent('create', 'auth', cred.user.uid, `Novo usuário registrado no AgroGest [${role}].`);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
    logAuditEvent('update', 'auth', 'reset_pwd', `Solicitação de redefinição de senha para: ${email}`);
  };

  const logout = async () => {
    if (isDemoMode || activeTestProfile) {
      setActiveTestProfile(null);
      setIsDemoMode(false);
      setUserProfile(null);
      setProperty(null);
      setUserRole('VISITOR');
      return;
    }
    await signOut(auth);
    setUserRole('VISITOR');
    setUserProfile(null);
    setProperty(null);
  };

  // SUPER_ADMIN Administration Methods
  const createFieldAdmin = async (adminData: {
    name: string;
    email: string;
    phone?: string;
    areaName?: string;
    assignedProducerIds?: string[];
    notes?: string;
  }) => {
    if (!isSuperAdmin) {
      await logAuditEvent('access_denied', 'admin', activeUid, 'Tentativa não autorizada de criar administrador de campo.');
      throw new Error('Usuário sem autorização: Apenas o Administrador Principal (SUPER_ADMIN) tem permissão para cadastrar ou convidar administradores de campo.');
    }

    const cleanEmail = adminData.email.trim().toLowerCase();
    const cleanName = adminData.name.trim();

    if (!cleanName || cleanName.length < 3) {
      throw new Error('Nome inválido. Informe o nome completo do administrador (mínimo de 3 caracteres).');
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error('E-mail inválido. Informe um endereço de e-mail no formato correto (exemplo: usuario@dominio.com).');
    }

    // Check duplicate in local state
    if (fieldAdmins.some((a) => a.email.toLowerCase() === cleanEmail)) {
      throw new Error('E-mail já cadastrado. Já existe um administrador cadastrado com este e-mail no AgroGest.');
    }

    // Prepare backend call
    const idToken = currentUser ? await currentUser.getIdToken().catch(() => null) : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-caller-email': AUTHORIZED_ADMIN_EMAIL,
    };
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    let responseData: any;
    try {
      const resp = await fetch('/api/admin/invite-field-admin', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          phone: adminData.phone?.trim() || '',
          areaName: adminData.areaName?.trim() || 'Nova Área de Campo',
          notes: adminData.notes?.trim() || '',
        }),
      });

      responseData = await resp.json();
      if (!resp.ok) {
        throw new Error(responseData.error || 'Falha ao cadastrar administrador de campo no servidor.');
      }
    } catch (networkErr: any) {
      if (responseData && responseData.error) {
        throw new Error(responseData.error);
      }
      if (networkErr.message && !networkErr.message.includes('fetch')) {
        throw networkErr;
      }
      throw new Error('Problema de conexão com o servidor do AgroGest. Verifique sua rede e tente novamente.');
    }

    const createdAdmin: FieldAdminUser = responseData.admin || {
      id: `field_admin_${Date.now()}`,
      userId: `field_admin_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      phone: adminData.phone?.trim() || '',
      role: 'FIELD_ADMIN',
      status: 'ativo',
      areaName: adminData.areaName?.trim() || 'Nova Área de Campo',
      assignedProducerIds: adminData.assignedProducerIds || [],
      notes: adminData.notes?.trim() || '',
      createdAt: new Date().toISOString(),
      lastLoginAt: 'Pendente primeiro acesso',
      inviteStatus: 'convite_enviado',
      inviteLink: responseData.inviteLink,
      accountCreatedInAuth: responseData.accountCreatedInAuth,
    };

    setFieldAdmins((prev) => {
      const filtered = prev.filter((a) => a.id !== createdAdmin.id && a.email.toLowerCase() !== createdAdmin.email.toLowerCase());
      return [...filtered, createdAdmin];
    });

    // Also persist in Firestore if connected
    try {
      if (currentUser && !isDemoMode) {
        await setDoc(doc(db, 'admins', createdAdmin.id), createdAdmin);
      }
    } catch (err) {
      console.warn('Persistência direta no Firestore (admins):', err);
    }

    await logAuditEvent(
      'create',
      'admin',
      createdAdmin.id,
      `SUPER_ADMIN cadastrou Administrador de Campo: ${createdAdmin.name} (${createdAdmin.email})`
    );

    return responseData;
  };

  const completeFieldAdminInvite = async (params: {
    email: string;
    password: string;
    uid?: string;
    token?: string;
  }) => {
    let responseData: any;
    try {
      const resp = await fetch('/api/auth/complete-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      responseData = await resp.json();
      if (!resp.ok) {
        throw new Error(responseData.error || 'Erro ao definir senha do administrador.');
      }
    } catch (netErr: any) {
      if (responseData && responseData.error) {
        throw new Error(responseData.error);
      }
      throw netErr;
    }

    // Try authenticating with email & new password
    try {
      await signInWithEmailAndPassword(auth, params.email.trim(), params.password);
    } catch (loginErr) {
      console.warn('Auto login após redefinição de senha:', loginErr);
    }

    setFieldAdmins((prev) =>
      prev.map((a) =>
        a.email.toLowerCase() === params.email.trim().toLowerCase()
          ? {
              ...a,
              status: 'ativo',
              inviteStatus: 'convite_aceito',
              lastLoginAt: new Date().toISOString(),
            }
          : a
      )
    );

    await logAuditEvent('status_change', 'admin', params.email, `Administrador de campo concluiu acesso e definiu senha.`);
    return responseData;
  };

  const resendFieldAdminInvite = async (email: string) => {
    if (!isSuperAdmin) {
      throw new Error('Acesso negado: Somente o SUPER_ADMIN pode reenviar convites.');
    }
    const idToken = currentUser ? await currentUser.getIdToken().catch(() => null) : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-caller-email': AUTHORIZED_ADMIN_EMAIL,
    };
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    const resp = await fetch('/api/admin/resend-invite', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.error || 'Erro ao reenviar convite.');
    }
    await logAuditEvent('update', 'admin', email, `Convite reenviado para ${email}`);
    return data;
  };

  const updateFieldAdmin = async (adminId: string, partial: Partial<FieldAdminUser>) => {
    if (!isSuperAdmin) {
      throw new Error('Acesso negado: Somente o SUPER_ADMIN pode atualizar administradores.');
    }

    setFieldAdmins((prev) =>
      prev.map((a) => (a.id === adminId || a.userId === adminId ? { ...a, ...partial, updatedAt: new Date().toISOString() } : a))
    );

    try {
      if (currentUser) {
        await updateDoc(doc(db, 'admins', adminId), partial);
      }
    } catch (err) {
      console.warn('Erro ao atualizar admin no Firestore:', err);
    }

    await logAuditEvent('update', 'admin', adminId, `Dados cadastrais do administrador ${adminId} alterados.`);
  };

  const suspendFieldAdmin = async (adminId: string, reason?: string) => {
    if (!isSuperAdmin) {
      throw new Error('Acesso negado: Somente o SUPER_ADMIN pode suspender administradores de campo.');
    }

    setFieldAdmins((prev) =>
      prev.map((a) =>
        a.id === adminId || a.userId === adminId ? { ...a, status: 'suspenso', updatedAt: new Date().toISOString() } : a
      )
    );

    try {
      if (currentUser) {
        await updateDoc(doc(db, 'admins', adminId), { status: 'suspenso' });
      }
    } catch (err) {
      console.warn('Erro ao suspender admin no Firestore:', err);
    }

    await logAuditEvent(
      'status_change',
      'admin',
      adminId,
      `Administrador de campo suspenso pelo SUPER_ADMIN. Motivo: ${reason || 'Suspensão preventiva de segurança.'}`
    );
  };

  const reactivateFieldAdmin = async (adminId: string) => {
    if (!isSuperAdmin) {
      throw new Error('Acesso negado: Somente o SUPER_ADMIN pode reativar administradores.');
    }

    setFieldAdmins((prev) =>
      prev.map((a) =>
        a.id === adminId || a.userId === adminId ? { ...a, status: 'ativo', updatedAt: new Date().toISOString() } : a
      )
    );

    try {
      if (currentUser) {
        await updateDoc(doc(db, 'admins', adminId), { status: 'ativo' });
      }
    } catch (err) {
      console.warn('Erro ao reativar admin no Firestore:', err);
    }

    await logAuditEvent('status_change', 'admin', adminId, `Administrador de campo reativado pelo SUPER_ADMIN.`);
  };

  const assignProducerToAdmin = async (producerId: string, targetAdminUid: string) => {
    if (!isSuperAdmin) {
      throw new Error('Acesso negado: Somente o SUPER_ADMIN pode reatribuir produtores entre administradores.');
    }

    setProducers((prev) =>
      prev.map((p) => (p.id === producerId ? { ...p, ownerAdminUid: targetAdminUid, updatedAt: new Date().toISOString() } : p))
    );

    // Update raw records that belong to this producer
    setRawProductions((prev) =>
      prev.map((r) => (r.producerId === producerId ? { ...r, ownerAdminUid: targetAdminUid } : r))
    );
    setRawCosts((prev) =>
      prev.map((r) => (r.producerId === producerId ? { ...r, ownerAdminUid: targetAdminUid } : r))
    );
    setRawInventory((prev) =>
      prev.map((r) => (r.producerId === producerId ? { ...r, ownerAdminUid: targetAdminUid } : r))
    );
    setRawSales((prev) =>
      prev.map((r) => (r.producerId === producerId ? { ...r, ownerAdminUid: targetAdminUid } : r))
    );

    await logAuditEvent(
      'update',
      'producer',
      producerId,
      `Produtor ${producerId} reatribuído para o Administrador ${targetAdminUid}.`
    );
  };

  // Producer CRUD Methods
  const addProducer = async (record: Omit<ProducerRecord, 'id' | 'createdAt'>) => {
    ensureCanWrite();

    // Auto-bind to authenticated Field Admin if not specified or if user is FIELD_ADMIN
    const assignedOwner = isSuperAdmin ? (record.ownerAdminUid || activeUid) : activeUid;

    const newProd: ProducerRecord = {
      ...record,
      id: `prod_${Date.now()}`,
      ownerAdminUid: assignedOwner,
      createdBy: activeUid,
      createdAt: new Date().toISOString(),
    };

    setProducers((prev) => [newProd, ...prev]);

    // Update field admin's assigned producers list
    setFieldAdmins((prev) =>
      prev.map((a) =>
        a.userId === assignedOwner || a.id === assignedOwner
          ? { ...a, assignedProducerIds: [...(a.assignedProducerIds || []), newProd.id] }
          : a
      )
    );

    try {
      if (currentUser && !isDemoMode) {
        await setDoc(doc(db, 'producers', newProd.id), newProd);
      }
    } catch (err) {
      console.warn('Erro ao salvar produtor no Firestore:', err);
    }

    await logAuditEvent('create', 'producer', newProd.id, `Produtor rural cadastrado: ${newProd.name}`, assignedOwner);
  };

  const updateProducer = async (id: string, record: Partial<ProducerRecord>) => {
    ensureCanWrite();

    const target = producers.find((p) => p.id === id);
    if (!target) return;

    if (!isSuperAdmin && target.ownerAdminUid !== activeUid) {
      logAuditEvent('access_denied', 'producer', id, 'Tentativa negada de alterar produtor de outra área.');
      throw new Error('Acesso negado: Você não pode alterar produtores vinculados a outro administrador.');
    }

    setProducers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...record, updatedAt: new Date().toISOString() } : p))
    );

    try {
      if (currentUser && !isDemoMode) {
        await updateDoc(doc(db, 'producers', id), record);
      }
    } catch (err) {
      console.warn('Erro ao atualizar produtor no Firestore:', err);
    }

    await logAuditEvent('update', 'producer', id, `Produtor rural ${id} atualizado.`, target.ownerAdminUid);
  };

  const deleteProducer = async (id: string) => {
    ensureCanWrite();

    const target = producers.find((p) => p.id === id);
    if (!target) return;

    if (!isSuperAdmin && target.ownerAdminUid !== activeUid) {
      logAuditEvent('access_denied', 'producer', id, 'Tentativa negada de excluir produtor de outra área.');
      throw new Error('Acesso negado: Você não pode excluir produtores vinculados a outro administrador.');
    }

    setProducers((prev) => prev.filter((p) => p.id !== id));

    try {
      if (currentUser && !isDemoMode) {
        await deleteDoc(doc(db, 'producers', id));
      }
    } catch (err) {
      console.warn('Erro ao deletar produtor no Firestore:', err);
    }

    await logAuditEvent('delete', 'producer', id, `Produtor rural ${id} excluído.`, target.ownerAdminUid);
  };

  // Operational Entity Actions
  const resolveOwnerUid = (): string => {
    if (isSuperAdmin) {
      return selectedFieldAdminFilter !== 'all' ? selectedFieldAdminFilter : activeUid;
    }
    return activeUid;
  };

  const resolveProducerId = (): string => {
    if (selectedProducerFilter !== 'all') return selectedProducerFilter;
    const available = producers.filter((p) => isSuperAdmin || p.ownerAdminUid === activeUid);
    return available[0]?.id || 'prod_1';
  };

  // Production
  const addProduction = async (record: Omit<ProductionRecord, 'id' | 'userId' | 'createdAt'>) => {
    ensureCanWrite();
    const now = new Date().toISOString();
    const ownerAdminUid = resolveOwnerUid();
    const producerId = record.producerId || resolveProducerId();

    const newRec: ProductionRecord = {
      ...record,
      id: `prod_rec_${Date.now()}`,
      userId: activeUid,
      ownerAdminUid,
      producerId,
      createdBy: activeUid,
      createdAt: now,
      status: 'ativo',
    };

    setRawProductions((prev) => [newRec, ...prev]);

    try {
      if (currentUser && !isDemoMode) {
        await addDoc(collection(db, 'production'), newRec);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'production');
    }

    await logAuditEvent('create', 'production', newRec.id, `Produção lançada: ${newRec.quantity} ${newRec.unit} de ${newRec.product}`, ownerAdminUid);
  };

  const updateProduction = async (id: string, record: Partial<ProductionRecord>) => {
    ensureCanWrite();
    const target = rawProductions.find((p) => p.id === id);
    if (!target) return;

    if (!isSuperAdmin && target.ownerAdminUid !== activeUid) {
      logAuditEvent('access_denied', 'production', id, 'Tentativa de alterar produção de outra área.');
      throw new Error('Acesso negado: Você só pode editar registros da sua própria área de atuação.');
    }

    setRawProductions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...record, updatedAt: new Date().toISOString() } : p))
    );

    try {
      if (currentUser && !isDemoMode) {
        await updateDoc(doc(db, 'production', id), record);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `production/${id}`);
    }

    await logAuditEvent('update', 'production', id, `Registro de produção ${id} alterado.`, target.ownerAdminUid);
  };

  const deleteProduction = async (id: string) => {
    ensureCanWrite();
    const target = rawProductions.find((p) => p.id === id);
    if (!target) return;

    if (!isSuperAdmin && target.ownerAdminUid !== activeUid) {
      logAuditEvent('access_denied', 'production', id, 'Tentativa de excluir produção de outra área.');
      throw new Error('Acesso negado: Você só pode excluir registros da sua própria área de atuação.');
    }

    setRawProductions((prev) => prev.filter((p) => p.id !== id));

    try {
      if (currentUser && !isDemoMode) {
        await deleteDoc(doc(db, 'production', id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `production/${id}`);
    }

    await logAuditEvent('delete', 'production', id, `Registro de produção ${id} removido.`, target.ownerAdminUid);
  };

  // Costs
  const addCost = async (record: Omit<CostRecord, 'id' | 'userId' | 'createdAt'>) => {
    ensureCanWrite();
    const now = new Date().toISOString();
    const ownerAdminUid = resolveOwnerUid();
    const producerId = record.producerId || resolveProducerId();

    const newRec: CostRecord = {
      ...record,
      id: `cost_rec_${Date.now()}`,
      userId: activeUid,
      ownerAdminUid,
      producerId,
      createdBy: activeUid,
      createdAt: now,
      status: 'ativo',
    };

    setRawCosts((prev) => [newRec, ...prev]);

    try {
      if (currentUser && !isDemoMode) {
        await addDoc(collection(db, 'costs'), newRec);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'costs');
    }

    await logAuditEvent('create', 'cost', newRec.id, `Custo registrado: R$ ${newRec.amount} - ${newRec.description}`, ownerAdminUid);
  };

  const updateCost = async (id: string, record: Partial<CostRecord>) => {
    ensureCanWrite();
    const target = rawCosts.find((c) => c.id === id);
    if (!target) return;

    if (!isSuperAdmin && target.ownerAdminUid !== activeUid) {
      logAuditEvent('access_denied', 'cost', id, 'Tentativa de alterar custo de outra área.');
      throw new Error('Acesso negado: Você só pode editar custos da sua própria área.');
    }

    setRawCosts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...record, updatedAt: new Date().toISOString() } : c))
    );

    try {
      if (currentUser && !isDemoMode) {
        await updateDoc(doc(db, 'costs', id), record);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `costs/${id}`);
    }

    await logAuditEvent('update', 'cost', id, `Custo ${id} atualizado.`, target.ownerAdminUid);
  };

  const deleteCost = async (id: string) => {
    ensureCanWrite();
    const target = rawCosts.find((c) => c.id === id);
    if (!target) return;

    if (!isSuperAdmin && target.ownerAdminUid !== activeUid) {
      logAuditEvent('access_denied', 'cost', id, 'Tentativa de excluir custo de outra área.');
      throw new Error('Acesso negado: Você só pode excluir custos da sua própria área.');
    }

    setRawCosts((prev) => prev.filter((c) => c.id !== id));

    try {
      if (currentUser && !isDemoMode) {
        await deleteDoc(doc(db, 'costs', id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `costs/${id}`);
    }

    await logAuditEvent('delete', 'cost', id, `Custo ${id} removido.`, target.ownerAdminUid);
  };

  // Inventory
  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'userId' | 'createdAt'>) => {
    ensureCanWrite();
    const now = new Date().toISOString();
    const ownerAdminUid = resolveOwnerUid();
    const producerId = item.producerId || resolveProducerId();

    const newRec: InventoryItem = {
      ...item,
      id: `inv_rec_${Date.now()}`,
      userId: activeUid,
      ownerAdminUid,
      producerId,
      createdBy: activeUid,
      createdAt: now,
      status: 'ativo',
    };

    setRawInventory((prev) => [newRec, ...prev]);

    try {
      if (currentUser && !isDemoMode) {
        await addDoc(collection(db, 'inventory'), newRec);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'inventory');
    }

    await logAuditEvent('create', 'inventory', newRec.id, `Item de estoque cadastrado: ${newRec.item}`, ownerAdminUid);
  };

  const updateInventoryItem = async (id: string, item: Partial<InventoryItem>) => {
    ensureCanWrite();
    const target = rawInventory.find((i) => i.id === id);
    if (!target) return;

    if (!isSuperAdmin && target.ownerAdminUid !== activeUid) {
      logAuditEvent('access_denied', 'inventory', id, 'Tentativa de alterar estoque de outra área.');
      throw new Error('Acesso negado: Você só pode alterar itens da sua própria área.');
    }

    setRawInventory((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...item, updatedAt: new Date().toISOString() } : i))
    );

    try {
      if (currentUser && !isDemoMode) {
        await updateDoc(doc(db, 'inventory', id), item);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `inventory/${id}`);
    }

    await logAuditEvent('update', 'inventory', id, `Estoque do item ${id} atualizado.`, target.ownerAdminUid);
  };

  const deleteInventoryItem = async (id: string) => {
    ensureCanWrite();
    const target = rawInventory.find((i) => i.id === id);
    if (!target) return;

    if (!isSuperAdmin && target.ownerAdminUid !== activeUid) {
      throw new Error('Acesso negado: Você só pode excluir itens da sua própria área.');
    }

    setRawInventory((prev) => prev.filter((i) => i.id !== id));

    try {
      if (currentUser && !isDemoMode) {
        await deleteDoc(doc(db, 'inventory', id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `inventory/${id}`);
    }

    await logAuditEvent('delete', 'inventory', id, `Item de estoque ${id} removido.`, target.ownerAdminUid);
  };

  const adjustStock = async (id: string, change: number, notes?: string) => {
    ensureCanWrite();
    const target = rawInventory.find((i) => i.id === id);
    if (!target) return;

    const newQty = Math.max(0, target.currentQuantity + change);
    let updatedNotes = target.notes;
    if (notes) {
      const combined = target.notes ? `${target.notes} | ${notes}` : notes;
      updatedNotes = combined.length > 450 ? combined.slice(-450) : combined;
    }

    await updateInventoryItem(id, {
      currentQuantity: newQty,
      notes: updatedNotes,
    });
  };

  // Sales
  const addSale = async (sale: Omit<SaleRecord, 'id' | 'userId' | 'createdAt'>) => {
    ensureCanWrite();
    const now = new Date().toISOString();
    const ownerAdminUid = resolveOwnerUid();
    const producerId = sale.producerId || resolveProducerId();

    const newRec: SaleRecord = {
      ...sale,
      id: `sale_rec_${Date.now()}`,
      userId: activeUid,
      ownerAdminUid,
      producerId,
      createdBy: activeUid,
      createdAt: now,
      status: 'ativo',
    };

    setRawSales((prev) => [newRec, ...prev]);

    try {
      if (currentUser && !isDemoMode) {
        await addDoc(collection(db, 'sales'), newRec);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'sales');
    }

    await logAuditEvent('create', 'sale', newRec.id, `Venda registrada: R$ ${newRec.totalAmount} (${newRec.product})`, ownerAdminUid);
  };

  const updateSale = async (id: string, sale: Partial<SaleRecord>) => {
    ensureCanWrite();
    const target = rawSales.find((s) => s.id === id);
    if (!target) return;

    if (!isSuperAdmin && target.ownerAdminUid !== activeUid) {
      throw new Error('Acesso negado: Você só pode editar vendas da sua própria área.');
    }

    setRawSales((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...sale, updatedAt: new Date().toISOString() } : s))
    );

    try {
      if (currentUser && !isDemoMode) {
        await updateDoc(doc(db, 'sales', id), sale);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sales/${id}`);
    }

    await logAuditEvent('update', 'sale', id, `Venda ${id} alterada.`, target.ownerAdminUid);
  };

  const deleteSale = async (id: string) => {
    ensureCanWrite();
    const target = rawSales.find((s) => s.id === id);
    if (!target) return;

    if (!isSuperAdmin && target.ownerAdminUid !== activeUid) {
      throw new Error('Acesso negado: Você só pode excluir vendas da sua própria área.');
    }

    setRawSales((prev) => prev.filter((s) => s.id !== id));

    try {
      if (currentUser && !isDemoMode) {
        await deleteDoc(doc(db, 'sales', id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `sales/${id}`);
    }

    await logAuditEvent('delete', 'sale', id, `Venda ${id} excluída.`, target.ownerAdminUid);
  };

  // Customers
  const addCustomer = async (cust: Omit<CustomerRecord, 'id' | 'userId' | 'createdAt'>) => {
    ensureCanWrite();
    const now = new Date().toISOString();
    const ownerAdminUid = resolveOwnerUid();

    const newRec: CustomerRecord = {
      ...cust,
      id: `cust_rec_${Date.now()}`,
      userId: activeUid,
      ownerAdminUid,
      createdBy: activeUid,
      createdAt: now,
      status: 'ativo',
    };

    setRawCustomers((prev) => [newRec, ...prev]);

    try {
      if (currentUser && !isDemoMode) {
        await addDoc(collection(db, 'customers'), newRec);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'customers');
    }

    await logAuditEvent('create', 'customer', newRec.id, `Cliente cadastrado: ${newRec.name}`, ownerAdminUid);
  };

  const updateCustomer = async (id: string, cust: Partial<CustomerRecord>) => {
    ensureCanWrite();
    setRawCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...cust, updatedAt: new Date().toISOString() } : c))
    );

    try {
      if (currentUser && !isDemoMode) {
        await updateDoc(doc(db, 'customers', id), cust);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `customers/${id}`);
    }

    await logAuditEvent('update', 'customer', id, `Cliente ${id} atualizado.`);
  };

  const deleteCustomer = async (id: string) => {
    ensureCanWrite();
    setRawCustomers((prev) => prev.filter((c) => c.id !== id));

    try {
      if (currentUser && !isDemoMode) {
        await deleteDoc(doc(db, 'customers', id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `customers/${id}`);
    }

    await logAuditEvent('delete', 'customer', id, `Cliente ${id} excluído.`);
  };

  // Suppliers
  const addSupplier = async (supp: Omit<SupplierRecord, 'id' | 'userId' | 'createdAt'>) => {
    ensureCanWrite();
    const now = new Date().toISOString();
    const ownerAdminUid = resolveOwnerUid();

    const newRec: SupplierRecord = {
      ...supp,
      id: `supp_rec_${Date.now()}`,
      userId: activeUid,
      ownerAdminUid,
      createdBy: activeUid,
      createdAt: now,
      status: 'ativo',
    };

    setRawSuppliers((prev) => [newRec, ...prev]);

    try {
      if (currentUser && !isDemoMode) {
        await addDoc(collection(db, 'suppliers'), newRec);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'suppliers');
    }

    await logAuditEvent('create', 'supplier', newRec.id, `Fornecedor cadastrado: ${newRec.name}`, ownerAdminUid);
  };

  const updateSupplier = async (id: string, supp: Partial<SupplierRecord>) => {
    ensureCanWrite();
    setRawSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...supp, updatedAt: new Date().toISOString() } : s))
    );

    try {
      if (currentUser && !isDemoMode) {
        await updateDoc(doc(db, 'suppliers', id), supp);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `suppliers/${id}`);
    }

    await logAuditEvent('update', 'supplier', id, `Fornecedor ${id} atualizado.`);
  };

  const deleteSupplier = async (id: string) => {
    ensureCanWrite();
    setRawSuppliers((prev) => prev.filter((s) => s.id !== id));

    try {
      if (currentUser && !isDemoMode) {
        await deleteDoc(doc(db, 'suppliers', id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `suppliers/${id}`);
    }

    await logAuditEvent('delete', 'supplier', id, `Fornecedor ${id} excluído.`);
  };

  const saveProperty = async (prop: Partial<PropertyItem>) => {
    ensureCanWrite();
    const now = new Date().toISOString();
    try {
      if (property?.id) {
        await updateDoc(doc(db, 'properties', property.id), {
          ...prop,
          updatedAt: now,
        });
        setProperty((prev) => (prev ? { ...prev, ...prop, updatedAt: now } : null));
      } else {
        const newDoc = await addDoc(collection(db, 'properties'), {
          ...prop,
          userId: activeUid,
          ownerAdminUid: resolveOwnerUid(),
          createdAt: now,
        });
        setProperty({
          id: newDoc.id,
          userId: activeUid,
          ownerAdminUid: resolveOwnerUid(),
          name: prop.name || 'Propriedade Rural',
          createdAt: now,
          ...prop,
        });
      }
      await logAuditEvent('update', 'property', property?.id || 'new', `Dados da propriedade ${prop.name} salvos.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'properties');
    }
  };

  const restoreDemoData = async () => {
    ensureCanWrite();
    initializeSeededAreaRecords(activeUid);
    setFieldAdmins(SEED_FIELD_ADMINS as FieldAdminUser[]);
    setProducers(SEED_PRODUCERS as ProducerRecord[]);
    setAuditLogs(SEED_AUDIT_LOGS as AuditLogRecord[]);
    await logAuditEvent('update', 'admin', 'system', 'Restauração completa dos dados e administradores de teste.');
  };

  const loadDemoDataToAccount = async () => {
    await restoreDemoData();
  };

  const clearAccountData = async () => {
    ensureCanWrite();
    setRawProductions([]);
    setRawCosts([]);
    setRawInventory([]);
    setRawSales([]);
    await logAuditEvent('delete', 'admin', activeUid, 'Todos os registros operacionais da conta foram limpos.');
  };

  return (
    <AgroContext.Provider
      value={{
        currentUser,
        userProfile,
        userRole,
        isSuperAdmin,
        isFieldAdmin,
        isAdmin,
        isVisitor,
        isSuspended,
        property,
        loading,
        isDemoMode,
        activeTestProfile,
        fieldAdmins,
        producers,
        auditLogs,
        selectedFieldAdminFilter,
        setSelectedFieldAdminFilter,
        selectedProducerFilter,
        setSelectedProducerFilter,
        productions,
        costs,
        inventory,
        sales,
        customers,
        suppliers,
        allProductions,
        allCosts,
        allInventory,
        allSales,
        loginWithGoogle,
        loginWithEmail,
        loginAdminWithEmail,
        registerWithEmail,
        sendPasswordReset,
        logout,
        startInstantDemo,
        switchTestProfile,
        createFieldAdmin,
        updateFieldAdmin,
        suspendFieldAdmin,
        reactivateFieldAdmin,
        assignProducerToAdmin,
        completeFieldAdminInvite,
        resendFieldAdminInvite,
        addProducer,
        updateProducer,
        deleteProducer,
        logAuditEvent,
        addProduction,
        updateProduction,
        deleteProduction,
        addCost,
        updateCost,
        deleteCost,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        adjustStock,
        addSale,
        updateSale,
        deleteSale,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        saveProperty,
        loadDemoDataToAccount,
        restoreDemoData,
        clearAccountData,
      }}
    >
      {children}
    </AgroContext.Provider>
  );
};

export const useAgro = () => {
  const context = useContext(AgroContext);
  if (!context) throw new Error('useAgro must be used within an AgroProvider');
  return context;
};

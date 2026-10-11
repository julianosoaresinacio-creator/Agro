import React, { useState } from 'react';
import { AgroProvider, useAgro } from './context/AgroContext';
import { ActivePage, ProductionRecord, CostRecord, SaleRecord, InventoryItem } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './components/DashboardView';
import { ProductionView } from './components/ProductionView';
import { CostsView } from './components/CostsView';
import { InventoryView } from './components/InventoryView';
import { SalesView } from './components/SalesView';
import { ResultView } from './components/ResultView';
import { CustomersView } from './components/CustomersView';
import { SuppliersView } from './components/SuppliersView';
import { ReportsView } from './components/ReportsView';
import { AgroGestAIView } from './components/AgroGestAIView';
import { SettingsView } from './components/SettingsView';
import { GlobalAdminView } from './components/GlobalAdminView';
import { ProducersView } from './components/ProducersView';
import { AuditLogView } from './components/AuditLogView';
import { ComplianceTestView } from './components/ComplianceTestView';
import { CompleteInviteModal } from './components/CompleteInviteModal';
import {
  Wheat,
  TrendingUp,
  Receipt,
  Package,
  X,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Plus,
} from 'lucide-react';

const MainApp: React.FC = () => {
  const {
    currentUser,
    isDemoMode,
    isAdmin,
    isSuperAdmin,
    isFieldAdmin,
    isSuspended,
    activeTestProfile,
    loading,
    addProduction,
    addSale,
    addCost,
    adjustStock,
    inventory,
  } = useAgro();
  const [activePage, setActivePage] = useState<ActivePage>('landing');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'admin'>('login');

  // Quick Action Modal state from Dashboard
  const [quickAction, setQuickAction] = useState<'producao' | 'venda' | 'custo' | 'estoque' | null>(null);

  // Quick form states
  const [quickProdName, setQuickProdName] = useState('');
  const [quickProdQty, setQuickProdQty] = useState<number | ''>('');
  const [quickProdUnit, setQuickProdUnit] = useState('kg');

  const [quickSaleProduct, setQuickSaleProduct] = useState('');
  const [quickSaleQty, setQuickSaleQty] = useState<number | ''>('');
  const [quickSalePrice, setQuickSalePrice] = useState<number | ''>('');
  const [quickSaleCustomer, setQuickSaleCustomer] = useState('');

  const [quickCostDesc, setQuickCostDesc] = useState('');
  const [quickCostAmount, setQuickCostAmount] = useState<number | ''>('');
  const [quickCostCategory, setQuickCostCategory] = useState<any>('insumos');

  const [quickStockItemId, setQuickStockItemId] = useState('');
  const [quickStockQty, setQuickStockQty] = useState<number | ''>('');

  const [quickError, setQuickError] = useState<string | null>(null);

  // Auto transition when logged in, in demo mode or in active test profile
  React.useEffect(() => {
    if ((currentUser || isDemoMode || activeTestProfile) && activePage === 'landing') {
      setActivePage('dashboard');
    } else if (!currentUser && !isDemoMode && !activeTestProfile && activePage !== 'landing') {
      setActivePage('landing');
    }
  }, [currentUser, isDemoMode, activeTestProfile]);

  // Check URL hash or query for invitation password setup
  const [inviteModalData, setInviteModalData] = useState<{
    email: string;
    name?: string;
    uid?: string;
    token?: string;
  } | null>(null);

  React.useEffect(() => {
    const checkHashOrQuery = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash.includes('definir-senha') || search.includes('definir-senha') || hash.includes('token=')) {
        const queryStr = hash.includes('?') ? hash.split('?')[1] : search.replace('?', '');
        const params = new URLSearchParams(queryStr);
        const email = params.get('email');
        const token = params.get('token');
        const uid = params.get('uid');
        const name = params.get('name');

        if (email) {
          setInviteModalData({
            email,
            token: token || undefined,
            uid: uid || undefined,
            name: name || undefined,
          });
        }
      }
    };

    checkHashOrQuery();
    window.addEventListener('hashchange', checkHashOrQuery);
    return () => window.removeEventListener('hashchange', checkHashOrQuery);
  }, []);

  const handleOpenAuth = (mode: 'login' | 'register' | 'admin' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError(null);

    if (!isAdmin) {
      setQuickError('Operação bloqueada: No modo demonstração, as operações de cadastro estão desabilitadas. Faça login como administrador para registrar dados.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    try {
      if (quickAction === 'producao') {
        if (!quickProdName.trim() || quickProdQty === '' || Number(quickProdQty) <= 0) {
          setQuickError('Preencha produto e quantidade válida.');
          return;
        }
        await addProduction({
          product: quickProdName.trim(),
          quantity: Number(quickProdQty),
          unit: quickProdUnit,
          date: today,
        });
        setQuickProdName('');
        setQuickProdQty('');
      } else if (quickAction === 'venda') {
        if (!quickSaleProduct.trim() || quickSaleQty === '' || quickSalePrice === '') {
          setQuickError('Preencha produto, quantidade e preço unitário.');
          return;
        }
        const qty = Number(quickSaleQty);
        const price = Number(quickSalePrice);
        await addSale({
          product: quickSaleProduct.trim(),
          quantity: qty,
          unit: 'unidades',
          unitPrice: price,
          totalAmount: qty * price,
          customer: quickSaleCustomer.trim() || undefined,
          date: today,
          paymentMethod: 'pix',
        });
        setQuickSaleProduct('');
        setQuickSaleQty('');
        setQuickSalePrice('');
        setQuickSaleCustomer('');
      } else if (quickAction === 'custo') {
        if (!quickCostDesc.trim() || quickCostAmount === '' || Number(quickCostAmount) <= 0) {
          setQuickError('Preencha a descrição e valor da despesa.');
          return;
        }
        await addCost({
          description: quickCostDesc.trim(),
          amount: Number(quickCostAmount),
          category: quickCostCategory,
          date: today,
        });
        setQuickCostDesc('');
        setQuickCostAmount('');
      } else if (quickAction === 'estoque') {
        if (!quickStockItemId || quickStockQty === '' || Number(quickStockQty) <= 0) {
          setQuickError('Selecione o item e a quantidade de entrada.');
          return;
        }
        await adjustStock(quickStockItemId, Number(quickStockQty), 'Entrada rápida via Dashboard');
        setQuickStockItemId('');
        setQuickStockQty('');
      }

      setQuickAction(null);
    } catch (err) {
      setQuickError('Erro ao salvar registro.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center animate-pulse shadow-md">
            <span className="font-bold text-xl">AG</span>
          </div>
          <p className="text-sm font-bold text-[#1B4332]">Carregando AgroGest...</p>
        </div>
      </div>
    );
  }

  const isInsideApp = (currentUser || isDemoMode || activeTestProfile) && activePage !== 'landing';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF8] text-[#1F2937]">
      {/* Top Navigation */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        onOpenAuth={(mode) => handleOpenAuth(mode || 'login')}
      />

      {/* Visitor Demo Mode Top Banner */}
      {isDemoMode && !isAdmin && isInsideApp && (
        <div className="bg-[#FEF3C7] border-b border-[#FDE68A] text-[#92400E] px-4 py-2 text-xs sm:text-sm font-semibold flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xs z-20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
            <span>Você está no modo demonstração. Os dados são somente para consulta.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-[#B45309] hidden md:inline">
              Operações de cadastro, edição e exclusão desabilitadas
            </span>
            <button
              type="button"
              onClick={() => handleOpenAuth('admin')}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Acesso administrativo</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      {!isInsideApp ? (
        <main className="flex-1">
          <LandingPage onOpenAuth={handleOpenAuth} />
        </main>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <Sidebar activePage={activePage} setActivePage={setActivePage} />
          </div>

          {/* Page Content View */}
          <main className="flex-1 overflow-y-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 md:pb-12 max-w-7xl mx-auto w-full">
            {activePage === 'global_admin' && (
              <GlobalAdminView
                onNavigateToAudit={() => setActivePage('auditoria')}
                onNavigateToProducers={() => setActivePage('produtores')}
              />
            )}
            {activePage === 'dashboard' && (
              <DashboardView
                setActivePage={setActivePage}
                onOpenQuickAction={(action) => setQuickAction(action)}
              />
            )}
            {activePage === 'produtores' && <ProducersView />}
            {activePage === 'producao' && <ProductionView />}
            {activePage === 'custos' && <CostsView />}
            {activePage === 'estoque' && <InventoryView />}
            {activePage === 'vendas' && <SalesView />}
            {activePage === 'resultado' && <ResultView />}
            {activePage === 'clientes' && <CustomersView />}
            {activePage === 'fornecedores' && <SuppliersView />}
            {activePage === 'relatorios' && <ReportsView />}
            {activePage === 'auditoria' && <AuditLogView />}
            {activePage === 'testes' && <ComplianceTestView />}
            {activePage === 'ia' && <AgroGestAIView />}
            {activePage === 'configuracoes' && <SettingsView />}
          </main>
        </div>
      )}

      {/* Mobile Navigation */}
      {isInsideApp && (
        <MobileNav activePage={activePage} setActivePage={setActivePage} />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
      />

      {/* Complete Invite / Define Password Modal */}
      <CompleteInviteModal
        isOpen={!!inviteModalData}
        onClose={() => setInviteModalData(null)}
        adminData={inviteModalData}
        onSuccess={() => {
          setInviteModalData(null);
          setActivePage('dashboard');
        }}
      />

      {/* Quick Action Modal */}
      {quickAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1B4332] p-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                {quickAction === 'producao' && <Wheat className="w-5 h-5 text-amber-400" />}
                {quickAction === 'venda' && <TrendingUp className="w-5 h-5 text-emerald-400" />}
                {quickAction === 'custo' && <Receipt className="w-5 h-5 text-rose-400" />}
                {quickAction === 'estoque' && <Package className="w-5 h-5 text-blue-400" />}
                <span>
                  {quickAction === 'producao' && 'Registrar Produção Rápida'}
                  {quickAction === 'venda' && 'Registrar Venda Rápida'}
                  {quickAction === 'custo' && 'Registrar Custo Rápido'}
                  {quickAction === 'estoque' && 'Entrada Rápida no Estoque'}
                </span>
              </h3>
              <button
                onClick={() => setQuickAction(null)}
                className="p-1 rounded-full text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="p-6 space-y-4">
              {quickError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{quickError}</span>
                </div>
              )}

              {/* Produção Form */}
              {quickAction === 'producao' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Produto</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Mel Silvestre, Leite..."
                      value={quickProdName}
                      onChange={(e) => setQuickProdName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Quantidade</label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="Ex: 50"
                        value={quickProdQty}
                        onChange={(e) => setQuickProdQty(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Unidade</label>
                      <select
                        value={quickProdUnit}
                        onChange={(e) => setQuickProdUnit(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden bg-white"
                      >
                        <option value="kg">kg</option>
                        <option value="litros">litros</option>
                        <option value="unidades">unidades</option>
                        <option value="potes">potes</option>
                        <option value="caixas">caixas</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Venda Form */}
              {quickAction === 'venda' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Produto</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Mel Silvestre Pote 500g..."
                      value={quickSaleProduct}
                      onChange={(e) => setQuickSaleProduct(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Quantidade</label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="Ex: 10"
                        value={quickSaleQty}
                        onChange={(e) => setQuickSaleQty(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Preço Unitário (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="Ex: 32.00"
                        value={quickSalePrice}
                        onChange={(e) => setQuickSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Cliente (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: Empório da Serra"
                      value={quickSaleCustomer}
                      onChange={(e) => setQuickSaleCustomer(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden"
                    />
                  </div>
                </>
              )}

              {/* Custo Form */}
              {quickAction === 'custo' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Descrição</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Combustível picape, Frascos..."
                      value={quickCostDesc}
                      onChange={(e) => setQuickCostDesc(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Valor (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="Ex: 180.00"
                        value={quickCostAmount}
                        onChange={(e) => setQuickCostAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Categoria</label>
                      <select
                        value={quickCostCategory}
                        onChange={(e) => setQuickCostCategory(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden bg-white"
                      >
                        <option value="insumos">Insumos</option>
                        <option value="alimentacao">Alimentação</option>
                        <option value="mao_de_obra">Mão de Obra</option>
                        <option value="transporte">Transporte</option>
                        <option value="energia">Energia</option>
                        <option value="manutencao">Manutenção</option>
                        <option value="equipamentos">Equipamentos</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Estoque Form */}
              {quickAction === 'estoque' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Selecione o Item</label>
                    {inventory.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                        <p>Nenhum item cadastrado no estoque ainda.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickAction(null);
                            setActivePage('estoque');
                          }}
                          className="px-3 py-1.5 bg-[#1B4332] text-white rounded-lg font-bold text-xs"
                        >
                          Ir para Módulo Estoque &rarr;
                        </button>
                      </div>
                    ) : (
                      <select
                        value={quickStockItemId}
                        onChange={(e) => setQuickStockItemId(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden bg-white font-medium"
                      >
                        <option value="">Selecione...</option>
                        {inventory.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.item} (Atual: {i.currentQuantity} {i.unit})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Quantidade de Entrada (+)</label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="Ex: 20"
                      value={quickStockQty}
                      onChange={(e) => setQuickStockQty(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setQuickAction(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AgroProvider>
      <MainApp />
    </AgroProvider>
  );
}

import React, { useState, useMemo } from 'react';
import { useAgro } from '../context/AgroContext';
import { ActivePage } from '../types';
import {
  Wheat,
  TrendingUp,
  Receipt,
  PieChart,
  Package,
  PlusCircle,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Scale,
  ShieldCheck,
} from 'lucide-react';

interface DashboardViewProps {
  setActivePage: (page: ActivePage) => void;
  onOpenQuickAction: (action: 'producao' | 'venda' | 'custo' | 'estoque') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActivePage,
  onOpenQuickAction,
}) => {
  const {
    userProfile,
    property,
    productions,
    costs,
    inventory,
    sales,
    isDemoMode,
    isAdmin,
    isFieldAdmin,
    isSuperAdmin,
    isSuspended,
    producers,
    selectedProducerFilter,
    setSelectedProducerFilter,
  } = useAgro();
  const [period, setPeriod] = useState<'this_month' | '3_months' | 'all'>('this_month');
  const [showFormulaHelp, setShowFormulaHelp] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Filtered records by period
  const filteredData = useMemo(() => {
    const filterByDate = (dateStr: string) => {
      const d = new Date(dateStr + 'T00:00:00');
      if (period === 'this_month') {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }
      if (period === '3_months') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return d >= threeMonthsAgo;
      }
      return true; // 'all'
    };

    return {
      sales: sales.filter((s) => filterByDate(s.date)),
      costs: costs.filter((c) => filterByDate(c.date)),
      productions: productions.filter((p) => filterByDate(p.date)),
    };
  }, [sales, costs, productions, period, currentYear, currentMonth]);

  // KPI Calculations
  const totalRevenue = useMemo(
    () => filteredData.sales.reduce((acc, s) => acc + s.totalAmount, 0),
    [filteredData.sales]
  );

  const totalCosts = useMemo(
    () => filteredData.costs.reduce((acc, c) => acc + c.amount, 0),
    [filteredData.costs]
  );

  const netResult = totalRevenue - totalCosts;
  const marginPct = totalRevenue > 0 ? (netResult / totalRevenue) * 100 : 0;
  const returnOnCost = totalCosts > 0 ? totalRevenue / totalCosts : totalRevenue > 0 ? 1 : 0;

  const totalProductionCount = useMemo(
    () => filteredData.productions.reduce((acc, p) => acc + p.quantity, 0),
    [filteredData.productions]
  );

  // Group production by product
  const productionByProduct = useMemo(() => {
    const map: Record<string, { qty: number; unit: string }> = {};
    filteredData.productions.forEach((p) => {
      if (!map[p.product]) {
        map[p.product] = { qty: 0, unit: p.unit };
      }
      map[p.product].qty += p.quantity;
    });
    return Object.entries(map).map(([product, data]) => ({
      product,
      ...data,
    }));
  }, [filteredData.productions]);

  // Highest cost category
  const topCostCategory = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredData.costs.forEach((c) => {
      catMap[c.category] = (catMap[c.category] || 0) + c.amount;
    });
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    const catLabels: Record<string, string> = {
      insumos: 'Insumos / Adubos',
      alimentacao: 'Ração / Alimentação',
      mao_de_obra: 'Mão de Obra / Diárias',
      transporte: 'Frete / Combustível',
      energia: 'Energia Elétrica',
      manutencao: 'Manutenção / Peças',
      equipamentos: 'Equipamentos',
      outros: 'Outros Custos',
    };
    return {
      name: catLabels[sorted[0][0]] || sorted[0][0],
      amount: sorted[0][1],
      pct: totalCosts > 0 ? (sorted[0][1] / totalCosts) * 100 : 0,
    };
  }, [filteredData.costs, totalCosts]);

  // Average sale ticket
  const averageTicket = useMemo(() => {
    if (filteredData.sales.length === 0) return 0;
    return totalRevenue / filteredData.sales.length;
  }, [totalRevenue, filteredData.sales]);

  // Stock status
  const criticalStockItems = useMemo(
    () => inventory.filter((i) => i.currentQuantity <= i.minQuantity),
    [inventory]
  );
  const normalStockCount = inventory.length - criticalStockItems.length;

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Period label for display
  const periodLabel = useMemo(() => {
    if (period === 'this_month') {
      const monthName = now.toLocaleDateString('pt-BR', { month: 'long' });
      return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${currentYear}`;
    }
    if (period === '3_months') {
      return 'Últimos 90 dias';
    }
    return 'Todo o histórico lançado';
  }, [period, now, currentYear]);

  // Chart Data: Monthly trends for last 6 months
  const monthlyTrends = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mIdx = d.getMonth();
      const yVal = d.getFullYear();
      const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

      // monthly sales
      const mSales = sales
        .filter((s) => {
          const sd = new Date(s.date + 'T00:00:00');
          return sd.getMonth() === mIdx && sd.getFullYear() === yVal;
        })
        .reduce((acc, s) => acc + s.totalAmount, 0);

      // monthly costs
      const mCosts = costs
        .filter((c) => {
          const cd = new Date(c.date + 'T00:00:00');
          return cd.getMonth() === mIdx && cd.getFullYear() === yVal;
        })
        .reduce((acc, c) => acc + c.amount, 0);

      // monthly production volume
      const mProd = productions
        .filter((p) => {
          const pd = new Date(p.date + 'T00:00:00');
          return pd.getMonth() === mIdx && pd.getFullYear() === yVal;
        })
        .reduce((acc, p) => acc + p.quantity, 0);

      months.push({
        label: `${monthLabel}/${String(yVal).slice(2)}`,
        sales: mSales,
        costs: mCosts,
        result: mSales - mCosts,
        production: mProd,
      });
    }
    return months;
  }, [sales, costs, productions, currentYear, currentMonth]);

  // Chart 4: Top Products by Revenue
  const topProducts = useMemo(() => {
    const prodMap: Record<string, { total: number; qty: number; unit: string }> = {};
    sales.forEach((s) => {
      if (!prodMap[s.product]) {
        prodMap[s.product] = { total: 0, qty: 0, unit: s.unit };
      }
      prodMap[s.product].total += s.totalAmount;
      prodMap[s.product].qty += s.quantity;
    });

    const list = Object.entries(prodMap).map(([product, val]) => ({
      product,
      ...val,
    }));
    list.sort((a, b) => b.total - a.total);
    return list.slice(0, 5);
  }, [sales]);

  // Total sales across all products for percentage
  const totalAllSales = useMemo(
    () => sales.reduce((acc, s) => acc + s.totalAmount, 0),
    [sales]
  );

  // Max values for chart scaling
  const maxSalesCost = Math.max(
    ...monthlyTrends.map((m) => Math.max(m.sales, m.costs, 100)),
    100
  );
  const maxProd = Math.max(...monthlyTrends.map((m) => m.production), 50);
  const maxResult = Math.max(...monthlyTrends.map((m) => Math.abs(m.result)), 100);
  const maxTopProductTotal = topProducts.length > 0 ? topProducts[0].total : 100;

  return (
    <div className="space-y-6 pb-12">
      {/* Suspension Alert Banner */}
      {isSuspended && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-r-2xl shadow-xs text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-black text-rose-950 text-sm">Conta de Administrador de Campo Suspensa</h4>
            <p className="mt-0.5">
              Sua conta foi suspensa temporariamente pelo Administrador Principal. Novas operações de produção, custo, estoque e vendas foram congeladas. Os dados históricos permanecem preservados para consulta.
            </p>
          </div>
        </div>
      )}

      {/* 1. Header and Welcome Card with Clear Rural Context */}
      <div className="bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] rounded-2xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative background wheat icon */}
        <div className="absolute -right-8 -bottom-12 opacity-10 pointer-events-none">
          <Wheat className="w-72 h-72" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#D8F3DC]">
              <span className="font-bold uppercase tracking-wider text-white">
                {property?.name || 'Sítio / Propriedade Rural'}
              </span>
              <span>·</span>
              <span>{property?.activityType || 'Agropecuária Familiar'}</span>
              {isFieldAdmin && (
                <>
                  <span>·</span>
                  <span className="bg-emerald-400 text-[#1B4332] font-black px-2 py-0.5 rounded text-[11px] uppercase">
                    Área: Administrador de Campo
                  </span>
                </>
              )}
              {isSuperAdmin && (
                <>
                  <span>·</span>
                  <span className="bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded text-[11px] uppercase">
                    SUPER_ADMIN
                  </span>
                </>
              )}
              {isDemoMode && (
                <>
                  <span>·</span>
                  <span className="bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded text-[11px]">
                    Modo Demonstração
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Olá, {userProfile?.displayName || 'Produtor Rural'}
            </h1>
            <p className="text-sm text-[#D8F3DC] max-w-xl leading-relaxed">
              {isFieldAdmin
                ? `Painel da sua área de campo: dados operacionais, colheitas e resultados dos produtores sob sua supervisão em ${periodLabel.toLowerCase()}.`
                : `Painel do produtor: veja quanto você colheu, o que entrou das vendas, o que saiu em despesas e quanto sobrou no seu bolso em ${periodLabel.toLowerCase()}.`}
            </p>
          </div>

          {/* Period selector with clear Brazilian Portuguese labels */}
          <div className="w-full sm:w-auto flex flex-col sm:items-end gap-2 shrink-0">
            {/* Filter by Producer */}
            {producers.length > 0 && (isAdmin || isFieldAdmin) && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[11px] font-semibold text-[#D8F3DC] uppercase tracking-wider hidden sm:inline">
                  Produtor:
                </span>
                <select
                  value={selectedProducerFilter}
                  onChange={(e) => setSelectedProducerFilter(e.target.value)}
                  className="bg-black/30 text-white border border-white/20 rounded-xl px-2.5 py-1 text-xs outline-hidden font-bold w-full sm:w-auto"
                >
                  <option value="all" className="text-gray-900">
                    Todos os Produtores da Área
                  </option>
                  {producers.map((p) => (
                    <option key={p.id} value={p.id} className="text-gray-900">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="w-full sm:w-auto flex flex-col sm:items-end gap-1 shrink-0">
              <span className="text-[11px] font-semibold text-[#D8F3DC] uppercase tracking-wider hidden sm:block">
                Período de Análise
              </span>
              <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-black/25 backdrop-blur-md p-1.5 rounded-xl border border-white/15 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPeriod('this_month')}
                  className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                    period === 'this_month'
                      ? 'bg-white text-[#1B4332] shadow-xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Este Mês
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('3_months')}
                  className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                    period === '3_months'
                      ? 'bg-white text-[#1B4332] shadow-xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Últimos 3 Meses
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('all')}
                  className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                    period === 'all'
                      ? 'bg-white text-[#1B4332] shadow-xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Tudo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visitor Consultation Notice */}
      {isDemoMode && !isAdmin && (
        <div className="bg-[#FEF3C7] border-l-4 border-[#D97706] rounded-r-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-[#92400E]">
                Você está no modo demonstração. Os dados são somente para consulta.
              </h4>
              <p className="text-xs text-[#B45309] mt-0.5">
                Você pode testar todos os filtros de período e navegar pelos gráficos. Operações de cadastro, edição, exclusão e exportação são exclusivas do administrador (ADMIN).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActivePage('configuracoes')}
            className="self-start sm:self-center px-3.5 py-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs shrink-0 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Acesso administrativo</span>
          </button>
        </div>
      )}

      {/* 2. Critical Stock Alert Banner if items are low */}
      {criticalStockItems.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Atenção ao Barracão: {criticalStockItems.length}{' '}
                {criticalStockItems.length === 1 ? 'insumo precisa de reposição!' : 'insumos precisam de reposição!'}
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Quantidade atual no limite ou abaixo do mínimo: {criticalStockItems.map((i) => `${i.item} (${i.currentQuantity} ${i.unit})`).join(', ')}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActivePage('estoque')}
            className="self-start sm:self-center px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs shrink-0 flex items-center gap-1.5"
          >
            <span>Repor no Estoque</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Termômetro da Propriedade Rural (Diagnóstico Financeiro Direto e Claro) */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${netResult >= 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
            <h2 className="text-base font-bold text-gray-900">
              Termômetro da Propriedade ({periodLabel})
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`font-bold px-2.5 py-1 rounded-md ${
              netResult >= 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {netResult >= 0 ? 'Propriedade no Azul (Lucro)' : 'Propriedade no Vermelho (Atenção aos Custos)'}
            </span>
            <button
              type="button"
              onClick={() => setShowFormulaHelp(!showFormulaHelp)}
              className="text-gray-400 hover:text-gray-600 p-1"
              title="Como esse resultado é calculado?"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Explanatory Help Card for the small producer if toggled */}
        {showFormulaHelp && (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3.5 text-xs text-[#1B4332] space-y-1.5 animate-in fade-in duration-150">
            <p className="font-bold flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-emerald-600" />
              Como funciona o cálculo simples da sua roça:
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>Resultado da Safra = Dinheiro que Entrou (Vendas) - Dinheiro que Saiu (Custos e Despesas).</strong> Se o valor for positivo, você teve lucro líquido e sobrou dinheiro. Se for negativo, significa que as despesas do período superaram as receitas das vendas.
            </p>
          </div>
        )}

        {/* Visual Rural Formula Bar (Entrou - Saiu = Sobrou) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Entrou */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <span>(+) Dinheiro que Entrou</span>
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-800 mt-1">
                {formatBRL(totalRevenue)}
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {filteredData.sales.length} vendas registradas
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>

          {/* Saiu */}
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                <span>(-) Dinheiro que Saiu</span>
              </span>
              <p className="text-xl sm:text-2xl font-black text-rose-800 mt-1">
                {formatBRL(totalCosts)}
              </p>
              <p className="text-xs text-rose-700 mt-0.5">
                {filteredData.costs.length} despesas lançadas
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-6 h-6" />
            </div>
          </div>

          {/* Sobrou no Bolso */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            netResult >= 0 ? 'bg-[#D8F3DC]/40 border-[#74C69D]/50' : 'bg-red-50/80 border-red-200'
          }`}>
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                netResult >= 0 ? 'text-[#1B4332]' : 'text-red-800'
              }`}>
                (=) Sobra no Bolso (Lucro)
              </span>
              <p className={`text-xl sm:text-2xl font-black mt-1 ${
                netResult >= 0 ? 'text-[#1B4332]' : 'text-red-700'
              }`}>
                {formatBRL(netResult)}
              </p>
              <p className="text-xs text-gray-600 mt-0.5 font-medium">
                {totalRevenue > 0
                  ? `De cada R$ 100 vendidos, sobram R$ ${Math.max(0, marginPct).toFixed(0)} limpos.`
                  : 'Nenhuma venda lançada no período.'}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              netResult >= 0 ? 'bg-[#1B4332] text-white' : 'bg-red-600 text-white'
            }`}>
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Practical summary pills / key takeaways for the farmer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-2 text-gray-700">
            <span className="w-2 h-2 rounded-full bg-[#2D6A4F] shrink-0" />
            <span>
              <strong>Margem Real:</strong>{' '}
              {marginPct >= 0 ? `${marginPct.toFixed(1)}% de lucro` : `${marginPct.toFixed(1)}% (déficit)`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <span>
              <strong>Ticket Médio:</strong>{' '}
              {filteredData.sales.length > 0 ? `${formatBRL(averageTicket)} por venda` : 'Sem vendas no período'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>
              <strong>Maior Custo:</strong>{' '}
              {topCostCategory ? `${topCostCategory.name} (${topCostCategory.pct.toFixed(0)}%)` : 'Nenhum custo lançado'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Os 5 Indicadores Principais (KPIs com Linguagem Simples e Clara) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800">
              5 Indicadores Principais
            </h3>
            <p className="text-xs text-gray-500">
              Clique em qualquer indicador para abrir a tela completa com filtros e cadastros
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* KPI 1: Produção / Colheita */}
          <div
            onClick={() => setActivePage('producao')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-xs hover:border-[#2D6A4F] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  1. Produção da Roça
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wheat className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">
                {totalProductionCount.toLocaleString('pt-BR')}{' '}
                <span className="text-xs font-semibold text-gray-500">un/kg</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {filteredData.productions.length === 1
                  ? '1 colheita registrada'
                  : `${filteredData.productions.length} colheitas registradas`}
              </p>
              {productionByProduct.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500 truncate">
                  Destaque: <strong className="text-gray-700">{productionByProduct[0].product}</strong> ({productionByProduct[0].qty} {productionByProduct[0].unit})
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-[#2D6A4F] pt-2 border-t border-gray-50">
              <span>Ver colheitas</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* KPI 2: Vendas / Faturamento */}
          <div
            onClick={() => setActivePage('vendas')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-xs hover:border-[#2D6A4F] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  2. Dinheiro que Entrou
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-700 tracking-tight">
                {formatBRL(totalRevenue)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {filteredData.sales.length === 1
                  ? '1 venda realizada'
                  : `${filteredData.sales.length} vendas no período`}
              </p>
              <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                Ticket médio: <strong className="text-gray-700">{formatBRL(averageTicket)}</strong>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-emerald-700 pt-2 border-t border-gray-50">
              <span>Ver vendas</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* KPI 3: Custos e Despesas */}
          <div
            onClick={() => setActivePage('custos')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-xs hover:border-[#2D6A4F] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  3. Dinheiro que Saiu
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-700 tracking-tight">
                {formatBRL(totalCosts)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {filteredData.costs.length === 1
                  ? '1 despesa lançada'
                  : `${filteredData.costs.length} despesas lançadas`}
              </p>
              <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500 truncate">
                {topCostCategory ? (
                  <>Maior peso: <strong className="text-gray-700">{topCostCategory.name}</strong></>
                ) : (
                  'Nenhuma despesa'
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-rose-700 pt-2 border-t border-gray-50">
              <span>Ver despesas</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* KPI 4: Resultado / Sobra no Bolso */}
          <div
            onClick={() => setActivePage('resultado')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-xs hover:border-[#2D6A4F] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  4. Sobra no Bolso
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  netResult >= 0 ? 'bg-[#D8F3DC] text-[#1B4332]' : 'bg-red-50 text-red-700'
                }`}>
                  <PieChart className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-2xl font-black tracking-tight ${netResult >= 0 ? 'text-[#1B4332]' : 'text-red-600'}`}>
                {formatBRL(netResult)}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                  marginPct >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {marginPct.toFixed(1)}% de margem
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                {netResult >= 0 ? 'Saldo líquido positivo' : 'Atenção: saldo negativo'}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-[#1B4332] pt-2 border-t border-gray-50">
              <span>Ver DRE da Roça</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* KPI 5: Insumos no Barracão (Estoque) */}
          <div
            onClick={() => setActivePage('estoque')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-xs hover:border-[#2D6A4F] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  5. Insumos no Barracão
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  criticalStockItems.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">
                {inventory.length} <span className="text-xs font-semibold text-gray-500">itens</span>
              </p>
              <p className="text-xs mt-1">
                {criticalStockItems.length > 0 ? (
                  <span className="text-amber-700 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {criticalStockItems.length} precisando repor
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">Todos acima do mínimo</span>
                )}
              </p>
              <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                {normalStockCount} abastecidos com folga
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-blue-700 pt-2 border-t border-gray-50">
              <span>Controlar estoque</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Seção de Ações Rápidas (Exclusiva para Administradores) */}
      {isAdmin ? (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                <span>Lançamento Rápido no Campo (ADMIN)</span>
              </h3>
              <p className="text-xs text-gray-500">
                Lance direto pelo celular sem precisar navegar pelas páginas
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => onOpenQuickAction('producao')}
              className="flex items-center justify-center gap-2 py-3 px-3.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#1B4332] font-bold text-xs sm:text-sm rounded-xl border border-[#BBF7D0] transition-all active:scale-[0.98] shadow-2xs"
            >
              <PlusCircle className="w-4 h-4 text-[#2D6A4F] shrink-0" />
              <span className="truncate">Registrar Colheita</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenQuickAction('venda')}
              className="flex items-center justify-center gap-2 py-3 px-3.5 bg-[#ECFDF5] hover:bg-[#D1FAE5] text-emerald-900 font-bold text-xs sm:text-sm rounded-xl border border-[#A7F3D0] transition-all active:scale-[0.98] shadow-2xs"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">Registrar Venda</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenQuickAction('custo')}
              className="flex items-center justify-center gap-2 py-3 px-3.5 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-rose-900 font-bold text-xs sm:text-sm rounded-xl border border-[#FECDD3] transition-all active:scale-[0.98] shadow-2xs"
            >
              <PlusCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="truncate">Registrar Despesa</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenQuickAction('estoque')}
              className="flex items-center justify-center gap-2 py-3 px-3.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-blue-900 font-bold text-xs sm:text-sm rounded-xl border border-[#BFDBFE] transition-all active:scale-[0.98] shadow-2xs"
            >
              <PlusCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate">Entrada de Insumo</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* 6. Os 4 Gráficos Requisitados (Claros e Diretos para o Produtor) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Produção por Mês */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-base font-bold text-gray-900">
                  Gráfico 1: Produção por Mês
                </h4>
                <p className="text-xs text-gray-500">
                  Volume físico colhido nos últimos 6 meses (kg, sacas ou unidades)
                </p>
              </div>
              <Wheat className="w-5 h-5 text-amber-600" />
            </div>

            <div className="h-56 flex items-end justify-between gap-1.5 sm:gap-2 pt-6 pb-2 border-b border-gray-100">
              {monthlyTrends.map((m, idx) => {
                const heightPct = m.production > 0 ? Math.max(10, Math.round((m.production / maxProd) * 100)) : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[10px] font-bold text-amber-900 transition-opacity">
                      {m.production > 0 ? m.production : '-'}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[38px] rounded-t-lg transition-all group-hover:brightness-110 shadow-2xs ${
                        heightPct > 0 ? 'bg-gradient-to-t from-amber-600 to-amber-400' : 'bg-gray-100 border-b border-gray-200'
                      }`}
                    />
                    <span className="text-[11px] font-medium text-gray-600 mt-1 capitalize">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500 pt-2">
            <span>Acompanhe o ritmo da colheita</span>
            <span className="font-bold text-gray-800">
              Total 6 meses: {monthlyTrends.reduce((a, b) => a + b.production, 0).toLocaleString('pt-BR')} un/kg
            </span>
          </div>
        </div>

        {/* Gráfico 2: Vendas x Custos (Entrou vs Saiu) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="text-base font-bold text-gray-900">
                  Gráfico 2: Entrou vs Saiu (Vendas x Custos)
                </h4>
                <p className="text-xs text-gray-500">
                  Comparativo direto de receitas contra despesas de cada mês
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold shrink-0">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Entrou
                </span>
                <span className="flex items-center gap-1.5 text-rose-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Saiu
                </span>
              </div>
            </div>

            <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-gray-100">
              {monthlyTrends.map((m, idx) => {
                const salesPct = m.sales > 0 ? Math.max(8, Math.round((m.sales / maxSalesCost) * 100)) : 0;
                const costsPct = m.costs > 0 ? Math.max(8, Math.round((m.costs / maxSalesCost) * 100)) : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group">
                    <div className="w-full flex items-end justify-center gap-1 h-44">
                      <div
                        style={{ height: `${salesPct}%` }}
                        className={`w-1/2 max-w-[18px] rounded-t-md transition-all group-hover:brightness-110 ${
                          salesPct > 0 ? 'bg-emerald-600 shadow-2xs' : 'bg-transparent'
                        }`}
                        title={`Entrou: ${formatBRL(m.sales)}`}
                      />
                      <div
                        style={{ height: `${costsPct}%` }}
                        className={`w-1/2 max-w-[18px] rounded-t-md transition-all group-hover:brightness-110 ${
                          costsPct > 0 ? 'bg-rose-500 shadow-2xs' : 'bg-transparent'
                        }`}
                        title={`Saiu: ${formatBRL(m.costs)}`}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-gray-600 mt-2 capitalize">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500 pt-2">
            <span>Verde = Faturamento | Vermelho = Custos</span>
            <span className="font-bold text-[#1B4332]">
              Saldo do semestre: {formatBRL(monthlyTrends.reduce((a, b) => a + (b.sales - b.costs), 0))}
            </span>
          </div>
        </div>

        {/* Gráfico 3: Resultado Mensal (Sobra Líquida da Roça) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-base font-bold text-gray-900">
                  Gráfico 3: Sobra no Bolso Mês a Mês (Lucro)
                </h4>
                <p className="text-xs text-gray-500">
                  Quanto sobrou limpo para a fazenda ao final de cada mês
                </p>
              </div>
              <PieChart className="w-5 h-5 text-[#2D6A4F]" />
            </div>

            <div className="h-56 flex items-end justify-between gap-1.5 sm:gap-2 pt-6 pb-2 border-b border-gray-100">
              {monthlyTrends.map((m, idx) => {
                const isPositive = m.result >= 0;
                const heightPct = m.result !== 0 ? Math.max(10, Math.round((Math.abs(m.result) / maxResult) * 100)) : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className={`text-[10px] font-bold ${isPositive ? 'text-emerald-800' : 'text-red-700'}`}>
                      {m.result !== 0 ? (m.result >= 1000 ? `${(m.result / 1000).toFixed(1)}k` : m.result.toFixed(0)) : '-'}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[34px] rounded-t-lg transition-all group-hover:brightness-110 shadow-2xs ${
                        heightPct === 0
                          ? 'bg-transparent border-b border-gray-200'
                          : isPositive
                          ? 'bg-gradient-to-t from-[#1B4332] to-[#40916C]'
                          : 'bg-gradient-to-t from-red-700 to-red-400'
                      }`}
                      title={`${m.label}: ${formatBRL(m.result)}`}
                    />
                    <span className="text-[11px] font-medium text-gray-600 mt-1 capitalize">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500 pt-2">
            <span>Verde = Lucro Líquido | Vermelho = Prejuízo</span>
            <span className="font-bold text-emerald-800">
              Média mensal: {formatBRL(monthlyTrends.reduce((a, b) => a + b.result, 0) / (monthlyTrends.length || 1))}
            </span>
          </div>
        </div>

        {/* Gráfico 4: Principais Produtos (O que mais deu dinheiro) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-base font-bold text-gray-900">
                  Gráfico 4: O que Mais Deu Dinheiro (Produtos)
                </h4>
                <p className="text-xs text-gray-500">
                  Produtos mais vendidos e sua participação na renda da propriedade
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>

            <div className="space-y-3 pt-1">
              {topProducts.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Nenhuma venda registrada ainda para calcular os produtos principais.
                </div>
              ) : (
                topProducts.map((p, idx) => {
                  const pct = totalAllSales > 0 ? Math.round((p.total / totalAllSales) * 100) : 0;
                  const barWidth = Math.max(12, Math.round((p.total / maxTopProductTotal) * 100));
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-1.5 truncate max-w-[210px] sm:max-w-xs">
                          <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-100 text-[#1B4332] text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-gray-800 truncate">
                            {p.product}
                          </span>
                          <span className="text-gray-400 font-normal text-[11px] hidden sm:inline">
                            ({p.qty} {p.unit})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#1B4332] font-black">{formatBRL(p.total)}</span>
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${barWidth}%` }}
                          className="h-full bg-gradient-to-r from-[#2D6A4F] to-[#74C69D] rounded-full transition-all duration-300"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Mostra qual cultivo sustenta as contas</span>
            <button
              type="button"
              onClick={() => setActivePage('resultado')}
              className="text-[#2D6A4F] font-bold hover:underline flex items-center gap-1"
            >
              <span>Ver análise detalhada</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Dicas Práticas de Gestão Rural para o Pequeno Produtor */}
      <div className="bg-[#F8FAF9] rounded-2xl border border-gray-200/90 p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Recomendações Práticas para a sua Propriedade
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3.5 rounded-xl bg-white border border-gray-200/80 shadow-2xs space-y-1">
            <span className="font-bold text-[#1B4332] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Saúde do Caixa Rural
            </span>
            <p className="text-gray-600 leading-relaxed">
              {netResult >= 0
                ? 'Sua propriedade está no azul! Recomenda-se guardar pelo menos 20% do lucro como reserva para manutenção de máquinas e imprevistos climáticos.'
                : 'Os custos superaram as receitas no período. Avalie adiar compras de itens não essenciais e focar na comercialização do estoque disponível.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-gray-200/80 shadow-2xs space-y-1">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Gestão de Insumos
            </span>
            <p className="text-gray-600 leading-relaxed">
              {criticalStockItems.length > 0
                ? `Você tem ${criticalStockItems.length} insumo(s) em nível crítico. Faça a cotação antecipada com fornecedores para conseguir melhores preços à vista ou prazo.`
                : 'Todos os seus insumos estão em níveis seguros no barracão. Excelente planejamento de safra!'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-gray-200/80 shadow-2xs space-y-1">
            <span className="font-bold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Consultoria AgroGest IA
            </span>
            <p className="text-gray-600 leading-relaxed">
              Dúvidas sobre preço justo de venda ou como reduzir gastos com adubação e ração? Converse com a assistente técnica na aba AgroGest IA.
            </p>
            <button
              type="button"
              onClick={() => setActivePage('ia')}
              className="text-blue-700 font-bold hover:underline inline-flex items-center gap-1 pt-1"
            >
              <span>Fazer pergunta à IA</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

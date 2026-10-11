import React, { useState, useMemo } from 'react';
import { useAgro } from '../context/AgroContext';
import {
  PieChart,
  TrendingUp,
  Receipt,
  Minus,
  Equal,
  Percent,
  Calendar,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
} from 'lucide-react';

export const ResultView: React.FC = () => {
  const { sales, costs, productions } = useAgro();
  const [period, setPeriod] = useState<'this_month' | '3_months' | 'this_year' | 'all'>('this_month');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const filterByPeriod = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (period === 'this_month') {
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }
    if (period === '3_months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return d >= threeMonthsAgo;
    }
    if (period === 'this_year') {
      return d.getFullYear() === currentYear;
    }
    return true;
  };

  const currentSales = useMemo(() => sales.filter((s) => filterByPeriod(s.date)), [sales, period]);
  const currentCosts = useMemo(() => costs.filter((c) => filterByPeriod(c.date)), [costs, period]);

  // Main calculations
  const totalRevenue = useMemo(
    () => currentSales.reduce((acc, s) => acc + s.totalAmount, 0),
    [currentSales]
  );

  const totalCosts = useMemo(
    () => currentCosts.reduce((acc, c) => acc + c.amount, 0),
    [currentCosts]
  );

  const netResult = totalRevenue - totalCosts;
  const marginPct = totalRevenue > 0 ? (netResult / totalRevenue) * 100 : 0;

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Breakdown by product
  const productPerformance = useMemo(() => {
    const map: Record<string, { revenue: number; quantity: number; unit: string }> = {};

    currentSales.forEach((s) => {
      if (!map[s.product]) map[s.product] = { revenue: 0, quantity: 0, unit: s.unit };
      map[s.product].revenue += s.totalAmount;
      map[s.product].quantity += s.quantity;
    });

    const list = Object.entries(map).map(([product, data]) => {
      const sharePct = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
      return {
        product,
        ...data,
        sharePct,
      };
    });

    list.sort((a, b) => b.revenue - a.revenue);
    return list;
  }, [currentSales, totalRevenue]);

  // Monthly timeline evolution
  const monthlyEvolution = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mIdx = d.getMonth();
      const yVal = d.getFullYear();
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

      const mSales = sales
        .filter((s) => {
          const sd = new Date(s.date + 'T00:00:00');
          return sd.getMonth() === mIdx && sd.getFullYear() === yVal;
        })
        .reduce((acc, s) => acc + s.totalAmount, 0);

      const mCosts = costs
        .filter((c) => {
          const cd = new Date(c.date + 'T00:00:00');
          return cd.getMonth() === mIdx && cd.getFullYear() === yVal;
        })
        .reduce((acc, c) => acc + c.amount, 0);

      const res = mSales - mCosts;
      const marg = mSales > 0 ? (res / mSales) * 100 : 0;

      months.push({
        label: `${label}/${String(yVal).slice(2)}`,
        sales: mSales,
        costs: mCosts,
        result: res,
        margin: marg,
      });
    }
    return months;
  }, [sales, costs, currentYear, currentMonth]);

  const maxVal = Math.max(
    ...monthlyEvolution.map((m) => Math.max(m.sales, m.costs, Math.abs(m.result))),
    100
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header with period toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] tracking-tight flex items-center gap-2">
            <PieChart className="w-8 h-8 text-[#2D6A4F]" />
            <span>Meu Resultado</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Veja com clareza matemática a relação entre o que entrou, o que saiu e o seu lucro real.
          </p>
        </div>

        {/* Period Selector */}
        <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center gap-1 sm:gap-1.5 bg-white p-1.5 rounded-xl border border-gray-200 shadow-2xs self-stretch sm:self-auto">
          <Calendar className="w-4 h-4 text-gray-400 ml-2 hidden sm:block" />
          <button
            onClick={() => setPeriod('this_month')}
            className={`py-2 px-3 rounded-lg text-xs font-bold text-center transition-all ${
              period === 'this_month' ? 'bg-[#1B4332] text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setPeriod('3_months')}
            className={`py-2 px-3 rounded-lg text-xs font-bold text-center transition-all ${
              period === '3_months' ? 'bg-[#1B4332] text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            3 Meses
          </button>
          <button
            onClick={() => setPeriod('this_year')}
            className={`py-2 px-3 rounded-lg text-xs font-bold text-center transition-all ${
              period === 'this_year' ? 'bg-[#1B4332] text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Este Ano
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`py-2 px-3 rounded-lg text-xs font-bold text-center transition-all ${
              period === 'all' ? 'bg-[#1B4332] text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Todo Histórico
          </button>
        </div>
      </div>

      {/* Visual Arithmetic Equation Card */}
      <div className="bg-gradient-to-br from-[#F8FAF8] via-white to-[#F0FDF4] p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#2D6A4F]/20 shadow-sm">
        <div className="text-center mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-[#2D6A4F] bg-[#D8F3DC] px-3 py-1 rounded-full">
            Balanço Operacional do Período
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 mt-2">
            Equação do Resultado Rural
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-4 text-center">
          {/* Receita Card */}
          <div className="md:col-span-2 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-5 shadow-2xs">
            <span className="text-xs font-bold uppercase text-emerald-800 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Receita Total
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
              {formatBRL(totalRevenue)}
            </p>
            <p className="text-xs text-emerald-600 mt-1">{currentSales.length} vendas realizadas</p>
          </div>

          {/* Minus Operator */}
          <div className="flex justify-center text-gray-400">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-xl text-gray-600 shadow-2xs">
              <Minus className="w-5 h-5" />
            </div>
          </div>

          {/* Custos Card */}
          <div className="md:col-span-2 bg-rose-50/80 border border-rose-200/80 rounded-2xl p-5 shadow-2xs">
            <span className="text-xs font-bold uppercase text-rose-800 flex items-center justify-center gap-1">
              <Receipt className="w-4 h-4 text-rose-600" />
              Custos Totais
            </span>
            <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-2">
              {formatBRL(totalCosts)}
            </p>
            <p className="text-xs text-rose-600 mt-1">{currentCosts.length} despesas lançadas</p>
          </div>

          {/* Equal Operator */}
          <div className="flex justify-center text-gray-400">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-black text-xl text-gray-600 shadow-2xs">
              <Equal className="w-5 h-5" />
            </div>
          </div>

          {/* Resultado Estimado Card */}
          <div className={`md:col-span-2 rounded-2xl p-5 shadow-sm border ${
            netResult >= 0
              ? 'bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white border-[#1B4332]'
              : 'bg-red-700 text-white border-red-800'
          }`}>
            <span className="text-xs font-bold uppercase tracking-wide opacity-90">
              Resultado Estimado
            </span>
            <p className="text-2xl sm:text-3xl font-black mt-2">
              {formatBRL(netResult)}
            </p>
            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">
              <Percent className="w-3.5 h-3.5" />
              <span>Margem: {marginPct.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Marginal calculation explanation */}
        <div className="mt-6 pt-5 border-t border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-600 gap-2">
          <p>
            <strong>Cálculo da Margem:</strong> Margem (%) = (Resultado ÷ Receita) × 100
          </p>
          <span className={`font-bold ${netResult >= 0 ? 'text-[#1B4332]' : 'text-red-600'}`}>
            {netResult >= 0
              ? 'Seu negócio rural está operando com saldo positivo.'
              : 'Atenção: seus custos superaram o faturamento no período.'}
          </span>
        </div>
      </div>

      {/* Evolução do Resultado Mês a Mês */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Evolução Histórica do Resultado</h3>
            <p className="text-xs text-gray-500">Histórico de receitas, despesas e margem mensal</p>
          </div>
          <span className="text-xs font-bold bg-[#D8F3DC] text-[#1B4332] px-2.5 py-1 rounded-full">
            Últimos 6 Meses
          </span>
        </div>

        {/* Chart representation */}
        <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-gray-100">
          {monthlyEvolution.map((m, idx) => {
            const isPos = m.result >= 0;
            const heightPct = m.result !== 0 ? Math.max(8, Math.round((Math.abs(m.result) / maxVal) * 100)) : 0;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <span className="text-[10px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {formatBRL(m.result)}
                </span>
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[42px] rounded-t-lg transition-all group-hover:brightness-110 shadow-2xs ${
                    heightPct === 0
                      ? 'bg-transparent border-b border-gray-200'
                      : isPos
                      ? 'bg-gradient-to-t from-[#1B4332] to-[#52B788]'
                      : 'bg-gradient-to-t from-rose-700 to-rose-400'
                  }`}
                />
                <span className="text-[11px] font-semibold text-gray-600 mt-2 capitalize">
                  {m.label}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                  {m.sales > 0 ? `${m.margin.toFixed(0)}%` : '—'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Timeline Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-gray-500 uppercase font-bold border-b border-gray-100">
              <tr>
                <th className="py-2">Mês</th>
                <th className="py-2 text-right">Receita</th>
                <th className="py-2 text-right">Custos</th>
                <th className="py-2 text-right">Resultado</th>
                <th className="py-2 text-right">Margem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monthlyEvolution.map((m, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-2 font-bold text-gray-700 capitalize">{m.label}</td>
                  <td className="py-2 text-right text-emerald-700 font-semibold">{formatBRL(m.sales)}</td>
                  <td className="py-2 text-right text-rose-700 font-semibold">{formatBRL(m.costs)}</td>
                  <td className={`py-2 text-right font-black ${m.result >= 0 ? 'text-[#1B4332]' : 'text-red-600'}`}>
                    {formatBRL(m.result)}
                  </td>
                  <td className="py-2 text-right font-bold text-gray-600">{m.margin.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resultado por Produto */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <h3 className="text-base font-bold text-gray-900 mb-1">Resultado & Receita por Produto</h3>
        <p className="text-xs text-gray-500 mb-4">Veja quais itens mais contribuem para a receita da propriedade</p>

        {productPerformance.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            Nenhuma venda registrada no período selecionado.
          </div>
        ) : (
          <div className="space-y-3">
            {productPerformance.map((p, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-800">{p.product}</span>
                  <span className="font-black text-[#1B4332] text-base">{formatBRL(p.revenue)}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${p.sharePct}%` }}
                    className="h-full bg-gradient-to-r from-[#2D6A4F] to-[#74C69D] rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{p.quantity} {p.unit} comercializados</span>
                  <span className="font-semibold">{p.sharePct.toFixed(1)}% do faturamento total</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs leading-relaxed shadow-2xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Aviso Importante aos Produtores:</p>
          <p className="mt-0.5">
            &ldquo;Os valores apresentados são indicadores de gestão e não substituem uma análise contábil profissional.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
};

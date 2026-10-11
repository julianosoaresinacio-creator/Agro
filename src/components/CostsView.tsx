import React, { useState, useMemo } from 'react';
import { useAgro } from '../context/AgroContext';
import { CostRecord, CostCategory, formatDisplayDate } from '../types';
import {
  Receipt,
  Plus,
  Search,
  Calendar,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  AlertTriangle,
  Tag,
  TrendingDown,
} from 'lucide-react';

const CATEGORY_LABELS: Record<CostCategory, string> = {
  insumos: 'Insumos',
  alimentacao: 'Alimentação',
  mao_de_obra: 'Mão de Obra',
  transporte: 'Transporte',
  energia: 'Energia',
  manutencao: 'Manutenção',
  equipamentos: 'Equipamentos',
  outros: 'Outros',
};

const CATEGORY_COLORS: Record<CostCategory, string> = {
  insumos: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  alimentacao: 'bg-amber-100 text-amber-800 border-amber-200',
  mao_de_obra: 'bg-blue-100 text-blue-800 border-blue-200',
  transporte: 'bg-purple-100 text-purple-800 border-purple-200',
  energia: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  manutencao: 'bg-orange-100 text-orange-800 border-orange-200',
  equipamentos: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  outros: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const CostsView: React.FC = () => {
  const { costs, addCost, updateCost, deleteCost, suppliers, isAdmin, isDemoMode } = useAgro();

  const [periodFilter, setPeriodFilter] = useState<'all' | 'this_month' | 'last_month' | 'this_year'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CostRecord | null>(null);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<CostCategory>('insumos');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered list
  const filteredCosts = useMemo(() => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth();

    return costs.filter((c) => {
      const cDate = new Date(c.date + 'T00:00:00');
      let matchesPeriod = true;
      if (periodFilter === 'this_month') {
        matchesPeriod = cDate.getFullYear() === currYear && cDate.getMonth() === currMonth;
      } else if (periodFilter === 'last_month') {
        const lastMDate = new Date(currYear, currMonth - 1, 1);
        matchesPeriod =
          cDate.getFullYear() === lastMDate.getFullYear() &&
          cDate.getMonth() === lastMDate.getMonth();
      } else if (periodFilter === 'this_year') {
        matchesPeriod = cDate.getFullYear() === currYear;
      }

      const matchesCat = categoryFilter === 'all' || c.category === categoryFilter;

      const matchesSearch =
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.supplier && c.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesPeriod && matchesCat && matchesSearch;
    });
  }, [costs, periodFilter, categoryFilter, searchTerm]);

  // Total cost
  const totalCostAmount = useMemo(
    () => filteredCosts.reduce((acc, c) => acc + c.amount, 0),
    [filteredCosts]
  );

  // Costs by category
  const costsByCategory = useMemo(() => {
    const map: Record<CostCategory, number> = {
      insumos: 0,
      alimentacao: 0,
      mao_de_obra: 0,
      transporte: 0,
      energia: 0,
      manutencao: 0,
      equipamentos: 0,
      outros: 0,
    };
    filteredCosts.forEach((c) => {
      map[c.category] = (map[c.category] || 0) + c.amount;
    });
    return map;
  }, [filteredCosts]);

  // Monthly evolution (last 6 months)
  const monthlyEvolution = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yVal = d.getFullYear();
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

      const mTotal = costs
        .filter((c) => {
          const cd = new Date(c.date + 'T00:00:00');
          return cd.getMonth() === mIdx && cd.getFullYear() === yVal;
        })
        .reduce((acc, c) => acc + c.amount, 0);

      months.push({ label: `${label}/${String(yVal).slice(2)}`, total: mTotal });
    }
    return months;
  }, [costs]);

  const maxMonthCost = Math.max(...monthlyEvolution.map((m) => m.total), 100);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('insumos');
    setDescription('');
    setAmount('');
    setSupplier('');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CostRecord) => {
    setEditingItem(item);
    setDate(item.date);
    setCategory(item.category);
    setDescription(item.description);
    setAmount(item.amount);
    setSupplier(item.supplier || '');
    setNotes(item.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setFormError('Informe a descrição do custo.');
      return;
    }
    if (amount === '' || Number(amount) <= 0) {
      setFormError('O valor deve ser maior que zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateCost(editingItem.id, {
          date,
          category,
          description: description.trim(),
          amount: Number(amount),
          supplier: supplier.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await addCost({
          date,
          category,
          description: description.trim(),
          amount: Number(amount),
          supplier: supplier.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError('Erro ao salvar custo. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, desc: string) => {
    if (confirm(`Excluir o custo "${desc}"?`)) {
      await deleteCost(id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Visitor Banner if not admin */}
      {isDemoMode && !isAdmin && (
        <div className="bg-[#FEF3C7] border-l-4 border-[#D97706] rounded-r-xl p-4 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#92400E]">
                Você está no modo demonstração. Os dados são somente para consulta.
              </p>
              <p className="text-[11px] text-[#B45309]">
                O cadastro, edição e exclusão de custos estão desabilitados para visitantes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] tracking-tight flex items-center gap-2">
            <Receipt className="w-8 h-8 text-rose-600" />
            <span>Módulo Custos</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Registre todas as despesas da propriedade para saber onde cada centavo foi investido.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold rounded-xl text-sm shadow-md shadow-[#1B4332]/20 transition-all active:scale-[0.98] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Custo</span>
          </button>
        )}
      </div>

      {/* Top Indicators & Evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total indicator */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase text-gray-500">Total de Custos</span>
            <p className="text-3xl font-black text-rose-600 mt-2">{formatBRL(totalCostAmount)}</p>
            <p className="text-xs text-gray-500 mt-1">{filteredCosts.length} lançamentos no período</p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-600">
            <TrendingDown className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Controle rigoroso reduz perdas e amplia seu lucro.</span>
          </div>
        </div>

        {/* Evolução Mensal */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-gray-900">Evolução Mensal dos Custos</h4>
            <span className="text-xs text-gray-500">Últimos 6 meses</span>
          </div>

          <div className="h-28 flex items-end justify-between gap-2 pt-4">
            {monthlyEvolution.map((m, idx) => {
              const heightPct = m.total > 0 ? Math.max(10, Math.round((m.total / maxMonthCost) * 100)) : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[10px] font-bold text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatBRL(m.total)}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[34px] rounded-t-md transition-all group-hover:brightness-110 shadow-2xs ${
                      heightPct > 0 ? 'bg-gradient-to-t from-rose-600 to-rose-400' : 'bg-transparent border-b border-gray-200'
                    }`}
                  />
                  <span className="text-[11px] font-medium text-gray-500 capitalize">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custos por Categoria (Visual Breakdown Cards) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
          Custos por Categoria no Período
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(CATEGORY_LABELS) as CostCategory[]).map((cat) => {
            const val = costsByCategory[cat] || 0;
            const pct = totalCostAmount > 0 ? Math.round((val / totalCostAmount) * 100) : 0;
            return (
              <div
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'border-[#1B4332] bg-[#F0FDF4] ring-2 ring-[#2D6A4F]/20'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">{CATEGORY_LABELS[cat]}</span>
                  <span className="text-[10px] font-extrabold text-gray-500">{pct}%</span>
                </div>
                <p className="text-sm sm:text-base font-black text-rose-700 mt-1">{formatBRL(val)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por descrição, fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {categoryFilter !== 'all' && (
            <button
              onClick={() => setCategoryFilter('all')}
              className="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-800 rounded-lg flex items-center gap-1"
            >
              <span>{CATEGORY_LABELS[categoryFilter as CostCategory]}</span>
              <X className="w-3 h-3" />
            </button>
          )}

          <span className="text-xs font-bold text-gray-500 mr-1 hidden sm:inline">Período:</span>
          <button
            onClick={() => setPeriodFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              periodFilter === 'all'
                ? 'bg-[#1B4332] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setPeriodFilter('this_month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              periodFilter === 'this_month'
                ? 'bg-[#1B4332] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setPeriodFilter('last_month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              periodFilter === 'last_month'
                ? 'bg-[#1B4332] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mês Passado
          </button>
          <button
            onClick={() => setPeriodFilter('this_year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              periodFilter === 'this_year'
                ? 'bg-[#1B4332] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Este Ano
          </button>
        </div>
      </div>

      {/* Costs List */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {filteredCosts.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">Nenhum custo encontrado</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              Lance gastos com insumos, alimentação, mão de obra ou transporte para manter seu saldo em dia.
            </p>
            {isAdmin && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-[#2D6A4F] text-white rounded-xl text-xs font-bold hover:bg-[#1B4332] transition-colors"
              >
                + Adicionar Custo
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F9FAFB] text-gray-600 text-xs uppercase font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3.5">Data</th>
                    <th className="px-6 py-3.5">Categoria</th>
                    <th className="px-6 py-3.5">Descrição</th>
                    <th className="px-6 py-3.5 text-right">Valor</th>
                    <th className="px-6 py-3.5">Fornecedor</th>
                    <th className="px-6 py-3.5">Observações</th>
                    {isAdmin && <th className="px-6 py-3.5 text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCosts.map((c) => {
                    const formattedDate = formatDisplayDate(c.date);
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${CATEGORY_COLORS[c.category]}`}
                          >
                            {CATEGORY_LABELS[c.category]}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">{c.description}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap font-black text-rose-600 text-base">
                          {formatBRL(c.amount)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{c.supplier || <span className="text-gray-300">—</span>}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs max-w-xs truncate">
                          {c.notes || <span className="text-gray-300">—</span>}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(c)}
                                className="p-1.5 text-gray-500 hover:text-[#2D6A4F] hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id, c.description)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredCosts.map((c) => {
                const formattedDate = formatDisplayDate(c.date);
                return (
                  <div key={c.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${CATEGORY_COLORS[c.category]}`}
                          >
                            {CATEGORY_LABELS[c.category]}
                          </span>
                          <span className="text-xs text-gray-500">{formattedDate}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-base">{c.description}</h4>
                      </div>
                      <span className="text-lg font-black text-rose-600 whitespace-nowrap">
                        {formatBRL(c.amount)}
                      </span>
                    </div>

                    {c.supplier && (
                      <p className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md inline-block">
                        Fornecedor: <span className="font-semibold">{c.supplier}</span>
                      </p>
                    )}

                    {c.notes && <p className="text-xs text-gray-500 italic">{c.notes}</p>}

                    {isAdmin && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.description)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal Cadastro/Edição de Custo */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            <div className="bg-[#1B4332] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-400" />
                {editingItem ? 'Editar Despesa' : 'Novo Registro de Custo'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Data e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Data <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Categoria <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CostCategory)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium bg-white"
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

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Descrição <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Frascos de vidro, Diesel para trator, Diária colheita..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                />
              </div>

              {/* Valor e Fornecedor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Valor (R$) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="Ex: 350.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Fornecedor <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    list="suppliers-list"
                    placeholder="Nome do fornecedor..."
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                  />
                  <datalist id="suppliers-list">
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Observações <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Número de nota fiscal, condições de pagamento..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto py-3 sm:py-2.5 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto py-3.5 sm:py-2.5 px-6 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold rounded-xl text-sm shadow-md shadow-[#1B4332]/20 transition-all active:scale-[0.98] disabled:opacity-50 text-center"
                >
                  {isSubmitting ? 'Salvando...' : editingItem ? 'Atualizar Custo' : 'Salvar Custo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={handleOpenCreate}
        className="fixed bottom-20 right-4 z-30 md:hidden flex items-center gap-2 px-4 py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-full shadow-xl shadow-[#1B4332]/35 font-bold text-xs active:scale-95 transition-all"
        aria-label="Adicionar Custo"
      >
        <Plus className="w-5 h-5 text-rose-400" />
        <span>Novo Custo</span>
      </button>
    </div>
  );
};

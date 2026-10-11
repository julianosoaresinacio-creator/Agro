import React, { useState, useMemo } from 'react';
import { useAgro } from '../context/AgroContext';
import { ProductionRecord, formatDisplayDate } from '../types';
import {
  Wheat,
  Plus,
  Search,
  Filter,
  Calendar,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

export const ProductionView: React.FC = () => {
  const { productions, addProduction, updateProduction, deleteProduction, isAdmin, isDemoMode } = useAgro();

  const [periodFilter, setPeriodFilter] = useState<'all' | 'this_month' | 'last_month' | 'this_year'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductionRecord | null>(null);

  // Form states
  const [product, setProduct] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('kg');
  const [areaPlot, setAreaPlot] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtering
  const filteredProductions = useMemo(() => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth();

    return productions.filter((p) => {
      // Period filter
      const pDate = new Date(p.date + 'T00:00:00');
      let matchesPeriod = true;
      if (periodFilter === 'this_month') {
        matchesPeriod = pDate.getFullYear() === currYear && pDate.getMonth() === currMonth;
      } else if (periodFilter === 'last_month') {
        const lastMDate = new Date(currYear, currMonth - 1, 1);
        matchesPeriod =
          pDate.getFullYear() === lastMDate.getFullYear() &&
          pDate.getMonth() === lastMDate.getMonth();
      } else if (periodFilter === 'this_year') {
        matchesPeriod = pDate.getFullYear() === currYear;
      }

      // Search filter
      const matchesSearch =
        p.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.areaPlot && p.areaPlot.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesPeriod && matchesSearch;
    });
  }, [productions, periodFilter, searchTerm]);

  // Aggregate totals by unit
  const totalsByUnit = useMemo(() => {
    const map: Record<string, number> = {};
    filteredProductions.forEach((p) => {
      map[p.unit] = (map[p.unit] || 0) + p.quantity;
    });
    return map;
  }, [filteredProductions]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setProduct('');
    setDate(new Date().toISOString().split('T')[0]);
    setQuantity('');
    setUnit('kg');
    setAreaPlot('');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ProductionRecord) => {
    setEditingItem(item);
    setProduct(item.product);
    setDate(item.date);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setAreaPlot(item.areaPlot || '');
    setNotes(item.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.trim()) {
      setFormError('Informe o nome do produto.');
      return;
    }
    if (quantity === '' || Number(quantity) <= 0) {
      setFormError('A quantidade deve ser maior que zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateProduction(editingItem.id, {
          product: product.trim(),
          date,
          quantity: Number(quantity),
          unit,
          areaPlot: areaPlot.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await addProduction({
          product: product.trim(),
          date,
          quantity: Number(quantity),
          unit,
          areaPlot: areaPlot.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError('Erro ao salvar produção. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o registro de colheita "${name}"?`)) {
      await deleteProduction(id);
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
                O cadastro, edição e exclusão de colheitas estão desabilitados para visitantes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] tracking-tight flex items-center gap-2">
            <Wheat className="w-8 h-8 text-amber-600" />
            <span>Módulo Produção</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Cadastre colheitas e safras para saber exatamente quanto o seu campo produz.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold rounded-xl text-sm shadow-md shadow-[#1B4332]/20 transition-all active:scale-[0.98] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Produção</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-gray-500">Registros de Produção</span>
          <p className="text-3xl font-black text-gray-900 mt-2">{filteredProductions.length}</p>
          <p className="text-xs text-gray-500 mt-1">Lançamentos no período</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs sm:col-span-2">
          <span className="text-xs font-bold uppercase text-gray-500">Total Produzido</span>
          <div className="flex flex-wrap gap-3 mt-2">
            {Object.keys(totalsByUnit).length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhuma colheita no filtro atual</p>
            ) : (
              Object.entries(totalsByUnit).map(([un, qty]) => (
                <div
                  key={un}
                  className="px-3.5 py-1.5 bg-[#D8F3DC] border border-[#B7E4C7] rounded-xl text-[#1B4332] font-black text-base flex items-baseline gap-1"
                >
                  <span>{qty.toLocaleString('pt-BR')}</span>
                  <span className="text-xs font-bold text-[#2D6A4F]">{un}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por produto, talhão ou nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden"
          />
        </div>

        {/* Period Buttons */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-gray-500 mr-1 hidden sm:inline">Período:</span>
          <button
            onClick={() => setPeriodFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              periodFilter === 'all'
                ? 'bg-[#1B4332] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setPeriodFilter('this_month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              periodFilter === 'this_month'
                ? 'bg-[#1B4332] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setPeriodFilter('last_month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              periodFilter === 'last_month'
                ? 'bg-[#1B4332] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mês Passado
          </button>
          <button
            onClick={() => setPeriodFilter('this_year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              periodFilter === 'this_year'
                ? 'bg-[#1B4332] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Este Ano
          </button>
        </div>
      </div>

      {/* Production List / Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {filteredProductions.length === 0 ? (
          <div className="p-12 text-center">
            <Wheat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">Nenhum registro de produção encontrado</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              Registre as primeiras colheitas do seu sítio para acompanhar seu volume produtivo.
            </p>
            {isAdmin && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-[#2D6A4F] text-white rounded-xl text-xs font-bold hover:bg-[#1B4332] transition-colors"
              >
                + Adicionar Produção
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
                    <th className="px-6 py-3.5">Produto</th>
                    <th className="px-6 py-3.5 text-right">Quantidade</th>
                    <th className="px-6 py-3.5">Área / Talhão</th>
                    <th className="px-6 py-3.5">Observações</th>
                    {isAdmin && <th className="px-6 py-3.5 text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProductions.map((p) => {
                    const formattedDate = formatDisplayDate(p.date);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">{p.product}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <span className="font-extrabold text-[#1B4332] text-base">
                            {p.quantity.toLocaleString('pt-BR')}
                          </span>{' '}
                          <span className="text-xs text-gray-500 font-semibold">{p.unit}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {p.areaPlot || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs max-w-xs truncate">
                          {p.notes || <span className="text-gray-300">—</span>}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="p-1.5 text-gray-500 hover:text-[#2D6A4F] hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id, p.product)}
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
              {filteredProductions.map((p) => {
                const formattedDate = formatDisplayDate(p.date);
                return (
                  <div key={p.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">{p.product}</h4>
                        <span className="text-xs text-gray-500 font-medium">{formattedDate}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-[#1B4332]">
                          {p.quantity.toLocaleString('pt-BR')}
                        </span>{' '}
                        <span className="text-xs font-bold text-gray-500">{p.unit}</span>
                      </div>
                    </div>

                    {p.areaPlot && (
                      <p className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md inline-block">
                        Talhão: <span className="font-semibold">{p.areaPlot}</span>
                      </p>
                    )}

                    {p.notes && <p className="text-xs text-gray-500 italic">{p.notes}</p>}

                    {isAdmin && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.product)}
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

      {/* Modal de Cadastro / Edição */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            <div className="bg-[#1B4332] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Wheat className="w-5 h-5 text-amber-400" />
                {editingItem ? 'Editar Registro de Produção' : 'Novo Registro de Produção'}
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

              {/* Produto */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Produto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mel Silvestre, Tomate, Leite..."
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                />
              </div>

              {/* Data e Quantidade / Unidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Data da Colheita <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Quantidade <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="Ex: 120"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Unidade <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium bg-white"
                    >
                      <option value="kg">kg (Quilos)</option>
                      <option value="litros">litros</option>
                      <option value="unidades">unidades</option>
                      <option value="potes">potes</option>
                      <option value="caixas">caixas</option>
                      <option value="sacas">sacas</option>
                      <option value="maços">maços</option>
                      <option value="baldes">baldes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Área / Talhão */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Área / Talhão <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Talhão 3, Apiário Bosque, Estufa B..."
                  value={areaPlot}
                  onChange={(e) => setAreaPlot(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Observações <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhes sobre a florada, clima, qualidade do produto..."
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
                  {isSubmitting ? 'Salvando...' : editingItem ? 'Atualizar Colheita' : 'Salvar Produção'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button (FAB) - Visível somente para ADMIN */}
      {isAdmin && (
        <button
          onClick={handleOpenCreate}
          className="fixed bottom-20 right-4 z-30 md:hidden flex items-center gap-2 px-4 py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-full shadow-xl shadow-[#1B4332]/35 font-bold text-xs active:scale-95 transition-all"
          aria-label="Adicionar Produção"
        >
          <Plus className="w-5 h-5 text-amber-400" />
          <span>Nova Produção</span>
        </button>
      )}
    </div>
  );
};

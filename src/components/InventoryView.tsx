import React, { useState, useMemo } from 'react';
import { useAgro } from '../context/AgroContext';
import { InventoryItem } from '../types';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Boxes,
  Truck,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const {
    inventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    adjustStock,
    suppliers,
    isAdmin,
    isDemoMode,
  } = useAgro();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'normal'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Quick adjust modal
  const [adjustModalItem, setAdjustModalItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'set'>('in');
  const [adjustQty, setAdjustQty] = useState<number | ''>('');
  const [adjustReason, setAdjustReason] = useState('');

  // Item form states
  const [item, setItem] = useState('');
  const [unit, setUnit] = useState('unidades');
  const [currentQuantity, setCurrentQuantity] = useState<number | ''>('');
  const [minQuantity, setMinQuantity] = useState<number | ''>('');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((i) => {
      const isLow = i.currentQuantity <= i.minQuantity;
      if (statusFilter === 'low' && !isLow) return false;
      if (statusFilter === 'normal' && isLow) return false;

      const matchesSearch =
        i.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.supplier && i.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (i.notes && i.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });
  }, [inventory, statusFilter, searchTerm]);

  // Aggregates
  const totalStockValue = useMemo(() => {
    return inventory.reduce((acc, i) => acc + (i.currentQuantity * (i.unitCost || 0)), 0);
  }, [inventory]);

  const lowStockCount = useMemo(() => {
    return inventory.filter((i) => i.currentQuantity <= i.minQuantity).length;
  }, [inventory]);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setItem('');
    setUnit('unidades');
    setCurrentQuantity('');
    setMinQuantity('');
    setUnitCost('');
    setSupplier('');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (i: InventoryItem) => {
    setEditingItem(i);
    setItem(i.item);
    setUnit(i.unit);
    setCurrentQuantity(i.currentQuantity);
    setMinQuantity(i.minQuantity);
    setUnitCost(i.unitCost ?? '');
    setSupplier(i.supplier || '');
    setNotes(i.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setFormError('Operação bloqueada: Somente administradores podem alterar o estoque.');
      return;
    }
    if (!item.trim()) {
      setFormError('Informe o nome do item de estoque.');
      return;
    }
    if (currentQuantity === '' || Number(currentQuantity) < 0) {
      setFormError('Quantidade atual inválida.');
      return;
    }
    if (minQuantity === '' || Number(minQuantity) < 0) {
      setFormError('Informe o estoque mínimo de segurança.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateInventoryItem(editingItem.id, {
          item: item.trim(),
          unit,
          currentQuantity: Number(currentQuantity),
          minQuantity: Number(minQuantity),
          unitCost: unitCost !== '' ? Number(unitCost) : undefined,
          supplier: supplier.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await addInventoryItem({
          item: item.trim(),
          unit,
          currentQuantity: Number(currentQuantity),
          minQuantity: Number(minQuantity),
          unitCost: unitCost !== '' ? Number(unitCost) : undefined,
          supplier: supplier.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError('Erro ao salvar item no estoque.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !adjustModalItem || adjustQty === '' || Number(adjustQty) <= 0) return;

    const qty = Number(adjustQty);
    let noteDesc = '';

    if (adjustType === 'in') {
      noteDesc = `Entrada (+${qty} ${adjustModalItem.unit})${adjustReason ? `: ${adjustReason}` : ''}`;
      await adjustStock(adjustModalItem.id, qty, noteDesc);
    } else if (adjustType === 'out') {
      noteDesc = `Saída (-${qty} ${adjustModalItem.unit})${adjustReason ? `: ${adjustReason}` : ''}`;
      await adjustStock(adjustModalItem.id, -qty, noteDesc);
    } else {
      // Set absolute value
      const diff = qty - adjustModalItem.currentQuantity;
      noteDesc = `Ajuste de inventário (definido para ${qty} ${adjustModalItem.unit})${adjustReason ? `: ${adjustReason}` : ''}`;
      await adjustStock(adjustModalItem.id, diff, noteDesc);
    }

    setAdjustModalItem(null);
    setAdjustQty('');
    setAdjustReason('');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) return;
    if (confirm(`Excluir o item "${name}" do estoque?`)) {
      await deleteInventoryItem(id);
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
                O cadastro, edição e movimentação de estoque estão desabilitados para visitantes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] tracking-tight flex items-center gap-2">
            <Package className="w-8 h-8 text-blue-600" />
            <span>Módulo Estoque</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Controle produtos prontos e insumos com alertas automáticos para nunca faltar nada.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold rounded-xl text-sm shadow-md shadow-[#1B4332]/20 transition-all active:scale-[0.98] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Item</span>
          </button>
        )}
      </div>

      {/* Top Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-gray-500">Total de Itens</span>
          <p className="text-3xl font-black text-gray-900 mt-2">{inventory.length}</p>
          <p className="text-xs text-gray-500 mt-1">Produtos e insumos cadastrados</p>
        </div>

        <div className={`p-5 rounded-2xl border shadow-xs transition-colors ${
          lowStockCount > 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-gray-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-900">Alerta: Estoque Baixo</span>
            {lowStockCount > 0 && <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />}
          </div>
          <p className={`text-3xl font-black mt-2 ${lowStockCount > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
            {lowStockCount}
          </p>
          <p className="text-xs text-amber-800 mt-1">
            {lowStockCount > 0 ? 'Itens atingiram a quantidade mínima' : 'Todos os itens em nível seguro'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-gray-500">Valor em Estoque</span>
          <p className="text-3xl font-black text-[#1B4332] mt-2">{formatBRL(totalStockValue)}</p>
          <p className="text-xs text-gray-500 mt-1">Custo total imobilizado</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar item ou fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-gray-500">Filtrar:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-[#1B4332] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({inventory.length})
          </button>
          <button
            onClick={() => setStatusFilter('low')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'low'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Estoque Baixo ({lowStockCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('normal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'normal'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
            }`}
          >
            Normal ({inventory.length - lowStockCount})
          </button>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {filteredInventory.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">Nenhum item encontrado no estoque</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              Cadastre embalagens, colheitas prontas, ração ou ferramentas para controle rigoroso.
            </p>
            {isAdmin && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-[#2D6A4F] text-white rounded-xl text-xs font-bold hover:bg-[#1B4332] transition-colors"
              >
                + Adicionar Primeiro Item
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
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Item</th>
                    <th className="px-6 py-3.5 text-center">Quantidade Atual</th>
                    <th className="px-6 py-3.5 text-center">Estoque Mínimo</th>
                    <th className="px-6 py-3.5 text-right">Custo Unitário</th>
                    <th className="px-6 py-3.5">Fornecedor</th>
                    {isAdmin && <th className="px-6 py-3.5 text-center">Movimentar</th>}
                    {isAdmin && <th className="px-6 py-3.5 text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInventory.map((i) => {
                    const isLow = i.currentQuantity <= i.minQuantity;
                    return (
                      <tr key={i.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Estoque Baixo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{i.item}</p>
                          {i.notes && <p className="text-xs text-gray-500 truncate max-w-xs">{i.notes}</p>}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className={`text-base font-black ${isLow ? 'text-amber-700' : 'text-gray-900'}`}>
                            {i.currentQuantity}
                          </span>{' '}
                          <span className="text-xs text-gray-500 font-semibold">{i.unit}</span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap text-xs font-semibold text-gray-500">
                          {i.minQuantity} {i.unit}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap font-semibold text-gray-700">
                          {i.unitCost ? formatBRL(i.unitCost) : '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-xs">
                          {i.supplier || <span className="text-gray-300">—</span>}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setAdjustModalItem(i);
                                  setAdjustType('in');
                                  setAdjustQty('');
                                  setAdjustReason('');
                                }}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-0.5"
                                title="Registrar Entrada"
                              >
                                <ArrowUp className="w-3 h-3" />
                                Entrada
                              </button>
                              <button
                                onClick={() => {
                                  setAdjustModalItem(i);
                                  setAdjustType('out');
                                  setAdjustQty('');
                                  setAdjustReason('');
                                }}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-0.5"
                                title="Registrar Saída"
                              >
                                <ArrowDown className="w-3 h-3" />
                                Saída
                              </button>
                            </div>
                          </td>
                        )}
                        {isAdmin && (
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(i)}
                                className="p-1.5 text-gray-500 hover:text-[#2D6A4F] hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(i.id, i.item)}
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
              {filteredInventory.map((i) => {
                const isLow = i.currentQuantity <= i.minQuantity;
                return (
                  <div key={i.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="mb-1">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Estoque Baixo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Normal
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-gray-900 text-base">{i.item}</h4>
                        {i.supplier && (
                          <p className="text-xs text-gray-500">Fornecedor: {i.supplier}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className={`text-xl font-black ${isLow ? 'text-amber-700' : 'text-gray-900'}`}>
                          {i.currentQuantity}
                        </span>{' '}
                        <span className="text-xs font-bold text-gray-500">{i.unit}</span>
                        <p className="text-[11px] text-gray-400">mín: {i.minQuantity} {i.unit}</p>
                      </div>
                    </div>

                    {isAdmin && (
                      <>
                        {/* Quick Move Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => {
                              setAdjustModalItem(i);
                              setAdjustType('in');
                              setAdjustQty('');
                              setAdjustReason('');
                            }}
                            className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                          >
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
                            + Entrada
                          </button>
                          <button
                            onClick={() => {
                              setAdjustModalItem(i);
                              setAdjustType('out');
                              setAdjustQty('');
                              setAdjustReason('');
                            }}
                            className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                          >
                            <ArrowDown className="w-3.5 h-3.5 text-rose-600" />
                            - Saída
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-xs">
                          <span className="text-gray-500">
                            Custo: {i.unitCost ? formatBRL(i.unitCost) : '—'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(i)}
                              className="p-1.5 text-gray-600 hover:text-black"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(i.id, i.item)}
                              className="p-1.5 text-rose-600 hover:text-rose-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal Entrada / Saída / Ajuste */}
      {adjustModalItem && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            <div className="bg-[#1B4332] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold">Movimentação de Estoque</h3>
                <p className="text-xs text-[#D8F3DC] mt-0.5 truncate max-w-[240px]">
                  Item: <span className="font-bold text-white">{adjustModalItem.item}</span> ({adjustModalItem.currentQuantity} {adjustModalItem.unit})
                </p>
              </div>
              <button
                onClick={() => setAdjustModalItem(null)}
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAdjustType('in')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    adjustType === 'in' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  Entrada (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('out')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    adjustType === 'out' ? 'bg-rose-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  Saída (-)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('set')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                    adjustType === 'set' ? 'bg-blue-600 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Ajuste
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {adjustType === 'set' ? 'Nova Quantidade Absoluta' : 'Quantidade da Movimentação'}{' '}
                  <span className="text-gray-400">({adjustModalItem.unit})</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder={`Ex: 10 ${adjustModalItem.unit}`}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-base font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Motivo / Observação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Compra de lote, Uso na produção, Perda, Contagem..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  className="w-full sm:w-auto py-3 sm:py-2 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto py-3.5 sm:py-2.5 px-6 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold rounded-xl text-sm shadow-md transition-all text-center"
                >
                  Confirmar Movimentação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Item */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            <div className="bg-[#1B4332] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                {editingItem ? 'Editar Item no Estoque' : 'Cadastrar Item no Estoque'}
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

              {/* Item */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nome do Item / Insumo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mel Silvestre Potes 500g, Cera Alveolada, Frascos..."
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                />
              </div>

              {/* Unidade e Quantidade Atual */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Unidade <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden bg-white font-medium"
                  >
                    <option value="unidades">unidades</option>
                    <option value="kg">kg</option>
                    <option value="litros">litros</option>
                    <option value="frascos">frascos</option>
                    <option value="potes">potes</option>
                    <option value="baldes">baldes</option>
                    <option value="caixas">caixas</option>
                    <option value="sacas">sacas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Qtd. Atual <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="Ex: 50"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Estoque Mínimo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="Ex: 15"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Custo Unitário e Fornecedor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Custo Unitário (R$) <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 12.50"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Fornecedor <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    list="suppliers-list-inv"
                    placeholder="Nome do fornecedor..."
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                  />
                  <datalist id="suppliers-list-inv">
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Observações <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Local de armazenamento, lote, validade..."
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
                  className="w-full sm:w-auto py-3.5 sm:py-2.5 px-6 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50 text-center"
                >
                  {isSubmitting ? 'Salvando...' : editingItem ? 'Atualizar Item' : 'Salvar Item'}
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
        aria-label="Adicionar Item"
      >
        <Plus className="w-5 h-5 text-blue-400" />
        <span>Novo Item</span>
      </button>
    </div>
  );
};

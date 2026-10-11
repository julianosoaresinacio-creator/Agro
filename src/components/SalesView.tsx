import React, { useState, useMemo } from 'react';
import { useAgro } from '../context/AgroContext';
import { SaleRecord, PaymentMethod, formatDisplayDate } from '../types';
import {
  TrendingUp,
  Plus,
  Search,
  Calendar,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CreditCard,
  Banknote,
  DollarSign,
  Users,
} from 'lucide-react';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  transferencia: 'Transferência Bancária',
  cartao: 'Cartão',
  boleto: 'Boleto',
  prazo: 'A Prazo',
};

export const SalesView: React.FC = () => {
  const { sales, addSale, updateSale, deleteSale, customers, isAdmin, isDemoMode } = useAgro();

  const [periodFilter, setPeriodFilter] = useState<'all' | 'this_month' | 'last_month' | 'this_year'>('this_month');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SaleRecord | null>(null);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('potes');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [customer, setCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto calculated total: quantidade × preço unitário
  const calculatedTotal = useMemo(() => {
    if (quantity !== '' && unitPrice !== '') {
      return Math.round(Number(quantity) * Number(unitPrice) * 100) / 100;
    }
    return 0;
  }, [quantity, unitPrice]);

  // Filtered sales
  const filteredSales = useMemo(() => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth();

    return sales.filter((s) => {
      const sDate = new Date(s.date + 'T00:00:00');
      let matchesPeriod = true;
      if (periodFilter === 'this_month') {
        matchesPeriod = sDate.getFullYear() === currYear && sDate.getMonth() === currMonth;
      } else if (periodFilter === 'last_month') {
        const lastMDate = new Date(currYear, currMonth - 1, 1);
        matchesPeriod =
          sDate.getFullYear() === lastMDate.getFullYear() &&
          sDate.getMonth() === lastMDate.getMonth();
      } else if (periodFilter === 'this_year') {
        matchesPeriod = sDate.getFullYear() === currYear;
      }

      const matchesSearch =
        s.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.customer && s.customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesPeriod && matchesSearch;
    });
  }, [sales, periodFilter, searchTerm]);

  // Key stats
  const totalRevenue = useMemo(
    () => filteredSales.reduce((acc, s) => acc + s.totalAmount, 0),
    [filteredSales]
  );

  const averageTicket = useMemo(
    () => (filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0),
    [totalRevenue, filteredSales]
  );

  // Top products in sales
  const topProducts = useMemo(() => {
    const map: Record<string, { total: number; qty: number; unit: string }> = {};
    filteredSales.forEach((s) => {
      if (!map[s.product]) map[s.product] = { total: 0, qty: 0, unit: s.unit };
      map[s.product].total += s.totalAmount;
      map[s.product].qty += s.quantity;
    });
    const list = Object.entries(map).map(([name, data]) => ({ name, ...data }));
    list.sort((a, b) => b.total - a.total);
    return list.slice(0, 4);
  }, [filteredSales]);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setDate(new Date().toISOString().split('T')[0]);
    setProduct('');
    setQuantity('');
    setUnit('potes');
    setUnitPrice('');
    setCustomer('');
    setPaymentMethod('pix');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: SaleRecord) => {
    setEditingItem(s);
    setDate(s.date);
    setProduct(s.product);
    setQuantity(s.quantity);
    setUnit(s.unit);
    setUnitPrice(s.unitPrice);
    setCustomer(s.customer || '');
    setPaymentMethod(s.paymentMethod || 'pix');
    setNotes(s.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setFormError('Operação bloqueada: Somente administradores podem registrar vendas.');
      return;
    }
    if (!product.trim()) {
      setFormError('Informe o produto vendido.');
      return;
    }
    if (quantity === '' || Number(quantity) <= 0) {
      setFormError('A quantidade deve ser maior que zero.');
      return;
    }
    if (unitPrice === '' || Number(unitPrice) <= 0) {
      setFormError('O preço unitário deve ser maior que zero.');
      return;
    }

    const total = Math.round(Number(quantity) * Number(unitPrice) * 100) / 100;
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateSale(editingItem.id, {
          date,
          product: product.trim(),
          quantity: Number(quantity),
          unit,
          unitPrice: Number(unitPrice),
          totalAmount: total,
          customer: customer.trim() || undefined,
          paymentMethod,
          notes: notes.trim() || undefined,
        });
      } else {
        await addSale({
          date,
          product: product.trim(),
          quantity: Number(quantity),
          unit,
          unitPrice: Number(unitPrice),
          totalAmount: total,
          customer: customer.trim() || undefined,
          paymentMethod,
          notes: notes.trim() || undefined,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError('Erro ao registrar venda. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, prod: string) => {
    if (!isAdmin) return;
    if (confirm(`Excluir o registro de venda de "${prod}"?`)) {
      await deleteSale(id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Visitor Banner if not admin */}
      {isDemoMode && !isAdmin && (
        <div className="bg-[#FEF3C7] border-l-4 border-[#D97706] rounded-r-xl p-4 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#92400E]">
                Você está no modo demonstração. Os dados são somente para consulta.
              </p>
              <p className="text-[11px] text-[#B45309]">
                O cadastro, edição e exclusão de vendas estão desabilitados para visitantes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] tracking-tight flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
            <span>Módulo Vendas</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Lance cada venda com cálculo automático de faturamento e histórico por cliente.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold rounded-xl text-sm shadow-md shadow-[#1B4332]/20 transition-all active:scale-[0.98] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Venda</span>
          </button>
        )}
      </div>

      {/* Top Indicators & Top Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-gray-500">Vendas no Período</span>
          <p className="text-3xl font-black text-gray-900 mt-2">{filteredSales.length}</p>
          <p className="text-xs text-gray-500 mt-1">Negociações concluídas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-gray-500">Faturamento Bruto</span>
          <p className="text-3xl font-black text-emerald-700 mt-2">{formatBRL(totalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">Receita total no período</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-gray-500">Ticket Médio</span>
          <p className="text-3xl font-black text-[#1B4332] mt-2">{formatBRL(averageTicket)}</p>
          <p className="text-xs text-gray-500 mt-1">Média por venda realizada</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-gray-500">Clientes Atendidos</span>
          <p className="text-3xl font-black text-blue-700 mt-2">
            {new Set(filteredSales.map((s) => s.customer).filter(Boolean)).size}
          </p>
          <p className="text-xs text-gray-500 mt-1">Compradores distintos</p>
        </div>
      </div>

      {/* Top Products Breakdown */}
      {topProducts.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
            Principais Produtos Vendidos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topProducts.map((p, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200/70">
                <p className="text-xs font-bold text-gray-700 truncate">{p.name}</p>
                <p className="text-base font-black text-[#1B4332] mt-1">{formatBRL(p.total)}</p>
                <p className="text-xs text-gray-500">{p.qty} {p.unit} vendidos</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por produto, cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
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

      {/* Sales List */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">Nenhuma venda encontrada</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              Registre a comercialização dos produtos do seu campo para contabilizar seu faturamento.
            </p>
            {isAdmin && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-[#2D6A4F] text-white rounded-xl text-xs font-bold hover:bg-[#1B4332] transition-colors"
              >
                + Adicionar Venda
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
                    <th className="px-6 py-3.5 text-center">Quantidade</th>
                    <th className="px-6 py-3.5 text-right">Preço Unitário</th>
                    <th className="px-6 py-3.5 text-right">Valor Total</th>
                    <th className="px-6 py-3.5">Cliente</th>
                    <th className="px-6 py-3.5">Pagamento</th>
                    {isAdmin && <th className="px-6 py-3.5 text-center">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSales.map((s) => {
                    const formattedDate = formatDisplayDate(s.date);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{s.product}</p>
                          {s.notes && <p className="text-xs text-gray-400 truncate max-w-xs">{s.notes}</p>}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap font-bold text-gray-700">
                          {s.quantity} <span className="text-xs text-gray-500 font-normal">{s.unit}</span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap text-gray-600 font-semibold">
                          {formatBRL(s.unitPrice)}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap font-black text-emerald-700 text-base">
                          {formatBRL(s.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-medium">
                          {s.customer || <span className="text-gray-300">Venda Direta</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold">
                            {s.paymentMethod ? PAYMENT_LABELS[s.paymentMethod] : 'PIX'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(s)}
                                className="p-1.5 text-gray-500 hover:text-[#2D6A4F] hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(s.id, s.product)}
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
              {filteredSales.map((s) => {
                const formattedDate = formatDisplayDate(s.date);
                return (
                  <div key={s.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs text-gray-500 font-medium">{formattedDate}</span>
                        <h4 className="font-bold text-gray-900 text-base">{s.product}</h4>
                        <p className="text-xs text-gray-600">
                          {s.quantity} {s.unit} × {formatBRL(s.unitPrice)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-700">
                          {formatBRL(s.totalAmount)}
                        </span>
                        <div className="mt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold">
                            {s.paymentMethod ? PAYMENT_LABELS[s.paymentMethod] : 'PIX'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {s.customer && (
                      <p className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md inline-block">
                        Cliente: <span className="font-semibold">{s.customer}</span>
                      </p>
                    )}

                    {s.notes && <p className="text-xs text-gray-500 italic">{s.notes}</p>}

                    {isAdmin && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.product)}
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

      {/* Modal Criar / Editar Venda */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            <div className="bg-[#1B4332] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                {editingItem ? 'Editar Registro de Venda' : 'Registrar Nova Venda'}
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

              {/* Data e Produto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Data da Venda <span className="text-rose-500">*</span>
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
                    Produto Vendido <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mel Silvestre 500g..."
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Quantidade, Unidade e Preço Unitário */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Quantidade <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    placeholder="Ex: 20"
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
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden bg-white font-medium"
                  >
                    <option value="potes">potes</option>
                    <option value="kg">kg</option>
                    <option value="litros">litros</option>
                    <option value="unidades">unidades</option>
                    <option value="frascos">frascos</option>
                    <option value="baldes">baldes</option>
                    <option value="caixas">caixas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Preço Unit. (R$) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="Ex: 32.00"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Auto Total Highlight Card */}
              <div className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#166534] uppercase tracking-wider">
                    Valor Total Calculado Automaticamente
                  </span>
                  <p className="text-xs text-[#15803D]">
                    {quantity || 0} {unit} × {formatBRL(Number(unitPrice) || 0)}
                  </p>
                </div>
                <span className="text-xl font-black text-[#1B4332]">
                  {formatBRL(calculatedTotal)}
                </span>
              </div>

              {/* Cliente e Forma de Pagamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Cliente / Comprador <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    list="customers-list-sale"
                    placeholder="Nome do cliente ou feira..."
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                  />
                  <datalist id="customers-list-sale">
                    {customers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Forma de Pagamento <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden bg-white font-medium"
                  >
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro em Espécie</option>
                    <option value="transferencia">Transferência Bancária</option>
                    <option value="cartao">Cartão de Débito/Crédito</option>
                    <option value="boleto">Boleto Bancário</option>
                    <option value="prazo">A Prazo / Fiado</option>
                  </select>
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Observações <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Informações de entrega, parcelamento..."
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
                  {isSubmitting ? 'Salvando...' : editingItem ? 'Atualizar Venda' : 'Salvar Venda'}
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
        aria-label="Registrar Venda"
      >
        <Plus className="w-5 h-5 text-emerald-400" />
        <span>Nova Venda</span>
      </button>
    </div>
  );
};

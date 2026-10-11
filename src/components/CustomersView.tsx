import React, { useState, useMemo } from 'react';
import { useAgro } from '../context/AgroContext';
import { CustomerRecord, formatDisplayDate } from '../types';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  ShoppingBag,
  History,
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { customers, sales, addCustomer, updateCustomer, deleteCustomer, isAdmin, isDemoMode } = useAgro();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomerRecord | null>(null);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<CustomerRecord | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.phone && c.phone.includes(searchTerm))
    );
  }, [customers, searchTerm]);

  // Customer purchase history
  const customerSalesMap = useMemo(() => {
    const map: Record<string, { totalAmount: number; count: number; lastDate: string }> = {};
    sales.forEach((s) => {
      if (s.customer) {
        const custKey = s.customer.toLowerCase().trim();
        if (!map[custKey]) {
          map[custKey] = { totalAmount: 0, count: 0, lastDate: s.date };
        }
        map[custKey].totalAmount += s.totalAmount;
        map[custKey].count += 1;
        if (new Date(s.date) > new Date(map[custKey].lastDate)) {
          map[custKey].lastDate = s.date;
        }
      }
    });
    return map;
  }, [sales]);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setName('');
    setPhone('');
    setEmail('');
    setCity('');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CustomerRecord) => {
    setEditingItem(c);
    setName(c.name);
    setPhone(c.phone || '');
    setEmail(c.email || '');
    setCity(c.city || '');
    setNotes(c.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setFormError('Operação bloqueada: Somente administradores podem cadastrar clientes.');
      return;
    }
    if (!name.trim()) {
      setFormError('Informe o nome do cliente.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateCustomer(editingItem.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          city: city.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await addCustomer({
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          city: city.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError('Erro ao salvar cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, customerName: string) => {
    if (!isAdmin) return;
    if (confirm(`Excluir o cadastro de "${customerName}"?`)) {
      await deleteCustomer(id);
    }
  };

  const historyOfSelected = useMemo(() => {
    if (!selectedCustomerHistory) return [];
    const targetName = selectedCustomerHistory.name.toLowerCase().trim();
    return sales.filter((s) => s.customer && s.customer.toLowerCase().trim() === targetName);
  }, [selectedCustomerHistory, sales]);

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
                O cadastro, edição e exclusão de clientes estão desabilitados para visitantes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            <span>Clientes & Compradores</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Cadastre mercados, feirantes e famílias consumidoras com histórico de compras.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold rounded-xl text-sm shadow-md shadow-[#1B4332]/20 transition-all active:scale-[0.98] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden"
          />
        </div>
        <span className="text-xs font-bold text-gray-500 hidden sm:inline">
          {filteredCustomers.length} cadastrados
        </span>
      </div>

      {/* Customer Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">Nenhum cliente cadastrado</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            Organize contatos de compradores frequentes para fidelizar suas vendas.
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-[#2D6A4F] text-white rounded-xl text-xs font-bold hover:bg-[#1B4332] transition-colors"
            >
              + Adicionar Cliente
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((c) => {
            const purchaseInfo = customerSalesMap[c.name.toLowerCase().trim()];
            return (
              <div
                key={c.id}
                className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between hover:border-[#2D6A4F] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{c.name}</h3>
                      {c.city && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{c.city}</span>
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-gray-400 hover:text-[#2D6A4F] hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Contacts */}
                  <div className="mt-3 space-y-1 text-xs text-gray-600">
                    {c.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium">{c.phone}</span>
                      </p>
                    )}
                    {c.email && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{c.email}</span>
                      </p>
                    )}
                  </div>

                  {c.notes && (
                    <p className="mt-3 text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg">
                      {c.notes}
                    </p>
                  )}
                </div>

                {/* Purchase Stats & History Button */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Total Comprado</span>
                    <p className="text-sm font-black text-[#1B4332]">
                      {purchaseInfo ? formatBRL(purchaseInfo.totalAmount) : 'R$ 0,00'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCustomerHistory(c)}
                    className="flex items-center gap-1 text-xs font-bold text-[#2D6A4F] hover:underline"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Ver compras ({purchaseInfo ? purchaseInfo.count : 0})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Modal */}
      {selectedCustomerHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1B4332] p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                  Histórico de Compras: {selectedCustomerHistory.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCustomerHistory(null)}
                className="p-1 rounded-full text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {historyOfSelected.length === 0 ? (
                <p className="text-center text-gray-400 text-xs py-8">
                  Nenhuma venda lançada com o nome deste cliente até o momento.
                </p>
              ) : (
                <div className="space-y-3">
                  {historyOfSelected.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs text-gray-500 font-semibold">{formatDisplayDate(s.date)}</span>
                        <h4 className="font-bold text-gray-900 text-sm">{s.product}</h4>
                        <p className="text-xs text-gray-600">
                          {s.quantity} {s.unit} × {formatBRL(s.unitPrice)}
                        </p>
                      </div>
                      <span className="text-base font-black text-emerald-700">
                        {formatBRL(s.totalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar Cliente */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            <div className="bg-[#1B4332] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                {editingItem ? 'Editar Cliente' : 'Novo Cliente'}
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

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nome do Cliente / Comprador <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Empório da Serra, Dona Maria..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(31) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Cidade / Região
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ouro Preto - MG"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="contato@comprador.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Observações</label>
                <textarea
                  rows={2}
                  placeholder="Preferências, dias de feira, forma usual de entrega..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden resize-none"
                />
              </div>

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
                  {isSubmitting ? 'Salvando...' : editingItem ? 'Atualizar Cliente' : 'Salvar Cliente'}
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
        aria-label="Adicionar Cliente"
      >
        <Plus className="w-5 h-5 text-blue-400" />
        <span>Novo Cliente</span>
      </button>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useAgro } from '../context/AgroContext';
import { SupplierRecord } from '../types';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Package,
  Edit2,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, isAdmin, isDemoMode } = useAgro();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplierRecord | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [suppliedProduct, setSuppliedProduct] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.suppliedProduct && s.suppliedProduct.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.phone && s.phone.includes(searchTerm))
    );
  }, [suppliers, searchTerm]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setName('');
    setPhone('');
    setSuppliedProduct('');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: SupplierRecord) => {
    setEditingItem(s);
    setName(s.name);
    setPhone(s.phone || '');
    setSuppliedProduct(s.suppliedProduct || '');
    setNotes(s.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setFormError('Operação bloqueada: Somente administradores podem salvar fornecedores.');
      return;
    }
    if (!name.trim()) {
      setFormError('Informe o nome do fornecedor.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateSupplier(editingItem.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          suppliedProduct: suppliedProduct.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await addSupplier({
          name: name.trim(),
          phone: phone.trim() || undefined,
          suppliedProduct: suppliedProduct.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError('Erro ao salvar fornecedor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, supplierName: string) => {
    if (!isAdmin) return;
    if (confirm(`Excluir o cadastro de "${supplierName}"?`)) {
      await deleteSupplier(id);
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
                O cadastro, edição e exclusão de fornecedores estão desabilitados para visitantes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] tracking-tight flex items-center gap-2">
            <Truck className="w-8 h-8 text-violet-600" />
            <span>Fornecedores de Insumos</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Mantenha contatos de embalagens, ração, adubos e sementes em um só lugar.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold rounded-xl text-sm shadow-md shadow-[#1B4332]/20 transition-all active:scale-[0.98] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Fornecedor</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome ou insumo fornecido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden"
          />
        </div>
        <span className="text-xs font-bold text-gray-500 hidden sm:inline">
          {filteredSuppliers.length} parceiros
        </span>
      </div>

      {/* Suppliers Grid */}
      {filteredSuppliers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">Nenhum fornecedor cadastrado</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            Cadastre os parceiros de compras da sua propriedade para agilizar reposições de estoque.
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-[#2D6A4F] text-white rounded-xl text-xs font-bold hover:bg-[#1B4332] transition-colors"
            >
              + Adicionar Fornecedor
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((s) => (
            <div
              key={s.id}
              className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between hover:border-[#2D6A4F] transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-gray-900 text-base">{s.name}</h3>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-gray-400 hover:text-[#2D6A4F] hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {s.suppliedProduct && (
                  <div className="mt-2.5 p-2 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl flex items-start gap-2 text-xs text-[#166534] font-medium">
                    <Package className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#2D6A4F]" />
                    <span>{s.suppliedProduct}</span>
                  </div>
                )}

                {s.phone && (
                  <p className="mt-3 text-xs text-gray-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium">{s.phone}</span>
                  </p>
                )}

                {s.notes && (
                  <p className="mt-3 text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg">
                    {s.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar Fornecedor */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

            <div className="bg-[#1B4332] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Truck className="w-5 h-5 text-violet-400" />
                {editingItem ? 'Editar Fornecedor' : 'Novo Fornecedor'}
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
                  Nome do Fornecedor / Loja <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vidraria Central, AgroCampo..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Produto Fornecido
                </label>
                <input
                  type="text"
                  placeholder="Ex: Caixas de madeira, Frascos de vidro, Cera..."
                  value={suppliedProduct}
                  onChange={(e) => setSuppliedProduct(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="(31) 3551-2000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Observações</label>
                <textarea
                  rows={2}
                  placeholder="Prazos de entrega, frete mínimo, contato comercial..."
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
                  {isSubmitting ? 'Salvando...' : editingItem ? 'Atualizar Fornecedor' : 'Salvar Fornecedor'}
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
        aria-label="Adicionar Fornecedor"
      >
        <Plus className="w-5 h-5 text-violet-400" />
        <span>Novo Fornecedor</span>
      </button>
    </div>
  );
};

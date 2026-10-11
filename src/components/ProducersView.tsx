import React, { useState } from 'react';
import { useAgro } from '../context/AgroContext';
import { ProducerRecord, formatDisplayDate } from '../types';
import {
  Users,
  Building,
  Plus,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  AlertCircle,
  Link2,
} from 'lucide-react';

export const ProducersView: React.FC = () => {
  const {
    producers,
    fieldAdmins,
    isSuperAdmin,
    isFieldAdmin,
    isAdmin,
    isSuspended,
    isVisitor,
    currentUser,
    userProfile,
    addProducer,
    updateProducer,
    deleteProducer,
    assignProducerToAdmin,
    selectedFieldAdminFilter,
    setSelectedFieldAdminFilter,
  } = useAgro();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProducer, setEditingProducer] = useState<ProducerRecord | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [mainActivity, setMainActivity] = useState('');
  const [ownerAdminUid, setOwnerAdminUid] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const activeUid = currentUser?.uid || userProfile?.userId || 'field_admin_1';

  // Filter producers
  const filteredProducers = producers.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.mainActivity || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (isSuperAdmin && selectedFieldAdminFilter !== 'all') {
      return matchesSearch && p.ownerAdminUid === selectedFieldAdminFilter;
    }

    if (isFieldAdmin) {
      return matchesSearch && (p.ownerAdminUid === activeUid || p.createdBy === activeUid);
    }

    return matchesSearch;
  });

  const handleOpenCreate = () => {
    if (isSuspended) {
      alert('Sua conta de administrador de campo está suspensa. Operações bloqueadas.');
      return;
    }
    setEditingProducer(null);
    setName('');
    setCpfCnpj('');
    setEmail('');
    setPhone('');
    setLocation('');
    setMainActivity('Apicultura');
    setOwnerAdminUid(isSuperAdmin ? (selectedFieldAdminFilter !== 'all' ? selectedFieldAdminFilter : 'field_admin_1') : activeUid);
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ProducerRecord) => {
    if (isSuspended) {
      alert('Sua conta de administrador de campo está suspensa. Operações bloqueadas.');
      return;
    }
    setEditingProducer(p);
    setName(p.name);
    setCpfCnpj(p.cpfCnpj || '');
    setEmail(p.email || '');
    setPhone(p.phone || '');
    setLocation(p.location || '');
    setMainActivity(p.mainActivity || '');
    setOwnerAdminUid(p.ownerAdminUid);
    setNotes(p.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Informe o nome do produtor rural.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProducer) {
        await updateProducer(editingProducer.id, {
          name: name.trim(),
          cpfCnpj: cpfCnpj.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          location: location.trim() || undefined,
          mainActivity: mainActivity.trim() || undefined,
          ownerAdminUid: isSuperAdmin ? ownerAdminUid : editingProducer.ownerAdminUid,
          notes: notes.trim() || undefined,
        });
        setFeedbackSuccess(`Produtor "${name}" atualizado com sucesso.`);
      } else {
        await addProducer({
          name: name.trim(),
          cpfCnpj: cpfCnpj.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          location: location.trim() || undefined,
          mainActivity: mainActivity.trim() || undefined,
          ownerAdminUid: isSuperAdmin ? (ownerAdminUid || activeUid) : activeUid,
          propertyCount: 1,
          status: 'ativo',
          createdBy: activeUid,
          notes: notes.trim() || undefined,
        });
        setFeedbackSuccess(`Produtor rural "${name}" cadastrado e vinculado com sucesso.`);
      }
      setIsModalOpen(false);
      setTimeout(() => setFeedbackSuccess(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar produtor rural.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (p: ProducerRecord) => {
    if (isSuspended) {
      alert('Sua conta está suspensa.');
      return;
    }
    if (confirm(`Deseja excluir o cadastro do produtor "${p.name}"?`)) {
      try {
        await deleteProducer(p.id);
        setFeedbackSuccess(`Produtor "${p.name}" removido.`);
        setTimeout(() => setFeedbackSuccess(null), 4000);
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir produtor.');
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {feedbackSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#1B4332] tracking-tight">
              Gestão de Produtores Rurais
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#E8F5E9] text-[#1B4332]">
              {filteredProducers.length} {filteredProducers.length === 1 ? 'produtor' : 'produtores'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {isSuperAdmin
              ? 'Todos os produtores cadastrados no ecossistema e seus administradores responsáveis.'
              : 'Produtores vinculados à sua área de responsabilidade de campo.'}
          </p>
        </div>

        {isAdmin && !isSuspended && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Produtor</span>
          </button>
        )}
      </div>

      {/* Suspended Alert */}
      {isSuspended && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-bold">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>
            Sua conta de Administrador de Campo está suspensa pelo Administrador Principal. Novas inclusões e alterações de produtores estão desabilitadas.
          </span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome, atividade ou município..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
          />
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Filtrar por Área:</span>
            <select
              value={selectedFieldAdminFilter}
              onChange={(e) => setSelectedFieldAdminFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-xl px-3 py-2 outline-hidden bg-white font-medium"
            >
              <option value="all">Todas as Áreas (Consolidado)</option>
              {fieldAdmins
                .filter((a) => a.role === 'FIELD_ADMIN')
                .map((a) => (
                  <option key={a.id} value={a.userId || a.id}>
                    {a.name} ({a.areaName})
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid of Producers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducers.map((producer) => {
          const ownerAdmin = fieldAdmins.find(
            (a) => a.userId === producer.ownerAdminUid || a.id === producer.ownerAdminUid
          );

          return (
            <div
              key={producer.id}
              className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3.5 hover:border-emerald-300 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 leading-tight">
                    {producer.name}
                  </h3>
                  <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                    {producer.mainActivity || 'Agricultura Familiar'}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 shrink-0">
                  {producer.status}
                </span>
              </div>

              {/* Location & Contact */}
              <div className="space-y-1.5 text-xs text-gray-600">
                {producer.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{producer.location}</span>
                  </div>
                )}
                {producer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{producer.phone}</span>
                  </div>
                )}
                {producer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate font-mono text-[11px]">{producer.email}</span>
                  </div>
                )}
              </div>

              {/* Responsible Admin Badge */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400 font-semibold">Adm Responsável:</span>
                <span className="font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                  {ownerAdmin ? ownerAdmin.name : 'Central AgroGest'}
                </span>
              </div>

              {/* Actions */}
              {isAdmin && !isSuspended && (
                <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(producer)}
                    className="p-1.5 text-gray-600 hover:text-[#1B4332] hover:bg-emerald-50 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(producer)}
                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredProducers.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">Nenhum produtor encontrado</h3>
          <p className="text-xs text-gray-500 mt-1">
            {searchQuery
              ? 'Tente ajustar os termos da busca.'
              : 'Cadastre o primeiro produtor para esta área de atuação.'}
          </p>
        </div>
      )}

      {/* Modal Cadastrar / Editar Produtor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="bg-[#1B4332] p-5 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                <span>{editingProducer ? 'Editar Produtor Rural' : 'Novo Produtor Rural'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nome do Produtor Rural <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Batista da Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Atividade Principal
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Apicultura, Cafeicultura, Leite"
                    value={mainActivity}
                    onChange={(e) => setMainActivity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    CPF ou CNPJ (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    E-mail de Contato
                  </label>
                  <input
                    type="email"
                    placeholder="produtor@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Município / Localização da Propriedade
                </label>
                <input
                  type="text"
                  placeholder="Ex: Serra das Abelhas, Mariana - MG"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
                />
              </div>

              {isSuperAdmin && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Administrador de Campo Responsável
                  </label>
                  <select
                    value={ownerAdminUid}
                    onChange={(e) => setOwnerAdminUid(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden bg-white font-medium"
                  >
                    {fieldAdmins.map((a) => (
                      <option key={a.id} value={a.userId || a.id}>
                        {a.name} ({a.role} — {a.areaName})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Como SUPER_ADMIN, você pode atribuir ou transferir este produtor para qualquer administrador.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Observações</label>
                <textarea
                  rows={2}
                  placeholder="Anotações gerais..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1B4332] text-white text-xs font-bold rounded-xl hover:bg-[#2D6A4F] shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : editingProducer ? 'Salvar Alterações' : 'Cadastrar Produtor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

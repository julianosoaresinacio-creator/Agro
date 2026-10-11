import React, { useState, useEffect } from 'react';
import { useAgro } from '../context/AgroContext';
import { FieldAdminUser, formatBRL, formatDisplayDate } from '../types';
import { CompleteInviteModal } from './CompleteInviteModal';
import {
  ShieldCheck,
  Users,
  Building,
  Wheat,
  Receipt,
  TrendingUp,
  Package,
  Clock,
  UserCheck,
  UserX,
  Plus,
  Edit2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Lock,
  X,
  FileText,
  Mail,
  Phone,
  Send,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Copy,
  Check,
  KeyRound,
  RefreshCw,
  Server,
  ExternalLink,
} from 'lucide-react';

interface GlobalAdminViewProps {
  onNavigateToAudit?: () => void;
  onNavigateToProducers?: () => void;
}

export const GlobalAdminView: React.FC<GlobalAdminViewProps> = ({
  onNavigateToAudit,
  onNavigateToProducers,
}) => {
  const {
    isSuperAdmin,
    fieldAdmins,
    producers,
    allProductions,
    allCosts,
    allInventory,
    allSales,
    auditLogs,
    createFieldAdmin,
    updateFieldAdmin,
    suspendFieldAdmin,
    reactivateFieldAdmin,
    resendFieldAdminInvite,
  } = useAgro();

  // Tab state: 'gerenciar_admins' (default) | 'visao_geral' | 'sdk_status'
  const [activeTab, setActiveTab] = useState<'gerenciar_admins' | 'visao_geral' | 'sdk_status'>('gerenciar_admins');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteStatusModalOpen, setIsInviteStatusModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  const [selectedAdmin, setSelectedAdmin] = useState<FieldAdminUser | null>(null);
  const [selectedAdminForCompletion, setSelectedAdminForCompletion] = useState<{
    email: string;
    name?: string;
    uid?: string;
    areaName?: string;
    token?: string;
  } | null>(null);

  const [createdInviteResult, setCreatedInviteResult] = useState<{
    admin: FieldAdminUser;
    inviteLink?: string;
    inviteToken?: string;
    accountCreatedInAuth?: boolean;
    adminSdkConfigured?: boolean;
    message?: string;
  } | null>(null);

  // Form states (Section 1: nome completo, e-mail, telefone opcional)
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [suspendReason, setSuspendReason] = useState('Suspensão preventiva de segurança operacional');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'suspenso'>('all');

  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // SDK status diagnostic state
  const [sdkStatus, setSdkStatus] = useState<any>(null);
  const [sdkLoading, setSdkLoading] = useState(false);

  const fetchSdkStatus = async () => {
    setSdkLoading(true);
    try {
      const resp = await fetch('/api/admin/sdk-status');
      if (resp.ok) {
        const data = await resp.json();
        setSdkStatus(data);
      }
    } catch (err) {
      console.warn('Erro ao carregar sdk status:', err);
    } finally {
      setSdkLoading(false);
    }
  };

  useEffect(() => {
    fetchSdkStatus();
  }, []);

  if (!isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-rose-200 shadow-md text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Acesso Restrito: SUPER_ADMIN</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          O <strong>Painel Global AgroGest</strong> é exclusivo do Administrador Principal e proprietário da plataforma. Administradores de campo e produtores não possuem autorização para visualizar este painel ou gerenciar outros usuários.
        </p>
      </div>
    );
  }

  // Filtered field admins list
  const filteredAdmins = fieldAdmins.filter((admin) => {
    const matchesSearch =
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (admin.areaName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || admin.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI Calculations (Consolidated Platform Data)
  const totalFieldAdmins = fieldAdmins.filter((a) => a.role === 'FIELD_ADMIN').length;
  const activeAdminsCount = fieldAdmins.filter((a) => a.role === 'FIELD_ADMIN' && a.status === 'ativo').length;
  const suspendedAdminsCount = fieldAdmins.filter((a) => a.role === 'FIELD_ADMIN' && a.status === 'suspenso').length;
  const totalProducers = producers.length;
  const totalSalesRevenue = allSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCostsAmount = allCosts.reduce((sum, c) => sum + c.amount, 0);
  const totalProductionVolume = allProductions.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockItemsCount = allInventory.filter((i) => i.currentQuantity <= i.minQuantity).length;

  // Handlers
  const handleOpenCreate = () => {
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewAreaName('');
    setNewNotes('');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Section 4 Error checks
    if (!newName.trim() || newName.trim().length < 3) {
      setFormError('Nome inválido. Informe o nome completo do administrador (mínimo de 3 caracteres).');
      return;
    }

    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      setFormError('E-mail inválido. Informe um endereço de e-mail no formato correto (exemplo: usuario@dominio.com).');
      return;
    }

    // Check duplicate email
    if (fieldAdmins.some((a) => a.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      setFormError('E-mail já cadastrado. Já existe um administrador com este e-mail no sistema.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createFieldAdmin({
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim(),
        areaName: newAreaName.trim() || 'Pólo Operacional de Campo',
        notes: newNotes.trim(),
        assignedProducerIds: [],
      });

      setIsCreateModalOpen(false);
      setCreatedInviteResult({
        admin: res.admin,
        inviteLink: res.inviteLink,
        inviteToken: res.inviteToken,
        accountCreatedInAuth: res.accountCreatedInAuth,
        adminSdkConfigured: res.adminSdkConfigured,
        message: res.message,
      });
      setIsInviteStatusModalOpen(true);
      setSuccessToast(`Administrador de Campo "${newName}" cadastrado com sucesso!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao cadastrar administrador de campo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyInviteLink = (linkToCopy?: string) => {
    const link = linkToCopy || createdInviteResult?.inviteLink || '';
    if (link) {
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleOpenEdit = (admin: FieldAdminUser) => {
    setSelectedAdmin(admin);
    setNewName(admin.name);
    setNewEmail(admin.email);
    setNewPhone(admin.phone || '');
    setNewAreaName(admin.areaName || '');
    setNewNotes(admin.notes || '');
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setIsSubmitting(true);
    try {
      await updateFieldAdmin(selectedAdmin.id, {
        name: newName,
        phone: newPhone,
        areaName: newAreaName,
        notes: newNotes,
      });
      setIsEditModalOpen(false);
      setSuccessToast(`Cadastro de ${newName} atualizado com sucesso.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao atualizar administrador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSuspend = (admin: FieldAdminUser) => {
    setSelectedAdmin(admin);
    setSuspendReason('Suspensão preventiva de segurança operacional');
    setIsSuspendModalOpen(true);
  };

  const handleConfirmSuspend = async () => {
    if (!selectedAdmin) return;
    try {
      await suspendFieldAdmin(selectedAdmin.id, suspendReason);
      setIsSuspendModalOpen(false);
      setSuccessToast(`Administrador ${selectedAdmin.name} foi suspenso. Novas operações estão bloqueadas.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao suspender administrador.');
    }
  };

  const handleConfirmReactivate = async (admin: FieldAdminUser) => {
    if (confirm(`Deseja reativar a conta do administrador de campo "${admin.name}"? As operações serão desbloqueadas.`)) {
      try {
        await reactivateFieldAdmin(admin.id);
        setSuccessToast(`Conta de ${admin.name} reativada com sucesso!`);
        setTimeout(() => setSuccessToast(null), 4000);
      } catch (err: any) {
        alert(err.message || 'Erro ao reativar administrador.');
      }
    }
  };

  const handleResendInvite = async (admin: FieldAdminUser) => {
    try {
      const res = await resendFieldAdminInvite(admin.email);
      setCreatedInviteResult({
        admin,
        inviteLink: res.inviteLink,
        message: `Novo convite gerado para ${admin.name}`,
      });
      setIsInviteStatusModalOpen(true);
      setSuccessToast(`Novo link de convite gerado para ${admin.email}!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erro ao reenviar convite.');
    }
  };

  const handleTestCompleteAccess = (admin: FieldAdminUser) => {
    setSelectedAdminForCompletion({
      email: admin.email,
      name: admin.name,
      uid: admin.userId || admin.id,
      areaName: admin.areaName,
      token: (admin as any).inviteToken,
    });
    setIsInviteStatusModalOpen(false);
    setIsCompleteModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-14 max-w-7xl mx-auto">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#1B4332] text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_center,rgba(116,198,157,0.15),transparent)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-[#1B4332] rounded-full text-xs font-black uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Painel Global AgroGest</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Visão Consolidada & Gestão de Administradores
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Ambiente restrito do Proprietário da Plataforma (SUPER_ADMIN). Cadastre os 3 administradores de campo com contas individuais, monitore o isolamento de dados e auditoria.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#1B4332] hover:bg-emerald-50 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#2D6A4F]" />
              <span>+ Novo administrador de campo</span>
            </button>
            {onNavigateToAudit && (
              <button
                onClick={onNavigateToAudit}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800/80 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs border border-emerald-600/50 transition-colors"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                <span>Logs de Auditoria</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs (Gerenciar administradores de campo / Visão Consolidada / Firebase Admin SDK) */}
      <div className="flex border-b border-gray-200 bg-white p-1 rounded-2xl shadow-2xs gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('gerenciar_admins')}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'gerenciar_admins'
              ? 'bg-[#1B4332] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <UserCheck className="w-4 h-4 text-amber-400" />
          <span>Gerenciar administradores de campo</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white">
            {fieldAdmins.filter((a) => a.role === 'FIELD_ADMIN').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('visao_geral')}
          className={`flex-1 min-w-[180px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'visao_geral'
              ? 'bg-[#1B4332] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Visão Geral Consolidada</span>
        </button>

        <button
          onClick={() => setActiveTab('sdk_status')}
          className={`flex-1 min-w-[200px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'sdk_status'
              ? 'bg-[#1B4332] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Server className="w-4 h-4 text-blue-400" />
          <span>Status do Firebase Admin SDK</span>
          <span
            className={`w-2 h-2 rounded-full ${
              sdkStatus?.initialized ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
        </button>
      </div>

      {/* TAB CONTENT 1: GERENCIAR ADMINISTRADORES DE CAMPO */}
      {activeTab === 'gerenciar_admins' && (
        <div className="space-y-6">
          {/* Quick Notice Banner */}
          <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-950">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-emerald-900 block font-black">
                  Contas Individuais de Administradores de Campo
                </strong>
                <span className="text-emerald-800 text-[11px]">
                  Cada integrante recebe um convite exclusivo, define sua própria senha e atua apenas sobre produtores e propriedades de sua área territorial.
                </span>
              </div>
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 bg-[#1B4332] text-white rounded-xl font-bold text-xs shrink-0 hover:bg-[#2D6A4F] transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Novo administrador de campo</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
            {/* Table Filters & Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#2D6A4F]" />
                  <span>Gerenciar administradores de campo</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Cadastre novos administradores, consulte a situação do convite e gerencie o status das contas.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden w-48 sm:w-60"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs border border-gray-300 rounded-xl px-2.5 py-1.5 outline-hidden bg-white font-medium"
                >
                  <option value="all">Todos os Status</option>
                  <option value="ativo">Apenas Ativos</option>
                  <option value="suspenso">Apenas Suspensos</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Nome Completo</th>
                    <th className="py-3 px-4">E-mail</th>
                    <th className="py-3 px-4">Telefone</th>
                    <th className="py-3 px-4">Pólo / Área</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Situação do Convite</th>
                    <th className="py-3 px-4 text-center">Firebase Auth</th>
                    <th className="py-3 px-4 text-center">Produtores</th>
                    <th className="py-3 px-4">Último Acesso</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-400">
                        Nenhum administrador encontrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filteredAdmins.map((admin) => {
                      const assignedProds = producers.filter(
                        (p) => p.ownerAdminUid === admin.userId || p.ownerAdminUid === admin.id
                      );
                      const isOwner = admin.role === 'SUPER_ADMIN';
                      const isSusp = admin.status === 'suspenso';
                      const inviteStatus = admin.inviteStatus || (admin.lastLoginAt?.includes('Pendente') ? 'convite_enviado' : 'convite_aceito');
                      const inAuth = admin.accountCreatedInAuth !== false;

                      return (
                        <tr
                          key={admin.id}
                          className={`hover:bg-gray-50/60 transition-colors ${
                            isSusp ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          {/* Nome */}
                          <td className="py-3.5 px-4 font-bold text-gray-900">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                  isOwner
                                    ? 'bg-amber-100 text-amber-900'
                                    : isSusp
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-emerald-100 text-emerald-900'
                                }`}
                              >
                                {admin.name.charAt(0)}
                              </div>
                              <div>
                                <div>{admin.name}</div>
                                {isOwner && (
                                  <span className="text-[10px] text-amber-700 font-extrabold uppercase">
                                    Proprietário (SUPER_ADMIN)
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* E-mail */}
                          <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">
                            {admin.email}
                          </td>

                          {/* Telefone */}
                          <td className="py-3.5 px-4 text-gray-600 font-medium text-[11px]">
                            {admin.phone || '—'}
                          </td>

                          {/* Polo */}
                          <td className="py-3.5 px-4 text-gray-700 font-medium">
                            {admin.areaName || '—'}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                isSusp
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSusp ? 'bg-rose-600' : 'bg-emerald-600'
                                }`}
                              />
                              {admin.status}
                            </span>
                          </td>

                          {/* Situação do Convite */}
                          <td className="py-3.5 px-4 text-center">
                            {isOwner ? (
                              <span className="text-[10px] font-bold text-gray-400">N/A</span>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  inviteStatus === 'convite_aceito' || inviteStatus === 'acesso_concluido'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {inviteStatus === 'convite_aceito' || inviteStatus === 'acesso_concluido' ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                    <span>Acesso concluído</span>
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3 h-3 text-amber-600" />
                                    <span>Convite enviado</span>
                                  </>
                                )}
                              </span>
                            )}
                          </td>

                          {/* Firebase Auth Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inAuth
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Conta no Auth</span>
                            </span>
                          </td>

                          {/* Produtores Vinculados */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-extrabold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                              {assignedProds.length}
                            </span>
                          </td>

                          {/* Último Acesso */}
                          <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                            {formatDisplayDate(admin.lastLoginAt || '')}
                          </td>

                          {/* Ações */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isOwner && (
                                <>
                                  <button
                                    title="Reenviar Convite"
                                    onClick={() => handleResendInvite(admin)}
                                    className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg transition-colors"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>

                                  <button
                                    title="Concluir Acesso / Definir Senha"
                                    onClick={() => handleTestCompleteAccess(admin)}
                                    className="p-1.5 hover:bg-blue-50 text-blue-700 rounded-lg transition-colors"
                                  >
                                    <KeyRound className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              <button
                                title="Visualizar Detalhes"
                                onClick={() => {
                                  setSelectedAdmin(admin);
                                  setIsDetailModalOpen(true);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                title="Editar Cadastro"
                                onClick={() => handleOpenEdit(admin)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-[#1B4332] transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {!isOwner && (
                                <>
                                  {isSusp ? (
                                    <button
                                      title="Reativar Conta"
                                      onClick={() => handleConfirmReactivate(admin)}
                                      className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-700 font-bold transition-colors"
                                    >
                                      <UserCheck className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      title="Suspender Conta"
                                      onClick={() => handleOpenSuspend(admin)}
                                      className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 font-bold transition-colors"
                                    >
                                      <UserX className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: VISÃO GERAL CONSOLIDADA (KPIs) */}
      {activeTab === 'visao_geral' && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Card 1: Admins de Campo */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Adms de Campo</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#1B4332] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">{totalFieldAdmins}</span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {activeAdminsCount} ativos
                </span>
              </div>
              {suspendedAdminsCount > 0 && (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{suspendedAdminsCount} suspenso</span>
                </p>
              )}
            </div>

            {/* Card 2: Produtores Cadastrados */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Produtores Rurais</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">{totalProducers}</span>
                <span className="text-[11px] text-gray-500">distribuídos nas 3 áreas</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Média de ~{(totalProducers / Math.max(1, totalFieldAdmins)).toFixed(1)} por adm de campo
              </p>
            </div>

            {/* Card 3: Vendas Consolidadas */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Vendas Registradas</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-700">
                  {formatBRL(totalSalesRevenue)}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                {allSales.length} transações no ecossistema
              </p>
            </div>

            {/* Card 4: Custos Lançados */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">Custos Lançados</span>
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-rose-700">
                  {formatBRL(totalCostsAmount)}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                {allCosts.length} despesas computadas
              </p>
            </div>
          </div>

          {/* Produtores por Administrador Distribution Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#2D6A4F]" />
                  <span>Distribuição de Produtores por Administrador de Campo</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cada administrador atua de forma isolada sobre os produtores vinculados à sua área territorial.
                </p>
              </div>
              {onNavigateToProducers && (
                <button
                  onClick={onNavigateToProducers}
                  className="text-xs font-bold text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1"
                >
                  <span>Ver todos os produtores</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {fieldAdmins
                .filter((a) => a.role === 'FIELD_ADMIN')
                .map((admin) => {
                  const assignedProds = producers.filter((p) => p.ownerAdminUid === admin.userId || p.ownerAdminUid === admin.id);
                  const isSusp = admin.status === 'suspenso';
                  return (
                    <div
                      key={admin.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isSusp
                          ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                          : 'bg-[#F9FAF9] border-gray-200 text-gray-800 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-gray-900">{admin.name}</span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isSusp ? 'bg-rose-200 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {admin.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{admin.areaName}</div>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-200/60 text-xs">
                        <span className="text-gray-500">Produtores vinculados:</span>
                        <strong className="text-gray-900 font-black">{assignedProds.length}</strong>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="text-gray-500">Última atividade:</span>
                        <span className="text-[11px] text-gray-600 font-medium">{formatDisplayDate(admin.lastLoginAt || '')}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: STATUS DO FIREBASE ADMIN SDK & CREDENCIAIS */}
      {activeTab === 'sdk_status' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    sdkStatus?.initialized
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Diagnóstico do Firebase Admin SDK</h3>
                  <p className="text-xs text-gray-500">
                    Verificação em tempo real da conexão do servidor backend com a infraestrutura Firebase.
                  </p>
                </div>
              </div>
              <button
                onClick={fetchSdkStatus}
                disabled={sdkLoading}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sdkLoading ? 'animate-spin' : ''}`} />
                <span>Atualizar Diagnóstico</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2 text-xs">
                <span className="text-gray-500 font-semibold block">Situação Atual:</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      sdkStatus?.initialized ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <strong className="text-gray-900 text-sm">
                    {sdkStatus?.initialized
                      ? 'Admin SDK Inicializado com Sucesso'
                      : 'Modo Seguro com Google Identity Toolkit REST API'}
                  </strong>
                </div>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  {sdkStatus?.message || 'Aguardando diagnóstico do backend...'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2 text-xs">
                <span className="text-gray-500 font-semibold block">Projeto Firebase Configurado:</span>
                <strong className="text-gray-900 font-mono text-xs block">
                  {sdkStatus?.projectId || 'apt-buffer-h41j7'}
                </strong>
                <span className="text-gray-500 font-semibold block pt-1">SUPER_ADMIN Responsável:</span>
                <strong className="text-emerald-800 font-mono text-xs block">
                  {sdkStatus?.superAdminEmail || 'juliano.soares.inacio@gmail.com'}
                </strong>
              </div>
            </div>

            {/* Credential setup instructions */}
            <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 text-xs text-amber-950">
              <h4 className="font-black flex items-center gap-2 text-sm text-amber-900">
                <KeyRound className="w-4 h-4 text-amber-700" />
                <span>Instruções para Configuração da Chave de Serviço do Firebase</span>
              </h4>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Para que o backend execute chamadas administrativas avançadas com o Firebase Admin SDK utilizando uma Conta de Serviço direta (Service Account):
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 text-[11px] text-amber-900 font-medium">
                <li>Acesse o <strong>Console do Firebase</strong> &gt; Configurações do Projeto &gt; <strong>Contas de Serviço</strong>.</li>
                <li>Clique em <strong>"Gerar nova chave privada"</strong> para baixar o arquivo JSON de credenciais.</li>
                <li>Configure o conteúdo desse JSON na variável de ambiente <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-950">FIREBASE_SERVICE_ACCOUNT_KEY</code>.</li>
              </ol>
              <p className="text-[11px] text-emerald-800 font-semibold pt-1">
                ✅ <strong>Proteção Ativa:</strong> Mesmo sem a chave de serviço configurada, o backend do AgroGest efetua a criação e o vínculo real da conta de autenticação via Google Identity Toolkit REST API, garantindo segurança estrita e sem senhas em texto aberto.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: NOVO ADMINISTRADOR DE CAMPO (Section 1) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="bg-[#1B4332] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-[#1B4332] flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold">
                  + Novo administrador de campo
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nome completo */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nome completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo Silva"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
                />
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  E-mail <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ex: carlos.campo@agrogest.com.br"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  O integrante receberá o convite para definir sua própria senha de acesso de forma segura.
                </p>
              </div>

              {/* Telefone, opcional */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Telefone, opcional
                </label>
                <input
                  type="text"
                  placeholder="(35) 99876-1122"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
                />
              </div>

              {/* Pólo territorial opcional */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Pólo / Área territorial de atuação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sul de Minas — Café e Frutas"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
                />
              </div>

              {/* Observações opcionais */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Observações administrativas (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Escopo do teste de campo, convênio ou metas..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium resize-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <strong>Segurança AgroGest:</strong> A conta de acesso será provisionada no Firebase Authentication. O novo administrador de campo atuará isolado em sua área de dados e não terá acesso ao código-fonte ou ao painel global.
              </div>

              {/* Botões do formulário: Enviar convite; Cancelar (Section 1) */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1B4332] text-white text-xs font-bold rounded-xl hover:bg-[#2D6A4F] shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isSubmitting ? 'Enviando convite...' : 'Enviar convite'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SITUAÇÃO DO CONVITE E DA CONTA (Section 1 & 2) */}
      {isInviteStatusModalOpen && createdInviteResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="bg-[#1B4332] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-400 text-[#1B4332] flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Situação do Convite e da Conta</h3>
                  <p className="text-[11px] text-emerald-100">Operação concluída com sucesso no servidor</p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteStatusModalOpen(false)}
                className="p-1 rounded-full text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Status Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <strong className="text-sm text-emerald-900 font-black">
                    Administrador de Campo Cadastrado com Sucesso!
                  </strong>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/70 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[11px]">Situação do Convite:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md mt-0.5">
                      <Send className="w-3 h-3 text-amber-600" />
                      <span>Convite enviado</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-[11px]">Situação da Conta:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Criada no Firebase Auth</span>
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/70 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Nome:</span>
                    <strong className="text-gray-900">{createdInviteResult.admin.name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">E-mail:</span>
                    <strong className="font-mono text-gray-800 text-[11px]">{createdInviteResult.admin.email}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Identificador (UID):</span>
                    <strong className="font-mono text-gray-800 text-[11px]">{createdInviteResult.admin.userId || createdInviteResult.admin.id}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Papel:</span>
                    <span className="font-black text-[10px] bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded uppercase">
                      FIELD_ADMIN
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Responsável:</span>
                    <span className="text-gray-700 text-[11px]">Juliano Soares Inácio (SUPER_ADMIN)</span>
                  </div>
                </div>
              </div>

              {/* Invite Link Card */}
              {createdInviteResult.inviteLink && (
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Link Seguro de Convite & Definição de Senha:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdInviteResult.inviteLink}
                      className="w-full px-2.5 py-1.5 text-[11px] font-mono bg-white border border-gray-300 rounded-xl outline-hidden text-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyInviteLink()}
                      className="px-3 py-1.5 bg-[#1B4332] text-white rounded-xl text-xs font-bold hover:bg-[#2D6A4F] shrink-0 flex items-center gap-1"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-400" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    O integrante acessa este link, define sua própria senha secreta no Firebase Authentication e obtém acesso imediato como Administrador de Campo.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleTestCompleteAccess(createdInviteResult.admin)}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>Testar / Definir Senha Agora</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsInviteStatusModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2 bg-[#1B4332] text-white text-xs font-bold rounded-xl hover:bg-[#2D6A4F] transition-colors"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DEFINIR SENHA / CONCLUIR ACESSO DO INTEGRANTE */}
      <CompleteInviteModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        adminData={selectedAdminForCompletion}
        onSuccess={() => {
          setSuccessToast('Acesso de Administrador de Campo concluído e senha definida!');
          setTimeout(() => setSuccessToast(null), 4000);
        }}
      />

      {/* MODAL 4: DETALHES DO ADMINISTRADOR */}
      {isDetailModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="bg-[#1B4332] p-5 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <span>Ficha Cadastral: {selectedAdmin.name}</span>
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-full text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-gray-500 text-[11px] block">Função / Perfil:</span>
                  <strong className="text-gray-900">{selectedAdmin.role}</strong>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block">Status:</span>
                  <span
                    className={`inline-block font-bold text-[10px] uppercase px-2 py-0.5 rounded-full ${
                      selectedAdmin.status === 'ativo'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedAdmin.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block">Pólo / Área:</span>
                  <strong className="text-gray-900">{selectedAdmin.areaName || '—'}</strong>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block">Telefone:</span>
                  <strong className="text-gray-900">{selectedAdmin.phone || 'Não informado'}</strong>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block">Data de Criação:</span>
                  <span className="text-gray-700">{formatDisplayDate(selectedAdmin.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block">Último Acesso:</span>
                  <span className="text-gray-700">{formatDisplayDate(selectedAdmin.lastLoginAt || '')}</span>
                </div>
              </div>

              {selectedAdmin.inviteLink && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                  <span className="font-bold text-emerald-900 block">Link de Convite Ativo:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={selectedAdmin.inviteLink}
                      className="w-full text-[11px] font-mono bg-white border border-emerald-300 rounded-lg px-2 py-1"
                    />
                    <button
                      onClick={() => handleCopyInviteLink(selectedAdmin.inviteLink)}
                      className="px-2.5 py-1 bg-[#1B4332] text-white rounded-lg text-xs font-bold shrink-0"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                {selectedAdmin.role !== 'SUPER_ADMIN' && (
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleTestCompleteAccess(selectedAdmin);
                    }}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-xl"
                  >
                    Definir Senha do Integrante
                  </button>
                )}
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EDITAR ADMINISTRADOR */}
      {isEditModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="bg-[#1B4332] p-5 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <span>Editar Cadastro: {selectedAdmin.name}</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pólo / Área</label>
                <input
                  type="text"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1B4332] text-white text-xs font-bold rounded-xl hover:bg-[#2D6A4F] shadow-sm disabled:opacity-50"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: SUSPENDER ADMINISTRADOR */}
      {isSuspendModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="bg-rose-700 p-5 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <span>Suspender Conta de Administrador</span>
              </h3>
              <button
                onClick={() => setIsSuspendModalOpen(false)}
                className="p-1 rounded-full text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                Você está prestes a suspender a conta de <strong>{selectedAdmin.name}</strong>. Enquanto estiver suspenso, este administrador não poderá cadastrar produtores, lançar custos ou registrar produções.
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Motivo da suspensão (registrado em auditoria):
                </label>
                <textarea
                  rows={2}
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-hidden font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSuspendModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSuspend}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Confirmar Suspensão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

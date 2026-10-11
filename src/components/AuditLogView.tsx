import React, { useState } from 'react';
import { useAgro } from '../context/AgroContext';
import { AuditLogRecord, formatDisplayDate } from '../types';
import {
  FileText,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  User,
  Clock,
  KeyRound,
  Download,
  Terminal,
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs, isSuperAdmin, fieldAdmins } = useAgro();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>('all');

  if (!isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-rose-200 shadow-md text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Acesso Restrito: Auditoria Global</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Os logs de auditoria da plataforma AgroGest são de leitura exclusiva do <strong>SUPER_ADMIN</strong>. Administradores de campo e produtores não têm acesso a esta área nem permissão para alterar ou apagar registros de auditoria.
        </p>
      </div>
    );
  }

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.recordId || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesRecord = recordTypeFilter === 'all' || log.recordType === recordTypeFilter;

    return matchesSearch && matchesAction && matchesRecord;
  });

  const getActionBadge = (action: AuditLogRecord['action']) => {
    switch (action) {
      case 'create':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">Criação</span>;
      case 'update':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800">Edição</span>;
      case 'delete':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">Exclusão</span>;
      case 'status_change':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800">Status</span>;
      case 'access_denied':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900">Negado</span>;
      case 'login':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-100 text-teal-800">Login</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-800">{action}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white p-6 sm:p-7 rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-[#1B4332] rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Auditoria Imutável AgroGest</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Logs de Auditoria & Conformidade
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl">
            Rastreabilidade de todas as ações dos administradores de campo e do administrador principal. Regras do Firestore proíbem edição ou exclusão deste histórico (imutabilidade garantida).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold flex items-center gap-2 text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{auditLogs.length} eventos registrados</span>
          </span>
        </div>
      </div>

      {/* Security Specification Card */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-950 text-xs">
        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-bold">Garantia Técnica de Imutabilidade:</strong>
          <p className="text-emerald-800 leading-relaxed">
            Em <code>firestore.rules</code>, a coleção <code>/audit_logs/{'{logId}'}</code> possui a diretiva <code>allow update, delete: if false;</code>. Nenhum administrador de campo tem poder técnico para expurgar ou mascarar seus registros operacionais.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por detalhes, e-mail ou identificador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-xl px-3 py-2 outline-hidden bg-white font-medium"
          >
            <option value="all">Todas as Ações</option>
            <option value="create">Criação (Create)</option>
            <option value="update">Edição (Update)</option>
            <option value="delete">Exclusão (Delete)</option>
            <option value="status_change">Mudança de Status</option>
            <option value="login">Login de Usuário</option>
            <option value="access_denied">Tentativas Negadas</option>
          </select>

          <select
            value={recordTypeFilter}
            onChange={(e) => setRecordTypeFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-xl px-3 py-2 outline-hidden bg-white font-medium"
          >
            <option value="all">Todos os Módulos</option>
            <option value="admin">Administrador (Admin)</option>
            <option value="producer">Produtor (Producer)</option>
            <option value="production">Produção (Production)</option>
            <option value="cost">Custos (Cost)</option>
            <option value="inventory">Estoque (Inventory)</option>
            <option value="sale">Vendas (Sale)</option>
            <option value="customer">Clientes (Customer)</option>
            <option value="auth">Autenticação (Auth)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Data & Horário</th>
                <th className="py-3 px-4">Usuário Responsável</th>
                <th className="py-3 px-4 text-center">Papel</th>
                <th className="py-3 px-4 text-center">Ação</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Detalhes da Operação</th>
                <th className="py-3 px-4 text-right">ID do Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Nenhum log encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      <div>{log.userName || log.userEmail}</div>
                      <div className="text-[10px] text-gray-400 font-mono font-normal">
                        {log.userEmail}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">{getActionBadge(log.action)}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-700 capitalize">
                      {log.recordType}
                    </td>
                    <td className="py-3.5 px-4 text-gray-800 max-w-md">
                      <span className="line-clamp-2">{log.details}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[10px] text-gray-400 whitespace-nowrap">
                      {log.recordId || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

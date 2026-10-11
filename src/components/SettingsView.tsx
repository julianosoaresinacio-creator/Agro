import React, { useState } from 'react';
import { useAgro, AUTHORIZED_ADMIN_EMAIL } from '../context/AgroContext';
import {
  Settings,
  Sparkles,
  Trash2,
  Database,
  MapPin,
  Check,
  AlertTriangle,
  Building,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  User,
  Phone,
  FileCheck,
  RotateCcw,
  Server,
  Lock,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    userProfile,
    property,
    saveProperty,
    loadDemoDataToAccount,
    clearAccountData,
    restoreDemoData,
    isDemoMode,
    isAdmin,
    isSuperAdmin,
    isFieldAdmin,
  } = useAgro();

  // Producer fields
  const [producerName, setProducerName] = useState(userProfile?.displayName || 'Juliano Soares Inácio');
  const [producerPhone, setProducerPhone] = useState(userProfile?.phone || '(31) 98765-4321');

  // Property fields
  const [name, setName] = useState(property?.name || 'Apiário São José');
  const [location, setLocation] = useState(property?.location || 'Serra das Abelhas, Mariana - MG');
  const [sizeHectares, setSizeHectares] = useState<number | ''>(property?.sizeHectares ?? 15);
  const [activityType, setActivityType] = useState(property?.activityType || 'Apicultura');

  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  if (!isSuperAdmin) {
    if (isFieldAdmin) {
      return (
        <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-amber-200 shadow-md text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Configurações Globais: Exclusivo SUPER_ADMIN</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Como <strong>Administrador de Campo</strong>, você possui autonomia para gerenciar seus produtores, registrar colheitas, custos, estoque e vendas em sua área de atuação. As configurações globais de plataforma, infraestrutura Firebase e gerenciamento de outros administradores pertencem exclusivamente ao <strong>SUPER_ADMIN</strong>.
          </p>
          <div className="p-3 bg-amber-50 rounded-xl text-xs font-semibold text-amber-900 border border-amber-200">
            Utilize os módulos &quot;Produtores Rurais&quot;, &quot;Produção&quot;, &quot;Custos&quot; e &quot;Estoque&quot; no menu lateral para gerenciar sua área.
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto my-8 p-6 bg-white rounded-2xl border border-amber-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Acesso Restrito a Administradores</h2>
        <p className="text-sm text-gray-600">
          Você está no modo demonstração. As configurações administrativas e painel de gestão do AgroGest são restritos a usuários autenticados com o papel ADMIN.
        </p>
        <div className="p-3 bg-amber-50 rounded-xl text-xs font-semibold text-amber-900">
          Você está no modo demonstração. Os dados são somente para consulta.
        </div>
      </div>
    );
  }

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedbackMsg(null);
    setFeedbackError(null);
    try {
      await saveProperty({
        name: name.trim(),
        location: location.trim() || undefined,
        sizeHectares: sizeHectares !== '' ? Number(sizeHectares) : undefined,
        activityType: activityType.trim() || undefined,
      });
      setFeedbackMsg('Dados do produtor e propriedade salvos com sucesso no sistema!');
    } catch (err: any) {
      setFeedbackError(err.message || 'Erro ao salvar propriedade.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreDemo = async () => {
    if (
      confirm(
        'Deseja restaurar os dados fictícios da demonstração (Apiário São José)? Isso redefinirá os registros demonstrativos de mel, despesas, colheitas e vendas.'
      )
    ) {
      setFeedbackMsg('Restaurando dados fictícios da demonstração...');
      try {
        await restoreDemoData();
        setFeedbackMsg('Dados da demonstração do Apiário São José restaurados com sucesso!');
      } catch (err: any) {
        setFeedbackError(err.message || 'Erro ao restaurar dados.');
      }
    }
  };

  const handleClear = async () => {
    if (
      confirm(
        'Atenção: tem certeza que deseja excluir todos os lançamentos de produção, custos, estoque e vendas? Essa ação é irreversível.'
      )
    ) {
      try {
        await clearAccountData();
        setFeedbackMsg('Todos os lançamentos foram limpos.');
      } catch (err: any) {
        setFeedbackError(err.message || 'Erro ao limpar dados.');
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-[#2D6A4F]" />
          <span>Painel de Gestão & Configurações Administrativas</span>
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Controle total de produtores, propriedades rurais, dados e segurança Firebase da plataforma.
        </p>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {feedbackError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs font-bold animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{feedbackError}</span>
        </div>
      )}

      {/* Admin Status Card */}
      <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-400 text-[#1B4332] flex items-center justify-center font-black text-xl shadow-inner">
            <ShieldCheck className="w-7 h-7 text-[#1B4332]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold">Sessão Administrativa Ativa</span>
              <span className="px-2 py-0.5 bg-amber-300 text-[#1B4332] text-[10px] font-black rounded-full uppercase tracking-wider">
                ADMIN
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              Usuário autenticado: <strong className="text-white">{currentUser?.email || AUTHORIZED_ADMIN_EMAIL}</strong>
            </p>
          </div>
        </div>
        <div className="text-right sm:text-right w-full sm:w-auto">
          <span className="text-[11px] text-emerald-200 bg-white/10 px-3 py-1 rounded-full border border-white/20 inline-flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Regras Firestore ativas
          </span>
        </div>
      </div>

      {/* Property & Producer Form */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Building className="w-5 h-5 text-[#2D6A4F]" />
          <span>Cadastro de Produtor e Propriedade Rural</span>
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Defina as informações do produtor responsável e os parâmetros territoriais da propriedade.
        </p>

        <form onSubmit={handleSaveProperty} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nome do Produtor Responsável <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={producerName}
                  onChange={(e) => setProducerName(e.target.value)}
                  placeholder="Nome do produtor"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Telefone / WhatsApp de Contato
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={producerPhone}
                  onChange={(e) => setProducerPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nome da Propriedade / Apiário <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Apiário São José, Sítio Primavera..."
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Atividade Principal da Propriedade
              </label>
              <input
                type="text"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                placeholder="Ex: Apicultura, Hortifrúti, Leite..."
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Localização / Município
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Serra das Abelhas, Mariana - MG"
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Área Total (Hectares)
              </label>
              <input
                type="number"
                step="any"
                value={sizeHectares}
                onChange={(e) => setSizeHectares(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ex: 15"
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto py-3.5 sm:py-2.5 px-6 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50 text-center"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>

      {/* Demo Data Management Card */}
      <div className="bg-[#F0FDF4] p-4 sm:p-6 rounded-2xl border border-[#BBF7D0] shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-[#166534]">Restauração de Dados Fictícios da Demonstração</h3>
            </div>
            <p className="text-xs text-[#15803D] mt-1 max-w-xl">
              Permite restaurar a qualquer momento os dados completos de demonstração do Apiário São José (colheitas de mel silvestre, custos de caixas/embalagens, estoque mínimo, clientes e vendas).
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <button
            onClick={handleRestoreDemo}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl shadow-xs transition-colors active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-[#74C69D]" />
            <span>Restaurar Dados da Demonstração</span>
          </button>
          <button
            onClick={handleClear}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors active:scale-95"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>Limpar Todos os Lançamentos</span>
          </button>
        </div>
      </div>

      {/* Security & Firebase Specs Information Panel */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-[#1B4332]">
          <Server className="w-5 h-5 text-[#2D6A4F]" />
          <h3 className="text-base font-bold text-gray-900">
            Arquitetura de Segurança & Permissões no Firebase
          </h3>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Para garantir total segurança, as permissões administrativas não dependem de validação visual no navegador. O controle de gravação, edição e exclusão é estritamente reforçado pelas regras de segurança do Firestore (<strong>firestore.rules</strong>) e pela validação de contas autorizadas:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Validação no Backend / Firestore</span>
            </div>
            <p className="text-[11px] text-gray-600">
              Regras do Firestore verificam a função <code>isAdmin()</code> exigindo Custom Claim <code>request.auth.token.admin == true</code>, existência do documento na coleção <code>/admins/{'{uid}'}</code> ou e-mail autorizado.
            </p>
          </div>

          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Como Autorizar Novo Administrador</span>
            </div>
            <p className="text-[11px] text-gray-600">
              No Firebase Admin SDK ou Cloud Functions: execute <code>admin.auth().setCustomUserClaims(uid, {'{ admin: true, role: "ADMIN" }'})</code> para a conta autorizada.
            </p>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
          <strong>Isolamento de dados:</strong> Nenhum visitante do modo demonstração pode criar documentos no banco, alterar papéis de usuário ou executar chamadas de exclusão.
        </div>
      </div>
    </div>
  );
};

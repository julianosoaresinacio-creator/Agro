import React, { useState } from 'react';
import { useAgro } from '../context/AgroContext';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  ArrowRight,
  X,
} from 'lucide-react';

interface CompleteInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminData: {
    email: string;
    name?: string;
    uid?: string;
    areaName?: string;
    token?: string;
  } | null;
  onSuccess?: () => void;
}

export const CompleteInviteModal: React.FC<CompleteInviteModalProps> = ({
  isOpen,
  onClose,
  adminData,
  onSuccess,
}) => {
  const { completeFieldAdminInvite, switchTestProfile } = useAgro();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen || !adminData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password || password.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas digitadas não coincidem. Verifique e digite novamente.');
      return;
    }

    setLoading(true);
    try {
      await completeFieldAdminInvite({
        email: adminData.email,
        password,
        uid: adminData.uid,
        token: adminData.token,
      });

      setIsCompleted(true);
      setTimeout(() => {
        // Also simulate or activate the field admin profile in UI
        if (adminData.email.includes('carlos')) {
          switchTestProfile('FIELD_ADMIN_1');
        } else if (adminData.email.includes('mariana')) {
          switchTestProfile('FIELD_ADMIN_2');
        } else if (adminData.email.includes('roberto')) {
          switchTestProfile('FIELD_ADMIN_3');
        }
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao definir senha do administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#1B4332] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-[#1B4332] flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black leading-tight">Concluir Acesso de Campo</h3>
              <p className="text-[11px] text-emerald-100">Ativação segura de Administrador de Campo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isCompleted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="text-xl font-black text-gray-900">Acesso Concluído com Sucesso!</h4>
            <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
              Sua senha foi cadastrada no <strong>Firebase Authentication</strong> e sua função <strong>FIELD_ADMIN</strong> foi ativada. Redirecionando para seu painel operacional...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Admin identity pill */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Integrante Convidado:</span>
                <span className="font-extrabold text-[#1B4332]">{adminData.name || 'Administrador de Campo'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">E-mail:</span>
                <span className="font-mono text-gray-700 text-[11px] font-bold">{adminData.email}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60">
                <span className="text-gray-500 font-medium">Papel Atribuído:</span>
                <span className="bg-emerald-200 text-emerald-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                  FIELD_ADMIN
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Definir Nova Senha <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Mínimo de 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Confirmar Nova Senha <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Repita sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-200">
              🔒 <strong>Privacidade e Segurança:</strong> Sua senha é de uso pessoal e intransferível. O proprietário da plataforma (SUPER_ADMIN) não tem acesso à sua senha em texto aberto.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? (
                  <span>Salvando Senha...</span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    <span>Definir Senha e Acessar AgroGest</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

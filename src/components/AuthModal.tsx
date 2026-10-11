import React, { useState } from 'react';
import { useAgro, AUTHORIZED_ADMIN_EMAIL } from '../context/AgroContext';
import {
  X,
  Mail,
  Lock,
  User,
  Sprout,
  AlertCircle,
  CheckCircle2,
  MapPin,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Info,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'admin'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [activity, setActivity] = useState('Apicultura');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    loginWithGoogle,
    loginWithEmail,
    loginAdminWithEmail,
    registerWithEmail,
    sendPasswordReset,
    startInstantDemo,
  } = useAgro();

  // Reset mode when opened with new initialMode
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Janela de login fechada antes da conclusão.');
      } else {
        setErrorMsg('Erro ao conectar com Google. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Janela de login fechada antes da conclusão.');
      } else {
        setErrorMsg(err?.message || 'Erro ao conectar com conta administrativa do Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'admin') {
        if (!email.trim() || !password) {
          setErrorMsg('Informe e-mail e senha do administrador.');
          setLoading(false);
          return;
        }
        await loginAdminWithEmail(email, password);
        onClose();
      } else if (mode === 'login') {
        await loginWithEmail(email, password);
        onClose();
      } else if (mode === 'register') {
        if (!displayName.trim()) {
          setErrorMsg('Por favor, informe seu nome completo.');
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, displayName, farmName, activity);
        onClose();
      } else if (mode === 'forgot') {
        await sendPasswordReset(email);
        setSuccessMsg('E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const msg = err?.message || '';

      if (msg.includes('não possui o papel administrativo') || msg.includes('não autorizado')) {
        setErrorMsg('Acesso não autorizado: Esta conta não possui o papel administrativo (ADMIN). Apenas administradores pré-autorizados podem acessar esta área.');
      } else if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        setErrorMsg('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este e-mail já está cadastrado. Tente entrar.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('A senha deve possuir pelo menos 6 caracteres.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg('Muitas tentativas sem sucesso. Aguarde alguns instantes e tente novamente.');
      } else {
        setErrorMsg(err.message || 'Ocorreu um erro na autenticação. Verifique os dados e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    startInstantDemo();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Header Bar */}
        <div
          className={`p-5 sm:p-6 text-white text-center relative shrink-0 transition-colors ${
            mode === 'admin'
              ? 'bg-gradient-to-r from-[#0F291E] via-[#1B4332] to-[#2D6A4F]'
              : 'bg-gradient-to-r from-[#1B4332] to-[#2D6A4F]'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-2 text-[#74C69D]">
            {mode === 'admin' ? (
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
            ) : (
              <Sprout className="w-6 h-6 sm:w-7 sm:h-7" />
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold flex items-center justify-center gap-2">
            {mode === 'admin' && (
              <>
                <span>Acesso Administrativo</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded">
                  ADMIN
                </span>
              </>
            )}
            {mode === 'login' && 'Entrar no AgroGest'}
            {mode === 'register' && 'Criar Conta no AgroGest'}
            {mode === 'forgot' && 'Recuperar Senha'}
          </h2>
          <p className="text-xs text-[#D8F3DC] mt-0.5 max-w-xs mx-auto">
            {mode === 'admin'
              ? 'Autenticação segura para gestão de produtores, propriedades e registros.'
              : 'Do campo para a gestão: saiba quanto produz, quanto gasta e ganha.'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login' || mode === 'register' || mode === 'forgot'
                ? 'bg-white text-[#1B4332] shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Produtor Rural
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('admin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'admin'
                ? 'bg-[#1B4332] text-white shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Acesso Administrativo</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMsg}</div>
            </div>
          )}

          {/* Admin Notice */}
          {mode === 'admin' && (
            <>
              <div className="mb-4 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Validação de Segurança no Servidor</p>
                  <p className="text-amber-800 leading-relaxed text-[11px]">
                    O papel <strong>ADMIN</strong> é verificado diretamente pelo Firebase Authentication e regras de segurança do Firestore. Apenas administradores pré-autorizados recebem permissão para cadastrar, editar, excluir ou restaurar dados.
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleGoogleAdminLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-[#2D6A4F]/40 hover:bg-[#F0FDF4] text-[#1B4332] font-bold rounded-xl text-xs sm:text-sm shadow-2xs transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                    />
                  </svg>
                  <span>Entrar com Google ({AUTHORIZED_ADMIN_EMAIL})</span>
                </button>
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white px-2 text-gray-400 font-bold">ou com e-mail e senha</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Google Quick Login for regular users */}
          {mode !== 'forgot' && mode !== 'admin' && (
            <div className="mb-5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold rounded-xl text-sm shadow-2xs transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                  />
                </svg>
                <span>Entrar com o Google</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400 font-semibold">ou com e-mail</span>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nome do Produtor
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: José Carlos"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Propriedade
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Ex: Sítio São José"
                        value={farmName}
                        onChange={(e) => setFarmName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Atividade
                    </label>
                    <select
                      value={activity}
                      onChange={(e) => setActivity(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden bg-white"
                    >
                      <option value="Apicultura">Apicultura (Mel)</option>
                      <option value="Hortaliças">Hortaliças</option>
                      <option value="Frutas">Frutas</option>
                      <option value="Leite">Gado de Leite</option>
                      <option value="Agricultura Familiar">Agricultura Familiar</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {mode === 'admin' ? 'E-mail do Administrador' : 'E-mail'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder={mode === 'admin' ? 'admin@agrogest.com.br' : 'produtor@campo.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    {mode === 'admin' ? 'Senha Administrativa' : 'Senha'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-[#2D6A4F] hover:underline font-semibold"
                    >
                      Esqueceu?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Sua senha secreta"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-50 mt-2 ${
                mode === 'admin'
                  ? 'bg-[#1B4332] hover:bg-[#2D6A4F] shadow-[#1B4332]/25'
                  : 'bg-[#1B4332] hover:bg-[#2D6A4F] shadow-[#1B4332]/20'
              }`}
            >
              {loading ? (
                'Autenticando...'
              ) : mode === 'admin' ? (
                'Entrar como Administrador'
              ) : mode === 'login' ? (
                'Entrar no Sistema'
              ) : mode === 'register' ? (
                'Criar Minha Conta Grátis'
              ) : (
                'Enviar E-mail de Recuperação'
              )}
            </button>
          </form>

          {/* Toggles */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
            {mode === 'login' && (
              <p className="text-gray-600">
                Ainda não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-bold text-[#2D6A4F] hover:underline"
                >
                  Cadastre-se grátis
                </button>
              </p>
            )}
            {mode === 'register' && (
              <p className="text-gray-600">
                Já possui uma conta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-[#2D6A4F] hover:underline"
                >
                  Fazer login
                </button>
              </p>
            )}
            {mode === 'admin' && (
              <p className="text-gray-600">
                É produtor rural?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-[#2D6A4F] hover:underline"
                >
                  Entrar como produtor
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <p className="text-gray-600">
                Lembrou a senha?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-[#2D6A4F] hover:underline"
                >
                  Voltar ao login
                </button>
              </p>
            )}
          </div>

          {/* Quick Demo Access for Visitors */}
          <div className="mt-4 pt-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-3 text-center">
            <p className="text-xs text-[#166534] font-medium mb-2">
              Deseja apenas consultar e testar os recursos?
            </p>
            <button
              type="button"
              onClick={handleDemoMode}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white border border-[#2D6A4F]/30 hover:bg-[#E8F5E9] text-[#1B4332] text-xs font-bold rounded-lg shadow-2xs transition-colors"
            >
              <span>Acessar Modo Demonstração (Somente Consulta)</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#2D6A4F]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

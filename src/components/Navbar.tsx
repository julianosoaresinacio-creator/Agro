import React, { useState } from 'react';
import { useAgro, TestProfileKey } from '../context/AgroContext';
import { ActivePage } from '../types';
import {
  Sprout,
  LogOut,
  Sparkles,
  User,
  ShieldCheck,
  ChevronDown,
  Layers,
  Check,
} from 'lucide-react';

interface NavbarProps {
  activePage: ActivePage;
  setActivePage: (p: ActivePage) => void;
  onOpenAuth: (mode?: 'login' | 'register' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  onOpenAuth,
}) => {
  const {
    currentUser,
    userProfile,
    userRole,
    isSuperAdmin,
    isFieldAdmin,
    isAdmin,
    isSuspended,
    isDemoMode,
    logout,
    startInstantDemo,
    activeTestProfile,
    switchTestProfile,
  } = useAgro();

  const [isTestSwitcherOpen, setIsTestSwitcherOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div
          onClick={() => setActivePage(currentUser || isDemoMode || activeTestProfile ? 'dashboard' : 'landing')}
          className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] flex items-center justify-center text-white shadow-md shadow-[#2D6A4F]/20 group-hover:scale-105 transition-transform">
            <Sprout className="w-6 h-6 text-[#74C69D]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-[#1B4332]">
                Agro<span className="text-[#2D6A4F]">Gest</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold bg-[#D8F3DC] text-[#1B4332] px-1.5 py-0.5 rounded-sm">
                4-ADMIN
              </span>
            </div>
            <p className="text-[11px] text-[#52796F] hidden sm:block font-medium">
              Do campo para a gestão
            </p>
          </div>
        </div>

        {/* Role & Testing Switcher */}
        <div className="flex items-center gap-2">
          {/* Active Role Badge */}
          {isSuperAdmin && (
            <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-[#1B4332] border border-[#2D6A4F] text-amber-300 rounded-full text-[10px] sm:text-xs font-black shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>SUPER_ADMIN</span>
            </div>
          )}

          {isFieldAdmin && (
            <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-emerald-100 border border-emerald-200 text-[#1B4332] rounded-full text-[10px] sm:text-xs font-black shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>FIELD_ADMIN {isSuspended && '(SUSPENSO)'}</span>
            </div>
          )}

          {userRole === 'PRODUCER' && (
            <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded-full text-[10px] sm:text-xs font-bold">
              <span>Produtor Rural</span>
            </div>
          )}

          {isDemoMode && !isAdmin && (
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] rounded-full text-[10px] sm:text-xs font-semibold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse"></span>
              <span className="hidden md:inline">Modo Demonstração (Somente Consulta)</span>
              <span className="md:hidden font-bold">Demonstração</span>
            </div>
          )}

          {/* Quick Account Switcher for Evaluating the 4 Admins */}
          <div className="relative">
            <button
              onClick={() => setIsTestSwitcherOpen(!isTestSwitcherOpen)}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-200"
              title="Alternar entre as contas de teste"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>Contas de Teste</span>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>

            {isTestSwitcherOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                  Simulação de Contas (4 Usuários)
                </div>

                <button
                  onClick={() => {
                    switchTestProfile('SUPER_ADMIN');
                    setIsTestSwitcherOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-emerald-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-gray-900">SUPER_ADMIN</div>
                    <div className="text-[10px] text-gray-500">Juliano Soares (Proprietário)</div>
                  </div>
                  {userRole === 'SUPER_ADMIN' && <Check className="w-4 h-4 text-emerald-600" />}
                </button>

                <button
                  onClick={() => {
                    switchTestProfile('FIELD_ADMIN_1');
                    setIsTestSwitcherOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-emerald-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-gray-900">FIELD_ADMIN 1</div>
                    <div className="text-[10px] text-gray-500">Carlos Silva (Sul de Minas)</div>
                  </div>
                  {activeTestProfile === 'FIELD_ADMIN_1' && <Check className="w-4 h-4 text-emerald-600" />}
                </button>

                <button
                  onClick={() => {
                    switchTestProfile('FIELD_ADMIN_2');
                    setIsTestSwitcherOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-emerald-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-gray-900">FIELD_ADMIN 2</div>
                    <div className="text-[10px] text-gray-500">Mariana Costa (Triângulo)</div>
                  </div>
                  {activeTestProfile === 'FIELD_ADMIN_2' && <Check className="w-4 h-4 text-emerald-600" />}
                </button>

                <button
                  onClick={() => {
                    switchTestProfile('FIELD_ADMIN_3');
                    setIsTestSwitcherOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-emerald-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-gray-900">FIELD_ADMIN 3</div>
                    <div className="text-[10px] text-gray-500">Roberto Santos (Zona da Mata)</div>
                  </div>
                  {activeTestProfile === 'FIELD_ADMIN_3' && <Check className="w-4 h-4 text-emerald-600" />}
                </button>

                <div className="my-1 border-t border-gray-100" />

                <button
                  onClick={() => {
                    switchTestProfile('PRODUCER');
                    setIsTestSwitcherOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-gray-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-gray-900">PRODUCER</div>
                    <div className="text-[10px] text-gray-500">João do Mel (Produtor rural)</div>
                  </div>
                  {userRole === 'PRODUCER' && <Check className="w-4 h-4 text-emerald-600" />}
                </button>

                <button
                  onClick={() => {
                    switchTestProfile('VISITOR');
                    setIsTestSwitcherOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-gray-50 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-gray-900">Modo Demonstração</div>
                    <div className="text-[10px] text-gray-500">Visitante (Consulta)</div>
                  </div>
                  {isDemoMode && <Check className="w-4 h-4 text-amber-600" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {currentUser || isDemoMode || activeTestProfile ? (
            <>
              {/* IA quick link */}
              <button
                onClick={() => setActivePage('ia')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activePage === 'ia'
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'bg-[#D8F3DC] text-[#1B4332] hover:bg-[#B7E4C7]'
                }`}
                title="AgroGest IA"
              >
                <Sparkles className="w-4 h-4 text-[#D97706]" />
                <span className="hidden sm:inline">AgroGest IA</span>
                <span className="sm:hidden font-bold">IA</span>
              </button>

              {/* Demo mode: button to access admin */}
              {isDemoMode && !isAdmin && (
                <button
                  onClick={() => onOpenAuth('admin')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Acesso Administrativo</span>
                  <span className="sm:hidden">Admin</span>
                </button>
              )}

              {/* User indicator */}
              <div
                onClick={() => setActivePage(isSuperAdmin ? 'global_admin' : 'configuracoes')}
                className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer text-left"
                title={isSuperAdmin ? 'Painel Global AgroGest' : 'Configurações'}
              >
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSuperAdmin
                      ? 'bg-amber-400 text-[#1B4332] border-amber-500 font-black'
                      : isFieldAdmin
                      ? 'bg-emerald-700 text-white border-emerald-800'
                      : 'bg-[#E9D8A6]/40 text-[#1B4332] border-[#2D6A4F]/20'
                  }`}
                >
                  {isSuperAdmin ? (
                    <ShieldCheck className="w-4 h-4 text-[#1B4332]" />
                  ) : userProfile?.displayName ? (
                    userProfile.displayName.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-bold text-[#1F2937] leading-none truncate max-w-[130px]">
                    {userProfile?.displayName || 'Usuário'}
                  </p>
                  <p className="text-[11px] text-[#52796F] leading-tight truncate max-w-[130px]">
                    {userRole}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shadow-2xs"
                title="Encerrar Sessão"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onOpenAuth('admin')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-white bg-[#1B4332] hover:bg-[#2D6A4F] rounded-lg shadow-xs transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Acesso administrativo</span>
              </button>
              <button
                onClick={startInstantDemo}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-[#2D6A4F] bg-[#D8F3DC] hover:bg-[#B7E4C7] rounded-lg transition-colors"
              >
                Modo Demonstração
              </button>
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                Entrar
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

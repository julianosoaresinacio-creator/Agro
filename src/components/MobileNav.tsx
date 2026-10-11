import React, { useState } from 'react';
import { ActivePage } from '../types';
import { useAgro } from '../context/AgroContext';
import {
  LayoutDashboard,
  Wheat,
  Receipt,
  Package,
  TrendingUp,
  MoreHorizontal,
  PieChart,
  Users,
  Truck,
  FileText,
  Sparkles,
  Settings,
  X,
  LogOut,
  ChevronRight,
  Sprout,
  User,
  ShieldCheck,
} from 'lucide-react';

interface MobileNavProps {
  activePage: ActivePage;
  setActivePage: (p: ActivePage) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activePage, setActivePage }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { inventory, currentUser, userProfile, property, isDemoMode, logout, isAdmin, isSuperAdmin, isFieldAdmin } = useAgro();

  const lowStockCount = inventory.filter((i) => i.currentQuantity <= i.minQuantity).length;

  const mainTabs: { id: ActivePage; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'producao', label: 'Produção', icon: <Wheat className="w-5 h-5" /> },
    { id: 'custos', label: 'Custos', icon: <Receipt className="w-5 h-5" /> },
    {
      id: 'estoque',
      label: 'Estoque',
      icon: <Package className="w-5 h-5" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    { id: 'vendas', label: 'Vendas', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  const moreTabs: {
    id: ActivePage;
    label: string;
    subtitle: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    ...(isSuperAdmin
      ? [
          {
            id: 'global_admin' as ActivePage,
            label: 'Painel Global AgroGest',
            subtitle: 'Visão Consolidada & Admins',
            icon: <ShieldCheck className="w-5 h-5 text-amber-500" />,
            badge: 'SUPER_ADMIN',
          },
        ]
      : []),
    ...(isAdmin || isFieldAdmin || isSuperAdmin
      ? [
          {
            id: 'produtores' as ActivePage,
            label: 'Produtores Rurais',
            subtitle: 'Gestão de produtores de campo',
            icon: <Users className="w-5 h-5 text-emerald-600" />,
          },
        ]
      : []),
    {
      id: 'resultado',
      label: 'Meu Resultado',
      subtitle: 'Lucro & margem real',
      icon: <PieChart className="w-5 h-5 text-emerald-600" />,
      badge: 'Balanço',
    },
    {
      id: 'ia',
      label: 'AgroGest IA',
      subtitle: 'Consultas inteligentes',
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      badge: 'IA',
    },
    {
      id: 'clientes',
      label: 'Clientes',
      subtitle: 'Histórico de compradores',
      icon: <Users className="w-5 h-5 text-blue-600" />,
    },
    {
      id: 'fornecedores',
      label: 'Fornecedores',
      subtitle: 'Parceiros de insumos',
      icon: <Truck className="w-5 h-5 text-violet-600" />,
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      subtitle: 'Resumo & impressão',
      icon: <FileText className="w-5 h-5 text-gray-700" />,
    },
    {
      id: 'testes' as ActivePage,
      label: 'Testes de Campo (10/10)',
      subtitle: 'Conformidade dos 10 requisitos',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      badge: 'Testes',
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'auditoria' as ActivePage,
            label: 'Logs de Auditoria',
            subtitle: 'Histórico imutável de ações',
            icon: <FileText className="w-5 h-5 text-blue-600" />,
            badge: 'Auditoria',
          },
          {
            id: 'configuracoes' as ActivePage,
            label: 'Configurações Globais',
            subtitle: 'Gestão e Segurança',
            icon: <Settings className="w-5 h-5 text-amber-600" />,
            badge: 'ADMIN',
          },
        ]
      : []),
  ];

  const handleSelectTab = (tab: ActivePage) => {
    setActivePage(tab);
    setIsMoreOpen(false);
  };

  const isMoreActive = [
    'global_admin',
    'produtores',
    'resultado',
    'clientes',
    'fornecedores',
    'relatorios',
    'ia',
    'auditoria',
    'testes',
    'configuracoes',
  ].includes(activePage);

  return (
    <>
      {/* "Mais" Menu Drawer / Bottom Sheet */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-150">
          <div className="flex-1" onClick={() => setIsMoreOpen(false)} />
          <div className="bg-white rounded-t-3xl p-5 pb-safe shadow-2xl border-t border-gray-200 animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col overflow-hidden">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3 shrink-0" />

            {/* Header & User Card */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B4332] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {userProfile?.displayName ? (
                    userProfile.displayName.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 leading-tight">
                    {userProfile?.displayName || 'Produtor Rural'}
                  </h3>
                  <p className="text-xs text-[#2D6A4F] font-semibold leading-tight flex items-center gap-1">
                    <Sprout className="w-3.5 h-3.5" />
                    <span>{property?.name || 'Propriedade Rural'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:scale-90 transition-transform"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Banner */}
            {isDemoMode && (
              <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="text-[11px] font-bold text-amber-900">
                    Modo Demonstração: Apiário São José
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Exemplo
                </span>
              </div>
            )}

            {/* Modules Grid */}
            <div className="overflow-y-auto flex-1 pr-0.5 space-y-2 mb-3">
              <div className="grid grid-cols-2 gap-2">
                {moreTabs.map((t) => {
                  const isSelected = activePage === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTab(t.id)}
                      className={`flex flex-col p-3 rounded-2xl text-left transition-all active:scale-95 border ${
                        isSelected
                          ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-sm'
                          : 'bg-[#F9FAFB] hover:bg-[#F3F4F6] text-gray-800 border-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className={isSelected ? 'text-white' : ''}>{t.icon}</span>
                        {t.badge && (
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-[#D8F3DC] text-[#1B4332]'
                            }`}
                          >
                            {t.badge}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-xs leading-tight truncate">{t.label}</span>
                      <span
                        className={`text-[10px] mt-0.5 truncate ${
                          isSelected ? 'text-emerald-100' : 'text-gray-400'
                        }`}
                      >
                        {t.subtitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout / Switch Account */}
            <div className="pt-2 border-t border-gray-100 shrink-0">
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-98 font-bold text-xs transition-all border border-rose-100"
              >
                <LogOut className="w-4 h-4" />
                <span>{isDemoMode ? 'Sair do Modo Demonstração' : 'Sair da Conta'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 md:hidden pb-safe shadow-lg select-none">
        <div className="grid grid-cols-6 h-16 items-center px-0.5">
          {mainTabs.map((tab) => {
            const isActive = activePage === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center h-full py-1 relative select-none transition-all active:scale-90 ${
                  isActive ? 'text-[#1B4332]' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <div className="relative">
                  <div
                    className={`p-1 rounded-xl transition-colors ${
                      isActive ? 'bg-[#D8F3DC] text-[#1B4332]' : ''
                    }`}
                  >
                    {tab.icon}
                  </div>
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white shadow-xs">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] tracking-tight mt-0.5 truncate max-w-[54px] ${
                    isActive ? 'font-black text-[#1B4332]' : 'font-medium'
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute top-0 w-8 h-1 bg-[#1B4332] rounded-b-full"></span>
                )}
              </button>
            );
          })}

          {/* Mais Button */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-col items-center justify-center h-full py-1 relative select-none transition-all active:scale-90 ${
              isMoreActive ? 'text-[#1B4332]' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors ${
                isMoreActive ? 'bg-[#D8F3DC] text-[#1B4332]' : ''
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] tracking-tight mt-0.5 truncate max-w-[54px] ${
                isMoreActive ? 'font-black text-[#1B4332]' : 'font-medium'
              }`}
            >
              Mais
            </span>
            {isMoreActive && (
              <span className="absolute top-0 w-8 h-1 bg-[#1B4332] rounded-b-full"></span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
};

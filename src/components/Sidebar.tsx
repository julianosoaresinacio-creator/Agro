import React from 'react';
import { ActivePage } from '../types';
import { useAgro } from '../context/AgroContext';
import {
  LayoutDashboard,
  Wheat,
  Receipt,
  Package,
  TrendingUp,
  PieChart,
  Users,
  Truck,
  FileText,
  Sparkles,
  Settings,
  AlertCircle,
  ShieldCheck,
  Building,
  CheckSquare,
} from 'lucide-react';

interface SidebarProps {
  activePage: ActivePage;
  setActivePage: (p: ActivePage) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const { inventory, isAdmin, isSuperAdmin, isFieldAdmin } = useAgro();

  // Count items with low stock
  const lowStockCount = inventory.filter((i) => i.currentQuantity <= i.minQuantity).length;

  const navItems: { id: ActivePage; label: string; icon: React.ReactNode; badge?: number; section?: string }[] = [
    ...(isSuperAdmin
      ? [
          {
            id: 'global_admin' as ActivePage,
            label: 'Painel Global AgroGest',
            icon: <ShieldCheck className="w-5 h-5 text-amber-500" />,
          },
        ]
      : []),
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    ...(isAdmin || isFieldAdmin || isSuperAdmin
      ? [
          {
            id: 'produtores' as ActivePage,
            label: 'Produtores Rurais',
            icon: <Building className="w-5 h-5 text-emerald-600" />,
          },
        ]
      : []),
    { id: 'producao', label: 'Produção', icon: <Wheat className="w-5 h-5" /> },
    { id: 'custos', label: 'Custos', icon: <Receipt className="w-5 h-5" /> },
    {
      id: 'estoque',
      label: 'Estoque',
      icon: <Package className="w-5 h-5" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    { id: 'vendas', label: 'Vendas', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'resultado', label: 'Meu Resultado', icon: <PieChart className="w-5 h-5" /> },
    { id: 'clientes', label: 'Clientes', icon: <Users className="w-5 h-5" /> },
    { id: 'fornecedores', label: 'Fornecedores', icon: <Truck className="w-5 h-5" /> },
    { id: 'relatorios', label: 'Relatórios', icon: <FileText className="w-5 h-5" /> },
    { id: 'ia', label: 'AgroGest IA', icon: <Sparkles className="w-5 h-5 text-amber-500" /> },
    {
      id: 'testes' as ActivePage,
      label: 'Testes de Campo (10/10)',
      icon: <CheckSquare className="w-5 h-5 text-emerald-500" />,
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'auditoria' as ActivePage,
            label: 'Logs de Auditoria',
            icon: <FileText className="w-5 h-5 text-blue-500" />,
          },
          {
            id: 'configuracoes' as ActivePage,
            label: 'Configurações Globais',
            icon: <Settings className="w-5 h-5 text-amber-500" />,
          },
        ]
      : []),
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Navegação Principal
        </div>
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'text-gray-700 hover:bg-[#F3F4F6] hover:text-[#1B4332]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-[#74C69D]' : 'text-gray-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    isActive
                      ? 'bg-rose-500 text-white'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Slogan banner on bottom of sidebar */}
      <div className="p-4 m-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl text-left">
        <p className="text-xs font-semibold text-[#166534] leading-relaxed">
          &ldquo;Do campo para a gestão: saiba quanto produz, quanto gasta e quanto ganha.&rdquo;
        </p>
      </div>
    </aside>
  );
};

import React, { useState, useMemo } from 'react';
import { useAgro } from '../context/AgroContext';
import { formatDisplayDate } from '../types';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Wheat,
  Receipt,
  TrendingUp,
  Package,
  PieChart,
  CheckCircle2,
  Lock,
  AlertTriangle,
} from 'lucide-react';

type ReportType = 'resultado' | 'producao' | 'custos' | 'vendas' | 'estoque';

export const ReportsView: React.FC = () => {
  const { productions, costs, inventory, sales, userProfile, property, isAdmin, isDemoMode } = useAgro();
  const [reportType, setReportType] = useState<ReportType>('resultado');
  const [period, setPeriod] = useState<'this_month' | '3_months' | 'this_year' | 'all'>('this_month');

  const now = new Date();
  const currYear = now.getFullYear();
  const currMonth = now.getMonth();

  const filterByPeriod = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (period === 'this_month') return d.getFullYear() === currYear && d.getMonth() === currMonth;
    if (period === '3_months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return d >= threeMonthsAgo;
    }
    if (period === 'this_year') return d.getFullYear() === currYear;
    return true;
  };

  const filteredSales = useMemo(() => sales.filter((s) => filterByPeriod(s.date)), [sales, period]);
  const filteredCosts = useMemo(() => costs.filter((c) => filterByPeriod(c.date)), [costs, period]);
  const filteredProductions = useMemo(() => productions.filter((p) => filterByPeriod(p.date)), [productions, period]);

  const totalRevenue = useMemo(() => filteredSales.reduce((a, b) => a + b.totalAmount, 0), [filteredSales]);
  const totalCost = useMemo(() => filteredCosts.reduce((a, b) => a + b.amount, 0), [filteredCosts]);
  const netResult = totalRevenue - totalCost;
  const marginPct = totalRevenue > 0 ? (netResult / totalRevenue) * 100 : 0;

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!isAdmin) {
      alert('Operação bloqueada: No modo demonstração, a exportação de dados é desabilitada. Acesso restrito a administradores.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    if (reportType === 'vendas') {
      csvContent += 'Data,Produto,Quantidade,Unidade,Preco_Unitario,Total,Cliente,Pagamento\n';
      filteredSales.forEach((s) => {
        csvContent += `"${formatDisplayDate(s.date)}","${s.product}","${s.quantity}","${s.unit}","${s.unitPrice}","${s.totalAmount}","${s.customer || ''}","${s.paymentMethod || ''}"\n`;
      });
    } else if (reportType === 'custos') {
      csvContent += 'Data,Categoria,Descricao,Valor,Fornecedor\n';
      filteredCosts.forEach((c) => {
        csvContent += `"${formatDisplayDate(c.date)}","${c.category}","${c.description}","${c.amount}","${c.supplier || ''}"\n`;
      });
    } else if (reportType === 'producao') {
      csvContent += 'Data,Produto,Quantidade,Unidade,Talhao\n';
      filteredProductions.forEach((p) => {
        csvContent += `"${formatDisplayDate(p.date)}","${p.product}","${p.quantity}","${p.unit}","${p.areaPlot || ''}"\n`;
      });
    } else if (reportType === 'estoque') {
      csvContent += 'Item,Unidade,Quantidade_Atual,Minimo,Custo_Unitario,Fornecedor\n';
      inventory.forEach((i) => {
        csvContent += `"${i.item}","${i.unit}","${i.currentQuantity}","${i.minQuantity}","${i.unitCost || 0}","${i.supplier || ''}"\n`;
      });
    } else {
      // Resultado
      csvContent += 'Metrica,Valor\n';
      csvContent += `"Receita Total","${totalRevenue}"\n`;
      csvContent += `"Custos Totais","${totalCost}"\n`;
      csvContent += `"Resultado Estimado","${netResult}"\n`;
      csvContent += `"Margem (%)","${marginPct.toFixed(2)}%"\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agrogest_relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Visitor Banner if not admin */}
      {isDemoMode && !isAdmin && (
        <div className="bg-[#FEF3C7] border-l-4 border-[#D97706] rounded-r-xl p-4 shadow-2xs flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#92400E]">
                Você está no modo demonstração. Os dados são somente para consulta.
              </p>
              <p className="text-[11px] text-[#B45309]">
                A exportação de dados em CSV está desabilitada para visitantes sem acesso administrativo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8 text-[#2D6A4F]" />
            <span>Relatórios Gerenciais</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Gere relatórios completos para prestação de contas, cooperativas ou tomada de decisão.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto">
          {isAdmin ? (
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs sm:text-sm rounded-xl shadow-2xs transition-all active:scale-95"
            >
              <Download className="w-4 h-4 text-gray-600 shrink-0" />
              <span>Exportar CSV</span>
            </button>
          ) : (
            <button
              disabled
              title="Exportação permitida apenas para administradores"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-gray-100 border border-gray-200 text-gray-400 font-bold text-xs sm:text-sm rounded-xl cursor-not-allowed opacity-75"
            >
              <Lock className="w-4 h-4 text-gray-400 shrink-0" />
              <span>Exportar CSV (Bloqueado)</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Control Tabs & Period (hidden in print) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between print:hidden">
        {/* Report Type Selector */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0 -mx-1 px-1">
          <button
            onClick={() => setReportType('resultado')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              reportType === 'resultado' ? 'bg-[#1B4332] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            Balanço / Resultado
          </button>
          <button
            onClick={() => setReportType('producao')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              reportType === 'producao' ? 'bg-[#1B4332] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Wheat className="w-3.5 h-3.5" />
            Produção
          </button>
          <button
            onClick={() => setReportType('custos')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              reportType === 'custos' ? 'bg-[#1B4332] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Custos
          </button>
          <button
            onClick={() => setReportType('vendas')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              reportType === 'vendas' ? 'bg-[#1B4332] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Vendas
          </button>
          <button
            onClick={() => setReportType('estoque')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              reportType === 'estoque' ? 'bg-[#1B4332] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Estoque
          </button>
        </div>

        {/* Period Selector */}
        {reportType !== 'estoque' && (
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            <Calendar className="w-4 h-4 text-gray-400 hidden sm:block" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold bg-white text-gray-800 focus:ring-2 focus:ring-[#2D6A4F] outline-hidden"
            >
              <option value="this_month">Este Mês</option>
              <option value="3_months">Últimos 3 Meses</option>
              <option value="this_year">Este Ano</option>
              <option value="all">Todo o Histórico</option>
            </select>
          </div>
        )}
      </div>

      {/* Printable Report Document Sheet */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-gray-200/80 shadow-xs print:border-none print:shadow-none print:p-0">
        {/* Report Document Header */}
        <div className="border-b-2 border-[#1B4332] pb-4 mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-[#1B4332]">AgroGest</span>
              <span className="text-xs text-gray-400">| Plataforma de Gestão Rural</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-1 capitalize">
              Relatório de {reportType}
            </h2>
            <p className="text-xs text-gray-500">
              Propriedade: {property?.name || userProfile?.farmName || 'Apiário São José'} &bull; Produtor: {userProfile?.displayName || 'Produtor Rural'}
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
            <p className="font-semibold text-[#1B4332]">
              Período: {period === 'this_month' ? 'Este Mês' : period === '3_months' ? 'Últimos 3 Meses' : period === 'this_year' ? 'Ano Vigente' : 'Integral'}
            </p>
          </div>
        </div>

        {/* Report Contents according to type */}
        {reportType === 'resultado' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500">Receita Total</span>
                <p className="text-xl font-black text-emerald-700">{formatBRL(totalRevenue)}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500">Custos Totais</span>
                <p className="text-xl font-black text-rose-700">{formatBRL(totalCost)}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500">Resultado Líquido</span>
                <p className={`text-xl font-black ${netResult >= 0 ? 'text-[#1B4332]' : 'text-red-600'}`}>
                  {formatBRL(netResult)}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500">Margem (%)</span>
                <p className="text-xl font-black text-gray-800">{marginPct.toFixed(1)}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-gray-600">Detalhamento das Vendas Realizadas</h4>
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 font-bold text-gray-700">
                  <tr>
                    <th className="p-2">Data</th>
                    <th className="p-2">Produto</th>
                    <th className="p-2 text-right">Qtd</th>
                    <th className="p-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSales.map((s) => (
                    <tr key={s.id}>
                      <td className="p-2">{formatDisplayDate(s.date)}</td>
                      <td className="p-2 font-medium">{s.product}</td>
                      <td className="p-2 text-right">{s.quantity} {s.unit}</td>
                      <td className="p-2 text-right font-bold text-emerald-700">{formatBRL(s.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 pt-4">
              <h4 className="text-xs font-bold uppercase text-gray-600">Detalhamento dos Custos Lançados</h4>
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 font-bold text-gray-700">
                  <tr>
                    <th className="p-2">Data</th>
                    <th className="p-2">Categoria</th>
                    <th className="p-2">Descrição</th>
                    <th className="p-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCosts.map((c) => (
                    <tr key={c.id}>
                      <td className="p-2">{formatDisplayDate(c.date)}</td>
                      <td className="p-2 capitalize">{c.category}</td>
                      <td className="p-2 font-medium">{c.description}</td>
                      <td className="p-2 text-right font-bold text-rose-700">{formatBRL(c.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'producao' && (
          <div className="space-y-4">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-100 font-bold text-gray-700">
                <tr>
                  <th className="p-2.5">Data</th>
                  <th className="p-2.5">Produto</th>
                  <th className="p-2.5 text-right">Quantidade</th>
                  <th className="p-2.5">Talhão</th>
                  <th className="p-2.5">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProductions.map((p) => (
                  <tr key={p.id}>
                    <td className="p-2.5">{formatDisplayDate(p.date)}</td>
                    <td className="p-2.5 font-bold">{p.product}</td>
                    <td className="p-2.5 text-right font-black text-[#1B4332]">{p.quantity} {p.unit}</td>
                    <td className="p-2.5 text-gray-600">{p.areaPlot || '—'}</td>
                    <td className="p-2.5 text-gray-500 italic">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'custos' && (
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800">Total Desembolsado no Período:</span>
              <span className="text-lg font-black text-rose-700">{formatBRL(totalCost)}</span>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-100 font-bold text-gray-700">
                <tr>
                  <th className="p-2.5">Data</th>
                  <th className="p-2.5">Categoria</th>
                  <th className="p-2.5">Descrição</th>
                  <th className="p-2.5">Fornecedor</th>
                  <th className="p-2.5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCosts.map((c) => (
                  <tr key={c.id}>
                    <td className="p-2.5">{formatDisplayDate(c.date)}</td>
                    <td className="p-2.5 capitalize font-medium">{c.category}</td>
                    <td className="p-2.5 font-bold text-gray-900">{c.description}</td>
                    <td className="p-2.5 text-gray-600">{c.supplier || '—'}</td>
                    <td className="p-2.5 text-right font-black text-rose-700">{formatBRL(c.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'vendas' && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">Faturamento Bruto Total:</span>
              <span className="text-lg font-black text-emerald-700">{formatBRL(totalRevenue)}</span>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-100 font-bold text-gray-700">
                <tr>
                  <th className="p-2.5">Data</th>
                  <th className="p-2.5">Produto</th>
                  <th className="p-2.5 text-center">Qtd</th>
                  <th className="p-2.5 text-right">Unitário</th>
                  <th className="p-2.5 text-right">Total</th>
                  <th className="p-2.5">Cliente</th>
                  <th className="p-2.5">Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSales.map((s) => (
                  <tr key={s.id}>
                    <td className="p-2.5">{s.date}</td>
                    <td className="p-2.5 font-bold">{s.product}</td>
                    <td className="p-2.5 text-center">{s.quantity} {s.unit}</td>
                    <td className="p-2.5 text-right">{formatBRL(s.unitPrice)}</td>
                    <td className="p-2.5 text-right font-black text-emerald-700">{formatBRL(s.totalAmount)}</td>
                    <td className="p-2.5">{s.customer || '—'}</td>
                    <td className="p-2.5 capitalize">{s.paymentMethod || 'PIX'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'estoque' && (
          <div className="space-y-4">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-100 font-bold text-gray-700">
                <tr>
                  <th className="p-2.5">Item</th>
                  <th className="p-2.5 text-center">Qtd Atual</th>
                  <th className="p-2.5 text-center">Mínimo</th>
                  <th className="p-2.5 text-right">Custo Unitário</th>
                  <th className="p-2.5">Fornecedor</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.map((i) => {
                  const isLow = i.currentQuantity <= i.minQuantity;
                  return (
                    <tr key={i.id}>
                      <td className="p-2.5 font-bold text-gray-900">{i.item}</td>
                      <td className="p-2.5 text-center font-black">{i.currentQuantity} {i.unit}</td>
                      <td className="p-2.5 text-center text-gray-500">{i.minQuantity} {i.unit}</td>
                      <td className="p-2.5 text-right">{i.unitCost ? formatBRL(i.unitCost) : '—'}</td>
                      <td className="p-2.5 text-gray-600">{i.supplier || '—'}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLow ? 'Baixo' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer in print / document */}
        <div className="mt-10 pt-4 border-t border-gray-200 text-center text-[11px] text-gray-400">
          AgroGest &bull; &ldquo;Do campo para a gestão: saiba quanto produz, quanto gasta e quanto ganha.&rdquo;
        </div>
      </div>
    </div>
  );
};

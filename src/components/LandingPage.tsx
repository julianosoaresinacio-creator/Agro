import React, { useState } from 'react';
import { useAgro } from '../context/AgroContext';
import {
  Sprout,
  ArrowRight,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Wheat,
  Receipt,
  Package,
  TrendingUp,
  PieChart,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Smartphone,
  Users,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'register' | 'admin') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const { startInstantDemo } = useAgro();
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'O AgroGest é difícil de usar para quem não domina tecnologia?',
      a: 'Não! O AgroGest foi desenhado exatamente para o dia a dia do campo: botões grandes, formulários em uma coluna, sem termos técnicos complicados e cálculos 100% automáticos.',
    },
    {
      q: 'Posso acessar no meu celular pelo campo?',
      a: 'Sim, o sistema é totalmente responsivo e funciona no celular, tablet ou computador. Os menus e botões se adaptam automaticamente à sua tela.',
    },
    {
      q: 'Meus dados ficam seguros e separados de outros produtores?',
      a: 'Sim. Cada produtor possui seu acesso individual protegido com regras de segurança no Firebase. Nenhum outro usuário consegue visualizar suas colheitas, custos ou receitas.',
    },
    {
      q: 'O que é a AgroGest IA?',
      a: 'É um assistente inteligente integrado que responde perguntas simples como "Quanto gastei este mês?" ou "Quais produtos estão com estoque baixo?", consultando diretamente os dados reais da sua propriedade.',
    },
    {
      q: 'Preciso pagar para testar o MVP?',
      a: 'Não. Você pode começar gratuitamente agora mesmo ou clicar em "Ver Demonstração" para explorar com os dados do Apiário São José sem precisar cadastrar cartão.',
    },
  ];

  return (
    <div className="bg-[#F8FAF8] text-gray-900 selection:bg-[#2D6A4F] selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-[#E8F5E9]/50 via-white to-[#F8FAF8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D8F3DC] border border-[#B7E4C7] text-[#1B4332] text-xs font-bold uppercase tracking-wider mb-6 shadow-2xs">
            <Sprout className="w-4 h-4 text-[#2D6A4F]" />
            <span>Do campo para a gestão: saiba quanto produz, quanto gasta e ganha</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1B4332] tracking-tight max-w-4xl mx-auto leading-tight">
            Gestão rural simples <br className="hidden sm:inline" /> para quem produz.
          </h1>

          <p className="mt-5 text-base sm:text-xl text-[#2D6A4F] max-w-2xl mx-auto font-medium leading-relaxed">
            Controle produção, custos, estoque e vendas em um único lugar.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-xl mx-auto">
            <button
              onClick={() => onOpenAuth('admin')}
              className="w-full sm:w-auto px-7 py-4 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-[#1B4332]/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
            >
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Acesso administrativo</span>
            </button>
            <button
              onClick={startInstantDemo}
              className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-gray-50 text-[#1B4332] font-bold text-base rounded-2xl border border-[#2D6A4F]/30 shadow-2xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Ver Demonstração (Consulta)</span>
              <ArrowRight className="w-4 h-4 text-[#2D6A4F]" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
            <span>Produtor cadastrado?</span>
            <button
              onClick={() => onOpenAuth('login')}
              className="text-[#2D6A4F] font-bold hover:underline"
            >
              Entrar na conta
            </button>
            <span>&bull;</span>
            <button
              onClick={() => onOpenAuth('register')}
              className="text-[#2D6A4F] font-bold hover:underline"
            >
              Criar conta gratuita
            </button>
          </div>
        </div>
      </section>

      {/* Seção: O Problema x A Solução */}
      <section className="py-16 sm:py-24 border-y border-gray-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* O Problema */}
            <div className="p-8 rounded-3xl bg-rose-50/60 border border-rose-200/80 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">O Problema no Campo</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  Pequenos produtores enfrentam falta de controle financeiro: anotações perdidas no caderno, despesas esquecidas, vendas não cobradas e estoque que acaba sem aviso prévio. No fim do mês, não se sabe se houve lucro ou prejuízo.
                </p>
              </div>
              <ul className="mt-6 space-y-2 text-xs font-semibold text-rose-900">
                <li className="flex items-center gap-2">&bull; Falta de clareza nos custos reais por safra</li>
                <li className="flex items-center gap-2">&bull; Perda de dinheiro com insumos parados</li>
                <li className="flex items-center gap-2">&bull; Incerteza sobre o lucro líquido do trabalho diário</li>
              </ul>
            </div>

            {/* A Solução AgroGest */}
            <div className="p-8 rounded-3xl bg-[#F0FDF4] border border-[#BBF7D0] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#D8F3DC] text-[#1B4332] flex items-center justify-center mb-4">
                  <Sprout className="w-6 h-6 text-[#2D6A4F]" />
                </div>
                <h3 className="text-xl font-bold text-[#1B4332]">A Solução AgroGest</h3>
                <p className="text-sm text-[#166534] mt-2 leading-relaxed">
                  Uma plataforma moderna, leve e descomplicada. O produtor registra com poucos cliques o que colheu, o que gastou e o que vendeu. O sistema calcula automaticamente os totais, o saldo financeiro e a margem de lucro.
                </p>
              </div>
              <ul className="mt-6 space-y-2 text-xs font-semibold text-[#14532D]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Registro em menos de 30 segundos</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Alertas visuais quando o estoque está baixo</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Inteligência rural (AgroGest IA) para responder suas dúvidas</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona: 4 Passos */}
      <section className="py-16 sm:py-20 bg-[#F8FAF8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs uppercase font-bold tracking-widest text-[#2D6A4F] bg-[#D8F3DC] px-3 py-1 rounded-full">
            Fluxo Intuitivo
          </span>
          <h2 className="text-3xl font-extrabold text-[#1B4332] mt-3">Como Funciona o AgroGest</h2>
          <p className="text-sm text-gray-600 mt-1 max-w-xl mx-auto">
            Quatro etapas simples para transformar anotações soltas em gestão profissional:
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {/* Passo 1 */}
            <div className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-xs relative">
              <span className="text-3xl font-black text-[#2D6A4F]/20 absolute top-4 right-4">01</span>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-4">
                <Wheat className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-gray-900 text-base">1. Registrar</h4>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Anote no celular o mel colhido, as verduras colhidas, o custo de combustível ou a venda na feira.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-xs relative">
              <span className="text-3xl font-black text-[#2D6A4F]/20 absolute top-4 right-4">02</span>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-4">
                <Package className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-gray-900 text-base">2. Organizar</h4>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                O sistema categoriza insumos, controla o estoque mínimo e guarda o histórico de clientes e fornecedores.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-xs relative">
              <span className="text-3xl font-black text-[#2D6A4F]/20 absolute top-4 right-4">03</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-4">
                <PieChart className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-gray-900 text-base">3. Analisar</h4>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Gráficos visuais mostram sua receita, custos totais e a margem de lucro estimada mês a mês.
              </p>
            </div>

            {/* Passo 4 */}
            <div className="p-6 bg-white rounded-2xl border border-gray-200/80 shadow-xs relative">
              <span className="text-3xl font-black text-[#2D6A4F]/20 absolute top-4 right-4">04</span>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-gray-900 text-base">4. Decidir</h4>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Saiba quais produtos são mais rentáveis, onde cortar despesas e quando comprar mais insumos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos Principais */}
      <section className="py-16 sm:py-24 bg-white border-t border-gray-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase font-bold tracking-widest text-[#2D6A4F] bg-[#D8F3DC] px-3 py-1 rounded-full">
              Funcionalidades
            </span>
            <h2 className="text-3xl font-extrabold text-[#1B4332] mt-3">Recursos Práticos do AgroGest</h2>
            <p className="text-sm text-gray-600 mt-1">
              Desenvolvido ouvindo a realidade de quem acorda cedo para produzir.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-gray-200 hover:border-[#2D6A4F] transition-all bg-gray-50/50">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                <Wheat className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">Produção & Safras</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Histórico detalhado por talhão ou colheita, com totalizador automático em kg, litros ou unidades.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-200 hover:border-[#2D6A4F] transition-all bg-gray-50/50">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center mb-3">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">Custos & Despesas</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Classificação por insumos, energia, mão de obra e transporte com gráficos de evolução mensal.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-200 hover:border-[#2D6A4F] transition-all bg-gray-50/50">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-3">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">Estoque com Alertas</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Alerta visual de estoque baixo para itens essenciais e cálculo do valor total em estoque.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-200 hover:border-[#2D6A4F] transition-all bg-gray-50/50">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">Vendas com Cálculo Automático</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Multiplica quantidade por preço unitário instantaneamente e vincula o histórico ao cliente.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-200 hover:border-[#2D6A4F] transition-all bg-gray-50/50">
              <div className="w-10 h-10 rounded-xl bg-[#D8F3DC] text-[#1B4332] flex items-center justify-center mb-3">
                <PieChart className="w-5 h-5 text-[#2D6A4F]" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">Meu Resultado & Margem</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Equação transparente: Receitas menos Custos = Lucro estimado com cálculo da margem percentual.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-200 hover:border-[#2D6A4F] transition-all bg-gradient-to-br from-amber-50 to-white">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">AgroGest IA</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Assistente conversacional que responde dúvidas sobre faturamento, custos e produção consultando seus dados reais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Para Quem É */}
      <section className="py-16 sm:py-20 bg-[#F8FAF8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs uppercase font-bold tracking-widest text-[#2D6A4F] bg-[#D8F3DC] px-3 py-1 rounded-full">
            Público-Alvo
          </span>
          <h2 className="text-3xl font-extrabold text-[#1B4332] mt-3">Para Quem é o AgroGest?</h2>
          <p className="text-sm text-gray-600 mt-1 max-w-xl mx-auto">
            Projetado especialmente para negócios rurais familiares e pequenos produtores:
          </p>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
              <span className="text-2xl mb-1 block">🍯</span>
              <h4 className="font-bold text-gray-900 text-sm">Apicultores</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Mel, própolis, pólen e caixas</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
              <span className="text-2xl mb-1 block">🥬</span>
              <h4 className="font-bold text-gray-900 text-sm">Hortaliças</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Verduras, legumes e feiras</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
              <span className="text-2xl mb-1 block">🍊</span>
              <h4 className="font-bold text-gray-900 text-sm">Fruticultura</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Citros, bananas, morangos</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
              <span className="text-2xl mb-1 block">🥛</span>
              <h4 className="font-bold text-gray-900 text-sm">Pequenos Produtores de Leite</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Litros diários e queijo artesanal</p>
            </div>
          </div>
        </div>
      </section>

      {/* Planos (Visual) */}
      <section className="py-16 sm:py-24 bg-white border-t border-gray-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs uppercase font-bold tracking-widest text-[#2D6A4F] bg-[#D8F3DC] px-3 py-1 rounded-full">
              Planos & Preços
            </span>
            <h2 className="text-3xl font-extrabold text-[#1B4332] mt-3">Investimento Simples e Transparente</h2>
            <p className="text-sm text-gray-600 mt-1">
              Sem taxas escondidas. Comece no plano gratuito durante a fase MVP.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Gratuito */}
            <div className="p-6 rounded-3xl border border-gray-200 bg-gray-50 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">GRATUITO</h3>
                <p className="text-3xl font-black text-gray-900 mt-2">R$ 0</p>
                <p className="text-xs text-gray-500 mb-6">Para quem está dando os primeiros passos</p>
                <ul className="text-xs text-gray-700 space-y-2.5">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Registro de produção</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Registro de vendas</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Controle básico de dados</li>
                </ul>
              </div>
              <button
                onClick={() => onOpenAuth('register')}
                className="mt-8 w-full py-3 bg-white border border-gray-300 hover:bg-gray-100 font-bold text-xs rounded-xl transition-all"
              >
                Cadastrar Grátis
              </button>
            </div>

            {/* AgroGest - Recomendado */}
            <div className="p-6 rounded-3xl border-2 border-[#2D6A4F] bg-[#F0FDF4] flex flex-col justify-between shadow-lg relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1B4332] text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs">
                Mais Popular
              </span>
              <div>
                <h3 className="font-bold text-[#1B4332] text-lg">AGROGEST</h3>
                <p className="text-3xl font-black text-[#1B4332] mt-2">
                  R$ 19,90<span className="text-xs text-gray-500 font-normal">/mês</span>
                </p>
                <p className="text-xs text-gray-600 mb-6">Para gestão completa e profissional do sítio</p>
                <ul className="text-xs text-gray-800 space-y-2.5 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Produção e colheitas</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Custos categorizados</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Estoque com alerta de itens críticos</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Vendas com cálculo automático</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Indicadores & resultado mensal</li>
                </ul>
              </div>
              <button
                onClick={() => onOpenAuth('register')}
                className="mt-8 w-full py-3 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
              >
                Começar com AgroGest
              </button>
            </div>

            {/* AgroGest PRO */}
            <div className="p-6 rounded-3xl border border-gray-200 bg-gray-50 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">AGROGEST PRO</h3>
                <p className="text-3xl font-black text-gray-900 mt-2">
                  R$ 39,90<span className="text-xs text-gray-500 font-normal">/mês</span>
                </p>
                <p className="text-xs text-gray-500 mb-6">Para produtores que desejam IA e relatórios</p>
                <ul className="text-xs text-gray-700 space-y-2.5">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Todos os recursos do AgroGest</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Assistente AgroGest IA integrado</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Relatórios executivos e exportações</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Análises avançadas de rentabilidade</li>
                </ul>
              </div>
              <button
                onClick={() => onOpenAuth('register')}
                className="mt-8 w-full py-3 bg-white border border-gray-300 hover:bg-gray-100 font-bold text-xs rounded-xl transition-all"
              >
                Experimentar PRO
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24 bg-[#F8FAF8] border-t border-gray-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs uppercase font-bold tracking-widest text-[#2D6A4F] bg-[#D8F3DC] px-3 py-1 rounded-full">
              Dúvidas
            </span>
            <h2 className="text-3xl font-extrabold text-[#1B4332] mt-3">Perguntas Frequentes (FAQ)</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-2xs"
                >
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between font-bold text-sm sm:text-base text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-[#2D6A4F] shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Chamada Final para Cadastro */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-4 text-[#74C69D]">
            <Sprout className="w-8 h-8" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Pronto para transformar a gestão do seu campo?
          </h2>
          <p className="mt-3 text-base text-[#D8F3DC] max-w-xl mx-auto">
            Saiba quanto produz, quanto gasta e quanto ganha com o AgroGest. Crie sua conta gratuita em menos de 1 minuto.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-[#1B4332] hover:bg-[#D8F3DC] font-black text-base rounded-2xl shadow-xl transition-all active:scale-[0.98]"
            >
              Criar Conta Gratuita
            </button>
            <button
              onClick={startInstantDemo}
              className="w-full sm:w-auto px-6 py-4 bg-transparent hover:bg-white/10 text-white font-bold text-base rounded-2xl border border-white/30 transition-all"
            >
              Ver Demonstração ao Vivo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#143225] text-white/70 text-xs border-t border-white/10 text-center">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-base">AgroGest</span>
            <span>&bull; MVP de Gestão Rural</span>
          </div>
          <p className="text-white/60">
            &ldquo;Do campo para a gestão: saiba quanto produz, quanto gasta e quanto ganha.&rdquo;
          </p>
          <p>&copy; {new Date().getFullYear()} AgroGest. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

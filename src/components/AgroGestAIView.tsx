import React, { useState } from 'react';
import { useAgro } from '../context/AgroContext';
import { answerAgroQuery } from '../lib/agroGestAI';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldCheck,
  HelpCircle,
  TrendingUp,
  Receipt,
  Wheat,
  Package,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ia';
  text: string;
  time: string;
}

export const AgroGestAIView: React.FC = () => {
  const { productions, costs, inventory, sales, userProfile, property } = useAgro();

  const [inputQuestion, setInputQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ia',
      text: `Olá, ${
        userProfile?.displayName || 'Produtor'
      }! Sou a **AgroGest IA**. Estou conectada exclusivamente aos registros do seu campo (${
        property?.name || 'sua propriedade'
      }) para responder com exatidão sobre vendas, custos, produção e estoque. O que deseja saber hoje?`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const suggestedQuestions = [
    'Quanto vendi este mês?',
    'Quanto gastei este mês?',
    'Qual foi meu maior custo?',
    'Quanto produzi nos últimos 3 meses?',
    'Qual produto teve maior resultado?',
    'Quais itens estão com estoque baixo?',
    'Como estão meus custos?',
  ];

  const handleAsk = (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: queryText.trim(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsTyping(true);

    // Answer with small natural delay
    setTimeout(() => {
      const response = answerAgroQuery(queryText, {
        productions,
        costs,
        inventory,
        sales,
      });

      const iaMsg: ChatMessage = {
        id: `ia_${Date.now()}`,
        sender: 'ia',
        text: response.answer,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, iaMsg]);
      setIsTyping(false);
    }, 400);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#1E3A8A] rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-xs">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight">AgroGest IA</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                Assistente do Produtor
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#D8F3DC] mt-0.5">
              Consultas rápidas e inteligentes baseadas exclusivamente nos dados cadastrados na sua propriedade.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Questions Grid */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-[#2D6A4F]" />
          <span>Perguntas Frequentes (Toque para perguntar):</span>
        </p>
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 sm:flex-wrap">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(q)}
              className="text-xs font-semibold px-3 py-2 bg-gray-50 hover:bg-[#D8F3DC] hover:text-[#1B4332] text-gray-700 rounded-xl border border-gray-200/80 transition-all active:scale-95 whitespace-nowrap sm:whitespace-normal shrink-0 sm:shrink"
            >
              &ldquo;{q}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col h-[58vh] sm:h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-3.5 sm:p-6 overflow-y-auto space-y-3.5 sm:space-y-4 bg-gray-50/50">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 sm:gap-3 max-w-[90%] sm:max-w-[75%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                    isUser
                      ? 'bg-[#1B4332] text-white'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    isUser
                      ? 'bg-[#1B4332] text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-200/80 rounded-tl-none'
                  }`}
                >
                  <div
                    className="whitespace-pre-line text-xs sm:text-sm"
                    dangerouslySetInnerHTML={{
                      __html: m.text
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br />'),
                    }}
                  />
                  <span
                    className={`block text-[10px] mt-1.5 ${
                      isUser ? 'text-white/60 text-right' : 'text-gray-400'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-gray-500 italic py-2">
              <Bot className="w-4 h-4 text-amber-600 animate-spin" />
              <span>AgroGest IA consultando seus dados rurais...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-2.5 sm:p-3 bg-white border-t border-gray-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(inputQuestion);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Pergunte sobre vendas, custos, produção ou estoque..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              className="flex-1 px-3.5 sm:px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F] outline-hidden font-medium"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || isTyping}
              className="px-3.5 sm:px-5 py-2.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 shrink-0 active:scale-95"
            >
              <span className="hidden sm:inline">Perguntar</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Anti-Hallucination & Privacy Assurance */}
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <span>
          <strong>Garantia de Fidelidade:</strong> A IA analisa unicamente as colheitas, vendas e custos registrados na sua conta. Ela nunca inventa dados.
        </span>
      </div>
    </div>
  );
};

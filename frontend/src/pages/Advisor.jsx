import React, { useEffect, useRef, useState } from 'react';
import api from '../api';
import { Send, BrainCircuit, AlertTriangle, ChevronRight, Lightbulb, RefreshCw } from 'lucide-react';

const STARTERS = [
  'Quais são as 3 ações prioritárias para esta semana?',
  'Analise o risco crítico da UTI e sugira intervenções',
  'Como reduzir o turnover de 28% para menos de 15%?',
  'Qual o impacto financeiro do absenteísmo atual?',
  'O que precisamos fazer para atingir 80% de conformidade NR-1?',
  'Explique o que é o COPSOQ-II e como interpretar os resultados',
];

const PRIORIDADE_COLOR = { Alta: 'bg-red-100 text-red-700 border-red-200', Média: 'bg-yellow-100 text-yellow-700 border-yellow-200', Baixa: 'bg-green-100 text-green-700 border-green-200' };

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-teal-900 flex items-center justify-center mr-2 shrink-0 mt-0.5">
          <BrainCircuit className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser ? 'bg-teal-900 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-ink rounded-tl-sm shadow-sm'}`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  );
}

export default function Advisor() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/advisor/history').then(r => {
      if (r.data.length > 0) setMessages(r.data);
      else setMessages([{
        role: 'assistant',
        content: '👋 Olá! Sou o **Pulso Advisor**, sua IA especializada em gestão de riscos psicossociais hospitalares.\n\nTenho acesso aos dados atuais do Hospital Regional São Lucas — turnover, absenteísmo, riscos identificados no PGR, e resultados do COPSOQ-II.\n\nComo posso ajudar você hoje?',
      }]);
    });
    api.get('/advisor/recommendations').then(r => setRecommendations(r.data));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const { data } = await api.post('/advisor/chat', {
        message: msg,
        history: newMessages.slice(-8),
      });
      setMessages(m => [...m, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: '❌ Erro ao conectar com a IA. Verifique se a chave ANTHROPIC_API_KEY está configurada no arquivo backend/.env' }]);
    } finally { setLoading(false); }
  };

  const clear = () => {
    setMessages([{
      role: 'assistant',
      content: 'Conversa reiniciada. Como posso ajudar?',
    }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Pulso Advisor IA</h1>
          <p className="text-gray-500 text-sm">Assistente de gestão baseado nos dados reais do hospital · Powered by Claude</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chat */}
        <div className="lg:col-span-2 card flex flex-col" style={{ height: '600px' }}>
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-900 rounded-xl flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-ink text-sm">Pulso Advisor</p>
              <p className="text-xs text-gray-400">Dados injetados: Hospital Regional São Lucas · NR-1 2024</p>
            </div>
            <button onClick={clear} className="ml-auto p-1.5 hover:bg-gray-100 rounded-lg text-gray-400" title="Reiniciar conversa">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            {loading && (
              <div className="flex justify-start mb-4">
                <div className="w-8 h-8 rounded-full bg-teal-900 flex items-center justify-center mr-2 shrink-0">
                  <BrainCircuit className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 bg-teal-900 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Starters */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-400 mb-2">Sugestões de perguntas:</p>
              <div className="flex gap-2 flex-wrap">
                {STARTERS.slice(0, 3).map(s => (
                  <button key={s} onClick={() => send(s)} className="text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full hover:bg-teal-100 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Pergunte sobre riscos, conformidade, turnover, absenteísmo..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                disabled={loading}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="btn-primary px-4 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Dados do hospital são injetados automaticamente no contexto da IA.</p>
          </div>
        </div>

        {/* Recommendations panel */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-teal-900" />
              <h2 className="font-semibold text-ink text-sm">Recomendações Ativas</h2>
              <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{recommendations.length}</span>
            </div>
            <div className="space-y-3">
              {recommendations.map(r => (
                <div key={r.id} className={`border rounded-xl p-3 ${PRIORIDADE_COLOR[r.prioridade]}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{r.prioridade} prioridade</span>
                    <span className="text-xs opacity-70">{r.prazo}</span>
                  </div>
                  <p className="text-xs font-semibold mb-1">{r.titulo}</p>
                  <p className="text-xs opacity-80 mb-2">{r.descricao}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{r.nr}</span>
                    <button
                      onClick={() => send(`Detalhe a recomendação: "${r.titulo}". O que preciso fazer exatamente?`)}
                      className="text-xs flex items-center gap-1 hover:underline"
                    >
                      Analisar <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Mais sugestões</p>
            <div className="space-y-1.5">
              {STARTERS.slice(3).map(s => (
                <button key={s} onClick={() => send(s)} className="w-full text-left text-xs text-gray-600 hover:text-teal-900 p-2 hover:bg-teal-50 rounded-lg transition-colors flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 shrink-0 mt-0.5 text-teal-500" />
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4 bg-teal-900 text-white">
            <p className="text-xs font-semibold text-teal-300 mb-2">Contexto injetado</p>
            <div className="space-y-1 text-xs text-teal-200">
              <p>📊 Dados do dashboard (turnover, absenteísmo)</p>
              <p>⚠️ Top 10 riscos do PGR</p>
              <p>📋 Status dos planos de ação</p>
              <p>🔬 Resultados COPSOQ-II por setor</p>
              <p>📣 Denúncias abertas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

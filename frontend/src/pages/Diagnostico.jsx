import React, { useEffect, useState } from 'react';
import api from '../api';
import { CheckCircle2, ChevronRight, ChevronLeft, AlertTriangle, BarChart3 } from 'lucide-react';

const SETORES = ['UTI','Pronto-socorro','Internação','Centro Cirúrgico','Administrativo'];
const NIVEL_COLOR = { Baixo: 'text-green-700 bg-green-50', Médio: 'text-yellow-700 bg-yellow-50', Alto: 'text-orange-700 bg-orange-50', Crítico: 'text-red-700 bg-red-50', Insuficiente: 'text-gray-500 bg-gray-50' };
const NIVEL_BAR = { Baixo: 'bg-green-500', Médio: 'bg-yellow-500', Alto: 'bg-orange-500', Crítico: 'bg-red-600' };

export default function Diagnostico() {
  const [view, setView] = useState('intro'); // intro | wizard | result | results
  const [questions, setQuestions] = useState([]);
  const [scale, setScale] = useState([]);
  const [step, setStep] = useState(1);
  const [sector, setSector] = useState('');
  const [turno, setTurno] = useState('');
  const [tempo, setTempo] = useState('');
  const [respostas, setRespostas] = useState({});
  const [result, setResult] = useState(null);
  const [aggResults, setAggResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/diagnostico/questions').then(r => { setQuestions(r.data.questions); setScale(r.data.scale); });
    api.get('/diagnostico/results').then(r => setAggResults(r.data));
  }, []);

  const stepQuestions = questions.filter(q => q.step === step);
  const totalAnswered = stepQuestions.filter(q => respostas[q.id]).length;
  const allAnswered = totalAnswered === stepQuestions.length;
  const totalSteps = 5;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/diagnostico/submit', { sector, turno, tempo_funcao: tempo, respostas });
      setResult(data);
      setView('result');
    } catch (e) {
      alert(e.response?.data?.error || 'Erro ao enviar');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'results') return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Resultados Agregados — COPSOQ-II</h1>
          <p className="text-gray-500 text-sm">NR-1 §1.5.3.2.1 — mínimo 5 respondentes por setor para exibição</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('intro')} className="btn-secondary">Novo Diagnóstico</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aggResults?.results?.map(r => (
          <div key={r.sector} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-ink">{r.sector}</h3>
              {r.suficiente ? (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${NIVEL_COLOR[r.nivel]}`}>{r.nivel}</span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">Insuficiente</span>
              )}
            </div>
            {r.suficiente ? (
              <>
                <p className="text-3xl font-bold text-ink mb-1">{r.avg}<span className="text-sm font-normal text-gray-400">/100</span></p>
                <p className="text-xs text-gray-400 mb-4">{r.count} respondentes</p>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                  <div className={`h-2 rounded-full ${NIVEL_BAR[r.nivel]}`} style={{ width: `${r.avg}%` }} />
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {Object.entries(r.dist || {}).map(([nivel, n]) => (
                    <div key={nivel} className={`text-center py-1 px-0.5 rounded text-xs ${NIVEL_COLOR[nivel]}`}>
                      <p className="font-bold">{n}</p>
                      <p className="text-xs opacity-70">{nivel}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 mt-2">{r.count} respondentes — aguardando {5 - r.count} mais para exibir resultado.</p>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">Total de respondentes: {aggResults?.total} · Dados anonimizados conforme LGPD</p>
    </div>
  );

  if (view === 'result') return (
    <div className="max-w-lg mx-auto">
      <div className="card p-8 text-center">
        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold ${NIVEL_COLOR[result?.nivel_risco]}`}>
          {result?.score}
        </div>
        <CheckCircle2 className="w-8 h-8 text-teal-900 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-ink mb-1">Resposta registrada!</h2>
        <p className="text-gray-500 text-sm mb-4">{result?.message}</p>
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-500 mb-1">Protocolo anônimo</p>
          <p className="font-mono text-sm font-bold text-teal-900">{result?.protocolo}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setView('intro'); setRespostas({}); setStep(1); }} className="btn-secondary flex-1">Novo</button>
          <button onClick={() => setView('results')} className="btn-primary flex-1">Ver Resultados</button>
        </div>
      </div>
    </div>
  );

  if (view === 'intro') return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Diagnóstico Psicossocial</h1>
        <p className="text-gray-500 text-sm">COPSOQ-II — Instrumento validado internacionalmente · NR-1 §1.5.3.2.1</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <BarChart3 className="w-8 h-8 text-teal-900 mb-4" />
          <h2 className="text-lg font-semibold text-ink mb-2">Participar do Diagnóstico</h2>
          <p className="text-sm text-gray-500 mb-4">
            Questionário anônimo de 32 questões em 5 etapas (≈ 8 min). Seus dados <strong>não são coletados</strong> — apenas o setor e as respostas.
          </p>
          <ul className="space-y-1 mb-6">
            {['Organização do trabalho','Relações interpessoais','Bem-estar e saúde','Condições de trabalho'].map(t => (
              <li key={t} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-900" />
                {t}
              </li>
            ))}
          </ul>
          <button onClick={() => setView('wizard')} className="btn-primary w-full">Iniciar Questionário</button>
        </div>
        <div className="card p-6">
          <AlertTriangle className="w-8 h-8 text-teal-900 mb-4" />
          <h2 className="text-lg font-semibold text-ink mb-2">Resultados por Setor</h2>
          <p className="text-sm text-gray-500 mb-4">
            Visualize os resultados agregados por setor (mínimo 5 respondentes). Dados anonimizados.
          </p>
          {aggResults && (
            <div className="space-y-2 mb-6">
              {aggResults.results?.filter(r => r.suficiente).slice(0, 3).map(r => (
                <div key={r.sector} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-28 truncate">{r.sector}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${NIVEL_BAR[r.nivel]}`} style={{ width: `${r.avg}%` }} />
                  </div>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${NIVEL_COLOR[r.nivel]}`}>{r.nivel}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setView('results')} className="btn-secondary w-full">Ver Resultados Completos</button>
        </div>
      </div>
    </div>
  );

  // Wizard
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Diagnóstico Psicossocial</h1>
        <p className="text-gray-500 text-sm">Anônimo · LGPD · COPSOQ-II · NR-1 §1.5.3.2.1</p>
      </div>

      {/* Progress */}
      <div className="card p-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Etapa {step} de {totalSteps}</span>
          <span>{Math.round(((step - 1) / totalSteps) * 100)}% concluído</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-teal-900 h-2 rounded-full transition-all" style={{ width: `${((step - 1) / totalSteps) * 100}%` }} />
        </div>
        <div className="flex gap-1 mt-3">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i + 1 < step ? 'bg-teal-900' : i + 1 === step ? 'bg-teal-500' : 'bg-gray-100'}`} />
          ))}
        </div>
      </div>

      <div className="card p-6">
        {/* Step 1: selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-ink">Etapa 1 — Identificação do Setor</h2>
            <p className="text-sm text-gray-500">Nenhum dado pessoal será coletado. Apenas o setor é necessário para agregação.</p>
            <div>
              <label className="label">Setor onde trabalha *</label>
              <select className="input" value={sector} onChange={e => setSector(e.target.value)}>
                <option value="">Selecione...</option>
                {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Turno</label>
              <select className="input" value={turno} onChange={e => setTurno(e.target.value)}>
                <option value="">Prefiro não informar</option>
                <option>Diurno</option><option>Noturno</option><option>Plantonista</option>
              </select>
            </div>
            <div>
              <label className="label">Tempo na função</label>
              <select className="input" value={tempo} onChange={e => setTempo(e.target.value)}>
                <option value="">Prefiro não informar</option>
                <option>Menos de 1 ano</option><option>1 a 3 anos</option>
                <option>3 a 5 anos</option><option>Mais de 5 anos</option>
              </select>
            </div>
          </div>
        )}

        {/* Steps 2-5: questions */}
        {step >= 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-ink">
                {['','','Organização do Trabalho','Relações Interpessoais','Bem-estar e Saúde','Condições de Trabalho'][step]}
              </h2>
              <p className="text-sm text-gray-500">Etapa {step} de 5 · {totalAnswered}/{stepQuestions.length} respondidas</p>
            </div>

            <p className="text-xs bg-blue-50 text-blue-700 p-2 rounded-lg">
              Escala: 1 = Nunca/Quase nunca · 5 = Sempre/Quase sempre
            </p>

            {stepQuestions.map((q, qi) => (
              <div key={q.id} className={`p-4 rounded-xl border-2 transition-colors ${respostas[q.id] ? 'border-teal-200 bg-teal-50/50' : 'border-gray-100 bg-white'}`}>
                <p className="text-sm font-medium text-ink mb-1">{qi + 1}. {q.text}</p>
                <p className="text-xs text-gray-400 mb-3">{q.domain}</p>
                <div className="flex gap-2 flex-wrap">
                  {scale.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setRespostas(r => ({ ...r, [q.id]: s.value }))}
                      className={`flex-1 min-w-[40px] py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                        respostas[q.id] === s.value
                          ? 'border-teal-900 bg-teal-900 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-teal-300'
                      }`}
                    >
                      {s.value}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">{respostas[q.id] ? scale.find(s => s.value === respostas[q.id])?.label : 'Selecione uma opção'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <button
          onClick={() => { if (step > 1) setStep(s => s - 1); else setView('intro'); }}
          className="btn-secondary flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> {step === 1 ? 'Cancelar' : 'Anterior'}
        </button>
        {step < totalSteps ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 1 ? !sector : !allAnswered}
            className="btn-primary flex items-center gap-2"
          >
            Próxima <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={!allAnswered || loading} className="btn-primary flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {loading ? 'Enviando...' : 'Enviar Anonimamente'}
          </button>
        )}
      </div>
    </div>
  );
}

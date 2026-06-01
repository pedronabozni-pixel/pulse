import React, { useEffect, useState } from 'react';
import api from '../api';
import { ShieldCheck, Send, Search, AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';

const TIPOS = ['Assédio Moral','Assédio Sexual','Sobrecarga','Violência','Conflito','Discriminação','Outro'];
const SETORES = ['UTI','Pronto-socorro','Internação','Centro Cirúrgico','Administrativo'];
const FREQUENCIAS = ['Evento único','Eventual','Frequente','Semanal','Recorrente','Contínua'];
const STATUS_STEPS = ['Recebido','Em apuração','Medida adotada','Encerrado'];
const STATUS_COLOR = { 'Recebido': 'bg-blue-100 text-blue-700', 'Em apuração': 'bg-yellow-100 text-yellow-700', 'Medida adotada': 'bg-orange-100 text-orange-700', 'Encerrado': 'bg-green-100 text-green-700' };

export default function Denuncia({ anonymous }) {
  const [mode, setMode] = useState('list'); // list | form | consult | detail
  const [denuncias, setDenuncias] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ tipo: '', setor: '', descricao: '', frequencia: '' });
  const [result, setResult] = useState(null);
  const [consultCode, setConsultCode] = useState('');
  const [consultResult, setConsultResult] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [newObs, setNewObs] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!anonymous) api.get('/denuncia/list').then(r => setDenuncias(r.data));
    else setMode('form');
  }, [anonymous]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/denuncia/submit', form);
      setResult(data);
      setMode('done');
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao enviar');
    } finally { setLoading(false); }
  };

  const consultar = async () => {
    if (!consultCode.trim()) return;
    try {
      const { data } = await api.get(`/denuncia/consultar/${consultCode.trim()}`);
      setConsultResult(data);
    } catch { alert('Protocolo não encontrado'); }
  };

  const updateStatus = async (id) => {
    if (!newStatus) return;
    await api.put(`/denuncia/${id}/status`, { status: newStatus, observacao: newObs });
    const { data } = await api.get('/denuncia/list');
    setDenuncias(data);
    const updated = data.find(d => d.id === id);
    setSelected(updated);
    setNewStatus(''); setNewObs('');
  };

  if (mode === 'done') return (
    <div className={`${anonymous ? 'min-h-screen bg-paper flex items-center justify-center p-4' : ''}`}>
      <div className="max-w-md mx-auto card p-8 text-center">
        <ShieldCheck className="w-16 h-16 text-teal-900 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-ink mb-2">Denúncia registrada</h2>
        <p className="text-gray-500 text-sm mb-4">{result?.message}</p>
        <div className="bg-teal-50 rounded-xl p-4 mb-2">
          <p className="text-xs text-teal-600 mb-1">Número de protocolo</p>
          <p className="font-mono text-lg font-bold text-teal-900">{result?.protocolo}</p>
        </div>
        <p className="text-xs text-gray-400 mb-6">{result?.next}</p>
        <div className="space-y-2">
          <button onClick={() => { setMode('form'); setForm({ tipo:'',setor:'',descricao:'',frequencia:'' }); setResult(null); }} className="btn-secondary w-full">Nova denúncia</button>
          <a href="/login" className="btn-primary w-full block text-center">Voltar ao início</a>
        </div>
      </div>
    </div>
  );

  if (anonymous) return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 to-teal-700 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <ShieldCheck className="w-12 h-12 text-white mx-auto mb-2" />
          <h1 className="text-white text-2xl font-bold">Canal Anônimo de Denúncias</h1>
          <p className="text-teal-300 text-sm">Sem coleta de IP, sem identificação · NR-1 §1.4.1.1 · Lei 14.457/2022</p>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode('form')} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'form' ? 'bg-white text-teal-900' : 'bg-teal-800 text-teal-200'}`}>Registrar Denúncia</button>
          <button onClick={() => setMode('consult')} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'consult' ? 'bg-white text-teal-900' : 'bg-teal-800 text-teal-200'}`}>Consultar Protocolo</button>
        </div>

        <div className="card p-6">
          {mode === 'form' && (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Tipo de ocorrência *</label>
                <select className="input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} required>
                  <option value="">Selecione...</option>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Setor envolvido *</label>
                <select className="input" value={form.setor} onChange={e => setForm(f => ({ ...f, setor: e.target.value }))} required>
                  <option value="">Selecione...</option>
                  {SETORES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Descreva a situação * <span className="text-gray-400 font-normal">(não inclua seu nome)</span></label>
                <textarea className="input" rows={5} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descreva a situação sem identificar você mesmo(a)..." required />
              </div>
              <div>
                <label className="label">Frequência</label>
                <select className="input" value={form.frequencia} onChange={e => setForm(f => ({ ...f, frequencia: e.target.value }))}>
                  <option value="">Não sei informar</option>
                  {FREQUENCIAS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-700 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  Esta denúncia será registrada sem qualquer dado que permita sua identificação. Somente o setor e o conteúdo informados serão armazenados.
                </p>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? 'Registrando...' : 'Enviar Denúncia Anonimamente'}
              </button>
            </form>
          )}
          {mode === 'consult' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Acompanhe o status da sua denúncia com o número de protocolo fornecido no registro.</p>
              <div className="flex gap-2">
                <input className="input" placeholder="Ex: PULSO-2024-001" value={consultCode} onChange={e => setConsultCode(e.target.value)} />
                <button onClick={consultar} className="btn-primary px-4"><Search className="w-4 h-4" /></button>
              </div>
              {consultResult && (
                <div className="mt-4 space-y-3">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-mono text-sm font-bold text-teal-900">{consultResult.protocolo}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[consultResult.status]}`}>{consultResult.status}</span>
                    </div>
                    <p className="text-xs text-gray-500">{consultResult.tipo} · {consultResult.setor}</p>
                  </div>
                  <div className="flex justify-between">
                    {STATUS_STEPS.map((s, i) => {
                      const current = STATUS_STEPS.indexOf(consultResult.status);
                      return (
                        <div key={s} className="flex flex-col items-center flex-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i <= current ? 'bg-teal-900 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            {i <= current ? <CheckCircle className="w-3 h-3" /> : i + 1}
                          </div>
                          <p className={`text-xs mt-1 text-center ${i <= current ? 'text-teal-900 font-medium' : 'text-gray-400'}`}>{s}</p>
                        </div>
                      );
                    })}
                  </div>
                  {consultResult.updates?.length > 0 && (
                    <div className="space-y-2">
                      {consultResult.updates.map((u, i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <span className="text-gray-400 shrink-0">{new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
                          <span className={`font-medium px-1.5 py-0.5 rounded ${STATUS_COLOR[u.status]}`}>{u.status}</span>
                          {u.observacao && <span className="text-gray-600">{u.observacao}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Admin view
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Canal de Denúncias</h1>
          <p className="text-gray-500 text-sm">Gestão de casos · NR-1 §1.4.1.1 · Lei 14.457/2022</p>
        </div>
        <div className="flex gap-2">
          <a href="/denuncia" target="_blank" className="btn-secondary text-sm">Abrir formulário anônimo</a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATUS_STEPS.map(s => (
          <div key={s} className="card p-4">
            <p className="text-2xl font-bold text-ink">{denuncias.filter(d => d.status === s).length}</p>
            <p className="text-sm text-gray-600">{s}</p>
            <div className={`mt-2 h-1 w-full rounded-full ${s === 'Recebido' ? 'bg-blue-400' : s === 'Em apuração' ? 'bg-yellow-400' : s === 'Medida adotada' ? 'bg-orange-400' : 'bg-green-400'}`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <div className="lg:col-span-1 space-y-2">
          {denuncias.map(d => (
            <div
              key={d.id}
              onClick={() => setSelected(d)}
              className={`card p-4 cursor-pointer hover:shadow-card-hover transition-all ${selected?.id === d.id ? 'ring-2 ring-teal-900' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-teal-700 font-bold">{d.protocolo}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[d.status]}`}>{d.status}</span>
              </div>
              <p className="text-sm font-medium text-ink">{d.tipo}</p>
              <p className="text-xs text-gray-400">{d.setor} · {new Date(d.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="card p-12 flex flex-col items-center justify-center text-center text-gray-400">
              <AlertTriangle className="w-12 h-12 mb-3 opacity-30" />
              <p>Selecione uma denúncia para ver detalhes</p>
            </div>
          ) : (
            <div className="card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-mono text-sm font-bold text-teal-900">{selected.protocolo}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[selected.status]}`}>{selected.status}</span>
                  </div>
                  <p className="text-lg font-semibold text-ink">{selected.tipo}</p>
                  <p className="text-xs text-gray-400">{selected.setor} · {selected.frequencia || 'Frequência não informada'} · {new Date(selected.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1 font-medium">Relato</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.descricao}</p>
              </div>

              {/* Status tracker */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Histórico de atualizações</p>
                <div className="space-y-2">
                  {selected.updates?.map((u, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <span className="text-gray-400 shrink-0 w-20">{new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
                      <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${STATUS_COLOR[u.status]}`}>{u.status}</span>
                      {u.observacao && <span className="text-gray-600">{u.observacao}</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Update status */}
              {selected.status !== 'Encerrado' && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <p className="text-sm font-semibold text-ink">Atualizar Status</p>
                  <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    <option value="">Selecione novo status...</option>
                    {STATUS_STEPS.filter(s => STATUS_STEPS.indexOf(s) > STATUS_STEPS.indexOf(selected.status)).map(s => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <textarea className="input" rows={2} placeholder="Observação (opcional)..." value={newObs} onChange={e => setNewObs(e.target.value)} />
                  <button onClick={() => updateStatus(selected.id)} disabled={!newStatus} className="btn-primary w-full">
                    Atualizar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

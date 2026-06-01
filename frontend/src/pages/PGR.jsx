import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { Plus, Edit2, Trash2, FileText, History, ChevronDown, X, AlertTriangle, CheckCircle } from 'lucide-react';

const AREAS = ['UTI','Pronto-socorro','Internação','Centro Cirúrgico','Administrativo'];
const PROB_LABELS = { 1: 'Improvável', 2: 'Possível', 3: 'Provável', 4: 'Quase Certo' };
const SEV_LABELS = { 1: 'Insignificante', 2: 'Marginal', 3: 'Moderado', 4: 'Catastrófico' };
const STATUS_OPTS = ['Não iniciado','Em andamento','Atrasado','Concluído'];

const nivelColor = (n) => ({ Crítico: 'badge-critico', Alto: 'badge-alto', Médio: 'badge-medio', Baixo: 'badge-baixo' }[n] || '');
const cellBg = (v) => v >= 13 ? 'bg-red-600 text-white' : v >= 9 ? 'bg-orange-500 text-white' : v >= 5 ? 'bg-yellow-400 text-yellow-900' : 'bg-green-400 text-green-900';
const actionStatusColor = (s) => ({ 'Não iniciado': 'bg-gray-100 text-gray-600', 'Em andamento': 'bg-blue-100 text-blue-700', 'Atrasado': 'bg-red-100 text-red-700', 'Concluído': 'bg-green-100 text-green-700' }[s] || '');

const emptyRisk = { perigo: '', grupo_exposto: '', area: 'UTI', probabilidade: 2, severidade: 2, medidas_implementadas: '', nr_referencia: 'NR-1 §1.5.3.2.1', fonte: 'PGR' };
const emptyAction = { risk_id: '', what: '', why: '', who: '', when_date: '', where_loc: '', how: '', how_much: '', responsible: '' };

export default function PGR() {
  const [risks, setRisks] = useState([]);
  const [actions, setActions] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('matrix');
  const [riskModal, setRiskModal] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [editRisk, setEditRisk] = useState(emptyRisk);
  const [editAction, setEditAction] = useState(emptyAction);
  const [saving, setSaving] = useState(false);
  const [filterArea, setFilterArea] = useState('');

  const load = useCallback(() => {
    api.get('/pgr/risks').then(r => setRisks(r.data));
    api.get('/pgr/actions').then(r => setActions(r.data));
    api.get('/pgr/history').then(r => setHistory(r.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveRisk = async () => {
    setSaving(true);
    try {
      if (riskModal === 'new') await api.post('/pgr/risks', editRisk);
      else await api.put(`/pgr/risks/${riskModal}`, editRisk);
      load(); setRiskModal(null);
    } catch (e) { alert(e.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const deleteRisk = async (id) => {
    if (!confirm('Inativar este risco?')) return;
    await api.delete(`/pgr/risks/${id}`); load();
  };

  const saveAction = async () => {
    setSaving(true);
    try {
      if (actionModal === 'new') await api.post('/pgr/actions', editAction);
      else await api.put(`/pgr/actions/${actionModal}`, editAction);
      load(); setActionModal(null);
    } catch (e) { alert(e.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const generatePDF = async () => {
    const { data } = await api.get('/pgr/export');
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const teal = [0, 77, 64];

    // Cover
    doc.setFillColor(...teal);
    doc.rect(0, 0, 210, 60, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24); doc.setFont('helvetica', 'bold');
    doc.text('PROGRAMA DE GERENCIAMENTO DE RISCOS', 105, 25, { align: 'center' });
    doc.setFontSize(12); doc.setFont('helvetica', 'normal');
    doc.text('Gestão de Riscos Psicossociais — NR-1 (Portaria MTE 1.419/2024)', 105, 35, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`${data.hospital.nome} · CNPJ: ${data.hospital.cnpj}`, 105, 45, { align: 'center' });
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} · Responsável: ${data.responsible}`, 105, 53, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text('Base legal: NR-1 §1.5.7.3.2 · §1.5.4.4.2 · §1.5.3.2.1 · Retenção: 20 anos (§1.5.7.3.3.1)', 14, 70);

    // Risk inventory
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('1. INVENTÁRIO DE RISCOS PSICOSSOCIAIS', 14, 82);
    doc.setFont('helvetica', 'normal');

    autoTable(doc, {
      startY: 88,
      head: [['Perigo Identificado','Grupo Exposto','Área','Prob.','Sev.','Nível','Medidas']],
      body: data.risks.map(r => [r.perigo, r.grupo_exposto, r.area, PROB_LABELS[r.probabilidade] || r.probabilidade, SEV_LABELS[r.severidade] || r.severidade, r.nivel_risco_calculado, r.medidas_implementadas || '—']),
      headStyles: { fillColor: teal, fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      columnStyles: { 0: { cellWidth: 45 }, 6: { cellWidth: 35 } },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const colors = { Crítico: [191,54,12], Alto: [230,81,0], Médio: [249,168,37], Baixo: [46,125,50] };
          const c = colors[data.cell.raw] || [150,150,150];
          doc.setFillColor(...c);
          doc.setTextColor(255,255,255);
        }
      },
    });

    // Action plans
    const y2 = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('2. PLANO DE AÇÃO 5W2H', 14, y2);

    autoTable(doc, {
      startY: y2 + 6,
      head: [['O Quê (What)','Por Quê (Why)','Quem (Who)','Quando (When)','Onde (Where)','Como (How)','Custo (How Much)','Status']],
      body: data.actions.map(a => [a.what, a.why, a.who, a.when_date, a.where_loc, a.how, a.how_much || '—', a.status]),
      headStyles: { fillColor: teal, fontSize: 6.5 },
      bodyStyles: { fontSize: 6.5 },
    });

    doc.save(`PGR_${data.hospital.nome.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredRisks = risks.filter(r => !filterArea || r.area === filterArea);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">PGR / GRO</h1>
          <p className="text-gray-500 text-sm">Programa de Gerenciamento de Riscos · NR-1 §1.5</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setEditRisk(emptyRisk); setRiskModal('new'); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Risco
          </button>
          <button onClick={() => { setEditAction(emptyAction); setActionModal('new'); }} className="btn-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova Ação 5W2H
          </button>
          <button onClick={generatePDF} className="btn-secondary flex items-center gap-2">
            <FileText className="w-4 h-4" /> Gerar PGR PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[['matrix','Matriz de Risco'],['inventory','Inventário'],['actions','Plano de Ação'],['history','Histórico Auditável']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === k ? 'bg-white text-teal-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Matrix */}
      {tab === 'matrix' && (
        <div className="card p-6">
          <h2 className="font-semibold text-ink mb-1">Matriz Probabilidade × Severidade</h2>
          <p className="text-xs text-gray-400 mb-6">NR-1 §1.5.4.4.2 — Classificação de riscos por nível de risco calculado (P × S)</p>
          <div className="overflow-auto">
            <div className="min-w-[480px]">
              <div className="flex">
                <div className="w-32" />
                <div className="flex-1 grid grid-cols-4 gap-1 mb-1">
                  {[1,2,3,4].map(s => (
                    <div key={s} className="text-center text-xs text-gray-500 font-medium">{SEV_LABELS[s]}</div>
                  ))}
                </div>
              </div>
              {[4,3,2,1].map(p => (
                <div key={p} className="flex gap-1 mb-1">
                  <div className="w-32 flex items-center justify-end pr-3 text-xs text-gray-500 font-medium text-right">{PROB_LABELS[p]}</div>
                  {[1,2,3,4].map(s => {
                    const v = p * s;
                    const risksHere = risks.filter(r => r.probabilidade === p && r.severidade === s);
                    return (
                      <div key={s} className={`flex-1 risk-cell ${cellBg(v)} relative`} title={`P${p} × S${s} = ${v}`}>
                        <span className="absolute top-1 left-1 text-xs opacity-70">{v}</span>
                        {risksHere.length > 0 && (
                          <span className="text-lg font-bold">{risksHere.length}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 mt-4 flex-wrap">
            {[['bg-red-600 text-white','Crítico (13-16)'],['bg-orange-500 text-white','Alto (9-12)'],['bg-yellow-400 text-yellow-900','Médio (5-8)'],['bg-green-400 text-green-900','Baixo (1-4)']].map(([cls, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded ${cls.split(' ')[0]}`} />
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory */}
      {tab === 'inventory' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex gap-3 flex-wrap">
            <select className="input w-auto" value={filterArea} onChange={e => setFilterArea(e.target.value)}>
              <option value="">Todas as áreas</option>
              {AREAS.map(a => <option key={a}>{a}</option>)}
            </select>
            <p className="text-xs text-gray-400 self-center ml-auto">NR-1 §1.5.7.3.2 — campos obrigatórios do inventário</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Perigo</th>
                  <th className="px-4 py-3 text-left">Grupo Exposto</th>
                  <th className="px-4 py-3 text-left">Área</th>
                  <th className="px-4 py-3 text-center">P</th>
                  <th className="px-4 py-3 text-center">S</th>
                  <th className="px-4 py-3 text-center">Nível</th>
                  <th className="px-4 py-3 text-left">Referência NR</th>
                  <th className="px-4 py-3 text-left">Fonte</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRisks.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-ink text-xs">{r.perigo}</p>
                      {r.medidas_implementadas && <p className="text-xs text-gray-400 mt-0.5 truncate">✓ {r.medidas_implementadas}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{r.grupo_exposto}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{r.area}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold">{r.probabilidade}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold">{r.severidade}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={nivelColor(r.nivel_risco_calculado)}>{r.nivel_risco_calculado}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-teal-700">{r.nr_referencia}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.fonte}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditRisk(r); setRiskModal(r.id); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-teal-900">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteRisk(r.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      {tab === 'actions' && (
        <div className="space-y-3">
          {actions.map(a => (
            <div key={a.id} className="card p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionStatusColor(a.status)}`}>{a.status}</span>
                    {a.area && <span className="text-xs text-gray-400">{a.area}</span>}
                  </div>
                  <p className="font-semibold text-ink text-sm">{a.what}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.why}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { setEditAction(a); setActionModal(a.id); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-teal-900">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-50">
                <div><p className="text-xs text-gray-400">Responsável</p><p className="text-xs font-medium">{a.responsible || a.who}</p></div>
                <div><p className="text-xs text-gray-400">Prazo</p><p className="text-xs font-medium">{a.when_date}</p></div>
                <div><p className="text-xs text-gray-400">Local</p><p className="text-xs font-medium">{a.where_loc}</p></div>
                <div><p className="text-xs text-gray-400">Custo Est.</p><p className="text-xs font-medium">{a.how_much || '—'}</p></div>
              </div>
            </div>
          ))}
          {actions.length === 0 && <p className="text-center text-gray-400 py-12">Nenhuma ação cadastrada</p>}
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-teal-900" />
            <h2 className="font-semibold text-ink">Histórico Auditável</h2>
            <span className="text-xs text-gray-400 ml-auto">Retenção: 20 anos — NR-1 §1.5.7.3.3.1</span>
          </div>
          <div className="space-y-3">
            {history.map(h => (
              <div key={h.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-teal-900 shrink-0 mt-1.5" />
                <div>
                  <p className="text-sm font-semibold text-ink">{h.version}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{h.action_summary}</p>
                  <p className="text-xs text-gray-400 mt-1">{h.author || 'Sistema'} · {new Date(h.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Modal */}
      {riskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-ink">{riskModal === 'new' ? 'Novo Risco' : 'Editar Risco'}</h3>
              <button onClick={() => setRiskModal(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Perigo identificado * <span className="text-gray-400 font-normal">(NR-1 §1.5.7.3.2)</span></label>
                <input className="input" value={editRisk.perigo} onChange={e => setEditRisk(r => ({ ...r, perigo: e.target.value }))} placeholder="Ex: Sobrecarga de trabalho crônica" />
              </div>
              <div>
                <label className="label">Grupo exposto *</label>
                <input className="input" value={editRisk.grupo_exposto} onChange={e => setEditRisk(r => ({ ...r, grupo_exposto: e.target.value }))} placeholder="Ex: Equipe de enfermagem" />
              </div>
              <div>
                <label className="label">Área / Setor *</label>
                <select className="input" value={editRisk.area} onChange={e => setEditRisk(r => ({ ...r, area: e.target.value }))}>
                  {AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Probabilidade * (1-4)</label>
                  <select className="input" value={editRisk.probabilidade} onChange={e => setEditRisk(r => ({ ...r, probabilidade: +e.target.value }))}>
                    {[1,2,3,4].map(v => <option key={v} value={v}>{v} — {PROB_LABELS[v]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Severidade * (1-4)</label>
                  <select className="input" value={editRisk.severidade} onChange={e => setEditRisk(r => ({ ...r, severidade: +e.target.value }))}>
                    {[1,2,3,4].map(v => <option key={v} value={v}>{v} — {SEV_LABELS[v]}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Nível calculado: P{editRisk.probabilidade} × S{editRisk.severidade} = {editRisk.probabilidade * editRisk.severidade}</p>
                <p className={`text-sm font-bold mt-1 ${nivelColor({ 1: 'Baixo', 2: 'Baixo', 3: 'Baixo', 4: 'Baixo', 5: 'Médio', 6: 'Médio', 7: 'Médio', 8: 'Médio', 9: 'Alto', 10: 'Alto', 11: 'Alto', 12: 'Alto', 13: 'Crítico', 14: 'Crítico', 15: 'Crítico', 16: 'Crítico' }[editRisk.probabilidade * editRisk.severidade])}`}>
                  {editRisk.probabilidade * editRisk.severidade <= 4 ? 'Baixo' : editRisk.probabilidade * editRisk.severidade <= 8 ? 'Médio' : editRisk.probabilidade * editRisk.severidade <= 12 ? 'Alto' : 'Crítico'}
                </p>
              </div>
              <div>
                <label className="label">Medidas implementadas</label>
                <textarea className="input" rows={2} value={editRisk.medidas_implementadas} onChange={e => setEditRisk(r => ({ ...r, medidas_implementadas: e.target.value }))} placeholder="Descreva medidas já existentes..." />
              </div>
              <div>
                <label className="label">Referência NR</label>
                <input className="input" value={editRisk.nr_referencia} onChange={e => setEditRisk(r => ({ ...r, nr_referencia: e.target.value }))} placeholder="Ex: NR-1 §1.5.3.2.1" />
              </div>
              <div>
                <label className="label">Fonte</label>
                <select className="input" value={editRisk.fonte} onChange={e => setEditRisk(r => ({ ...r, fonte: e.target.value }))}>
                  <option>PGR</option><option>Denúncia</option><option>Diagnóstico COPSOQ-II</option><option>Auditoria</option>
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setRiskModal(null)} className="btn-secondary">Cancelar</button>
              <button onClick={saveRisk} disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar Risco'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-ink">{actionModal === 'new' ? 'Nova Ação 5W2H' : 'Editar Ação'}</h3>
              <button onClick={() => setActionModal(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="label">Risco associado</label>
                <select className="input" value={editAction.risk_id} onChange={e => setEditAction(a => ({ ...a, risk_id: e.target.value }))}>
                  <option value="">Sem vínculo específico</option>
                  {risks.map(r => <option key={r.id} value={r.id}>{r.area} — {r.perigo.slice(0, 50)}...</option>)}
                </select>
              </div>
              {[
                { field: 'what', label: 'O Quê? (What) *', ph: 'Ação a ser executada' },
                { field: 'why', label: 'Por Quê? (Why) *', ph: 'Justificativa e base legal' },
                { field: 'who', label: 'Quem? (Who) *', ph: 'Responsável pela execução' },
                { field: 'when_date', label: 'Quando? (When) *', type: 'date' },
                { field: 'where_loc', label: 'Onde? (Where) *', ph: 'Local de execução' },
                { field: 'how', label: 'Como? (How) *', ph: 'Metodologia de execução', rows: 2 },
                { field: 'how_much', label: 'Quanto Custa? (How Much)', ph: 'Ex: R$ 15.000' },
                { field: 'responsible', label: 'Responsável Final', ph: 'Nome / Cargo' },
              ].map(({ field, label, ph, type, rows }) => (
                <div key={field}>
                  <label className="label">{label}</label>
                  {rows ? (
                    <textarea className="input" rows={rows} placeholder={ph} value={editAction[field] || ''} onChange={e => setEditAction(a => ({ ...a, [field]: e.target.value }))} />
                  ) : (
                    <input className="input" type={type || 'text'} placeholder={ph} value={editAction[field] || ''} onChange={e => setEditAction(a => ({ ...a, [field]: e.target.value }))} />
                  )}
                </div>
              ))}
              {actionModal !== 'new' && (
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={editAction.status || 'Não iniciado'} onChange={e => setEditAction(a => ({ ...a, status: e.target.value }))}>
                    {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setActionModal(null)} className="btn-secondary">Cancelar</button>
              <button onClick={saveAction} disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar Ação'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

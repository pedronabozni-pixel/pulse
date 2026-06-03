import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import { FileText, Shield, BarChart3, History, Download, CheckCircle } from 'lucide-react';
import { AccessDeniedBanner } from '../components/ProtectedRoute';

const NIVEL_COLOR = { Crítico: 'badge-critico', Alto: 'badge-alto', Médio: 'badge-medio', Baixo: 'badge-baixo', Insuficiente: 'bg-gray-100 text-gray-500' };
const NIVEL_BAR  = { Crítico: 'bg-red-600', Alto: 'bg-orange-500', Médio: 'bg-yellow-400', Baixo: 'bg-green-500' };

export default function Evidencias() {
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [diagResults, setDiagResults] = useState(null);
  const [risks, setRisks] = useState([]);
  const [tab, setTab] = useState('historico');

  useEffect(() => {
    api.get('/pgr/history').then(r => setHistory(r.data)).catch(() => {});
    api.get('/diagnostico/results').then(r => setDiagResults(r.data)).catch(() => {});
    api.get('/pgr/risks').then(r => setRisks(r.data)).catch(() => {});
  }, []);

  const exportEvidencias = async () => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const teal = [0, 77, 64];

    doc.setFillColor(...teal);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('EVIDÊNCIAS E HISTÓRICO AUDITÁVEL', 105, 18, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Hospital Regional São Lucas — NR-1 §1.5.7.3.3.1 — Retenção 20 anos', 105, 28, { align: 'center' });
    doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 36, { align: 'center' });

    doc.setTextColor(0);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('1. Histórico de Versões do PGR', 14, 55);
    autoTable(doc, {
      startY: 60,
      head: [['Versão', 'Descrição da Ação', 'Data', 'Autor']],
      body: history.map(h => [h.version, h.action_summary, new Date(h.created_at).toLocaleDateString('pt-BR'), h.author || 'Sistema']),
      headStyles: { fillColor: teal, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
    });

    const y2 = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('2. Inventário de Riscos Psicossociais (PGR)', 14, y2);
    autoTable(doc, {
      startY: y2 + 5,
      head: [['Perigo', 'Área', 'P', 'S', 'Nível', 'Referência NR']],
      body: risks.map(r => [r.perigo, r.area, r.probabilidade, r.severidade, r.nivel_risco_calculado, r.nr_referencia]),
      headStyles: { fillColor: teal, fontSize: 7 },
      bodyStyles: { fontSize: 7 },
    });

    doc.save(`Evidencias_PULSO_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <AccessDeniedBanner from={location.state?.from} />

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Evidências e Histórico Auditável</h1>
          <p className="text-gray-500 text-sm">NR-1 §1.5.7.3.3.1 — Retenção obrigatória de 20 anos</p>
        </div>
        <button onClick={exportEvidencias} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" /> Exportar PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[['historico','Histórico PGR'],['diagnostico','COPSOQ-II'],['riscos','Inventário de Riscos']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === k ? 'bg-white text-teal-900 shadow-sm' : 'text-gray-500'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Histórico PGR */}
      {tab === 'historico' && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-teal-900" />
            <h2 className="font-semibold text-ink">Histórico de Versões do PGR</h2>
            <span className="ml-auto text-xs text-gray-400">Somente leitura</span>
          </div>
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={h.id} className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-teal-900 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {history.length - i}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{h.version}</p>
                    {i === 0 && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">Atual</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{h.action_summary}</p>
                  <p className="text-xs text-gray-400 mt-1">{h.author || 'Sistema'} · {new Date(h.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COPSOQ-II */}
      {tab === 'diagnostico' && (
        <div className="space-y-4">
          <div className="card p-4 bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-700 flex items-center gap-2">
              <Shield className="w-4 h-4 shrink-0" />
              Dados anonimizados conforme LGPD. Exibição apenas com ≥ 5 respondentes por setor. Instrumento: COPSOQ-II (NR-1 §1.5.3.2.1)
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {diagResults?.results?.map(r => (
              <div key={r.sector} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-ink text-sm">{r.sector}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${NIVEL_COLOR[r.suficiente ? r.nivel : 'Insuficiente']}`}>
                    {r.suficiente ? r.nivel : 'Insuficiente'}
                  </span>
                </div>
                {r.suficiente ? (
                  <>
                    <p className="text-3xl font-bold text-ink">{r.avg}<span className="text-sm text-gray-400 font-normal">/100</span></p>
                    <p className="text-xs text-gray-400 mb-3">{r.count} respondentes</p>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                      <div className={`h-2 rounded-full ${NIVEL_BAR[r.nivel]}`} style={{ width: `${r.avg}%` }} />
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {Object.entries(r.dist || {}).map(([n, v]) => (
                        <div key={n} className={`text-center py-1 rounded text-xs ${NIVEL_COLOR[n]}`}>
                          <p className="font-bold">{v}</p><p className="opacity-70">{n}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 mt-2">{r.count} respondentes — aguardando {5 - r.count} mais.</p>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">Total de respondentes: {diagResults?.total}</p>
        </div>
      )}

      {/* Inventário de Riscos (somente leitura) */}
      {tab === 'riscos' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-ink">Inventário de Riscos — PGR</h2>
              <p className="text-xs text-gray-400">NR-1 §1.5.7.3.2 · Modo leitura</p>
            </div>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{risks.length} perigos</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Perigo</th>
                  <th className="px-4 py-3 text-left">Área</th>
                  <th className="px-4 py-3 text-center">P×S</th>
                  <th className="px-4 py-3 text-center">Nível</th>
                  <th className="px-4 py-3 text-left">Referência</th>
                  <th className="px-4 py-3 text-left">Fonte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {risks.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink text-xs">{r.perigo}</p>
                      <p className="text-xs text-gray-400">{r.grupo_exposto}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{r.area}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold">{r.probabilidade * r.severidade}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${NIVEL_COLOR[r.nivel_risco_calculado]}`}>{r.nivel_risco_calculado}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-teal-700">{r.nr_referencia}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.fonte}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

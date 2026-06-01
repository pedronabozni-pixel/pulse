import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ShieldAlert, Users, TrendingDown, DollarSign, AlertTriangle, CheckCircle2, Clock, ChevronRight, Activity } from 'lucide-react';
import api from '../api';
import { Link } from 'react-router-dom';

const fmtBRL = (v) => `R$ ${v?.toLocaleString('pt-BR')}`;
const NIVEL_COLOR = { Crítico: '#BF360C', Alto: '#E65100', Médio: '#F9A825', Baixo: '#2E7D32' };
const STATUS_COLOR = { 'Não iniciado': 'bg-gray-100 text-gray-600', 'Em andamento': 'bg-blue-100 text-blue-700', 'Atrasado': 'bg-red-100 text-red-700', 'Concluído': 'bg-green-100 text-green-700' };

function ComplianceGauge({ value }) {
  const color = value < 40 ? '#BF360C' : value < 70 ? '#E65100' : '#2E7D32';
  const r = 60; const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ * 0.75;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-28 overflow-hidden">
        <svg width="160" height="120" viewBox="0 0 160 120">
          <circle cx="80" cy="80" r={r} fill="none" stroke="#E5E7EB" strokeWidth="12" strokeDasharray={`${circ * 0.75} ${circ}`} strokeDashoffset={-circ * 0.125} strokeLinecap="round" />
          <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="12" strokeDasharray={`${dash} ${circ}`} strokeDashoffset={-circ * 0.125} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-3xl font-bold" style={{ color }}>{value}%</span>
          <span className="text-xs text-gray-500">conformidade</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1 text-center">Índice NR-1 §1.5.7.3.2</p>
    </div>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [risksBySector, setRisksBySector] = useState([]);
  const [alerts, setAlerts] = useState({ lateActions: [], newComplaints: [] });
  const [pgrTimeline, setPgrTimeline] = useState([]);

  useEffect(() => {
    api.get('/dashboard/metrics').then(r => setMetrics(r.data));
    api.get('/dashboard/risks-by-sector').then(r => setRisksBySector(r.data));
    api.get('/dashboard/alerts').then(r => setAlerts(r.data));
    api.get('/dashboard/pgr-timeline').then(r => setPgrTimeline(r.data));
  }, []);

  if (!metrics) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-teal-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { hospital } = metrics;
  const exposicaoFinanceira = hospital.funcionarios * 6708 + (hospital.funcionarios * hospital.turnover / 100) * 3 * hospital.salarioMedio;

  const kpis = [
    { label: 'Turnover', value: `${hospital.turnover}%`, sub: 'Ref. saudável: ≤15%', icon: TrendingDown, color: 'text-coral-900', bg: 'bg-red-50', alert: hospital.turnover > 20 },
    { label: 'Absenteísmo', value: `${hospital.absenteismo}%`, sub: 'Ref. saudável: ≤3,5%', icon: Users, color: 'text-orange-900', bg: 'bg-orange-50', alert: hospital.absenteismo > 5 },
    { label: 'Exposição Financeira', value: fmtBRL(Math.round(exposicaoFinanceira)), sub: 'Turnover + Multas NR-1', icon: DollarSign, color: 'text-teal-900', bg: 'bg-teal-50', alert: false },
    { label: 'Denúncias Abertas', value: metrics.openComplaints, sub: `${metrics.actionsLate} ações atrasadas`, icon: AlertTriangle, color: 'text-coral-900', bg: 'bg-red-50', alert: metrics.openComplaints > 0 },
  ];

  const chartData = risksBySector.map(r => ({
    name: r.area.replace('Pronto-socorro', 'P.Socorro').replace('Administrativo', 'Adm.'),
    Crítico: r.critico,
    Alto: r.alto,
    Médio: r.medio,
    Baixo: r.baixo,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-gray-500 text-sm">{hospital.nome} · {hospital.funcionarios} colaboradores CLT</p>
      </div>

      {/* Top row: compliance + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="card p-6 flex flex-col items-center justify-center lg:col-span-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Conformidade NR-1</p>
          <ComplianceGauge value={metrics.compliance} />
        </div>

        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map(({ label, value, sub, icon: Icon, color, bg, alert }) => (
            <div key={label} className={`card p-4 ${alert ? 'ring-1 ring-red-200' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                {alert && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping-slow" />}
              </div>
              <p className="text-2xl font-bold text-ink">{value}</p>
              <p className="text-sm text-gray-600 font-medium mt-0.5">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risks by sector */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-ink">Riscos por Área Hospitalar</h2>
              <p className="text-xs text-gray-400">NR-1 §1.5.4.4.2 — Inventário de perigos</p>
            </div>
            <Link to="/pgr" className="text-xs text-teal-700 hover:underline flex items-center gap-1">
              Ver PGR <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Crítico" stackId="a" fill="#BF360C" radius={[0,0,0,0]} />
              <Bar dataKey="Alto" stackId="a" fill="#E65100" />
              <Bar dataKey="Médio" stackId="a" fill="#F9A825" />
              <Bar dataKey="Baixo" stackId="a" fill="#2E7D32" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PGR Status */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-ink">Timeline PGR</h2>
              <p className="text-xs text-gray-400">NR-1 §1.5.7.3.3.1 — Histórico 20 anos</p>
            </div>
            <Link to="/pgr" className="text-xs text-teal-700 hover:underline flex items-center gap-1">
              Abrir <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {pgrTimeline.map((item, i) => (
              <div key={item.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === pgrTimeline.length - 1 ? 'bg-teal-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {i + 1}
                  </div>
                  {i < pgrTimeline.length - 1 && <div className="w-0.5 h-full bg-gray-100 mt-1" />}
                </div>
                <div className="pb-3 min-w-0">
                  <p className="text-xs font-semibold text-gray-700">{item.version}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.action_summary}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-teal-300 flex items-center justify-center">
                <Activity className="w-3 h-3 text-teal-500" />
              </div>
              <p className="text-xs text-teal-600 font-medium pt-1">Próxima revisão programada</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Late actions */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-coral-900" />
            <h2 className="font-semibold text-ink">Ações Atrasadas</h2>
            <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{alerts.lateActions?.length || 0}</span>
          </div>
          <div className="space-y-2">
            {alerts.lateActions?.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhuma ação atrasada</p>}
            {alerts.lateActions?.map(a => (
              <div key={a.id} className="flex items-start gap-3 p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-coral-900 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink truncate">{a.what}</p>
                  <p className="text-xs text-gray-500">{a.area} · Prazo: {a.when_date} · {a.responsible}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New complaints */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-orange-900" />
            <h2 className="font-semibold text-ink">Denúncias Recentes</h2>
            <Link to="/denuncias" className="ml-auto text-xs text-teal-700 hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-2">
            {alerts.newComplaints?.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhuma denúncia pendente</p>}
            {alerts.newComplaints?.map(d => (
              <div key={d.id} className="flex items-start gap-3 p-2 bg-orange-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink">{d.tipo} — {d.setor}</p>
                  <p className="text-xs text-gray-500">{d.protocolo} · {new Date(d.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className="shrink-0 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Novo</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions summary */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink">Plano de Ação — Resumo</h2>
          <Link to="/pgr" className="text-xs text-teal-700 hover:underline flex items-center gap-1">
            Gerenciar <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Não iniciado', count: metrics.actionsTotal - metrics.actionsDone - metrics.actionsLate - 0, color: 'bg-gray-100 text-gray-700' },
            { label: 'Em andamento', count: 2, color: 'bg-blue-100 text-blue-700' },
            { label: 'Atrasado', count: metrics.actionsLate, color: 'bg-red-100 text-red-700' },
            { label: 'Concluído', count: metrics.actionsDone, color: 'bg-green-100 text-green-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-lg p-3 ${s.color}`}>
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-xs font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progresso geral</span>
            <span>{metrics.actionsDone}/{metrics.actionsTotal} concluídas</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-teal-900 h-2 rounded-full transition-all"
              style={{ width: `${(metrics.actionsDone / Math.max(metrics.actionsTotal, 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

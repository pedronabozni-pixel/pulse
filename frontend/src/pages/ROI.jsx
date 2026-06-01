import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { DollarSign, TrendingDown, AlertTriangle, Users, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../api';

const fmtBRL = (v) => v >= 1000000 ? `R$ ${(v / 1000000).toFixed(2)}M` : `R$ ${v?.toLocaleString('pt-BR')}`;
const fmtBRLFull = (v) => `R$ ${v?.toLocaleString('pt-BR')}`;

export default function ROI() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/roi/metrics').then(r => setData(r.data)); }, []);

  if (!data) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-teal-900 border-t-transparent rounded-full animate-spin" /></div>;

  const mainMetrics = [
    { label: 'Custo de Turnover Anual', value: fmtBRL(data.custoTurnover), detail: `${data.desligamentos} desligamentos × 3 salários médios`, icon: TrendingDown, color: 'text-coral-900', bg: 'bg-red-50', ref: 'Metodologia USP 2016' },
    { label: 'Custo de Absenteísmo Anual', value: fmtBRL(data.custoAbsenteismo), detail: `${data.diasPerdidos} dias perdidos + HE de cobertura`, icon: Users, color: 'text-orange-900', bg: 'bg-orange-50', ref: 'Salário/dia + 30% HE' },
    { label: 'Exposição a Multas NR-1', value: fmtBRL(data.multasNR1), detail: '320 trabalhadores × R$ 6.708', icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-50', ref: 'NR-1 §1.8' },
    { label: 'Passivo Trabalhista Est.', value: fmtBRL(data.passivoTrabalhista), detail: '2% da folha de pagamento anual', icon: DollarSign, color: 'text-teal-900', bg: 'bg-teal-50', ref: 'Est. jurídico 2024' },
  ];

  const chartData = data.setores?.map(s => ({
    name: s.setor.replace('Pronto-socorro', 'P.Socorro').replace('Centro Cirúrgico', 'C.Cirúrgico').replace('Administrativo', 'Adm.'),
    'Custo Turnover': Math.round(s.custoAnual / 1000),
    'Turnover %': s.turnoverSetor * 100,
  }));

  const STATUS_COLOR = { 'Não iniciado': '#E5E7EB', 'Em andamento': '#60A5FA', 'Atrasado': '#F87171', 'Concluído': '#34D399' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Dashboard ROI</h1>
        <p className="text-gray-500 text-sm">Impacto financeiro dos riscos psicossociais · Hospital Regional São Lucas</p>
      </div>

      {/* Total exposure banner */}
      <div className="bg-gradient-to-r from-teal-900 to-teal-700 rounded-2xl p-6 text-white">
        <p className="text-teal-300 text-sm font-medium mb-1">Exposição Financeira Total Estimada</p>
        <p className="text-4xl font-bold mb-1">{fmtBRL(data.totalExposicao)}</p>
        <p className="text-teal-300 text-sm">Turnover + Absenteísmo + Multas NR-1 + Passivo Trabalhista</p>
        <div className="mt-4 pt-4 border-t border-teal-700 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-teal-300 text-xs">Folha Anual</p><p className="font-semibold">{fmtBRL(data.folhaAnual)}</p></div>
          <div><p className="text-teal-300 text-xs">Desligamentos/ano</p><p className="font-semibold">{data.desligamentos} pessoas</p></div>
          <div><p className="text-teal-300 text-xs">Dias perdidos/ano</p><p className="font-semibold">{data.diasPerdidos} dias</p></div>
          <div><p className="text-teal-300 text-xs">% Exp. / Folha</p><p className="font-semibold">{Math.round((data.totalExposicao / data.folhaAnual) * 100)}%</p></div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mainMetrics.map(({ label, value, detail, icon: Icon, color, bg, ref }) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-xl font-bold text-ink">{value}</p>
            <p className="text-sm text-gray-600 font-medium mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{detail}</p>
            <p className="text-xs text-teal-600 mt-0.5 font-medium">{ref}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-semibold text-ink mb-1">Custo de Turnover por Setor (R$ mil)</h2>
          <p className="text-xs text-gray-400 mb-4">Setores com maior impacto financeiro</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ left: -10 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [`R$ ${v}K`, 'Custo']} />
              <Bar dataKey="Custo Turnover" fill="#004D40" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-ink mb-1">Tendência — Turnover e Absenteísmo (%)</h2>
          <p className="text-xs text-gray-400 mb-4">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.trend} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="turnover" stroke="#BF360C" strokeWidth={2} dot={{ r: 3 }} name="Turnover %" />
              <Line type="monotone" dataKey="absenteismo" stroke="#E65100" strokeWidth={2} dot={{ r: 3 }} name="Absenteísmo %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payback table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-ink">Tabela de Payback por Camada de Investimento</h2>
          <p className="text-xs text-gray-400 mt-0.5">Retorno sobre o investimento em saúde psicossocial</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Programa / Intervenção</th>
                <th className="px-4 py-3 text-right">Investimento</th>
                <th className="px-4 py-3 text-right">Economia Anual</th>
                <th className="px-4 py-3 text-center">Payback</th>
                <th className="px-4 py-3 text-center">ROI</th>
                <th className="px-4 py-3 text-center">Turnover -Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.payback?.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-ink text-xs">{p.nome}</td>
                  <td className="px-4 py-3 text-right text-xs">{fmtBRLFull(p.investimento)}</td>
                  <td className="px-4 py-3 text-right text-xs text-green-700 font-medium">{fmtBRLFull(p.economiaAnual)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.paybackMeses <= 12 ? 'bg-green-100 text-green-700' : p.paybackMeses <= 24 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.paybackMeses} meses
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {p.roi > 0 ? <ChevronUp className="w-3 h-3 text-green-600" /> : <ChevronDown className="w-3 h-3 text-red-500" />}
                      <span className={`text-xs font-bold ${p.roi > 0 ? 'text-green-700' : 'text-red-600'}`}>{p.roi}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-teal-700 font-medium">-{(p.reducaoTurnover * 100).toFixed(0)} p.p.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sector breakdown */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-ink">Indicadores por Setor</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Setor</th>
                <th className="px-4 py-3 text-center">Colaboradores</th>
                <th className="px-4 py-3 text-center">Turnover Setor</th>
                <th className="px-4 py-3 text-center">Desligamentos/ano</th>
                <th className="px-4 py-3 text-right">Custo Anual</th>
                <th className="px-4 py-3 text-center">Risco Predomi.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.setores?.map(s => (
                <tr key={s.setor} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-ink text-xs">{s.setor}</td>
                  <td className="px-4 py-3 text-center text-xs">{s.colaboradores}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold ${s.turnoverSetor > 0.25 ? 'text-red-600' : s.turnoverSetor > 0.15 ? 'text-orange-600' : 'text-green-700'}`}>
                      {(s.turnoverSetor * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs">{s.desligamentos}</td>
                  <td className="px-4 py-3 text-right text-xs font-medium">{fmtBRLFull(s.custoAnual)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${{ Crítico: 'badge-critico', Alto: 'badge-alto', Médio: 'badge-medio', Baixo: 'badge-baixo' }[s.riscoPredominante]}`}>
                      {s.riscoPredominante}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

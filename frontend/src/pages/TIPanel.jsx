import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import { Server, Plug, Code2, Activity, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { AccessDeniedBanner } from '../components/ProtectedRoute';

const METHOD_COLOR = { GET: 'bg-green-100 text-green-700', POST: 'bg-blue-100 text-blue-700', PUT: 'bg-yellow-100 text-yellow-700', DELETE: 'bg-red-100 text-red-700' };

export default function TIPanel() {
  const location = useLocation();
  const [status, setStatus] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [webhooks, setWebhooks] = useState(null);
  const [tab, setTab] = useState('status');

  useEffect(() => {
    api.get('/integracoes/status').then(r => setStatus(r.data)).catch(() => {});
    api.get('/integracoes/endpoints').then(r => setEndpoints(r.data)).catch(() => {});
    api.get('/integracoes/webhooks').then(r => setWebhooks(r.data)).catch(() => {});
  }, []);

  const fmtUptime = (s) => {
    if (!s) return '—';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}min`;
  };

  return (
    <div className="space-y-6">
      <AccessDeniedBanner from={location.state?.from} />

      <div>
        <h1 className="text-2xl font-bold text-ink">Painel de Integrações e API</h1>
        <p className="text-gray-500 text-sm">Monitoramento técnico, endpoints e configuração de webhooks</p>
      </div>

      {/* Status cards */}
      {status && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Status Geral', value: status.status === 'operational' ? 'Operacional' : 'Degradado', icon: Activity, color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'Versão da API', value: `v${status.version}`, icon: Code2, color: 'text-teal-900', bg: 'bg-teal-50' },
            { label: 'Uptime', value: fmtUptime(status.uptime), icon: Clock, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Ambiente', value: status.env, icon: Server, color: 'text-gray-700', bg: 'bg-gray-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-4">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-lg font-bold text-ink">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[['status','Serviços'],['endpoints','Endpoints'],['webhooks','Webhooks e Integrações']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === k ? 'bg-white text-teal-900 shadow-sm' : 'text-gray-500'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Serviços */}
      {tab === 'status' && status && (
        <div className="space-y-3">
          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-4">Status dos Serviços</h2>
            <div className="space-y-3">
              {status.services?.map(s => (
                <div key={s.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${s.status === 'up' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <p className="text-sm font-medium text-ink">{s.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{s.latency}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.status === 'up' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {s.status === 'up' ? 'Operacional' : 'Degradado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-4">Dados do Banco</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(status.db || {}).map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-ink">{v}</p>
                  <p className="text-xs text-gray-500 capitalize">{k}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Endpoints */}
      {tab === 'endpoints' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-ink">Documentação dos Endpoints</h2>
            <p className="text-xs text-gray-400">Base URL: {import.meta.env.VITE_API_URL || window.location.origin}/api</p>
          </div>
          <div className="divide-y divide-gray-50">
            {endpoints.map((e, i) => (
              <div key={i} className="flex items-start gap-4 px-4 py-3 hover:bg-gray-50">
                <span className={`text-xs font-bold px-2 py-1 rounded shrink-0 w-14 text-center ${METHOD_COLOR[e.method]}`}>{e.method}</span>
                <div className="flex-1 min-w-0">
                  <code className="text-xs font-mono text-teal-700">{e.path}</code>
                  <p className="text-xs text-gray-500 mt-0.5">{e.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  {e.auth ? (
                    <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">JWT</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Público</span>
                  )}
                  {e.roles?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">{e.roles.join(', ')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Webhooks */}
      {tab === 'webhooks' && webhooks && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-ink">Webhooks Configurados</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {webhooks.webhooks?.map(w => (
                <div key={w.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{w.event}</p>
                    <p className="text-xs text-gray-400">{w.url || 'URL não configurada'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${w.status === 'ativo' ? 'bg-green-100 text-green-700' : w.status === 'inativo' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'}`}>
                    {w.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-ink">Integrações com Sistemas Externos</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {webhooks.integrations?.map(w => (
                <div key={w.name} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{w.name}</p>
                    <p className="text-xs text-gray-400">{w.provider} · {w.type}</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">{w.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

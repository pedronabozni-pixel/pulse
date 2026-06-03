import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_CONFIG, resolveRole } from '../hooks/usePermissions';
import { Activity, Lock, Mail, AlertCircle } from 'lucide-react';

const DEMO_USERS = [
  { label: 'RH (Acesso completo)',    email: 'rh@saolucas.com.br',          pw: 'pulso123', role: 'rh' },
  { label: 'CFO (Dashboard ROI)',      email: 'cfo@saolucas.com.br',         pw: 'pulso123', role: 'cfo' },
  { label: 'Jurídico (Leitura)',       email: 'juridico@saolucas.com.br',    pw: 'pulso123', role: 'juridico' },
  { label: 'Gestor de Área',          email: 'gestor@saolucas.com.br',       pw: 'pulso123', role: 'gestor' },
  { label: 'Colaborador',             email: 'colaborador@saolucas.com.br',  pw: 'pulso123', role: 'colaborador' },
  { label: 'TI (Integrações)',        email: 'ti@saolucas.com.br',           pw: 'pulso123', role: 'ti' },
];

export default function Login() {
  const [email, setEmail] = useState('rh@saolucas.com.br');
  const [password, setPassword] = useState('pulso123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const role = resolveRole(user.role);
      const home = ROLE_CONFIG[role]?.home || '/dashboard';
      navigate(home, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-0 shadow-2xl rounded-2xl overflow-hidden">
        {/* Left */}
        <div className="bg-teal-900 p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-white text-3xl font-bold">PULSO</h1>
                <p className="text-teal-300 text-sm">Gestão de Riscos Psicossociais</p>
              </div>
            </div>
            <h2 className="text-white text-xl font-semibold mb-3">Acesso por Perfil</h2>
            <p className="text-teal-300 text-sm leading-relaxed mb-5">
              Cada perfil tem uma interface personalizada. Após o login você será redirecionado automaticamente para sua área.
            </p>
            <div className="space-y-2">
              {DEMO_USERS.map(u => {
                const config = ROLE_CONFIG[u.role];
                return (
                  <div key={u.role} className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config?.badgeClass || 'bg-gray-100 text-gray-700'}`}>{config?.label}</span>
                    <span className="text-teal-300 text-xs">→ {config?.home}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-teal-700">
            <p className="text-teal-400 text-xs">Hospital Regional São Lucas</p>
            <p className="text-teal-500 text-xs">NR-1 · NR-17 · NR-32 · Lei 14.457/2022</p>
          </div>
        </div>

        {/* Right */}
        <div className="bg-white p-10 flex flex-col justify-center">
          <h3 className="text-ink text-2xl font-bold mb-1">Bem-vindo(a)</h3>
          <p className="text-gray-500 text-sm mb-6">Acesse com seu perfil</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input pl-9" required />
              </div>
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input pl-9" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Acesso rápido — perfis demo</p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_USERS.map(u => (
                <button
                  key={u.email}
                  onClick={() => { setEmail(u.email); setPassword(u.pw); }}
                  className="text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-teal-50 text-xs transition-colors"
                >
                  <span className={`font-semibold px-1.5 py-0.5 rounded-full ${ROLE_CONFIG[u.role]?.badgeClass}`}>{ROLE_CONFIG[u.role]?.label}</span>
                  <span className="text-gray-400 ml-1 block mt-0.5 truncate">{u.label}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-gray-400">
            <a href="/denuncia" className="text-teal-700 hover:underline">Fazer denúncia anônima sem login →</a>
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Lock, Mail, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@saolucas.com.br');
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
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  const DEMO_USERS = [
    { label: 'Administrador SESMT', email: 'admin@saolucas.com.br', pw: 'pulso123' },
    { label: 'CFO (ROI)', email: 'cfo@saolucas.com.br', pw: 'senha123' },
    { label: 'Médico UTI', email: 'dr.silva@saolucas.com.br', pw: 'senha123' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-0 shadow-2xl rounded-2xl overflow-hidden">
        {/* Left panel */}
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
            <h2 className="text-white text-xl font-semibold mb-3">Conformidade NR-1</h2>
            <p className="text-teal-300 text-sm leading-relaxed mb-6">
              Plataforma completa para gestão de riscos psicossociais em hospitais, conforme a Portaria MTE 1.419/2024.
            </p>
            <ul className="space-y-2">
              {['Diagnóstico COPSOQ-II','PGR / GRO Integrado','Canal de Denúncias Anônimo','ROI Financeiro','IA Generativa'].map(f => (
                <li key={f} className="flex items-center gap-2 text-teal-200 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 pt-6 border-t border-teal-700">
            <p className="text-teal-400 text-xs">Hospital Regional São Lucas</p>
            <p className="text-teal-500 text-xs">NR-1 · NR-4 · NR-5 · NR-17 · NR-32 · Lei 14.457/2022</p>
          </div>
        </div>

        {/* Right panel */}
        <div className="bg-white p-10 flex flex-col justify-center">
          <h3 className="text-ink text-2xl font-bold mb-1">Bem-vindo(a)</h3>
          <p className="text-gray-500 text-sm mb-8">Acesse sua conta para continuar</p>

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
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="seu@email.com.br"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pl-9"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Usuários demo</p>
            <div className="space-y-1.5">
              {DEMO_USERS.map(u => (
                <button
                  key={u.email}
                  onClick={() => { setEmail(u.email); setPassword(u.pw); }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-teal-50 text-xs text-gray-600 hover:text-teal-900 transition-colors"
                >
                  <span className="font-medium">{u.label}</span>
                  <span className="text-gray-400 ml-2">{u.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            Canal anônimo:{' '}
            <a href="/denuncia" className="text-teal-700 hover:underline">Registrar denúncia sem login</a>
          </p>
        </div>
      </div>
    </div>
  );
}

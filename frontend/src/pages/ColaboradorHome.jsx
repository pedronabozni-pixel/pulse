import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardList, MessageSquareWarning, GraduationCap, Activity, ShieldCheck } from 'lucide-react';
import { AccessDeniedBanner } from '../components/ProtectedRoute';
import api from '../api';
import { useEffect, useState } from 'react';

export default function ColaboradorHome() {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/treinamentos/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const cards = [
    {
      icon: ClipboardList,
      title: 'Responder Diagnóstico',
      desc: 'Questionário COPSOQ-II anônimo — suas respostas ajudam a melhorar o ambiente de trabalho.',
      to: '/diagnostico',
      color: 'from-teal-900 to-teal-700',
      tag: '~8 minutos',
    },
    {
      icon: MessageSquareWarning,
      title: 'Fazer uma Denúncia',
      desc: 'Canal 100% anônimo. Sem identificação, sem IP registrado. Você recebe um protocolo de acompanhamento.',
      to: '/denuncia',
      color: 'from-coral-900 to-orange-900',
      tag: 'Anônimo',
    },
    {
      icon: GraduationCap,
      title: 'Meus Treinamentos',
      desc: 'Cursos obrigatórios e opcionais disponíveis para você. Emita seu certificado ao concluir.',
      to: '/treinamentos',
      color: 'from-purple-700 to-purple-900',
      tag: stats ? `${stats.completed}/${stats.total} concluídos` : 'Ver cursos',
    },
  ];

  return (
    <div className="space-y-6">
      <AccessDeniedBanner from={location.state?.from} />

      {/* Boas-vindas */}
      <div className="bg-gradient-to-r from-teal-900 to-teal-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-7 h-7 text-lime-300" />
          <h1 className="text-2xl font-bold">Olá, {user?.name?.split(' ')[0]}!</h1>
        </div>
        <p className="text-teal-200 text-sm">
          Bem-vindo(a) ao PULSO — sua área pessoal no programa de saúde e bem-estar do Hospital Regional São Lucas.
        </p>
      </div>

      {/* Cards de ação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ icon: Icon, title, desc, to, color, tag }) => (
          <Link key={to} to={to} className="card overflow-hidden hover:shadow-card-hover transition-all group">
            <div className={`bg-gradient-to-br ${color} p-5`}>
              <Icon className="w-8 h-8 text-white mb-2" />
              <span className="text-xs text-white/70 font-medium">{tag}</span>
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-ink mb-2 group-hover:text-teal-900 transition-colors">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Treinamentos obrigatórios */}
      {stats && stats.completedRequired < stats.required && (
        <div className="card p-5 border-l-4 border-orange-500">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-ink text-sm">Treinamentos obrigatórios pendentes</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Você concluiu {stats.completedRequired} de {stats.required} treinamentos obrigatórios.
                Complete os cursos restantes para emitir seu certificado de conformidade NR-1.
              </p>
              <Link to="/treinamentos" className="inline-block mt-3 btn-primary text-xs">
                Ver treinamentos pendentes →
              </Link>
            </div>
          </div>
        </div>
      )}

      {stats && stats.completedRequired >= stats.required && (
        <div className="card p-5 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-800 text-sm">✅ Treinamentos obrigatórios concluídos!</p>
              <p className="text-sm text-gray-500">Você está em conformidade com a NR-1. Continue com os cursos opcionais.</p>
            </div>
          </div>
        </div>
      )}

      {/* Info de privacidade */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-xs text-gray-500 leading-relaxed">
          <strong className="text-gray-700">Sua privacidade é garantida:</strong> O diagnóstico psicossocial é 100% anônimo — nenhum dado pessoal é coletado.
          O canal de denúncias não registra IP, e-mail ou qualquer forma de identificação. Conforme NR-1 §1.4.1.1 e LGPD.
        </p>
      </div>
    </div>
  );
}

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions, ROLE_CONFIG } from '../hooks/usePermissions';
import {
  LayoutDashboard, ClipboardList, ShieldAlert, TrendingUp,
  MessageSquareWarning, GraduationCap, BrainCircuit, LogOut,
  Activity, FileText, Plug, Home,
} from 'lucide-react';

const ALL_NAV = [
  { key: 'dashboard',   to: '/dashboard',   label: 'Dashboard',                icon: LayoutDashboard,      sub: 'NR-1 Conformidade' },
  { key: 'roi',         to: '/roi',         label: 'Dashboard ROI',             icon: TrendingUp,            sub: 'Para o CFO' },
  { key: 'diagnostico', to: '/diagnostico', label: 'Diagnóstico Psicossocial',  icon: ClipboardList,         sub: 'COPSOQ-II' },
  { key: 'pgr',         to: '/pgr',         label: 'PGR / GRO',                 icon: ShieldAlert,           sub: 'NR-1 §1.5' },
  { key: 'denuncias',   to: '/denuncias',   label: 'Canal de Denúncia',         icon: MessageSquareWarning,  sub: 'Anônimo' },
  { key: 'treinamentos',to: '/treinamentos',label: 'Treinamentos',              icon: GraduationCap,         sub: 'NR-1 §1.7' },
  { key: 'advisor',     to: '/advisor',     label: 'Pulso Advisor IA',          icon: BrainCircuit,          sub: 'Claude AI' },
  { key: 'evidencias',  to: '/evidencias',  label: 'Evidências / Histórico',    icon: FileText,              sub: 'Auditável' },
  { key: 'integracoes', to: '/integracoes', label: 'Integrações / API',         icon: Plug,                  sub: 'Para TI' },
  { key: 'meu-espaco',  to: '/meu-espaco',  label: 'Meu Espaço',               icon: Home,                  sub: 'Área pessoal' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { role, nav, label: roleLabel, badgeClass } = usePermissions();
  const navigate = useNavigate();

  const visibleNav = ALL_NAV.filter(item => nav.includes(item.key));

  return (
    <aside className="w-64 bg-teal-900 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-teal-800">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="text-lime-100 w-6 h-6" />
          <span className="text-white text-xl font-bold tracking-tight">PULSO</span>
        </div>
        <p className="text-teal-300 text-xs">Gestão de Riscos Psicossociais</p>
        <p className="text-teal-400 text-xs mt-0.5">NR-1 | Portaria MTE 1.419/2024</p>
      </div>

      {/* Hospital */}
      <div className="px-5 py-3 border-b border-teal-800 bg-teal-800/50">
        <p className="text-teal-200 text-xs font-medium">Hospital Regional São Lucas</p>
        <p className="text-teal-400 text-xs">320 colaboradores CLT</p>
      </div>

      {/* Nav dinâmica por role */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {visibleNav.map(({ key, to, label, icon: Icon, sub }) => (
          <NavLink
            key={key}
            to={to}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="block truncate">{label}</span>
              {sub && <span className="block text-xs text-teal-400 font-normal">{sub}</span>}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Usuário + badge de role */}
      <div className="px-3 py-4 border-t border-teal-800">
        <div className="flex items-center gap-3 px-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-medium truncate">{user?.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${badgeClass}`}>{roleLabel}</span>
              {user?.sector && <span className="text-teal-400 text-xs truncate">· {user.sector}</span>}
            </div>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="sidebar-item w-full text-teal-300 hover:text-red-300"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

import { useAuth } from '../contexts/AuthContext';

// role legado → novo
const LEGACY = { admin: 'rh', manager: 'gestor', viewer: 'colaborador' };
export const resolveRole = (r) => LEGACY[r] || r || 'colaborador';

export const ROLE_CONFIG = {
  rh: {
    label: 'RH',
    badgeClass: 'bg-blue-100 text-blue-700',
    home: '/dashboard',
    nav: ['dashboard', 'diagnostico', 'pgr', 'denuncias', 'treinamentos', 'advisor', 'evidencias'],
    readOnly: [],
  },
  juridico: {
    label: 'Jurídico',
    badgeClass: 'bg-purple-100 text-purple-700',
    home: '/evidencias',
    nav: ['diagnostico', 'pgr', 'denuncias', 'treinamentos', 'advisor', 'evidencias'],
    readOnly: ['diagnostico', 'pgr', 'denuncias'],
  },
  gestor: {
    label: 'Gestor',
    badgeClass: 'bg-green-100 text-green-700',
    home: '/advisor',
    nav: ['treinamentos', 'advisor'],
    readOnly: [],
  },
  colaborador: {
    label: 'Colaborador',
    badgeClass: 'bg-gray-100 text-gray-700',
    home: '/meu-espaco',
    nav: ['meu-espaco', 'treinamentos'],
    readOnly: [],
  },
  cfo: {
    label: 'CFO',
    badgeClass: 'bg-yellow-100 text-yellow-800',
    home: '/roi',
    nav: ['roi', 'treinamentos', 'advisor'],
    readOnly: [],
  },
  ti: {
    label: 'TI',
    badgeClass: 'bg-slate-100 text-slate-700',
    home: '/integracoes',
    nav: ['integracoes'],
    readOnly: [],
  },
};

export function usePermissions() {
  const { user } = useAuth();
  const role = resolveRole(user?.role);
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.colaborador;

  return {
    role,
    ...config,
    canAccess: (module) => config.nav.includes(module),
    isReadOnly: (module) => config.readOnly.includes(module),
  };
}

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ module, children }) {
  const { canAccess, home } = usePermissions();
  const location = useLocation();

  if (!canAccess(module)) {
    // Redireciona para home do perfil com state para exibir mensagem
    return <Navigate to={home} replace state={{ denied: true, from: location.pathname }} />;
  }

  return children;
}

// Banner exibido quando redirecionado por falta de permissão
export function AccessDeniedBanner({ from }) {
  if (!from) return null;
  return (
    <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
      <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0" />
      <p className="text-sm text-orange-800">
        <strong>Acesso não permitido</strong> para a rota <code className="bg-orange-100 px-1 rounded">{from}</code>.
        Você foi redirecionado para sua área principal.
      </p>
    </div>
  );
}

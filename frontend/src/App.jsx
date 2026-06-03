import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { usePermissions, ROLE_CONFIG, resolveRole } from './hooks/usePermissions';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Diagnostico  from './pages/Diagnostico';
import PGR          from './pages/PGR';
import ROI          from './pages/ROI';
import Denuncia     from './pages/Denuncia';
import Treinamentos from './pages/Treinamentos';
import Advisor      from './pages/Advisor';
import Evidencias   from './pages/Evidencias';
import TIPanel      from './pages/TIPanel';
import ColaboradorHome from './pages/ColaboradorHome';

function Spinner() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-teal-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-teal-900 font-medium">Carregando PULSO...</p>
      </div>
    </div>
  );
}

// Redireciona para home do perfil
function RoleHome() {
  const { user } = useAuth();
  const role = resolveRole(user?.role);
  const home = ROLE_CONFIG[role]?.home || '/dashboard';
  return <Navigate to={home} replace />;
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/denuncia" element={<Denuncia anonymous />} />

      <Route path="/*" element={
        <PrivateRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<RoleHome />} />

              <Route path="/dashboard" element={
                <ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>
              } />
              <Route path="/diagnostico" element={
                <ProtectedRoute module="diagnostico"><Diagnostico /></ProtectedRoute>
              } />
              <Route path="/pgr" element={
                <ProtectedRoute module="pgr"><PGR /></ProtectedRoute>
              } />
              <Route path="/roi" element={
                <ProtectedRoute module="roi"><ROI /></ProtectedRoute>
              } />
              <Route path="/denuncias" element={
                <ProtectedRoute module="denuncias"><Denuncia /></ProtectedRoute>
              } />
              <Route path="/treinamentos" element={
                <ProtectedRoute module="treinamentos"><Treinamentos /></ProtectedRoute>
              } />
              <Route path="/advisor" element={
                <ProtectedRoute module="advisor"><Advisor /></ProtectedRoute>
              } />
              <Route path="/evidencias" element={
                <ProtectedRoute module="evidencias"><Evidencias /></ProtectedRoute>
              } />
              <Route path="/integracoes" element={
                <ProtectedRoute module="integracoes"><TIPanel /></ProtectedRoute>
              } />
              <Route path="/meu-espaco" element={
                <ProtectedRoute module="meu-espaco"><ColaboradorHome /></ProtectedRoute>
              } />

              {/* Fallback — redireciona para home do perfil */}
              <Route path="*" element={<RoleHome />} />
            </Routes>
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

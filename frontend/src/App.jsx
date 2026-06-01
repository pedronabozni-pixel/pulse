import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Diagnostico from './pages/Diagnostico';
import PGR from './pages/PGR';
import ROI from './pages/ROI';
import Denuncia from './pages/Denuncia';
import Treinamentos from './pages/Treinamentos';
import Advisor from './pages/Advisor';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-teal-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-teal-900 font-medium">Carregando PULSO...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/denuncia" element={<Denuncia anonymous />} />
          <Route path="/*" element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/diagnostico" element={<Diagnostico />} />
                  <Route path="/pgr" element={<PGR />} />
                  <Route path="/roi" element={<ROI />} />
                  <Route path="/denuncias" element={<Denuncia />} />
                  <Route path="/treinamentos" element={<Treinamentos />} />
                  <Route path="/advisor" element={<Advisor />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

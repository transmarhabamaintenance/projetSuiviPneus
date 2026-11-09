import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Navbar from '../components/Navbar';

import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import CamionsPage from '../pages/CamionsPage';
import CamionDetailPage from '../pages/CamionDetailPage';
import PneusPage from '../pages/PneusPage';
import PneuDetailPage from '../pages/PneuDetailPage';
import HistoriquePage from '../pages/HistoriquePage';
import UtilisateursPage from '../pages/UtilisateursPage';
import NotFoundPage from '../pages/NotFoundPage';

// Layout englobant avec header et nav mobile
function AppLayout({ children }) {
  return (
    <div className="app-container min-h-screen bg-surface flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto pt-20 pb-24 md:pb-12 px-4 md:px-6">
        {children}
      </main>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Route Publique */}
      <Route path="/login" element={<LoginPage />} />

      {/* Redirection racine vers dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Tableau de bord */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Camions */}
      <Route
        path="/camions"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CamionsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/camions/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CamionDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Pneus */}
      <Route
        path="/pneus"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PneusPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pneus/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PneuDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Historique */}
      <Route
        path="/historique"
        element={
          <ProtectedRoute>
            <AppLayout>
              <HistoriquePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Utilisateurs (Strictement réservé à ADMIN) */}
      <Route
        path="/utilisateurs"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AppLayout>
              <UtilisateursPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Route 404 */}
      <Route
        path="*"
        element={
          <AppLayout>
            <NotFoundPage />
          </AppLayout>
        }
      />
    </Routes>
  );
}

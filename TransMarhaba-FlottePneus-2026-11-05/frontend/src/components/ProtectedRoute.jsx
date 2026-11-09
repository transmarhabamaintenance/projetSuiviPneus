import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, loading, hasRole, user } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: '#64748b' }}>Chargement de l'application...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !hasRole(...roles)) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
        <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Accès non autorisé</h2>
        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
          Votre rôle actuel (<strong>{typeof user?.role === 'string' ? user.role : user?.role?.nom}</strong>) ne vous donne pas accès à cette section.
        </p>
        <a href="/dashboard" className="btn btn-primary">
          Retour au tableau de bord
        </a>
      </div>
    );
  }

  return children;
}

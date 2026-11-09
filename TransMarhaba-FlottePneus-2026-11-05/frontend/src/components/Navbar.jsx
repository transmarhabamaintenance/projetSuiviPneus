import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const LOGO_SRC = "/logo.png";
const AVATAR_SRC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='8' r='4' fill='%236A5D40'/%3E%3Cpath d='M4 20c0-4 4-6 8-6s8 2 8 6' fill='%236A5D40'/%3E%3C/svg%3E";

export default function Navbar() {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const roleName = typeof user?.role === 'string' ? user.role : user?.role?.nom;

  // Déterminer le titre de page selon la route actuelle
  let pageTitle = "Tableau De Bord";
  if (location.pathname.startsWith('/camions')) {
    pageTitle = location.pathname === '/camions' ? "Camions" : "Détail Véhicule";
  } else if (location.pathname.startsWith('/pneus')) {
    pageTitle = location.pathname === '/pneus' ? "Pneumatiques" : "Détail Pneu";
  } else if (location.pathname.startsWith('/historique')) {
    pageTitle = "Historique";
  } else if (location.pathname.startsWith('/utilisateurs')) {
    pageTitle = "Équipe & Rôles";
  }

  return (
    <>
      {/* En-tête supérieur fixé (Desktop & Mobile) */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-surface-container shadow-[0_1px_8px_rgba(42,26,28,0.04)] pt-safe">
        <div className="max-w-7xl mx-auto h-16 px-4 md:px-6 flex items-center justify-between gap-4">
          
          {/* Logo & Marque Trans Marhaba */}
          <Link to="/dashboard" className="flex items-center gap-3 min-w-0 text-decoration-none group">
            <div className="w-9 h-9 rounded-full overflow-hidden shadow-sm border border-[#E5D3AF] bg-surface-container flex items-center justify-center flex-shrink-0">
              <img
                src={LOGO_SRC}
                alt="Trans Marhaba"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-caps text-[10px] text-primary tracking-widest uppercase font-bold truncate">
                Trans marhaba
              </span>
              <h1 className="font-headline-sm text-headline-sm text-on-surface truncate leading-tight">
                {pageTitle}
              </h1>
            </div>
          </Link>

          {/* Navigation Liens Desktop */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary-container text-surface shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[19px]">dashboard</span>
              <span>Bord</span>
            </NavLink>

            <NavLink
              to="/camions"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary-container text-surface shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[19px]">local_shipping</span>
              <span>Camions</span>
            </NavLink>

            <NavLink
              to="/pneus"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary-container text-surface shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[19px]">album</span>
              <span>Pneus</span>
            </NavLink>

            <NavLink
              to="/historique"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary-container text-surface shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[19px]">history_edu</span>
              <span>Historique</span>
            </NavLink>

            {hasRole('ADMIN') && (
              <NavLink
                to="/utilisateurs"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-primary-container text-surface shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[19px]">group</span>
                <span>Équipe</span>
              </NavLink>
            )}
          </nav>

          {/* Profil utilisateur & Déconnexion */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-on-surface leading-tight">
                {user?.prenom} {user?.nom}
              </span>
              <span className="text-[10px] uppercase font-bold text-secondary tracking-wider">
                {roleName || 'Opérateur'}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-secondary-container shadow-sm bg-surface-container flex-shrink-0">
              <img
                src={AVATAR_SRC}
                alt={user?.prenom || 'Profil'}
                className="w-full h-full object-cover"
              />
            </div>

            <button
              onClick={logout}
              title="Se déconnecter de la session"
              className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors ml-1"
            >
              <LogOut size={16} />
            </button>
          </div>

        </div>
      </header>

      {/* Barre de navigation inférieure fixe (Mobile & Tablette) */}
      <nav className="fixed bottom-0 left-0 right-0 w-full z-50 pb-safe bg-surface/95 backdrop-blur-xl border-t border-surface-container shadow-[0_-2px_12px_rgba(42,26,28,0.05)] md:hidden">
        <div className="flex justify-between items-center h-16 px-2 max-w-md mx-auto">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 h-13 min-w-[44px] transition-colors ${
                isActive ? 'text-primary-container font-bold' : 'text-on-surface-variant'
              }`
            }
          >
            <span className="material-symbols-outlined text-[22px]">dashboard</span>
            <span className="font-label-sm text-[11px] tracking-tight">Bord</span>
          </NavLink>

          <NavLink
            to="/camions"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 h-13 min-w-[44px] transition-colors ${
                isActive ? 'text-primary-container font-bold' : 'text-on-surface-variant'
              }`
            }
          >
            <span className="material-symbols-outlined text-[22px]">local_shipping</span>
            <span className="font-label-sm text-[11px] tracking-tight">Camions</span>
          </NavLink>

          <NavLink
            to="/pneus"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 h-13 min-w-[44px] transition-colors ${
                isActive ? 'text-primary-container font-bold' : 'text-on-surface-variant'
              }`
            }
          >
            <span className="material-symbols-outlined text-[22px]">album</span>
            <span className="font-label-sm text-[11px] tracking-tight">Pneus</span>
          </NavLink>

          <NavLink
            to="/historique"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 h-13 min-w-[44px] transition-colors ${
                isActive ? 'text-primary-container font-bold' : 'text-on-surface-variant'
              }`
            }
          >
            <span className="material-symbols-outlined text-[22px]">history_edu</span>
            <span className="font-label-sm text-[11px] tracking-tight">Historique</span>
          </NavLink>

          {hasRole('ADMIN') && (
            <NavLink
              to="/utilisateurs"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 h-13 min-w-[44px] transition-colors ${
                  isActive ? 'text-primary-container font-bold' : 'text-on-surface-variant'
                }`
              }
            >
              <span className="material-symbols-outlined text-[22px]">group</span>
              <span className="font-label-sm text-[11px] tracking-tight">Équipe</span>
            </NavLink>
          )}
        </div>
      </nav>
    </>
  );
}
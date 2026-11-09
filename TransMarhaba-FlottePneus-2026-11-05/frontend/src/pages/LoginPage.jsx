import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

const LOGO_SRC = "/logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const connecter = async (userEmail, userPassword) => {
    setError('');
    setLoading(true);

    try {
      await login(userEmail, userPassword);
      navigate('/dashboard');
    } catch (err) {
      console.error('Erreur login:', err);
      const message =
        err.response?.data?.message ||
        'Identifiants incorrects. Veuillez vérifier votre adresse courriel et mot de passe.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await connecter(email, motDePasse);
  };

  const handleCompteDemo = (userEmail, userPassword) => {
    setEmail(userEmail);
    setMotDePasse(userPassword);
    connecter(userEmail, userPassword);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md mx-auto flex flex-col pb-8">
        
        {/* Brand Monogram & En-tête éditorial */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="w-20 h-20 mx-auto rounded-full shadow-md overflow-hidden border border-[#E5D3AF] mb-3">
            <img
              src={LOGO_SRC}
              alt="Trans Marhaba"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-label-caps text-[11px] uppercase tracking-widest text-secondary font-bold mb-1">
            Registre d'Exploitation
          </span>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-serif text-on-surface">
            Suivi des pneus
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs mt-1">
            Gestion de Flotte Poids Lourds — Trans Marhaba
          </p>
        </div>

        {/* Abstract Stylized Tire Tread Banner (Bordeaux & Warm Sand) */}
        <div className="relative w-full h-24 rounded-xl overflow-hidden shadow-sm mb-6 bg-primary-container flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full opacity-40 mix-blend-screen" preserveAspectRatio="none" viewBox="0 0 360 96">
            <path d="M-20 120 L80 -20 M20 120 L120 -20 M60 120 L160 -20 M100 120 L200 -20 M140 120 L240 -20 M180 120 L280 -20 M220 120 L320 -20 M260 120 L360 -20 M300 120 L400 -20" stroke="#F3E1BC" strokeLinecap="round" strokeWidth="4"></path>
            <path d="M0 48 H360" stroke="#F3E1BC" strokeDasharray="8 6" strokeWidth="2"></path>
            <path d="M-10 120 L50 -20 M70 120 L130 -20 M150 120 L210 -20 M230 120 L290 -20 M310 120 L370 -20" stroke="#FFDAD7" strokeOpacity="0.6" strokeWidth="1.5"></path>
          </svg>
          <div className="relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/80 backdrop-blur-sm shadow-sm border border-[#E5D3AF]/30">
            <span className="material-symbols-outlined text-secondary-fixed text-[20px]">tire_repair</span>
            <span className="font-label-sm text-label-sm text-secondary-fixed tracking-wide font-medium">
              Télématique &amp; Sculpteur de Bande
            </span>
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-md p-6 border border-surface-container-high flex flex-col gap-5">
          <div className="flex items-center justify-between pb-1 border-b border-surface-container">
            <div>
              <h2 className="font-title-md text-title-md font-serif text-on-surface">Espace Technicien &amp; Flotte</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Accédez aux carnets de montage et d'usure</p>
            </div>
            <span className="material-symbols-outlined text-secondary text-[24px]">verified_user</span>
          </div>

          {/* Erreur de connexion */}
          {error && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container flex items-start gap-2 text-sm border border-[#f9dcde]">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-error" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Email / Identifiant */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface flex items-center justify-between" htmlFor="fleet-identifier">
                <span>Identifiant ou Courriel professionnel</span>
                <span className="text-secondary font-label-caps text-[10px] tracking-wider uppercase font-bold">MATRICULE / PRO</span>
              </label>
              <div className="relative flex items-center rounded-lg bg-surface-container-low focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary-container transition-all">
                <span className="material-symbols-outlined text-outline ml-3 select-none text-[20px]">badge</span>
                <input
                  id="fleet-identifier"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="ex. flotte@trans-marhaba.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent px-3 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline/70 focus:outline-none"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-label-sm text-on-surface" htmlFor="fleet-password">
                  Mot de passe
                </label>
                <span className="font-label-sm text-xs text-primary-container hover:underline cursor-pointer">
                  Accès sécurisé
                </span>
              </div>
              <div className="relative flex items-center rounded-lg bg-surface-container-low focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary-container transition-all">
                <span className="material-symbols-outlined text-outline ml-3 select-none text-[20px]">lock</span>
                <input
                  id="fleet-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  className="w-full bg-transparent px-3 py-3 font-body-md text-body-md text-on-surface placeholder:text-outline/70 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Afficher ou masquer mot de passe"
                  className="p-2 mr-1 text-outline hover:text-on-surface transition-colors focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Mémoriser la session */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface">Mémoriser cette session</span>
                <span className="font-body-sm text-[12px] text-on-surface-variant">Poste technique d'atelier sécurisé</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(!rememberMe)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                  rememberMe ? 'bg-primary-container' : 'bg-outline-variant'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-surface-container-lowest shadow-sm transition duration-200 ease-in-out ${
                    rememberMe ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Bouton de soumission */}
            <button
              id="submit-auth"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-lg bg-primary-container text-white flex items-center justify-center gap-2 shadow-md hover:bg-primary active:scale-[0.99] transition-all font-title-md text-title-md font-semibold disabled:opacity-60"
            >
              <span>{loading ? 'Connexion en cours...' : 'Se connecter à la flotte'}</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </form>

          {/* Raccourcis Comptes de test */}
          <div className="pt-4 border-t border-surface-container">
            <span className="font-label-caps text-[10px] text-secondary uppercase tracking-wider block text-center mb-2 font-bold">
              Comptes de test démonstration — accès direct
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleCompteDemo('admin@transport.com', 'Admin123!')}
                disabled={loading}
                className="py-1.5 px-2 rounded-lg bg-surface-container text-on-surface font-label-sm text-xs hover:bg-surface-container-high transition-colors font-medium truncate disabled:opacity-60"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleCompteDemo('gestionnaire@transport.com', 'Gestionnaire123!')}
                disabled={loading}
                className="py-1.5 px-2 rounded-lg bg-surface-container text-on-surface font-label-sm text-xs hover:bg-surface-container-high transition-colors font-medium truncate disabled:opacity-60"
              >
                Gestionnaire
              </button>
              <button
                type="button"
                onClick={() => handleCompteDemo('chauffeur@transport.com', 'Chauffeur123!')}
                disabled={loading}
                className="py-1.5 px-2 rounded-lg bg-surface-container text-on-surface font-label-sm text-xs hover:bg-surface-container-high transition-colors font-medium truncate disabled:opacity-60"
              >
                Chauffeur
              </button>
            </div>
          </div>
        </div>

        {/* Operational Badge Strip */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container-high flex items-center gap-2 shadow-xs">
            <span className="material-symbols-outlined text-primary-container text-[22px]">speed</span>
            <div className="min-w-0 flex flex-col">
              <span className="font-label-caps text-[10px] uppercase text-secondary font-bold">Contrôle</span>
              <span className="font-body-sm text-[12px] text-on-surface truncate">Pressions &amp; Taux d'usure</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container-high flex items-center gap-2 shadow-xs">
            <span className="material-symbols-outlined text-primary-container text-[22px]">history_edu</span>
            <div className="min-w-0 flex flex-col">
              <span className="font-label-caps text-[10px] uppercase text-secondary font-bold">Traçabilité</span>
              <span className="font-body-sm text-[12px] text-on-surface truncate">Rechapage &amp; Permutations</span>
            </div>
          </div>
        </div>

        {/* Security & Compliance Subtext */}
        <div className="text-center mt-6 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 text-outline">
            <span className="material-symbols-outlined text-[16px]">gite</span>
            <span className="font-label-caps text-[11px] uppercase text-secondary font-bold">
              Châssis &amp; Liaisons au Sol
            </span>
          </div>
          <p className="font-body-sm text-[12px] text-outline">
            Plateforme certifiée ISO 9001 — Flotte Trans Marhaba
          </p>
        </div>

      </div>
    </div>
  );
}
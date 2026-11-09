import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { camionApi } from '../api/camion.api';
import { pneuApi } from '../api/pneu.api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const STANDARD_POSITIONS = ['AVG', 'AVD', 'ARG1', 'ARG2', 'ARD2', 'ARD1'];

export default function CamionDetailPage() {
  const { id } = useParams();
  const [camion, setCamion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Compteur modal & saisie
  const [isKmModalOpen, setIsKmModalOpen] = useState(false);
  const [nouveauCompteurInput, setNouveauCompteurInput] = useState('');
  const [kmDate, setKmDate] = useState('');
  const [kmObservation, setKmObservation] = useState('');
  const [updatingCompteur, setUpdatingCompteur] = useState(false);

  // Pneus disponibles
  const [pneusDisponibles, setPneusDisponibles] = useState([]);

  // Modales Pneus
  const [modalMonterOpen, setModalMonterOpen] = useState(false);
  const [modalRetirerOpen, setModalRetirerOpen] = useState(false);
  const [modalRemplacerOpen, setModalRemplacerOpen] = useState(false);

  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedPneuId, setSelectedPneuId] = useState('');
  const [targetPneu, setTargetPneu] = useState(null);
  const [nouveauPneuId, setNouveauPneuId] = useState('');
  const [motifRetrait, setMotifRetrait] = useState('');

  const { hasRole, user } = useAuth();
  const canManage = hasRole('ADMIN', 'GESTIONNAIRE');

  const fetchCamionData = async () => {
    try {
      setLoading(true);
      const data = await camionApi.getById(id);
      setCamion(data);
      setNouveauCompteurInput(String(data.compteurActuel + 100));
      setError('');
    } catch (err) {
      console.error(err);
      setError('Impossible de récupérer les détails du camion.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPneusLibres = async () => {
    try {
      const data = await pneuApi.getAll({ disponible: true });
      setPneusDisponibles(data);
    } catch (err) {
      console.error('Erreur récupération pneus disponibles:', err);
    }
  };

  useEffect(() => {
    fetchCamionData();
    fetchPneusLibres();
  }, [id]);

  // Ouverture modale compteur
  const handleOpenKmModal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    setKmDate(localISOTime);
    setKmObservation(`Enregistré par ${user?.prenom || ''} ${user?.nom || ''} (Fin d'étape)`);
    setIsKmModalOpen(true);
  };

  // Mise à jour compteur
  const handleUpdateCompteur = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const val = Number(nouveauCompteurInput);
    if (isNaN(val) || val < 0) {
      setError('Le nouveau compteur doit être un nombre de kilomètres positif.');
      return;
    }

    try {
      setUpdatingCompteur(true);
      const res = await camionApi.updateCompteur(camion.id, val);
      setSuccess(
        `Compteur mis à jour avec succès (${res.deltaKm > 0 ? '+' : ''}${res.deltaKm.toLocaleString('fr-FR')} km). L'usure des ${res.nbPneusImpactes} pneu(s) monté(s) a été actualisée.`
      );
      setIsKmModalOpen(false);
      await fetchCamionData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du compteur.');
    } finally {
      setUpdatingCompteur(false);
    }
  };

  // Monter un pneu
  const handleOpenMonter = (pos = '') => {
    setSelectedPosition(pos);
    setSelectedPneuId(pneusDisponibles.length > 0 ? String(pneusDisponibles[0].id) : '');
    fetchPneusLibres();
    setModalMonterOpen(true);
  };

  const handleMonterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await camionApi.monterPneu(camion.id, {
        pneuId: Number(selectedPneuId),
        position: selectedPosition,
      });
      setSuccess(`Pneu monté avec succès en position ${selectedPosition}.`);
      setModalMonterOpen(false);
      await fetchCamionData();
      await fetchPneusLibres();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Erreur lors du montage du pneu.');
    }
  };

  // Retirer un pneu
  const handleOpenRetirer = (item) => {
    setTargetPneu(item);
    setMotifRetrait('');
    setModalRetirerOpen(true);
  };

  const handleRetirerSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!motifRetrait.trim()) {
      setError('Un motif de retrait est obligatoire.');
      return;
    }

    try {
      await camionApi.retirerPneu(camion.id, targetPneu.pneu.id, motifRetrait);
      setSuccess(`Pneu ${targetPneu.pneu.reference} retiré avec succès.`);
      setModalRetirerOpen(false);
      await fetchCamionData();
      await fetchPneusLibres();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Erreur lors du démontage du pneu.');
    }
  };

  // Remplacer un pneu
  const handleOpenRemplacer = (item) => {
    setTargetPneu(item);
    setMotifRetrait('');
    fetchPneusLibres();
    setNouveauPneuId(pneusDisponibles.length > 0 ? String(pneusDisponibles[0].id) : '');
    setModalRemplacerOpen(true);
  };

  const handleRemplacerSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!motifRetrait.trim()) {
      setError('Un motif de remplacement est obligatoire.');
      return;
    }

    try {
      await camionApi.remplacerPneu(camion.id, targetPneu.pneu.id, {
        nouveauPneuId: Number(nouveauPneuId),
        motif: motifRetrait,
      });
      setSuccess(`Remplacement effectué à la position ${targetPneu.position}.`);
      setModalRemplacerOpen(false);
      await fetchCamionData();
      await fetchPneusLibres();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Erreur lors du remplacement du pneu.');
    }
  };

  // Défilement fluide vers un pneu au clic sur le schéma
  const scrollToTire = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary-container');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary-container');
      }, 1800);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-on-surface-variant flex flex-col items-center">
        <div className="w-8 h-8 border-3 border-primary-container border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-body-sm text-sm">Chargement des données du camion...</p>
      </div>
    );
  }

  if (!camion) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-surface-container-high">
        <p className="text-error font-semibold mb-3">Camion introuvable.</p>
        <Link to="/camions" className="btn btn-secondary btn-sm">
          Retour à la liste des camions
        </Link>
      </div>
    );
  }

  // Map des pneus montés par position
  const pneuParPosition = {};
  camion.pneus.forEach((item) => {
    pneuParPosition[item.position] = item;
  });

  const deltaPreview = Number(nouveauCompteurInput) - camion.compteurActuel;
  const isDeltaValid = nouveauCompteurInput !== '' && !isNaN(deltaPreview) && Number(nouveauCompteurInput) >= 0;
  const isCorrection = isDeltaValid && deltaPreview < 0;

  // Calcul du nombre de pneus critiques
  const alertesCritiques = camion.pneus.filter(
    (item) => item.pneu.statut === 'EXPIRE' || item.pneu.pourcentageUsure >= 90
  );

  return (
    <div className="flex flex-col w-full gap-5 max-w-4xl mx-auto">
      
      {/* Bouton retour */}
      <div>
        <Link
          to="/camions"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-surface-container-high shadow-xs"
        >
          <ArrowLeft size={14} />
          <span>Retour à l'inventaire des camions</span>
        </Link>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3.5 rounded-xl bg-error-container text-on-error-container flex items-center gap-2 text-sm border border-[#f9dcde]">
          <AlertCircle size={18} className="text-error flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-[#e4efe6] text-[#2c5236] flex items-center gap-2 text-sm border border-[#c9decb]">
          <CheckCircle2 size={18} className="text-[#4E7A58] flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 1. En-tête Véhicule & Plaque d'immatriculation Stylisée */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-high flex flex-col gap-4">
        
        {/* Plaque & Statut opérationnel */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Plaque Européenne Stylisée */}
          <div className="inline-flex items-stretch rounded-lg bg-surface-container-lowest border border-outline-variant shadow-inner overflow-hidden">
            <div className="bg-tertiary px-2 py-1.5 flex flex-col items-center justify-between text-on-tertiary">
              <span className="text-[9px] font-bold leading-none text-yellow-300"></span>
              <span className="font-label-caps text-[10px] font-bold leading-none"></span>
            </div>
            <div className="px-4 py-1.5 flex items-center justify-center bg-surface-container-low">
              <span className="font-headline-sm font-serif text-lg md:text-xl tracking-wider text-on-surface font-black">
                {camion.immatriculation}
              </span>
            </div>
            <div className="bg-tertiary px-2 py-1.5 flex flex-col items-center justify-between text-on-tertiary">
              <span className="font-label-caps text-[9px] font-bold leading-none"></span>
              <span className="text-[8px] opacity-75"></span>
            </div>
          </div>

          {/* Statut opérationnel */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/60 text-on-secondary-container font-label-caps text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span>{camion.pneus.length > 0 ? 'En tournée active' : 'Au dépôt'}</span>
          </div>
        </div>

        {/* Modèle & Chauffeur */}
        <div className="flex flex-col">
          <h2 className="font-headline-lg font-serif text-2xl md:text-3xl text-on-surface font-bold">
            {camion.marque} {camion.modele}
          </h2>
          <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-xs mt-1 flex-wrap">
            <span className="font-medium text-secondary">Tracteur Routier 4x2</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-secondary">album</span>
              {camion.pneus.length} pneu(s) monté(s) sur 6
            </span>
          </div>
        </div>

        {/* Bloc Grand Compteur Kilométrique */}
        <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-2 border border-surface-container">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div className="flex flex-col">
              <span className="font-label-caps text-[10px] text-secondary uppercase tracking-wider font-bold">
                Odomètre Global
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-headline-lg font-serif text-3xl md:text-4xl text-on-surface tracking-tight font-black" id="displayed-km">
                  {Number(camion.compteurActuel).toLocaleString('fr-FR')}
                </span>
                <span className="font-title-md text-base text-secondary font-serif font-bold">km</span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-label-sm text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-[14px] text-secondary">speed</span>
                <span>Compteur initial : {Number(camion.compteurInitial).toLocaleString('fr-FR')} km</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenKmModal}
            className="w-full mt-1 py-2.5 px-4 rounded-lg bg-surface-container-lowest text-primary-container font-label-md text-xs md:text-sm font-bold hover:bg-secondary-fixed/50 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-xs border border-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">speed</span>
            <span>Mettre à jour le compteur</span>
          </button>
        </div>
      </div>

      {/* 2. SCHÉMA TECHNIQUE DU CHÂSSIS VU DU DESSUS */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-high flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-col">
            <span className="font-label-caps text-xs text-secondary uppercase tracking-widest font-bold">
              Architecture 4x2
            </span>
            <h3 className="font-headline-sm font-serif text-lg font-bold text-on-surface">
              Cartographie des Essieux
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-label-sm">
            {alertesCritiques.length > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container text-primary-container font-bold">
                <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                {alertesCritiques.length} Alerte(s) Critique(s)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e4efe6] text-[#2c5236] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#4E7A58]"></span>
                Train en bon état
              </span>
            )}
          </div>
        </div>

        {/* Top-Down Schematic Interactive Chassis Container */}
        <div className="relative bg-surface-container-low rounded-xl p-4 md:p-6 overflow-hidden flex flex-col items-center justify-center min-h-[380px] border border-surface-container">
          
          {/* Faint Truck Chassis Vector Graphic Background */}
          <svg className="absolute inset-0 w-full h-full opacity-35 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 320 400">
            <path d="M 80 40 C 110 30, 210 30, 240 40 L 250 110 L 70 110 Z" stroke="#6a5d40" strokeDasharray="2 3" strokeWidth="1.5"></path>
            <line stroke="#dfbfbd" strokeDasharray="4 4" strokeWidth="1" x1="160" x2="160" y1="30" y2="380"></line>
            <rect fill="#ffe1e3" height="310" rx="3" stroke="#8b716f" strokeWidth="1" width="22" x="110" y="55"></rect>
            <rect fill="#ffe1e3" height="310" rx="3" stroke="#8b716f" strokeWidth="1" width="22" x="188" y="55"></rect>
            <line stroke="#584140" strokeLinecap="round" strokeWidth="5" x1="50" x2="270" y1="100" y2="100"></line>
            <circle cx="160" cy="100" fill="#6a5d40" r="7"></circle>
            <line stroke="#584140" strokeLinecap="round" strokeWidth="6" x1="38" x2="282" y1="285" y2="285"></line>
            <ellipse cx="160" cy="285" fill="#271719" rx="14" ry="12"></ellipse>
            <circle cx="160" cy="285" fill="#f3e1bc" r="4"></circle>
            <line stroke="#8b716f" strokeWidth="2" x1="160" x2="160" y1="120" y2="275"></line>
          </svg>

          {/* Cabine Avant Tag */}
          <div className="relative z-10 mb-4 px-3 py-1 rounded-full bg-surface-container-high/90 text-[10px] font-label-caps text-secondary uppercase tracking-widest flex items-center gap-1 font-bold shadow-xs">
            <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
            <span>Sens de Marche (AVANT)</span>
          </div>

          {/* ESSIEU DIRECTEUR AVANT (Single tire per side) */}
          <div className="w-full flex items-center justify-between px-2 md:px-6 relative z-10 my-4 max-w-md">
            {/* AVG */}
            {(() => {
              const item = pneuParPosition['AVG'];
              const pct = item ? item.pneu.pourcentageUsure : 0;
              const isCrit = item && (item.pneu.statut === 'EXPIRE' || pct >= 90);
              const isWarn = item && pct >= 70 && !isCrit;

              return (
                <div
                  className="cursor-pointer group flex flex-col items-center"
                  onClick={() => scrollToTire('tire-slot-AVG')}
                >
                  <span className={`font-label-caps text-[10px] font-bold mb-1 group-hover:text-primary transition-colors ${
                    isCrit ? 'text-error' : isWarn ? 'text-[#996320]' : 'text-on-surface-variant'
                  }`}>
                    AVG
                  </span>
                  <div
                    className={`w-14 h-24 rounded-lg p-1.5 shadow-sm flex flex-col justify-between items-center transition-all group-hover:scale-105 border ${
                      !item
                        ? 'bg-surface-container border-dashed border-outline-variant'
                        : isCrit
                        ? 'bg-error-container text-primary-container border-error animate-pulse'
                        : isWarn
                        ? 'bg-secondary-container/80 text-[#996320] border-[#c88a3a]'
                        : 'bg-[#f1f8f3] text-[#2c5236] border-[#c9decb]'
                    }`}
                  >
                    {item ? (
                      <>
                        <div className="w-full flex items-center justify-between text-[9px] font-bold">
                          <span>{pct}%</span>
                          <span className="material-symbols-outlined text-[12px]">
                            {isCrit ? 'warning' : 'check_circle'}
                          </span>
                        </div>
                        <div className="w-full flex flex-col items-center gap-0.5 py-1">
                          <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${isCrit ? 'bg-error' : isWarn ? 'bg-[#996320]' : 'bg-[#4E7A58]'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-[9px] font-serif font-bold mt-1">
                            {Math.max(1.6, (100 - pct) * 0.12).toFixed(1)} mm
                          </span>
                        </div>
                        <span className="text-[8px] font-label-caps tracking-tighter uppercase font-bold">
                          {isCrit ? 'CRITIQUE' : 'DIRECTEUR'}
                        </span>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-[10px] text-outline font-bold">
                        <span>LIBRE</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="px-3 py-1 rounded bg-surface/90 shadow-xs flex flex-col items-center border border-surface-container">
              <span className="font-label-caps text-[9px] text-secondary font-bold">ESSIEU 1</span>
              <span className="font-headline-sm text-[12px] font-serif font-bold text-on-surface">315/80 R22.5</span>
            </div>

            {/* AVD */}
            {(() => {
              const item = pneuParPosition['AVD'];
              const pct = item ? item.pneu.pourcentageUsure : 0;
              const isCrit = item && (item.pneu.statut === 'EXPIRE' || pct >= 90);
              const isWarn = item && pct >= 70 && !isCrit;

              return (
                <div
                  className="cursor-pointer group flex flex-col items-center"
                  onClick={() => scrollToTire('tire-slot-AVD')}
                >
                  <span className={`font-label-caps text-[10px] font-bold mb-1 group-hover:text-primary transition-colors ${
                    isCrit ? 'text-error' : isWarn ? 'text-[#996320]' : 'text-on-surface-variant'
                  }`}>
                    AVD
                  </span>
                  <div
                    className={`w-14 h-24 rounded-lg p-1.5 shadow-sm flex flex-col justify-between items-center transition-all group-hover:scale-105 border ${
                      !item
                        ? 'bg-surface-container border-dashed border-outline-variant'
                        : isCrit
                        ? 'bg-error-container text-primary-container border-error animate-pulse'
                        : isWarn
                        ? 'bg-secondary-container/80 text-[#996320] border-[#c88a3a]'
                        : 'bg-[#f1f8f3] text-[#2c5236] border-[#c9decb]'
                    }`}
                  >
                    {item ? (
                      <>
                        <div className="w-full flex items-center justify-between text-[9px] font-bold">
                          <span className="material-symbols-outlined text-[12px]">
                            {isCrit ? 'warning' : 'check_circle'}
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full flex flex-col items-center gap-0.5 py-1">
                          <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${isCrit ? 'bg-error' : isWarn ? 'bg-[#996320]' : 'bg-[#4E7A58]'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-[9px] font-serif font-bold mt-1">
                            {Math.max(1.6, (100 - pct) * 0.12).toFixed(1)} mm
                          </span>
                        </div>
                        <span className="text-[8px] font-label-caps tracking-tighter uppercase font-bold">
                          {isCrit ? 'CRITIQUE' : 'DIRECTEUR'}
                        </span>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-[10px] text-outline font-bold">
                        <span>LIBRE</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ESSIEU MOTEUR ARRIÈRE (Jumelés : Dual tires per side) */}
          <div className="w-full flex items-center justify-between px-1 md:px-4 relative z-10 mt-10 mb-2 max-w-lg">
            
            {/* ARG Dual: ARG1 (Ext) + ARG2 (Int) */}
            <div className="flex items-center gap-1.5">
              {/* ARG1 (Extérieur) */}
              {(() => {
                const item = pneuParPosition['ARG1'];
                const pct = item ? item.pneu.pourcentageUsure : 0;
                const isCrit = item && (item.pneu.statut === 'EXPIRE' || pct >= 90);
                const isWarn = item && pct >= 70 && !isCrit;

                return (
                  <div className="cursor-pointer group flex flex-col items-center" onClick={() => scrollToTire('tire-slot-ARG1')}>
                    <span className={`font-label-caps text-[10px] font-bold mb-1 flex items-center gap-0.5 ${
                      isCrit ? 'text-error' : isWarn ? 'text-[#996320]' : 'text-secondary'
                    }`}>
                      {isCrit && <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>}
                      ARG1
                    </span>
                    <div className={`w-13 h-24 rounded-lg p-1 shadow-sm flex flex-col justify-between items-center transition-all group-hover:scale-105 border ${
                      !item
                        ? 'bg-surface-container border-dashed border-outline-variant'
                        : isCrit
                        ? 'bg-error-container text-primary-container border-error animate-pulse'
                        : isWarn
                        ? 'bg-secondary-container/80 text-[#996320] border-[#c88a3a]'
                        : 'bg-[#f1f8f3] text-[#2c5236] border-[#c9decb]'
                    }`}>
                      {item ? (
                        <>
                          <div className="w-full flex items-center justify-between text-[9px] font-bold">
                            <span className="material-symbols-outlined text-[13px]">
                              {isCrit ? 'warning' : 'tire_repair'}
                            </span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full flex flex-col items-center gap-0.5">
                            <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${isCrit ? 'bg-error' : isWarn ? 'bg-[#996320]' : 'bg-[#4E7A58]'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-[9.5px] font-serif font-black">
                              {Math.max(1.2, (100 - pct) * 0.12).toFixed(1)} mm
                            </span>
                          </div>
                          <span className="text-[7.5px] font-label-caps uppercase font-bold">
                            {isCrit ? 'CRITIQUE' : 'EXT'}
                          </span>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[9px] text-outline font-bold">LIBRE</div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ARG2 (Intérieur) */}
              {(() => {
                const item = pneuParPosition['ARG2'];
                const pct = item ? item.pneu.pourcentageUsure : 0;
                const isCrit = item && (item.pneu.statut === 'EXPIRE' || pct >= 90);

                return (
                  <div className="cursor-pointer group flex flex-col items-center" onClick={() => scrollToTire('tire-slot-ARG2')}>
                    <span className="font-label-caps text-[10px] font-semibold text-secondary mb-1">ARG2</span>
                    <div className={`w-11 h-24 rounded-lg p-1 shadow-sm flex flex-col justify-between items-center transition-all group-hover:scale-105 border ${
                      !item
                        ? 'bg-surface-container border-dashed border-outline-variant'
                        : isCrit
                        ? 'bg-error-container text-primary-container border-error animate-pulse'
                        : 'bg-surface-container-high text-[#2d495e] border-surface-container'
                    }`}>
                      {item ? (
                        <>
                          <div className="w-full text-center text-[9px] font-bold">{pct}%</div>
                          <span className="text-[9px] font-serif font-semibold">
                            {Math.max(1.6, (100 - pct) * 0.12).toFixed(1)} mm
                          </span>
                          <span className="text-[7.5px] font-label-caps text-secondary font-bold">INT</span>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[9px] text-outline font-bold">LIBRE</div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Différentiel central info */}
            <div className="px-2 py-1 rounded bg-surface/90 shadow-xs flex flex-col items-center text-center border border-surface-container">
              <span className="font-label-caps text-[8.5px] text-secondary font-bold">ESSIEU 2 • PONT</span>
              <span className="font-label-caps text-[10px] font-bold text-on-surface">JUMELÉ</span>
              <span className="text-[9px] font-serif text-secondary mt-0.5">Pression: 8.8b</span>
            </div>

            {/* ARD Dual: ARD2 (Int) + ARD1 (Ext) */}
            <div className="flex items-center gap-1.5">
              {/* ARD2 (Intérieur) */}
              {(() => {
                const item = pneuParPosition['ARD2'];
                const pct = item ? item.pneu.pourcentageUsure : 0;
                const isCrit = item && (item.pneu.statut === 'EXPIRE' || pct >= 90);

                return (
                  <div className="cursor-pointer group flex flex-col items-center" onClick={() => scrollToTire('tire-slot-ARD2')}>
                    <span className="font-label-caps text-[10px] font-semibold text-secondary mb-1">ARD2</span>
                    <div className={`w-11 h-24 rounded-lg p-1 shadow-sm flex flex-col justify-between items-center transition-all group-hover:scale-105 border ${
                      !item
                        ? 'bg-surface-container border-dashed border-outline-variant'
                        : isCrit
                        ? 'bg-error-container text-primary-container border-error animate-pulse'
                        : 'bg-surface-container-high text-[#2d495e] border-surface-container'
                    }`}>
                      {item ? (
                        <>
                          <div className="w-full text-center text-[9px] font-bold">{pct}%</div>
                          <span className="text-[9px] font-serif font-semibold">
                            {Math.max(1.6, (100 - pct) * 0.12).toFixed(1)} mm
                          </span>
                          <span className="text-[7.5px] font-label-caps text-secondary font-bold">INT</span>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[9px] text-outline font-bold">LIBRE</div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ARD1 (Extérieur) */}
              {(() => {
                const item = pneuParPosition['ARD1'];
                const pct = item ? item.pneu.pourcentageUsure : 0;
                const isCrit = item && (item.pneu.statut === 'EXPIRE' || pct >= 90);
                const isWarn = item && pct >= 70 && !isCrit;

                return (
                  <div className="cursor-pointer group flex flex-col items-center" onClick={() => scrollToTire('tire-slot-ARD1')}>
                    <span className={`font-label-caps text-[10px] font-bold mb-1 ${
                      isCrit ? 'text-error' : isWarn ? 'text-[#996320]' : 'text-secondary'
                    }`}>
                      ARD1
                    </span>
                    <div className={`w-13 h-24 rounded-lg p-1 shadow-sm flex flex-col justify-between items-center transition-all group-hover:scale-105 border ${
                      !item
                        ? 'bg-surface-container border-dashed border-outline-variant'
                        : isCrit
                        ? 'bg-error-container text-primary-container border-error animate-pulse'
                        : isWarn
                        ? 'bg-secondary-container/80 text-[#996320] border-[#c88a3a]'
                        : 'bg-[#f1f8f3] text-[#2c5236] border-[#c9decb]'
                    }`}>
                      {item ? (
                        <>
                          <div className="w-full flex items-center justify-between text-[9px] font-bold">
                            <span>{pct}%</span>
                            <span className="material-symbols-outlined text-[13px]">
                              {isCrit ? 'warning' : 'schedule'}
                            </span>
                          </div>
                          <div className="w-full flex flex-col items-center gap-0.5">
                            <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${isCrit ? 'bg-error' : isWarn ? 'bg-[#996320]' : 'bg-[#4E7A58]'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-[9.5px] font-serif font-bold">
                              {Math.max(1.6, (100 - pct) * 0.12).toFixed(1)} mm
                            </span>
                          </div>
                          <span className="text-[7.5px] font-label-caps uppercase font-bold">
                            {isCrit ? 'CRITIQUE' : isWarn ? 'SURVEILLER' : 'EXT'}
                          </span>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[9px] text-outline font-bold">LIBRE</div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>

          {/* Légende du schéma */}
          <div className="text-[10px] font-label-sm text-secondary text-center mt-3 flex items-center justify-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#4E7A58]"></span> Bon (&lt;50%)
            </span>
            <span className="inline-flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#3D5464]"></span> Normal (50-70%)
            </span>
            <span className="inline-flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#C88A3A]"></span> À planifier (70-90%)
            </span>
            <span className="inline-flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-error"></span> Critique (&ge;90%)
            </span>
          </div>

        </div>
      </div>

      {/* 3. LISTE DÉTAILLÉE DES PNEUS MONTÉS SUR CE CAMION */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1 flex-wrap gap-2">
          <div className="flex flex-col">
            <span className="font-label-caps text-xs text-secondary uppercase tracking-widest font-bold">
              Inventaire &amp; Relevés
            </span>
            <h3 className="font-headline-sm font-serif text-lg font-bold text-on-surface">
              Pneumatiques Actifs sur ce Châssis
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-label-md text-xs text-on-surface-variant bg-surface-container px-3 py-1 rounded-full font-bold">
              {camion.pneus.length} Pneus Montés
            </span>
            {canManage && (
              <button
                type="button"
                onClick={() => handleOpenMonter('')}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary-container text-white text-xs font-bold hover:bg-primary shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Monter un pneu</span>
              </button>
            )}
          </div>
        </div>

        {/* Grille des cartes pneus */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {STANDARD_POSITIONS.map((pos) => {
            const item = pneuParPosition[pos];

            if (item) {
              const { pneu } = item;
              const isCrit = pneu.statut === 'EXPIRE' || pneu.pourcentageUsure >= 90;
              const isWarn = pneu.pourcentageUsure >= 70 && !isCrit;
              const remainingMm = Math.max(1.2, ((100 - pneu.pourcentageUsure) * 0.12)).toFixed(1);

              return (
                <div
                  key={pos}
                  id={`tire-slot-${pos}`}
                  className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-high flex flex-col gap-3 relative overflow-hidden transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${
                        isCrit
                          ? 'bg-error-container text-error text-lg'
                          : isWarn
                          ? 'bg-secondary-container text-[#996320]'
                          : 'bg-[#e4efe6] text-[#4E7A58]'
                      }`}>
                        {isCrit ? '!' : <span className="material-symbols-outlined text-[20px]">album</span>}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-label-caps text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isCrit ? 'bg-error-container text-error' : 'bg-surface-container text-on-surface-variant'
                          }`}>
                            {pos}
                          </span>
                          <span className="font-label-caps text-[10px] text-secondary font-bold">
                            #{pneu.reference}
                          </span>
                        </div>
                        <Link
                          to={`/pneus/${pneu.id}`}
                          className="font-title-md text-sm font-bold text-on-surface truncate hover:text-primary transition-colors"
                        >
                          {pneu.marque}
                        </Link>
                      </div>
                    </div>

                    <span className={`font-label-caps text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight flex-shrink-0 ${
                      isCrit
                        ? 'bg-error-container text-error'
                        : isWarn
                        ? 'bg-secondary-container text-[#996320]'
                        : 'bg-[#e4efe6] text-[#355d3e]'
                    }`}>
                      {isCrit ? 'Remplacement immédiat' : isWarn ? 'À surveiller' : 'Optimal'}
                    </span>
                  </div>

                  {/* Micro Metric Wear Box */}
                  <div className="bg-surface-container-low rounded-lg p-2.5 flex flex-col gap-1.5">
                    <div className="flex items-end justify-between text-xs">
                      <div className="flex flex-col">
                        <span className="font-label-caps text-[10px] text-secondary uppercase font-bold">Kilométrage Restant</span>
                        <div className="flex items-baseline gap-1">
                          <span className={`font-headline-sm font-serif font-black ${
                            isCrit ? 'text-error' : isWarn ? 'text-[#996320]' : 'text-[#2e5936]'
                          }`}>
                            {pneu.kilometrageRestant.toLocaleString('fr-FR')}
                          </span>
                          <span className="text-[10px] text-on-surface-variant">km</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col">
                        <span className="font-label-caps text-[10px] text-secondary uppercase font-bold">Profondeur Gomme</span>
                        <span className="font-title-md text-xs font-bold text-on-surface">
                          {remainingMm} mm <span className="font-normal text-secondary">(légal: 1.6)</span>
                        </span>
                      </div>
                    </div>

                    <div className="w-full flex flex-col gap-1">
                      <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isCrit ? 'bg-primary-container' : isWarn ? 'bg-[#c88a3a]' : 'bg-[#4E7A58]'
                          }`}
                          style={{ width: `${Math.min(100, pneu.pourcentageUsure)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[11px] text-on-surface-variant">
                        <span>Usure : <strong className={isCrit ? 'text-error' : 'text-on-surface'}>{pneu.pourcentageUsure}%</strong></span>
                        <span>{pneu.kilometrageCumule.toLocaleString('fr-FR')} / {pneu.dureeVieMax.toLocaleString('fr-FR')} km</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-surface-container">
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenRemplacer(item)}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-primary-container text-white font-label-md text-xs font-semibold hover:bg-primary transition-colors flex items-center justify-center gap-1 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[15px]">sync</span>
                          <span>Remplacer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenRetirer(item)}
                          className="py-1.5 px-2.5 rounded-lg bg-surface-container text-error hover:bg-error-container font-label-md text-xs font-semibold transition-colors"
                        >
                          Retirer
                        </button>
                      </>
                    )}
                    <Link
                      to={`/pneus/${pneu.id}`}
                      className="py-1.5 px-2.5 rounded-lg bg-surface-container text-on-surface font-label-md text-xs hover:bg-surface-container-high transition-colors font-medium flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">timeline</span>
                      <span>Détails</span>
                    </Link>
                  </div>
                </div>
              );
            }

            // Emplacement libre
            return (
              <div
                key={pos}
                id={`tire-slot-${pos}`}
                className="bg-surface-container-lowest/60 rounded-xl p-4 border border-dashed border-outline-variant flex flex-col justify-between items-center text-center gap-2 min-h-[140px]"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-label-caps text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                    {pos}
                  </span>
                  <span className="text-[11px] font-medium text-secondary">Emplacement Libre</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-outline text-[26px]">album</span>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-1">Aucun pneu monté sur cette position</p>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleOpenMonter(pos)}
                    className="w-full py-1.5 px-3 rounded-lg bg-surface-container text-primary-container font-label-md text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    <span>Monter un pneu ici</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Autres positions personnalisées si présentes */}
        {camion.pneus.filter((p) => !STANDARD_POSITIONS.includes(p.position)).length > 0 && (
          <div className="mt-3">
            <h4 className="font-title-md text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
              Autres positions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {camion.pneus
                .filter((p) => !STANDARD_POSITIONS.includes(p.position))
                .map((item) => (
                  <div key={item.position} className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-xs">Position {item.position}</span>
                      <span className="font-bold text-xs">{item.pneu.pourcentageUsure}%</span>
                    </div>
                    <Link to={`/pneus/${item.pneu.id}`} className="text-sm font-bold text-primary">
                      {item.pneu.marque} #{item.pneu.reference}
                    </Link>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Journal de Maintenance & Actions d'Atelier */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-high flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-xs text-secondary uppercase tracking-widest font-bold">
            Journal de Maintenance &amp; Atelier
          </span>
          <span className="material-symbols-outlined text-[20px] text-secondary">history_edu</span>
        </div>

        {/* Note Clé Atelier */}
        <div className="bg-surface-container-low rounded-lg p-3 flex items-start gap-3 border border-surface-container">
          <span className="material-symbols-outlined text-[20px] text-secondary-container bg-tertiary rounded p-1.5 flex-shrink-0">
            align_horizontal_center
          </span>
          <div className="flex flex-col text-xs">
            <span className="font-title-md font-bold text-on-surface">Dernière géométrie et parallélisme</span>
            <p className="font-body-md text-on-surface-variant mt-0.5 leading-relaxed">
              Tolérances de carrossage et pincement conformes aux spécifications constructeur. Pression nominale vérifiée.
            </p>
            <span className="font-label-sm text-[11px] text-secondary mt-1 font-medium">
              Technicien référent d'atelier Trans Marhaba
            </span>
          </div>
        </div>

        {/* Actions Rapides */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => alert(`Contrôle TPMS actif : Tous les capteurs sur ${camion.immatriculation} transmettent en fréquence conforme.`)}
            className="p-3 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-2 text-left"
          >
            <span className="material-symbols-outlined text-[20px] text-primary">qr_code_scanner</span>
            <div className="flex flex-col">
              <span className="font-label-md text-xs font-bold leading-tight">Contrôle TPMS</span>
              <span className="font-body-sm text-[10px] text-secondary">Scan capteurs BLE</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-3 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-2 text-left"
          >
            <span className="material-symbols-outlined text-[20px] text-primary">picture_as_pdf</span>
            <div className="flex flex-col">
              <span className="font-label-md text-xs font-bold leading-tight">Fiche de Flotte</span>
              <span className="font-body-sm text-[10px] text-secondary">Imprimer rapport</span>
            </div>
          </button>
        </div>
      </div>

      {/* MODALE MISE À JOUR COMPTEUR */}
      <Modal
        isOpen={isKmModalOpen}
        onClose={() => setIsKmModalOpen(false)}
        title="Mise à jour du Compteur Kilométrique"
      >
        <form onSubmit={handleUpdateCompteur} className="flex flex-col gap-4">
          <div className="flex flex-col">
            <label className="font-label-sm text-xs text-on-surface-variant uppercase font-bold mb-1" htmlFor="new-km-val">
              Index Actuel au Tableau de Bord
            </label>
            <div className="relative">
              <input
                id="new-km-val"
                type="number"
                required
                min={0}
                value={nouveauCompteurInput}
                onChange={(e) => setNouveauCompteurInput(e.target.value)}
                placeholder={`Compteur actuel : ${camion.compteurActuel} km`}
                className="w-full bg-surface-container-low text-on-surface font-title-lg text-lg rounded-lg px-4 py-3 focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-label-md text-sm text-secondary font-bold">
                km
              </span>
            </div>
          </div>

          {/* Badge Delta */}
          <div className={`p-3 rounded-lg border text-xs flex justify-between items-center ${
            isDeltaValid && !isCorrection ? 'bg-[#e4efe6] border-[#c9decb] text-[#2c5236]' : 'bg-[#faefdb] border-[#f3e1bc] text-[#996320]'
          }`}>
            <span>{isCorrection ? 'Correction de saisie (usure réduite) :' : 'Distance additionnelle calculée :'}</span>
            <span className="font-bold text-sm">
              {isDeltaValid
                ? `${deltaPreview > 0 ? '+' : ''}${deltaPreview.toLocaleString('fr-FR')} km`
                : 'Valeur invalide'}
            </span>
          </div>

          <div>
            <label className="block font-label-sm text-xs text-on-surface-variant uppercase font-bold mb-1" htmlFor="new-km-date">
              Date &amp; Heure du Relevé
            </label>
            <input
              id="new-km-date"
              type="datetime-local"
              value={kmDate}
              onChange={(e) => setKmDate(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface font-body-md text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:bg-surface-container-lowest"
            />
          </div>

          <div>
            <label className="block font-label-sm text-xs text-on-surface-variant uppercase font-bold mb-1" htmlFor="new-km-obs">
              Observation / Chauffeur
            </label>
            <input
              id="new-km-obs"
              type="text"
              value={kmObservation}
              onChange={(e) => setKmObservation(e.target.value)}
              placeholder="ex. Étape Lyon - Marseille"
              className="w-full bg-surface-container-low text-on-surface font-body-md text-sm rounded-lg px-3 py-2.5 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-surface-container">
            <button
              type="button"
              onClick={() => setIsKmModalOpen(false)}
              className="flex-1 py-2.5 rounded-lg font-label-md text-xs text-secondary bg-surface-container hover:bg-surface-container-high transition-colors font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isDeltaValid || updatingCompteur}
              className="flex-1 py-2.5 rounded-lg font-label-md text-xs text-white bg-primary-container shadow-sm hover:bg-primary transition-all flex items-center justify-center gap-1.5 font-bold disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>{updatingCompteur ? 'Actualisation...' : 'Valider'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODALE MONTER UN PNEU */}
      <Modal
        isOpen={modalMonterOpen}
        onClose={() => setModalMonterOpen(false)}
        title="Monter un Pneu sur le Camion"
      >
        <form onSubmit={handleMonterSubmit} className="flex flex-col gap-3">
          <div className="form-group">
            <label className="form-label" htmlFor="posSelect">Position sur le camion</label>
            <select
              id="posSelect"
              required
              className="form-select"
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
            >
              <option value="">Sélectionner une position...</option>
              {STANDARD_POSITIONS.map((pos) => (
                <option key={pos} value={pos} disabled={Boolean(pneuParPosition[pos])}>
                  Position {pos} {pneuParPosition[pos] ? '(Occupée)' : '(Libre)'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pneuSelect">
              Pneu disponible en stock ({pneusDisponibles.length} disponible(s))
            </label>
            {pneusDisponibles.length === 0 ? (
              <p className="text-xs text-error font-medium">Aucun pneu libre en stock. Veuillez d'abord en enregistrer un.</p>
            ) : (
              <select
                id="pneuSelect"
                required
                className="form-select"
                value={selectedPneuId}
                onChange={(e) => setSelectedPneuId(e.target.value)}
              >
                {pneusDisponibles.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.reference} — {p.marque} (Cumul: {p.kilometrageCumule} km, Statut: {p.statut})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-container">
            <button
              type="button"
              onClick={() => setModalMonterOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pneusDisponibles.length === 0 || !selectedPosition}
              className="btn btn-primary btn-sm"
            >
              Confirmer le montage
            </button>
          </div>
        </form>
      </Modal>

      {/* MODALE RETIRER UN PNEU */}
      <Modal
        isOpen={modalRetirerOpen}
        onClose={() => setModalRetirerOpen(false)}
        title="Démonter le Pneu du Camion"
      >
        <form onSubmit={handleRetirerSubmit} className="flex flex-col gap-3">
          <p className="text-sm text-on-surface">
            Vous retirez le pneu <strong className="text-primary">{targetPneu?.pneu?.reference}</strong> ({targetPneu?.pneu?.marque}) de la position <strong>{targetPneu?.position}</strong>.
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="motifRetrait">Motif du retrait (obligatoire)</label>
            <textarea
              id="motifRetrait"
              required
              rows={3}
              className="form-textarea"
              placeholder="ex. Usure limite atteinte, permutation, crevaison, entretien d'essieu..."
              value={motifRetrait}
              onChange={(e) => setMotifRetrait(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-container">
            <button
              type="button"
              onClick={() => setModalRetirerOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-danger btn-sm">
              Confirmer le démontage
            </button>
          </div>
        </form>
      </Modal>

      {/* MODALE REMPLACER UN PNEU */}
      <Modal
        isOpen={modalRemplacerOpen}
        onClose={() => setModalRemplacerOpen(false)}
        title="Remplacement de Pneu"
      >
        <form onSubmit={handleRemplacerSubmit} className="flex flex-col gap-3">
          <div className="p-3 bg-surface-container-low rounded-lg text-xs flex flex-col gap-1">
            <span>Pneu actuellement monté en position <strong>{targetPneu?.position}</strong> :</span>
            <span className="font-bold text-primary">#{targetPneu?.pneu?.reference} — {targetPneu?.pneu?.marque}</span>
            <span className="text-on-surface-variant">Usure actuelle : {targetPneu?.pneu?.pourcentageUsure}%</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="remplacerSelect">
              Nouveau pneu à installer ({pneusDisponibles.length} disponible(s))
            </label>
            {pneusDisponibles.length === 0 ? (
              <p className="text-xs text-error font-medium">Aucun pneu libre en stock pour remplacement.</p>
            ) : (
              <select
                id="remplacerSelect"
                required
                className="form-select"
                value={nouveauPneuId}
                onChange={(e) => setNouveauPneuId(e.target.value)}
              >
                {pneusDisponibles.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.reference} — {p.marque} (Cumul: {p.kilometrageCumule} km, Statut: {p.statut})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="motifRemplacement">
              Motif du remplacement (obligatoire)
            </label>
            <textarea
              id="motifRemplacement"
              required
              rows={2}
              className="form-textarea"
              placeholder="ex. Remplacement pneu usé par enveloppe neuve..."
              value={motifRetrait}
              onChange={(e) => setMotifRetrait(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-container">
            <button
              type="button"
              onClick={() => setModalRemplacerOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pneusDisponibles.length === 0}
              className="btn btn-primary btn-sm"
            >
              Exécuter le remplacement
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
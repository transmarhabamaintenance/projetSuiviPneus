import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { historiqueApi } from '../api/historique.api';
import { camionApi } from '../api/camion.api';
import { pneuApi } from '../api/pneu.api';
import { Clock, Filter, RotateCcw, AlertCircle } from 'lucide-react';

export default function HistoriquePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [historique, setHistorique] = useState([]);
  const [camions, setCamions] = useState([]);
  const [pneus, setPneus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtres
  const [selectedCamion, setSelectedCamion] = useState(searchParams.get('camionId') || '');
  const [selectedPneu, setSelectedPneu] = useState(searchParams.get('pneuId') || '');
  const [statutMontage, setStatutMontage] = useState(searchParams.get('actif') || '');

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCamion) params.camionId = selectedCamion;
      if (selectedPneu) params.pneuId = selectedPneu;
      if (statutMontage) params.actif = statutMontage;

      const [histData, camionsData, pneusData] = await Promise.all([
        historiqueApi.getAll(params),
        camionApi.getAll(),
        pneuApi.getAll(),
      ]);

      setHistorique(histData);
      setCamions(camionsData);
      setPneus(pneusData);
      setError('');
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement de l'historique.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCamion, selectedPneu, statutMontage]);

  const handleResetFilters = () => {
    setSelectedCamion('');
    setSelectedPneu('');
    setStatutMontage('');
    setSearchParams({});
  };

  return (
    <div className="flex flex-col w-full gap-4">
      
      {/* En-tête de section */}
      <section className="flex flex-col gap-1">
        <span className="font-label-caps text-xs text-primary tracking-widest uppercase font-bold">
          Traçabilité Flotte
        </span>
        <h2 className="font-headline-lg font-serif text-2xl md:text-3xl text-on-surface tracking-tight">
          Historique des Montages &amp; Mouvements
        </h2>
        <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
          Journal exhaustif des installations, kilométrages parcourus et retraits de pneumatiques
        </p>
      </section>

      {error && (
        <div className="p-3 rounded-lg bg-error-container text-on-error-container flex items-center gap-2 text-sm border border-[#f9dcde]">
          <AlertCircle size={18} className="text-error flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Barre de filtres */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-high flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-surface-container">
          <Filter size={16} className="text-secondary" />
          <h3 className="font-title-md text-sm font-bold text-on-surface">Filtrer les opérations</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="font-label-sm text-xs text-on-surface-variant font-bold mb-1 block">
              Camion
            </label>
            <select
              className="w-full bg-surface-container-low text-on-surface text-sm rounded-lg px-3 py-2 border border-surface-container focus:outline-none focus:border-primary-container"
              value={selectedCamion}
              onChange={(e) => setSelectedCamion(e.target.value)}
            >
              <option value="">Tous les camions</option>
              {camions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.immatriculation} ({c.marque} {c.modele})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-label-sm text-xs text-on-surface-variant font-bold mb-1 block">
              Pneumatique
            </label>
            <select
              className="w-full bg-surface-container-low text-on-surface text-sm rounded-lg px-3 py-2 border border-surface-container focus:outline-none focus:border-primary-container"
              value={selectedPneu}
              onChange={(e) => setSelectedPneu(e.target.value)}
            >
              <option value="">Tous les pneus</option>
              {pneus.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.reference} ({p.marque})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-label-sm text-xs text-on-surface-variant font-bold mb-1 block">
              Statut du montage
            </label>
            <select
              className="w-full bg-surface-container-low text-on-surface text-sm rounded-lg px-3 py-2 border border-surface-container focus:outline-none focus:border-primary-container"
              value={statutMontage}
              onChange={(e) => setStatutMontage(e.target.value)}
            >
              <option value="">Tous les états</option>
              <option value="true">Montages en cours (Actifs)</option>
              <option value="false">Montages clôturés (Démontés)</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full py-2 px-3 rounded-lg bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tableau historique */}
      <section className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-high overflow-hidden">
        <div className="p-4 border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-secondary" />
            <h3 className="font-headline-sm font-serif text-base font-bold text-on-surface">
              Opérations enregistrées ({historique.length})
            </h3>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-on-surface-variant">
            <div className="w-8 h-8 border-3 border-primary-container border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="font-body-sm text-sm">Chargement de l'historique...</p>
          </div>
        ) : historique.length === 0 ? (
          <div className="py-12 px-4 text-center text-on-surface-variant">
            <p className="font-medium text-sm">Aucun enregistrement trouvé pour ces critères.</p>
          </div>
        ) : (
          <div className="table-container border-none shadow-none">
            <table>
              <thead>
                <tr>
                  <th>État</th>
                  <th>Camion</th>
                  <th>Position</th>
                  <th>Pneu</th>
                  <th>Installation</th>
                  <th>Retrait</th>
                  <th>Compteur Début</th>
                  <th>Compteur Fin</th>
                  <th>Km Parcourus</th>
                  <th>Motif</th>
                </tr>
              </thead>
              <tbody>
                {historique.map((h) => {
                  const estActif = !h.dateRetrait;
                  return (
                    <tr key={h.id} className={estActif ? 'bg-[#f1f8f3]/60' : 'hover:bg-surface-low'}>
                      <td>
                        {estActif ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e4efe6] text-[#2c5236] font-label-caps text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4E7A58] animate-pulse"></span>
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-caps text-[10px] font-bold">
                            Clôturé
                          </span>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/camions/${h.camion_id}`}
                          className="font-bold text-on-surface hover:text-primary transition-colors underline"
                        >
                          {h.camion_immatriculation}
                        </Link>
                      </td>
                      <td>
                        <span className="font-label-caps text-xs font-bold px-1.5 py-0.5 rounded bg-surface-container">
                          {h.position}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/pneus/${h.pneu_id}`}
                          className="font-bold text-primary hover:underline"
                        >
                          #{h.pneu_reference}
                        </Link>
                        <span className="text-xs text-on-surface-variant block">
                          {h.pneu_marque}
                        </span>
                      </td>
                      <td className="text-xs">
                        {new Date(h.dateInstallation).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="text-xs">
                        {h.dateRetrait ? (
                          new Date(h.dateRetrait).toLocaleDateString('fr-FR')
                        ) : (
                          <span className="text-[#2c5236] font-bold">En cours</span>
                        )}
                      </td>
                      <td className="text-xs">{Number(h.compteurCamionDebut || 0).toLocaleString('fr-FR')} km</td>
                      <td className="text-xs">
                        {h.compteurCamionFin !== null ? (
                          `${Number(h.compteurCamionFin).toLocaleString('fr-FR')} km`
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="font-bold text-xs">
                        {Number(h.kmParcourus || 0).toLocaleString('fr-FR')} km
                      </td>
                      <td className="text-xs italic text-on-surface-variant">
                        {h.motifRetrait || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
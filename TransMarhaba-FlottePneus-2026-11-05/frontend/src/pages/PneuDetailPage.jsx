import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { pneuApi } from '../api/pneu.api';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react';

export default function PneuDetailPage() {
  const { id } = useParams();
  const [pneu, setPneu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPneu = async () => {
    try {
      setLoading(true);
      const data = await pneuApi.getById(id);
      setPneu(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Impossible de récupérer les détails du pneu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPneu();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center text-on-surface-variant flex flex-col items-center">
        <div className="w-8 h-8 border-3 border-primary-container border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-body-sm text-sm">Chargement du pneumatique...</p>
      </div>
    );
  }

  if (!pneu) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-8 text-center border border-surface-container-high">
        <p className="text-error font-semibold mb-3">Pneumatique introuvable.</p>
        <Link to="/pneus" className="btn btn-secondary btn-sm">
          Retour à la liste des pneus
        </Link>
      </div>
    );
  }

  const remainingMm = Math.max(1.2, ((100 - pneu.pourcentageUsure) * 0.12)).toFixed(1);

  return (
    <div className="flex flex-col w-full gap-5 max-w-4xl mx-auto">
      
      {/* Bouton retour */}
      <div>
        <Link
          to="/pneus"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-surface-container-high shadow-xs"
        >
          <ArrowLeft size={14} />
          <span>Retour aux pneumatiques</span>
        </Link>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-error-container text-on-error-container flex items-center gap-2 text-sm border border-[#f9dcde]">
          <AlertCircle size={18} className="text-error flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Fiche d'identité du Pneu */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-high flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary-container flex-shrink-0">
              <span className="material-symbols-outlined text-[26px]">album</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-headline-lg font-serif text-2xl font-bold text-on-surface">
                  #{pneu.reference}
                </h1>
                <StatusBadge statut={pneu.statut} />
              </div>
              <p className="text-sm text-on-surface-variant mt-0.5 font-medium">
                Marque : <strong className="text-on-surface">{pneu.marque}</strong> — Type PL
              </p>
            </div>
          </div>

          {/* Affectation actuelle */}
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-surface-container text-right flex flex-col min-w-[200px]">
            <span className="font-label-caps text-[10px] text-secondary uppercase tracking-wider font-bold">
              Affectation Actuelle
            </span>
            {pneu.estMonte ? (
              <div className="mt-1">
                <Link
                  to={`/camions/${pneu.camion_actuel_id}`}
                  className="font-headline-sm font-serif text-base font-bold text-primary hover:underline block"
                >
                  {pneu.camion_immatriculation}
                </Link>
                <span className="font-label-caps text-[11px] font-bold text-secondary mt-0.5 inline-block">
                  Position : {pneu.position_actuelle}
                </span>
              </div>
            ) : (
              <span className="text-xs font-bold text-[#2c5236] bg-[#e4efe6] px-2.5 py-1 rounded-full mt-1 inline-block text-center">
                ● En stock (disponible)
              </span>
            )}
          </div>
        </div>

        {/* Détails kilométriques & usure */}
        <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container flex flex-col gap-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <span className="font-label-caps text-[10px] text-secondary uppercase font-bold">Cumul Actuel</span>
              <div className="font-headline-sm font-serif text-xl font-bold text-on-surface mt-0.5">
                {Number(pneu.kilometrageCumule).toLocaleString('fr-FR')} <span className="text-xs font-normal text-on-surface-variant">km</span>
              </div>
            </div>

            <div>
              <span className="font-label-caps text-[10px] text-secondary uppercase font-bold">Potentiel Max</span>
              <div className="font-headline-sm font-serif text-xl font-bold text-on-surface mt-0.5">
                {Number(pneu.dureeVieMax).toLocaleString('fr-FR')} <span className="text-xs font-normal text-on-surface-variant">km</span>
              </div>
            </div>

            <div>
              <span className="font-label-caps text-[10px] text-secondary uppercase font-bold">Vie Restante</span>
              <div className={`font-headline-sm font-serif text-xl font-bold mt-0.5 ${
                pneu.kilometrageRestant === 0 ? 'text-primary-container' : 'text-[#2c5236]'
              }`}>
                {Number(pneu.kilometrageRestant).toLocaleString('fr-FR')} <span className="text-xs font-normal text-on-surface-variant">km</span>
              </div>
            </div>

            <div>
              <span className="font-label-caps text-[10px] text-secondary uppercase font-bold">Gomme Estimée</span>
              <div className="font-headline-sm font-serif text-xl font-bold text-on-surface mt-0.5">
                {remainingMm} <span className="text-xs font-normal text-on-surface-variant">mm</span>
              </div>
            </div>
          </div>

          <ProgressBar
            pourcentage={pneu.pourcentageUsure}
            kmRestant={pneu.kilometrageRestant}
            max={pneu.dureeVieMax}
          />
        </div>
      </div>

      {/* Historique des affectations de ce pneu */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-high flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-secondary" />
            <h2 className="font-headline-sm font-serif text-lg font-bold text-on-surface">
              Historique des affectations ({pneu.historique?.length || 0})
            </h2>
          </div>
          <span className="text-xs text-on-surface-variant">
            Traçabilité des cycles de vie
          </span>
        </div>

        {(!pneu.historique || pneu.historique.length === 0) ? (
          <p className="text-center py-8 text-on-surface-variant text-sm">
            Ce pneumatique n'a pas encore été installé sur un véhicule de la flotte.
          </p>
        ) : (
          <div className="table-container border-none shadow-none">
            <table>
              <thead>
                <tr>
                  <th>Statut</th>
                  <th>Camion</th>
                  <th>Position</th>
                  <th>Installation</th>
                  <th>Retrait</th>
                  <th>Km Parcourus</th>
                  <th>Motif</th>
                </tr>
              </thead>
              <tbody>
                {pneu.historique.map((h) => {
                  const estActif = !h.dateRetrait;
                  return (
                    <tr key={h.id} className={estActif ? 'bg-[#f1f8f3]/60' : 'hover:bg-surface-low'}>
                      <td>
                        {estActif ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e4efe6] text-[#2c5236] font-label-caps text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4E7A58] animate-pulse"></span>
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-caps text-[10px] font-bold">
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
      </div>

    </div>
  );
}
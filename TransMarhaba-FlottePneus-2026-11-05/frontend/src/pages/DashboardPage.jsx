import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard.api';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Disc, Truck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getStats();
      setData(res);
      setError('');
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError('Impossible de charger les indicateurs du tableau de bord.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Format date du jour en français
  const formattedToday = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
        <div className="w-10 h-10 border-3 border-primary-container border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-body-sm text-sm">Chargement des données du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-error-container text-on-error-container flex items-center gap-3 border border-[#f9dcde]">
        <AlertTriangle className="text-error flex-shrink-0" size={20} />
        <span>{error}</span>
      </div>
    );
  }

  const { totalCamions, totalPneus, pneusParStatut, alertesCount, pneusAlertes } = data;

  const pneusEnServiceOuNeuf = (pneusParStatut?.EN_SERVICE || 0) + (pneusParStatut?.NEUF || 0);
  const pneusARemplacer = pneusParStatut?.A_REMPLACER || 0;
  const pneusExpires = pneusParStatut?.EXPIRE || 0;

  // Calcul du donut dynamique (Circonférence = 2 * PI * 40 ≈ 251.2)
  const totalCircumference = 251.2;
  const totalCountForDonut = Math.max(totalPneus, 1);
  const pctBon = Math.round((pneusEnServiceOuNeuf / totalCountForDonut) * 100);
  const pctModere = Math.round((pneusARemplacer / totalCountForDonut) * 100);
  const pctCritique = Math.max(0, 100 - pctBon - pctModere);

  const dashBon = (pctBon / 100) * totalCircumference;
  const dashModere = (pctModere / 100) * totalCircumference;
  const dashCritique = (pctCritique / 100) * totalCircumference;

  const offsetModere = -dashBon;
  const offsetCritique = -(dashBon + dashModere);

  return (
    <div className="flex flex-col w-full gap-5">
      
      {/* Header Éditorial & Salutation */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-label-caps text-xs text-secondary uppercase tracking-widest font-bold capitalize">
            {formattedToday}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest border border-surface-container-high text-on-surface-variant font-label-sm text-xs shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#4E7A58] animate-pulse"></span>
            <span>{totalCamions} camions en rotation</span>
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <h2 className="font-headline-lg font-serif text-3xl md:text-4xl text-on-surface tracking-tight">
            Bonjour, <span className="italic font-normal">{user?.prenom || 'Équipe Flotte'}</span>
          </h2>
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          Aperçu synthétique du registre de roulement et priorités d'atelier pour la journée.
        </p>
      </div>

      {/* Grille des 4 indicateurs clés */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Stat 1: Camions Actifs */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-high flex flex-col justify-between relative overflow-hidden transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">local_shipping</span>
            </div>
            <span className="font-label-caps text-[10px] px-2 py-0.5 rounded-full bg-[#4E7A58]/10 text-[#4E7A58] font-bold">
              100% OK
            </span>
          </div>
          <div>
            <div className="font-headline-md font-serif text-2xl md:text-3xl text-on-surface leading-none font-bold">
              {totalCamions}
            </div>
            <div className="font-label-sm text-xs text-on-surface-variant mt-1.5 font-medium">
              Camions actifs
            </div>
          </div>
        </div>

        {/* Stat 2: Pneus en Service */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-high flex flex-col justify-between relative overflow-hidden transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[20px]">album</span>
            </div>
            <span className="font-label-caps text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-bold">
              {totalPneus} total
            </span>
          </div>
          <div>
            <div className="font-headline-md font-serif text-2xl md:text-3xl text-on-surface leading-none font-bold">
              {pneusEnServiceOuNeuf}
            </div>
            <div className="font-label-sm text-xs text-on-surface-variant mt-1.5 font-medium">
              Pneus en service
            </div>
          </div>
        </div>

        {/* Stat 3: À Remplacer Sous 15j */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-high flex flex-col justify-between relative overflow-hidden transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-secondary-container/50 flex items-center justify-center text-[#996320]">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
            </div>
            <span className="font-label-caps text-[10px] px-2 py-0.5 rounded-full bg-[#C88A3A]/15 text-[#996320] font-bold">
              Urgent
            </span>
          </div>
          <div>
            <div className="font-headline-md font-serif text-2xl md:text-3xl text-on-surface leading-none font-bold">
              {String(pneusARemplacer).padStart(2, '0')}
            </div>
            <div className="font-label-sm text-xs text-on-surface-variant mt-1.5 font-medium">
              Sous 15 jours
            </div>
          </div>
        </div>

        {/* Stat 4: Pneus Expirés */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-high flex flex-col justify-between relative overflow-hidden transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-error-container flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined text-[20px] text-error">warning</span>
            </div>
            <span className="font-label-caps text-[10px] px-2 py-0.5 rounded-full bg-[#790D16]/10 text-primary-container font-bold">
              Critique
            </span>
          </div>
          <div>
            <div className="font-headline-md font-serif text-2xl md:text-3xl text-primary-container leading-none font-bold">
              {String(pneusExpires).padStart(2, '0')}
            </div>
            <div className="font-label-sm text-xs text-on-surface-variant mt-1.5 font-medium">
              Pneus expirés
            </div>
          </div>
        </div>
      </div>

      {/* Bloc 2 Colonnes : Donut chart & Roulage Mensuel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Operational Focus: Donut Chart & Health Distribution */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-high flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline-sm font-serif text-lg font-bold text-on-surface">État Global du Parc</h3>
              <p className="font-body-sm text-xs text-on-surface-variant">Intégrité des {totalPneus} enveloppes actives</p>
            </div>
            <span className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">donut_large</span>
            </span>
          </div>

          <div className="flex items-center gap-5 pt-1">
            {/* SVG Donut Chart */}
            <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="transparent" opacity="0.3" r="40" stroke="#f0d3d5" strokeWidth="9" />
                {/* Bon état */}
                {dashBon > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="#4E7A58"
                    strokeDasharray={`${dashBon} ${totalCircumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    strokeWidth="9"
                  />
                )}
                {/* Usure modérée */}
                {dashModere > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="#3D5464"
                    strokeDasharray={`${dashModere} ${totalCircumference}`}
                    strokeDashoffset={offsetModere}
                    strokeLinecap="round"
                    strokeWidth="9"
                  />
                )}
                {/* Critique */}
                {dashCritique > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="#790D16"
                    strokeDasharray={`${dashCritique} ${totalCircumference}`}
                    strokeDashoffset={offsetCritique}
                    strokeLinecap="round"
                    strokeWidth="9"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-headline-sm font-serif text-xl text-on-surface font-bold leading-none">
                  {pctBon}%
                </span>
                <span className="font-label-caps text-[9px] text-secondary tracking-widest uppercase mt-0.5 font-bold">
                  Sains
                </span>
              </div>
            </div>

            {/* Légende du Donut */}
            <div className="flex-1 flex flex-col justify-center gap-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4E7A58] flex-shrink-0"></span>
                  <span className="text-on-surface font-medium">Bon état (&gt; 5 mm)</span>
                </div>
                <span className="font-semibold text-on-surface">{pctBon}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3D5464] flex-shrink-0"></span>
                  <span className="text-on-surface font-medium">Usure modérée</span>
                </div>
                <span className="font-semibold text-on-surface">{pctModere}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#790D16] flex-shrink-0"></span>
                  <span className="text-on-surface font-medium">Critique (&lt; 2 mm)</span>
                </div>
                <span className="font-semibold text-primary-container">{pctCritique}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fleet Mileage Trends: Stylized Bar Chart */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-high flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline-sm font-serif text-lg font-bold text-on-surface">Roulage Mensuel</h3>
              <p className="font-body-sm text-xs text-on-surface-variant">Kilométrage total flotte (k km)</p>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded-md text-on-surface-variant font-label-caps text-[11px] font-bold">
              <span>2026</span>
            </div>
          </div>

          {/* Histogramme stylisé */}
          <div className="h-28 w-full flex items-end justify-between pt-4 px-1 gap-2">
            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
              <div className="w-full bg-[#AEC4D4]/30 rounded-t-sm h-[48%] group-hover:bg-primary-container transition-all"></div>
              <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">MAI</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
              <div className="w-full bg-[#AEC4D4]/30 rounded-t-sm h-[62%] group-hover:bg-primary-container transition-all"></div>
              <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">JUIN</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
              <div className="w-full bg-[#AEC4D4]/30 rounded-t-sm h-[88%] group-hover:bg-primary-container transition-all"></div>
              <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">JUIL</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
              <div className="w-full bg-[#AEC4D4]/30 rounded-t-sm h-[52%] group-hover:bg-primary-container transition-all"></div>
              <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">AOÛT</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
              <div className="w-full bg-[#AEC4D4]/30 rounded-t-sm h-[74%] group-hover:bg-primary-container transition-all"></div>
              <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">SEPT</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer">
              <div className="w-full bg-primary-container rounded-t-sm h-[94%] shadow-xs transition-all relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] font-bold px-1.5 py-0.5 rounded opacity-90 whitespace-nowrap">
                  184k
                </div>
              </div>
              <span className="font-label-caps text-[10px] text-primary-container font-bold">OCT</span>
            </div>
          </div>
        </div>

      </div>

      {/* Workshop Priority List: Urgent Tire Replacements */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-headline-sm font-serif text-lg font-bold text-on-surface">Urgences Atelier</h3>
            <p className="font-body-sm text-xs text-on-surface-variant">Pneus prioritaires à remplacer ({pneusAlertes?.length || 0})</p>
          </div>
          {pneusAlertes?.length > 0 && (
            <Link to="/pneus" className="font-label-sm text-xs text-primary-container font-bold hover:underline">
              Tout voir ({pneusAlertes.length})
            </Link>
          )}
        </div>

        {pneusAlertes?.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-6 text-center border border-surface-container-high flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#e4efe6] text-[#4E7A58] flex items-center justify-center mb-2">
              <CheckCircle2 size={26} />
            </div>
            <h4 className="font-headline-sm font-serif text-base font-bold text-on-surface">
              Parfait ! Aucun pneu en zone critique ou expiré.
            </h4>
            <p className="font-body-sm text-xs text-on-surface-variant mt-1">
              L'ensemble des pneumatiques affiche une usure inférieure au seuil d'alerte (90%).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pneusAlertes.map((pneu) => {
              const isExpired = pneu.statut === 'EXPIRE' || pneu.pourcentageUsure >= 100;
              const remainingMm = Math.max(1.2, ((100 - pneu.pourcentageUsure) * 0.12)).toFixed(1);

              return (
                <div
                  key={pneu.id}
                  className="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-surface-container-high flex flex-col gap-3 transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isExpired ? 'bg-error-container text-primary-container' : 'bg-secondary-container/50 text-[#996320]'
                      }`}>
                        <span className="material-symbols-outlined text-[22px]">tire_repair</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/pneus/${pneu.id}`}
                            className="font-title-md text-sm font-bold text-on-surface truncate hover:text-primary transition-colors"
                          >
                            {pneu.marque}
                          </Link>
                          <span className="font-label-caps text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold">
                            #{pneu.reference}
                          </span>
                        </div>
                        <p className="font-body-sm text-xs text-on-surface-variant truncate mt-0.5">
                          {pneu.camion_immatriculation ? (
                            <>Camion <span className="font-semibold text-on-surface">{pneu.camion_immatriculation}</span> · Pos. <span className="font-semibold text-on-surface">{pneu.position_actuelle || 'N/A'}</span></>
                          ) : (
                            <span className="italic text-secondary">Actuellement en stock</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <span className={`font-label-caps text-[10px] px-2.5 py-0.5 rounded-full font-bold flex-shrink-0 ${
                      isExpired ? 'bg-[#790D16]/10 text-primary-container' : 'bg-[#C88A3A]/15 text-[#996320]'
                    }`}>
                      {pneu.pourcentageUsure}% usure
                    </span>
                  </div>

                  {/* Micro Wear Gauge */}
                  <div className="flex flex-col gap-1.5 bg-surface-container-low rounded-lg p-2.5">
                    <div className="flex justify-between items-baseline font-body-sm text-xs">
                      <span className="text-on-surface-variant">Gomme restante estimée</span>
                      <span className={`font-bold ${isExpired ? 'text-primary-container' : 'text-[#996320]'}`}>
                        {remainingMm} mm <span className="text-[10px] font-normal text-on-surface-variant">(Seuil min: 1.6 mm)</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isExpired ? 'bg-primary-container' : 'bg-[#C88A3A]'}`}
                        style={{ width: `${Math.min(100, pneu.pourcentageUsure)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-[11px] text-on-surface-variant pt-0.5">
                      <span>Potentiel restant : ~{pneu.kilometrageRestant.toLocaleString('fr-FR')} km</span>
                      <span className={isExpired ? 'text-primary-container font-bold' : 'text-[#996320] font-medium'}>
                        {isExpired ? 'Remplacement immédiat' : 'À planifier'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
                      <span className="material-symbols-outlined text-[16px] text-[#C88A3A]">event_busy</span>
                      <span>Seuil dépassé</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {pneu.camion_actuel_id ? (
                        <Link
                          to={`/camions/${pneu.camion_actuel_id}`}
                          className="px-3.5 py-1.5 rounded-lg bg-primary-container text-white font-label-md text-xs hover:bg-primary active:scale-[0.99] transition-all shadow-xs flex items-center gap-1.5 font-semibold"
                        >
                          <span className="material-symbols-outlined text-[15px]">build</span>
                          <span>Gérer sur camion</span>
                        </Link>
                      ) : (
                        <Link
                          to={`/pneus/${pneu.id}`}
                          className="px-3.5 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-md text-xs hover:bg-surface-container-high transition-colors font-semibold"
                        >
                          <span>Détails pneu</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating CTA de bas de page */}
      <div className="pt-2">
        <Link
          to="/camions"
          className="w-full py-3.5 px-4 rounded-xl bg-primary text-on-primary font-title-md text-sm md:text-base flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-transform text-white font-semibold"
        >
          <span className="material-symbols-outlined text-[20px]">local_shipping</span>
          <span>Explorer le parc de camions &amp; odomètres</span>
        </Link>
      </div>

    </div>
  );
}
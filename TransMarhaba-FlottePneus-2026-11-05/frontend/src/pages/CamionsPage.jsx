import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { camionApi } from '../api/camion.api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { AlertCircle, CheckCircle2, Edit2, History, Trash2 } from 'lucide-react';

export default function CamionsPage() {
  const [camions, setCamions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'service', 'warning', 'depot'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modale création / édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamion, setEditingCamion] = useState(null);
  const [formData, setFormData] = useState({
    immatriculation: '',
    marque: '',
    modele: '',
    compteurInitial: '',
  });

  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'GESTIONNAIRE');

  const fetchCamions = async () => {
    try {
      setLoading(true);
      const data = await camionApi.getAll();
      setCamions(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Impossible de récupérer la liste des camions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamions();
  }, []);

  const openCreateModal = () => {
    setEditingCamion(null);
    setFormData({
      immatriculation: '',
      marque: '',
      modele: '',
      compteurInitial: '0',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (camion, e) => {
    if (e) e.stopPropagation();
    setEditingCamion(camion);
    setFormData({
      immatriculation: camion.immatriculation,
      marque: camion.marque,
      modele: camion.modele,
      compteurInitial: camion.compteurInitial,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingCamion) {
        await camionApi.update(editingCamion.id, {
          immatriculation: formData.immatriculation,
          marque: formData.marque,
          modele: formData.modele,
        });
        setSuccess('Informations du camion mises à jour avec succès.');
      } else {
        await camionApi.create({
          immatriculation: formData.immatriculation,
          marque: formData.marque,
          modele: formData.modele,
          compteurInitial: Number(formData.compteurInitial),
        });
        setSuccess('Nouveau camion enregistré avec succès.');
      }
      setIsModalOpen(false);
      fetchCamions();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Une erreur est survenue lors de l'enregistrement.");
    }
  };

  const handleDelete = async (camion, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Confirmez-vous la suppression du camion ${camion.immatriculation} ?`)) {
      return;
    }
    try {
      await camionApi.delete(camion.id);
      setSuccess(`Le camion ${camion.immatriculation} a été supprimé.`);
      fetchCamions();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression du camion.');
    }
  };

  // Filtrage combiné (Recherche + Filtres d'état)
  const filteredCamions = camions.filter((c) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      c.immatriculation.toLowerCase().includes(term) ||
      c.marque.toLowerCase().includes(term) ||
      c.modele.toLowerCase().includes(term);

    const nbPneus = Number(c.nbPneusActifs || 0);

    let matchesFilter = true;
    if (filterStatus === 'service') {
      matchesFilter = nbPneus > 0;
    } else if (filterStatus === 'depot') {
      matchesFilter = nbPneus === 0;
    } else if (filterStatus === 'warning') {
      // S'il a moins de 4 pneus ou un compteur très élevé
      matchesFilter = nbPneus > 0 && nbPneus < 6;
    }

    return matchesSearch && matchesFilter;
  });

  const countService = camions.filter((c) => Number(c.nbPneusActifs || 0) > 0).length;
  const countDepot = camions.filter((c) => Number(c.nbPneusActifs || 0) === 0).length;
  const countWarning = camions.filter((c) => Number(c.nbPneusActifs || 0) > 0 && Number(c.nbPneusActifs || 0) < 6).length;

  return (
    <div className="flex flex-col w-full gap-4">
      
      {/* En-tête de section */}
      <section className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div className="flex flex-col min-w-0">
            <span className="font-label-caps text-xs text-primary tracking-widest uppercase font-bold">
              Inventaire Actif
            </span>
            <h2 className="font-headline-lg font-serif text-2xl md:text-3xl text-on-surface tracking-tight">
              Parc de Camions
            </h2>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              {camions.length} véhicules enregistrés au registre
            </p>
          </div>

          {canManage && (
            <button
              id="add-truck-btn"
              type="button"
              onClick={openCreateModal}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-container text-white shadow-sm active:scale-95 transition-all font-semibold hover:bg-primary"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="font-label-md text-xs tracking-wide">Ajouter</span>
            </button>
          )}
        </div>

        {/* Messages d'alerte */}
        {error && (
          <div className="p-3 rounded-lg bg-error-container text-on-error-container flex items-center gap-2 text-sm border border-[#f9dcde]">
            <AlertCircle size={18} className="text-error flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-[#e4efe6] text-[#2c5236] flex items-center gap-2 text-sm border border-[#c9decb]">
            <CheckCircle2 size={18} className="text-[#4E7A58] flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Barre de recherche */}
        <div className="relative w-full mt-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
            search
          </span>
          <input
            id="truck-search"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par immatriculation ou modèle..."
            className="w-full bg-surface-container-lowest text-on-surface font-body-md text-sm placeholder:text-on-surface-variant/50 rounded-xl pl-10 pr-10 py-2.5 shadow-xs border border-surface-container-high focus:outline-none focus:border-primary-container transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Filtres horizontaux défilables */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none" role="tablist">
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex-shrink-0 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full font-label-caps text-xs transition-colors shadow-xs ${
              filterStatus === 'all'
                ? 'bg-primary-container text-white font-bold'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span>Tous</span>
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${filterStatus === 'all' ? 'bg-white/20 text-white' : 'bg-surface-container-highest text-on-surface-variant'}`}>
              {camions.length}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('service')}
            className={`flex-shrink-0 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full font-label-caps text-xs transition-colors shadow-xs ${
              filterStatus === 'service'
                ? 'bg-primary-container text-white font-bold'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span>En service</span>
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${filterStatus === 'service' ? 'bg-white/20 text-white' : 'bg-surface-container-highest text-on-surface-variant'}`}>
              {countService}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('warning')}
            className={`flex-shrink-0 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full font-label-caps text-xs transition-colors shadow-xs ${
              filterStatus === 'warning'
                ? 'bg-primary-container text-white font-bold'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span>Montage partiel</span>
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${filterStatus === 'warning' ? 'bg-white/20 text-white' : 'bg-error-container text-on-error-container'}`}>
              {countWarning}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('depot')}
            className={`flex-shrink-0 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full font-label-caps text-xs transition-colors shadow-xs ${
              filterStatus === 'depot'
                ? 'bg-primary-container text-white font-bold'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span>Au dépôt</span>
            <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${filterStatus === 'depot' ? 'bg-white/20 text-white' : 'bg-surface-container-highest text-on-surface-variant'}`}>
              {countDepot}
            </span>
          </button>
        </div>
      </section>

      {/* Liste des cartes de camions */}
      <section className="flex flex-col gap-3.5" id="trucks-container">
        {loading ? (
          <div className="py-20 text-center text-on-surface-variant">
            <div className="w-8 h-8 border-3 border-primary-container border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="font-body-sm text-sm">Chargement des véhicules...</p>
          </div>
        ) : filteredCamions.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl py-12 px-6 flex flex-col items-center justify-center text-center border border-surface-container-high" id="empty-state">
            <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-3">
              <span className="material-symbols-outlined text-[28px]">search_off</span>
            </div>
            <h4 className="font-headline-sm font-serif text-lg font-bold text-on-surface">Aucun camion trouvé</h4>
            <p className="font-body-sm text-xs text-on-surface-variant max-w-xs mt-1">
              Modifiez vos critères de recherche ou réinitialisez les filtres sélectionnés.
            </p>
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
              className="mt-4 px-4 py-2 rounded-lg bg-surface-container-highest text-on-surface font-label-md text-xs font-semibold hover:bg-surface-container-high transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          filteredCamions.map((camion) => {
            const nbPneus = Number(camion.nbPneusActifs || 0);
            const isFull = nbPneus >= 6;
            const isEmpty = nbPneus === 0;

            // Déterminer la couleur de la bande latérale et le badge
            let stripeColor = 'bg-tertiary-container';
            let badgeEl = (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-caps text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                Train complet ({nbPneus}/6)
              </span>
            );

            if (isEmpty) {
              stripeColor = 'bg-outline';
              badgeEl = (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-caps text-[10px] font-bold">
                  Au dépôt (0 pneu)
                </span>
              );
            } else if (!isFull) {
              stripeColor = 'bg-secondary';
              badgeEl = (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-caps text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  À compléter ({nbPneus}/6)
                </span>
              );
            }

            // Calcul d'un score de santé approximatif
            const healthPct = isFull ? 92 : isEmpty ? 0 : Math.round((nbPneus / 6) * 85);

            return (
              <article
                key={camion.id}
                className="truck-card group relative bg-surface-container-lowest rounded-[14px] p-4 shadow-[0_2px_8px_-2px_rgba(42,26,28,0.05),0_1px_3px_0_rgba(42,26,28,0.02)] border border-surface-container-high transition-transform duration-150 active:scale-[0.99] overflow-hidden"
              >
                {/* Indicateur latéral d'état */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${stripeColor}`}></div>

                <div className="flex flex-col gap-3 pl-1.5">
                  {/* Ligne d'en-tête : Plaque + Badge état */}
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex flex-col min-w-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-surface-container text-on-surface font-label-caps text-[11px] tracking-widest uppercase font-bold w-fit">
                        {camion.immatriculation}
                      </span>
                      <h3 className="font-headline-sm font-serif text-lg font-bold text-on-surface mt-1 leading-snug truncate">
                        {camion.marque} {camion.modele}
                      </h3>
                    </div>
                    {badgeEl}
                  </div>

                  {/* Données d'exploitation (Kilométrage, Configuration) */}
                  <div className="grid grid-cols-2 gap-2 py-2 px-3 rounded-lg bg-surface-container-low">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">Kilométrage Actuel</span>
                      <span className="font-headline-sm font-serif text-base font-bold text-on-surface tracking-tight mt-0.5">
                        {Number(camion.compteurActuel).toLocaleString('fr-FR')}{' '}
                        <span className="font-body-sm text-xs text-on-surface-variant font-normal">km</span>
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">Configuration</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="material-symbols-outlined text-[17px] text-on-surface-variant">album</span>
                        <span className="font-title-md text-sm font-bold text-on-surface">
                          {nbPneus} pneu(s) monté(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Jauge de train */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-label-sm text-on-surface-variant">Taux d'armement train</span>
                      <span className="font-label-md font-bold text-on-surface">{healthPct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          healthPct >= 80 ? 'bg-[#4E7A58]' : healthPct > 0 ? 'bg-secondary' : 'bg-outline-variant'
                        }`}
                        style={{ width: `${Math.max(healthPct, 4)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Pied de carte : Navigation action & Boutons admin */}
                  <div className="flex items-center justify-between pt-1 border-t border-surface-container flex-wrap gap-2">
                    <span className="font-body-sm text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-secondary">speed</span>
                      Compteur initial : {Number(camion.compteurInitial).toLocaleString('fr-FR')} km
                    </span>

                    <div className="flex items-center gap-2">
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => openEditModal(camion, e)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                            title="Modifier ce camion"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(camion, e)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors"
                            title="Supprimer ce camion"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}

                      <Link
                        to={`/historique?camionId=${camion.id}`}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                        title={`Historique des pneumatiques de ${camion.immatriculation}`}
                      >
                        <History size={15} />
                      </Link>

                      <Link
                        to={`/camions/${camion.id}`}
                        className="inline-flex items-center gap-1 font-label-md text-xs text-primary font-bold hover:text-primary-container group-hover:translate-x-0.5 transition-all ml-1"
                      >
                        <span>Consulter le véhicule</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Pagination / Pied de page */}
      <footer className="py-4 flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
          <span className="font-label-sm tracking-wide" id="pagination-counter">
            Affichage {filteredCamions.length} sur {camions.length} véhicules
          </span>
        </div>
      </footer>

      {/* Modale d'ajout / modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCamion ? 'Modifier le Camion' : 'Nouveau Camion Flotte'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="form-group">
            <label className="form-label" htmlFor="immat">Immatriculation</label>
            <input
              id="immat"
              type="text"
              required
              className="form-input uppercase"
              placeholder="ex. AA-404-TK"
              value={formData.immatriculation}
              onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label" htmlFor="marque">Marque</label>
              <input
                id="marque"
                type="text"
                required
                className="form-input"
                placeholder="ex. Mercedes-Benz"
                value={formData.marque}
                onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="modele">Modèle</label>
              <input
                id="modele"
                type="text"
                required
                className="form-input"
                placeholder="ex. Actros 1845"
                value={formData.modele}
                onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
              />
            </div>
          </div>

          {!editingCamion && (
            <div className="form-group">
              <label className="form-label" htmlFor="compteurInit">
                Compteur initial du véhicule (km)
              </label>
              <input
                id="compteurInit"
                type="number"
                min="0"
                required
                className="form-input"
                placeholder="0"
                value={formData.compteurInitial}
                onChange={(e) => setFormData({ ...formData, compteurInitial: e.target.value })}
              />
              <span className="text-[11px] text-on-surface-variant mt-1 block">
                Règle métier : le compteur actuel sera initialisé avec cette valeur.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-container">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
            >
              {editingCamion ? 'Enregistrer les modifications' : 'Créer le camion'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
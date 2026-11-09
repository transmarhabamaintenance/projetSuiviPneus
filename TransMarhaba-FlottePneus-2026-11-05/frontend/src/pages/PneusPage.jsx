import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pneuApi } from '../api/pneu.api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PneusPage() {
  const [pneus, setPneus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [dispoFilter, setDispoFilter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modale création / édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPneu, setEditingPneu] = useState(null);
  const [formData, setFormData] = useState({
    reference: '',
    marque: '',
    dureeVieMax: '1150',
    kilometrageCumule: '0',
  });

  const { hasRole } = useAuth();
  const canManage = hasRole('ADMIN', 'GESTIONNAIRE');

  const fetchPneus = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statutFilter) params.statut = statutFilter;
      if (dispoFilter === 'libre') params.disponible = true;

      const data = await pneuApi.getAll(params);
      setPneus(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Impossible de récupérer la liste des pneus.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPneus();
  }, [statutFilter, dispoFilter]);

  const openCreateModal = () => {
    setEditingPneu(null);
    setFormData({
      reference: '',
      marque: '',
      dureeVieMax: '1150',
      kilometrageCumule: '0',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (pneu, e) => {
    if (e) e.stopPropagation();
    setEditingPneu(pneu);
    setFormData({
      reference: pneu.reference,
      marque: pneu.marque,
      dureeVieMax: String(pneu.dureeVieMax),
      kilometrageCumule: String(pneu.kilometrageCumule),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingPneu) {
        await pneuApi.update(editingPneu.id, {
          reference: formData.reference,
          marque: formData.marque,
          dureeVieMax: Number(formData.dureeVieMax),
          kilometrageCumule: Number(formData.kilometrageCumule),
        });
        setSuccess('Pneu modifié avec succès.');
      } else {
        await pneuApi.create({
          reference: formData.reference,
          marque: formData.marque,
          dureeVieMax: Number(formData.dureeVieMax),
          kilometrageCumule: Number(formData.kilometrageCumule),
        });
        setSuccess('Nouveau pneu enregistré avec succès.');
      }
      setIsModalOpen(false);
      fetchPneus();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement du pneu.");
    }
  };

  const handleDelete = async (pneu, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Confirmez-vous la suppression du pneu ${pneu.reference} ?`)) {
      return;
    }
    try {
      await pneuApi.delete(pneu.id);
      setSuccess(`Le pneu ${pneu.reference} a été supprimé.`);
      fetchPneus();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const filteredPneus = pneus.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    const matchSearch =
      !term ||
      p.reference.toLowerCase().includes(term) ||
      p.marque.toLowerCase().includes(term) ||
      (p.camion_immatriculation && p.camion_immatriculation.toLowerCase().includes(term));

    if (dispoFilter === 'monte') {
      return matchSearch && p.estMonte;
    }
    return matchSearch;
  });

  return (
    <div className="flex flex-col w-full gap-4">
      
      {/* En-tête de section */}
      <section className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div className="flex flex-col min-w-0">
            <span className="font-label-caps text-xs text-primary tracking-widest uppercase font-bold">
              Registre Technique
            </span>
            <h2 className="font-headline-lg font-serif text-2xl md:text-3xl text-on-surface tracking-tight">
              Parc de Pneumatiques
            </h2>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              {pneus.length} enveloppes référencées et sous suivi d'usure
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={openCreateModal}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-container text-white shadow-sm active:scale-95 transition-all font-semibold hover:bg-primary"
            >
              <Plus size={18} />
              <span className="font-label-md text-xs tracking-wide">Nouveau Pneu</span>
            </button>
          )}
        </div>

        {/* Messages */}
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

        {/* Barre de filtres et recherche */}
        <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-xs border border-surface-container-high grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              className="w-full bg-surface-container-low text-on-surface text-sm rounded-lg pl-9 pr-8 py-2 border border-surface-container focus:outline-none focus:border-primary-container"
              placeholder="Référence, marque, camion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <div>
            <select
              className="w-full bg-surface-container-low text-on-surface text-sm rounded-lg px-3 py-2 border border-surface-container focus:outline-none focus:border-primary-container"
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="NEUF">Neuf</option>
              <option value="EN_SERVICE">En service</option>
              <option value="A_REMPLACER">À remplacer (≥ 90%)</option>
              <option value="EXPIRE">Expiré (≥ 100%)</option>
            </select>
          </div>

          <div>
            <select
              className="w-full bg-surface-container-low text-on-surface text-sm rounded-lg px-3 py-2 border border-surface-container focus:outline-none focus:border-primary-container"
              value={dispoFilter}
              onChange={(e) => setDispoFilter(e.target.value)}
            >
              <option value="">Toutes les affectations</option>
              <option value="monte">Montés sur camion</option>
              <option value="libre">En stock (disponibles)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Liste des pneus */}
      <section className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-high overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-on-surface-variant">
            <div className="w-8 h-8 border-3 border-primary-container border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="font-body-sm text-sm">Chargement du registre des pneus...</p>
          </div>
        ) : filteredPneus.length === 0 ? (
          <div className="py-12 px-4 text-center text-on-surface-variant">
            <p className="font-medium text-sm">Aucun pneumatique ne correspond aux critères.</p>
          </div>
        ) : (
          <div className="table-container border-none shadow-none">
            <table>
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Marque</th>
                  <th>Statut</th>
                  <th style={{ minWidth: '180px' }}>Progression d'usure</th>
                  <th>Kilométrage</th>
                  <th>Affectation</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPneus.map((pneu) => (
                  <tr key={pneu.id} className="hover:bg-surface-low transition-colors">
                    <td>
                      <Link
                        to={`/pneus/${pneu.id}`}
                        className="font-bold text-primary hover:underline"
                      >
                        #{pneu.reference}
                      </Link>
                    </td>
                    <td className="font-medium text-on-surface">{pneu.marque}</td>
                    <td>
                      <StatusBadge statut={pneu.statut} />
                    </td>
                    <td>
                      <ProgressBar
                        pourcentage={pneu.pourcentageUsure}
                        kmRestant={pneu.kilometrageRestant}
                        max={pneu.dureeVieMax}
                      />
                    </td>
                    <td>
                      <div className="text-xs">
                        <span className="font-bold text-on-surface">
                          {Number(pneu.kilometrageCumule).toLocaleString('fr-FR')} km
                        </span>
                        <span className="text-on-surface-variant">
                          {' '}/ {Number(pneu.dureeVieMax).toLocaleString('fr-FR')} km
                        </span>
                      </div>
                    </td>
                    <td>
                      {pneu.camion_immatriculation ? (
                        <div className="text-xs flex flex-col">
                          <Link
                            to={`/camions/${pneu.camion_actuel_id}`}
                            className="font-bold text-on-surface hover:text-primary transition-colors underline"
                          >
                            {pneu.camion_immatriculation}
                          </Link>
                          <span className="text-secondary font-label-caps text-[10px]">
                            Pos. {pneu.position_actuelle || '-'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs italic text-secondary bg-surface-container px-2 py-0.5 rounded">
                          En stock
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="inline-flex items-center gap-1.5">
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => openEditModal(pneu, e)}
                              className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                              title="Modifier ce pneu"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(pneu, e)}
                              className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors"
                              title="Supprimer ce pneu"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        <Link
                          to={`/pneus/${pneu.id}`}
                          className="px-2.5 py-1 rounded bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors"
                        >
                          Détails
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modale d'ajout / modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPneu ? 'Modifier le Pneumatique' : 'Enregistrer un Nouveau Pneu'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="form-group">
            <label className="form-label" htmlFor="ref">Numéro de Référence / Série</label>
            <input
              id="ref"
              type="text"
              required
              className="form-input"
              placeholder="ex. P-9042 ou MICH-X12"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="marquePneu">Marque &amp; Modèle</label>
            <input
              id="marquePneu"
              type="text"
              required
              className="form-input"
              placeholder="ex. Michelin X Multi D"
              value={formData.marque}
              onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label" htmlFor="dureeMax">
                Durée de vie max (km)
              </label>
              <input
                id="dureeMax"
                type="number"
                min="100"
                required
                className="form-input"
                placeholder="ex. 120000"
                value={formData.dureeVieMax}
                onChange={(e) => setFormData({ ...formData, dureeVieMax: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="kmCumule">
                Kilométrage initial cumulé
              </label>
              <input
                id="kmCumule"
                type="number"
                min="0"
                required
                className="form-input"
                placeholder="0"
                value={formData.kilometrageCumule}
                onChange={(e) => setFormData({ ...formData, kilometrageCumule: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-container">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              {editingPneu ? 'Enregistrer les modifications' : 'Créer le pneumatique'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
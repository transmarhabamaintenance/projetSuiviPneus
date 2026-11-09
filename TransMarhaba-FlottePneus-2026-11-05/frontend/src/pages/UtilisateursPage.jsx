import React, { useState, useEffect } from 'react';
import { utilisateurApi } from '../api/utilisateur.api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

export default function UtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modale
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    role_id: '2',
  });

  const { user: currentUser } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        utilisateurApi.getAll(),
        utilisateurApi.getRoles(),
      ]);
      setUtilisateurs(usersData);
      setRoles(rolesData);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Impossible de récupérer les utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      motDePasse: '',
      role_id: roles.length > 0 ? String(roles[0].id) : '2',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      motDePasse: '',
      role_id: String(u.role_id),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingUser) {
        await utilisateurApi.update(editingUser.id, {
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          motDePasse: formData.motDePasse || undefined,
          role_id: Number(formData.role_id),
        });
        setSuccess('Utilisateur mis à jour avec succès.');
      } else {
        await utilisateurApi.create({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          motDePasse: formData.motDePasse,
          role_id: Number(formData.role_id),
        });
        setSuccess('Nouvel utilisateur créé avec succès.');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement de l'utilisateur.");
    }
  };

  const handleDelete = async (u) => {
    if (u.id === currentUser?.id) {
      alert('Vous ne pouvez pas supprimer votre propre compte.');
      return;
    }

    if (!window.confirm(`Confirmez-vous la suppression de l'utilisateur ${u.prenom} ${u.nom} (${u.email}) ?`)) {
      return;
    }

    try {
      await utilisateurApi.delete(u.id);
      setSuccess(`Utilisateur ${u.email} supprimé.`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  return (
    <div className="flex flex-col w-full gap-4">
      
      {/* En-tête de section */}
      <section className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div className="flex flex-col min-w-0">
            <span className="font-label-caps text-xs text-primary tracking-widest uppercase font-bold">
              Administration &amp; Sécurité
            </span>
            <h2 className="font-headline-lg font-serif text-2xl md:text-3xl text-on-surface tracking-tight">
              Gestion de l'Équipe &amp; Rôles
            </h2>
            <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
              Gestion des comptes d'accès, permissions et techniciens de flotte
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-container text-white shadow-sm active:scale-95 transition-all font-semibold hover:bg-primary"
          >
            <Plus size={18} />
            <span className="font-label-md text-xs tracking-wide">Nouvel Utilisateur</span>
          </button>
        </div>

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
      </section>

      {/* Tableau des utilisateurs */}
      <section className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-high overflow-hidden">
        <div className="p-4 border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-secondary" />
            <h3 className="font-headline-sm font-serif text-base font-bold text-on-surface">
              Membres autorisés ({utilisateurs.length})
            </h3>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-on-surface-variant">
            <div className="w-8 h-8 border-3 border-primary-container border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="font-body-sm text-sm">Chargement de l'équipe...</p>
          </div>
        ) : (
          <div className="table-container border-none shadow-none">
            <table>
              <thead>
                <tr>
                  <th>Nom &amp; Prénom</th>
                  <th>Adresse Email</th>
                  <th>Rôle attribué</th>
                  <th>Description du rôle</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((u) => {
                  const roleNom = u.role?.nom || 'Inconnu';
                  const isCurrent = u.id === currentUser?.id;

                  let roleBadgeClass = 'bg-surface-container text-on-surface-variant';
                  if (roleNom === 'ADMIN') {
                    roleBadgeClass = 'bg-primary-container/15 text-primary-container border border-primary-container/20';
                  } else if (roleNom === 'GESTIONNAIRE') {
                    roleBadgeClass = 'bg-secondary-container text-on-secondary-container border border-[#e5d3af]';
                  } else if (roleNom === 'CHAUFFEUR') {
                    roleBadgeClass = 'bg-[#e2ecf3] text-[#132834] border border-[#cfe6f6]';
                  }

                  return (
                    <tr key={u.id} className="hover:bg-surface-low transition-colors">
                      <td className="font-bold text-on-surface">
                        {u.prenom} {u.nom}
                        {isCurrent && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-[#e4efe6] text-[#2c5236] font-bold">
                            Vous
                          </span>
                        )}
                      </td>
                      <td className="text-sm text-on-surface-variant">{u.email}</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-label-caps text-[10px] font-bold tracking-wider ${roleBadgeClass}`}>
                          {roleNom}
                        </span>
                      </td>
                      <td className="text-xs text-on-surface-variant">
                        {u.role?.description || '-'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                            title="Modifier ce profil"
                          >
                            <Edit2 size={14} />
                          </button>
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleDelete(u)}
                              className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors"
                              title="Supprimer ce compte"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal Création / Modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Modifier l'Utilisateur" : 'Créer un Compte Équipe'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label" htmlFor="prenom">Prénom *</label>
              <input
                id="prenom"
                type="text"
                className="form-input"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="nom">Nom *</label>
              <input
                id="nom"
                type="text"
                className="form-input"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="emailUser">Adresse Email Professionnelle *</label>
            <input
              id="emailUser"
              type="email"
              className="form-input"
              placeholder="technicien@trans-marhaba.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="passwordUser">
              {editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas modifier)' : 'Mot de passe initial *'}
            </label>
            <input
              id="passwordUser"
              type="password"
              className="form-input"
              placeholder={editingUser ? '•••••••• (inchangé)' : 'Minimum 6 caractères'}
              value={formData.motDePasse}
              onChange={(e) => setFormData({ ...formData, motDePasse: e.target.value })}
              required={!editingUser}
              minLength={editingUser ? 0 : 6}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="roleSelect">Rôle et Niveau d'Habilitation *</label>
            <select
              id="roleSelect"
              className="form-select"
              value={formData.role_id}
              onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
              required
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nom} — {r.description}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-container">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsModalOpen(false)}
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              {editingUser ? 'Sauvegarder' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
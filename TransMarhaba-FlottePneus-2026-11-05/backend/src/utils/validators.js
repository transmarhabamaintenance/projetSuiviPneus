const { z } = require('zod');

// Schéma Connexion
const loginSchema = z.object({
  email: z.string().email('Format d\'email invalide'),
  motDePasse: z.string().min(1, 'Le mot de passe est obligatoire'),
});

// Schémas Utilisateur
const createUtilisateurSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  email: z.string().email('Format d\'email invalide'),
  motDePasse: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  role_id: z.coerce.number().int().positive('Le rôle est obligatoire'),
});

const updateUtilisateurSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').optional(),
  email: z.string().email('Format d\'email invalide').optional(),
  motDePasse: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').optional().or(z.literal('')),
  role_id: z.coerce.number().int().positive().optional(),
});

// Schémas Camion
const createCamionSchema = z.object({
  immatriculation: z.string().min(3, 'L\'immatriculation est obligatoire'),
  marque: z.string().min(2, 'La marque est obligatoire'),
  modele: z.string().min(1, 'Le modèle est obligatoire'),
  compteurInitial: z.coerce.number().min(0, 'Le compteur initial doit être supérieur ou égal à 0'),
});

const updateCamionSchema = z.object({
  immatriculation: z.string().min(3).optional(),
  marque: z.string().min(2).optional(),
  modele: z.string().min(1).optional(),
});

const updateCompteurSchema = z.object({
  nouveauCompteur: z.coerce.number().min(0, 'Le compteur doit être un nombre positif'),
});

// Schémas Pneu
const createPneuSchema = z.object({
  reference: z.string().min(2, 'La référence est obligatoire'),
  marque: z.string().min(2, 'La marque est obligatoire'),
  dureeVieMax: z.coerce.number().positive('La durée de vie doit être positive').optional(),
  kilometrageCumule: z.coerce.number().min(0, 'Le kilométrage cumulé doit être supérieur ou égal à 0').optional(),
});

const updatePneuSchema = z.object({
  reference: z.string().min(2).optional(),
  marque: z.string().min(2).optional(),
  dureeVieMax: z.coerce.number().positive().optional(),
  kilometrageCumule: z.coerce.number().min(0).optional(),
});

// Montage, retrait, remplacement
const monterPneuSchema = z.object({
  pneuId: z.coerce.number().int().positive('L\'identifiant du pneu est obligatoire'),
  position: z.string().min(2, 'La position est obligatoire (ex: AVG, AVD, ARG1, ARD1)'),
});

const retirerPneuSchema = z.object({
  motif: z.string().min(2, 'Le motif de retrait est obligatoire'),
});

const remplacerPneuSchema = z.object({
  nouveauPneuId: z.coerce.number().int().positive('L\'identifiant du nouveau pneu est obligatoire'),
  motif: z.string().min(2, 'Le motif du remplacement est obligatoire'),
});

module.exports = {
  loginSchema,
  createUtilisateurSchema,
  updateUtilisateurSchema,
  createCamionSchema,
  updateCamionSchema,
  updateCompteurSchema,
  createPneuSchema,
  updatePneuSchema,
  monterPneuSchema,
  retirerPneuSchema,
  remplacerPneuSchema,
};

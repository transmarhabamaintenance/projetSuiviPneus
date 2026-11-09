import api from './axios';

export const camionApi = {
  getAll: async () => {
    const response = await api.get('/camions');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/camions/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/camions', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/camions/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/camions/${id}`);
    return response.data;
  },

  updateCompteur: async (id, nouveauCompteur) => {
    const response = await api.patch(`/camions/${id}/compteur`, { nouveauCompteur });
    return response.data;
  },

  monterPneu: async (camionId, { pneuId, position }) => {
    const response = await api.post(`/camions/${camionId}/pneus`, { pneuId, position });
    return response.data;
  },

  retirerPneu: async (camionId, pneuId, motif) => {
    const response = await api.post(`/camions/${camionId}/pneus/${pneuId}/retirer`, { motif });
    return response.data;
  },

  remplacerPneu: async (camionId, pneuId, { nouveauPneuId, motif }) => {
    const response = await api.post(`/camions/${camionId}/pneus/${pneuId}/remplacer`, {
      nouveauPneuId,
      motif,
    });
    return response.data;
  },
};

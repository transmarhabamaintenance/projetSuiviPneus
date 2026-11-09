import api from './axios';

export const utilisateurApi = {
  getAll: async () => {
    const response = await api.get('/utilisateurs');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/utilisateurs/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/utilisateurs', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/utilisateurs/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/utilisateurs/${id}`);
    return response.data;
  },

  getRoles: async () => {
    const response = await api.get('/roles');
    return response.data;
  },
};

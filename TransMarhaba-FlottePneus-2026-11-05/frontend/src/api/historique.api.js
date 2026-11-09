import api from './axios';

export const historiqueApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/historique', { params });
    return response.data;
  },
};

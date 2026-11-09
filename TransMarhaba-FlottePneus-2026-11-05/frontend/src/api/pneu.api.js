import api from './axios';

export const pneuApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/pneus', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/pneus/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/pneus', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/pneus/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/pneus/${id}`);
    return response.data;
  },
};

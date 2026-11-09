import api from './axios';

export const authApi = {
  login: async (email, motDePasse) => {
    const response = await api.post('/auth/login', { email, motDePasse });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

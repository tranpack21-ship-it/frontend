import { api } from '../api/axios';

export const cashConceptService = {
  list: async (params = {}) => {
    const { data } = await api.get('/cash-concepts', { params });
    return data.data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/cash-concepts/${id}`);
    return data.data;
  },
  create: async (payload) => {
    const { data } = await api.post('/cash-concepts', payload);
    return data.data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/cash-concepts/${id}`, payload);
    return data.data;
  },
  deactivate: async (id) => {
    const { data } = await api.patch(`/cash-concepts/${id}/deactivate`);
    return data.data;
  },
};

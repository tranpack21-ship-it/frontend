import { api } from '../api/axios';

export const inventoryMotiveService = {
  list: async (params = {}) => {
    const { data } = await api.get('/inventory-motives', { params });
    return data.data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/inventory-motives/${id}`);
    return data.data;
  },
  create: async (payload) => {
    const { data } = await api.post('/inventory-motives', payload);
    return data.data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/inventory-motives/${id}`, payload);
    return data.data;
  },
  deactivate: async (id) => {
    const { data } = await api.patch(`/inventory-motives/${id}/deactivate`);
    return data.data;
  },
};

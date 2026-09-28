import api from './api';

export const getCategories = async (search = '') => {
  return await api.get(`/categories${search ? `?search=${encodeURIComponent(search)}` : ''}`);
};

export const getShops = async (search = '') => {
  return await api.get(`/shops${search ? `?search=${encodeURIComponent(search)}` : ''}`);
};

export const getShopById = async (id) => {
  return await api.get(`/shops/${id}`);
};

export const getProducts = async (params = {}) => {
  const query = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      query.append(key, params[key]);
    }
  });
  const queryString = query.toString();
  return await api.get(`/products${queryString ? `?${queryString}` : ''}`);
};

export const getProductById = async (id) => {
  return await api.get(`/products/${id}`);
};

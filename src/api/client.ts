import axios from 'axios';
import type { DealsResponse, SupportedModel, SearchFilters } from '../types/listing';

const API = axios.create({ baseURL: '/api' });

export async function fetchModels(): Promise<SupportedModel[]> {
  const res = await API.get('/models');
  return res.data.models;
}

export async function fetchDeals(modelKey: string): Promise<DealsResponse> {
  const res = await API.get(`/deals?model=${modelKey}`);
  return res.data;
}

export async function fetchSearch(filters: SearchFilters) {
  const params = new URLSearchParams();
  params.set('model', filters.model);
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters.minYear) params.set('minYear', String(filters.minYear));
  if (filters.maxYear) params.set('maxYear', String(filters.maxYear));
  if (filters.maxKm) params.set('maxKm', String(filters.maxKm));
  if (filters.damageBadge && filters.damageBadge !== 'ALL') params.set('damageBadge', filters.damageBadge);
  if (filters.platform && filters.platform !== 'ALL') params.set('platform', filters.platform);
  if (filters.sort) params.set('sort', filters.sort);
  const res = await API.get(`/search?${params}`);
  return res.data;
}

export async function refreshListings(modelKey: string) {
  const res = await API.post(`/refresh?model=${modelKey}`);
  return res.data;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR').format(price) + ' TL';
}

export function formatKm(km: number): string {
  return new Intl.NumberFormat('tr-TR').format(km) + ' km';
}

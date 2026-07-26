import { request } from './apiClient';

export const getMovies = async (query = '') => { const response = await request(`/api/movies${query}`); return response.ok ? response.json() : Promise.reject(new Error('Movies could not be loaded.')); };
export const createMovie = (dto) => request('/api/movies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) });
export const updateMovie = (id, dto) => request(`/api/movies/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) });
export const changeMovieStatus = (id, dto) => request(`/api/movies/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) });
export const withdrawMovie = (id) => request(`/api/movies/${id}`, { method: 'DELETE' });

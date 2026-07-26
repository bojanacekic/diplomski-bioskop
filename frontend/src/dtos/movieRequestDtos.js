import { MovieStatus } from '../models/movieStatus';

export const toCreateMovieRequestDto = (form) => ({ ...form, durationMinutes: Number(form.durationMinutes), status: MovieStatus.Upcoming });
export const toUpdateMovieRequestDto = (form) => ({ ...form, durationMinutes: Number(form.durationMinutes) });
export const toChangeMovieStatusRequestDto = (status) => ({ status });

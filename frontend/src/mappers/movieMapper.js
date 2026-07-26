export const toMovieForm = (movie) => ({ ...movie, premiereDate: movie.premiereDate.slice(0, 10) });

export const toMovieForm = (movie) => ({
  ...movie,
  premiereDate: movie.premiereDate.slice(0, 10),
});
export const withMovieRating = (movie, rating) => ({
  ...movie,
  averageRating: rating?.averageRating ?? 0,
  ratingCount: rating?.ratingCount ?? 0,
});

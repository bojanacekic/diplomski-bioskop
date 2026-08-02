const addError = (errors, field, message) => {
  errors[field] = message;
};

export const validateMovieForm = (movie) => {
  const errors = {};
  if (!movie.title.trim() || movie.title.trim().length > 200)
    addError(
      errors,
      "title",
      "Title is required and can contain up to 200 characters.",
    );
  if (!movie.description.trim() || movie.description.trim().length > 2000)
    addError(
      errors,
      "description",
      "Description is required and can contain up to 2000 characters.",
    );
  if (!movie.genre.trim() || movie.genre.trim().length > 100)
    addError(
      errors,
      "genre",
      "Genre is required and can contain up to 100 characters.",
    );
  if (
    !Number.isInteger(Number(movie.durationMinutes)) ||
    Number(movie.durationMinutes) < 1 ||
    Number(movie.durationMinutes) > 600
  )
    addError(
      errors,
      "durationMinutes",
      "Duration must be between 1 and 600 minutes.",
    );
  if (!movie.premiereDate)
    addError(errors, "premiereDate", "Premiere date is required.");
  if (!movie.ageRating.trim() || movie.ageRating.trim().length > 30)
    addError(
      errors,
      "ageRating",
      "Age rating is required and can contain up to 30 characters.",
    );
  if (movie.trailerUrl?.trim()) {
    try {
      const url = new URL(movie.trailerUrl.trim());
      const host = url.hostname.replace(/^www\./, "");
      if (
        movie.trailerUrl.trim().length > 500 ||
        !["youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host)
      )
        throw new Error();
    } catch {
      addError(errors, "trailerUrl", "Enter a valid YouTube trailer URL.");
    }
  }
  return errors;
};

import { useEffect, useState } from "react";
import { movieService } from "../services/movieService";
import { ratingService } from "../services/ratingService";
import { withMovieRating } from "../mappers/movieMapper";

let cachedMovies = null;

export const useMovieCatalog = () => {
  const [movies, setMovies] = useState(() => cachedMovies ?? []);
  const [state, setState] = useState(() =>
    cachedMovies ? "ready" : "loading",
  );
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [featuredMovie, setFeaturedMovie] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      if (!cachedMovies || search) setState("loading");
      try {
        const query = search
          ? `?search=${encodeURIComponent(search)}&includeImages=false`
          : "?includeImages=false";
        const [response, averagesResponse] = await Promise.all([
          movieService.getResponse(query, controller.signal),
          ratingService.getAverages(controller.signal),
        ]);
        if (!response.ok) throw new Error();
        const rawMovies = await response.json();
        const averages = averagesResponse.ok
          ? await averagesResponse.json()
          : [];
        const byMovie = new Map(averages.map((item) => [item.movieId, item]));
        const loaded = rawMovies.map((movie) =>
          withMovieRating(movie, byMovie.get(movie.id)),
        );
        if (!search) cachedMovies = loaded;
        setMovies(loaded);
        setFeaturedMovie(
          (current) =>
            current ??
            loaded[Math.floor(Math.random() * loaded.length)] ??
            null,
        );
        setState("ready");
      } catch (error) {
        if (error.name !== "AbortError") setState("error");
      }
    };
    const timeout = setTimeout(load, search ? 200 : 0);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search, refreshKey]);

  const refresh = () => setRefreshKey((value) => value + 1);
  const chooseFeaturedMovie = () => {
    if (movies.length)
      setFeaturedMovie(movies[Math.floor(Math.random() * movies.length)]);
  };
  return {
    movies,
    state,
    search,
    setSearch,
    refreshKey,
    refresh,
    featuredMovie,
    chooseFeaturedMovie,
  };
};

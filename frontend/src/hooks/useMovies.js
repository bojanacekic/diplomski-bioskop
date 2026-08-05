import { useEffect, useState } from "react";
import { movieService } from "../services/movieService";

export const useMovies = (search = "") => {
  const [movies, setMovies] = useState([]);
  const [state, setState] = useState("loading");
  const refresh = async () => {
    try {
      setState("loading");
      setMovies(
        await movieService.getAll(search ? `?search=${encodeURIComponent(search)}` : ""),
      );
      setState("ready");
    } catch {
      setState("error");
    }
  };
  useEffect(() => {
    refresh();
  }, [search]);
  return { movies, state, refresh };
};

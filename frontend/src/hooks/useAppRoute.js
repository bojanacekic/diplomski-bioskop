import { useEffect, useRef, useState } from "react";

const staticRoutes = {
  "/": "home", "/coming-soon": "upcoming", "/about": "about", "/contact": "contact",
  "/auth": "auth", "/profile": "profile", "/management/movies": "manage",
  "/management/halls": "halls", "/management/screenings": "screenings",
  "/management/reservations": "reservations", "/management/ticket-validation": "ticket-validation",
  "/management/users": "users",
};

const pathForPage = (page, id = null) => {
  if (page === "movie-details") return `/movies/${id}`;
  if (page === "hall-layout") return `/management/halls/${id}/layout`;
  if (page === "profile") return id && id !== "details" ? `/profile/${id}` : "/profile";
  return Object.entries(staticRoutes).find(([, routePage]) => routePage === page)?.[0] ?? "/";
};

const routeFromLocation = () => {
  const profile = window.location.pathname.match(/^\/profile(?:\/(security|reservations|tickets))?$/);
  if (profile) return { page: "profile", profileTab: profile[1] ?? "details" };
  const movie = window.location.pathname.match(/^\/movies\/([^/]+)$/);
  if (movie) return { page: "movie-details", movieId: decodeURIComponent(movie[1]) };
  const hall = window.location.pathname.match(/^\/management\/halls\/([^/]+)\/layout$/);
  if (hall) return { page: "hall-layout", hallId: decodeURIComponent(hall[1]) };
  return { page: staticRoutes[window.location.pathname] ?? "home" };
};

export const useAppRoute = () => {
  const initial = useRef(routeFromLocation()).current;
  const [page, setPage] = useState(initial.page);
  const [profileTab, setProfileTab] = useState(initial.profileTab ?? "details");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedMovieId, setSelectedMovieId] = useState(initial.movieId ?? null);
  const [selectedHall, setSelectedHall] = useState(null);
  const [selectedHallId, setSelectedHallId] = useState(initial.hallId ?? null);

  const navigate = (nextPage, item = null, { replace = false } = {}) => {
    const id = typeof item === "string" ? item : item?.id ?? null;
    const path = pathForPage(nextPage, id);
    window.history[replace || window.location.pathname === path ? "replaceState" : "pushState"]({}, "", path);
    if (nextPage === "movie-details") { setSelectedMovie(item); setSelectedMovieId(id); }
    if (nextPage === "hall-layout") { setSelectedHall(item); setSelectedHallId(id); }
    if (nextPage === "profile") setProfileTab(id ?? "details");
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  useEffect(() => {
    const handlePopState = () => {
      const route = routeFromLocation();
      setSelectedMovieId(route.movieId ?? null); setSelectedMovie(null);
      setSelectedHallId(route.hallId ?? null); setSelectedHall(null);
      setProfileTab(route.profileTab ?? "details"); setPage(route.page);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return { page, setPage, profileTab, selectedMovie, setSelectedMovie, selectedMovieId, selectedHall, setSelectedHall, selectedHallId, navigate };
};

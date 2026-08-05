import { useEffect, useState } from "react";
import AiSupportChat from "./components/AiSupportChat";
import AppHeader from "./components/AppHeader";
import AppRoutes from "./components/AppRoutes";
import { useAuth } from "./context/AuthContext";
import { useAppRoute } from "./hooks/useAppRoute";
import { useGatewayInstance } from "./hooks/useGatewayInstance";
import { useMovieCatalog } from "./hooks/useMovieCatalog";
import { useRecommendations } from "./hooks/useRecommendations";
import { useRouteGuard } from "./hooks/useRouteGuard";
import { hallService } from "./services/hallService";
import { movieService } from "./services/movieService";
import { apiUrl } from "./services/apiClient";

export default function App() {
  const auth = useAuth();
  const route = useAppRoute();
  const catalog = useMovieCatalog();
  const [authMode, setAuthMode] = useState("login");
  const [postAuthPage, setPostAuthPage] = useState(null);
  const [resetToken] = useState(
    () => new URLSearchParams(window.location.search).get("resetToken") ?? "",
  );
  const recommendedMovies = useRecommendations(
    auth.accessToken,
    route.page === "home",
    catalog.movies,
    catalog.refreshKey,
  );

  useEffect(() => {
    if (
      route.page !== "movie-details" ||
      !route.selectedMovieId ||
      route.selectedMovie
    )
      return undefined;
    const cachedMovie = catalog.movies.find(
      (movie) => movie.id === route.selectedMovieId,
    );
    if (cachedMovie) {
      route.setSelectedMovie(cachedMovie);
      return undefined;
    }
    const controller = new AbortController();
    movieService
      .getById(route.selectedMovieId, controller.signal)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(route.setSelectedMovie)
      .catch(
        (error) =>
          error?.name !== "AbortError" &&
          route.navigate("home", null, { replace: true }),
      );
    return () => controller.abort();
  }, [catalog.movies, route.page, route.selectedMovie, route.selectedMovieId]);

  useEffect(() => {
    if (
      route.page !== "hall-layout" ||
      !route.selectedHallId ||
      route.selectedHall
    )
      return undefined;
    const controller = new AbortController();
    hallService
      .getById(route.selectedHallId, controller.signal)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(route.setSelectedHall)
      .catch(
        (error) =>
          error?.name !== "AbortError" &&
          route.navigate("halls", null, { replace: true }),
      );
    return () => controller.abort();
  }, [route.page, route.selectedHall, route.selectedHallId]);

  useRouteGuard({
    page: route.page,
    session: auth.session,
    isCinemaManager: auth.isCinemaManager,
    isAdministrator: auth.isAdministrator,
    navigate: route.navigate,
    onAuthenticationRequired: setPostAuthPage,
  });

  useEffect(() => {
    if (resetToken) {
      setAuthMode("reset");
      route.setPage("auth");
    }
  }, [resetToken]);

  useGatewayInstance(Boolean(apiUrl), () => {
    auth.clearSession();
    route.navigate("home", null, { replace: true });
  });

  const goAuth = (mode, returnPage = null) => {
    catalog.chooseFeaturedMovie();
    setAuthMode(mode);
    setPostAuthPage(returnPage);
    route.navigate("auth");
  };

  const handleAuthenticated = (session) => {
    auth.establishSession(session);
    route.navigate(
      postAuthPage ?? "home",
      postAuthPage === "movie-details" ? route.selectedMovie : null,
    );
    setPostAuthPage(null);
  };

  const signOut = () => {
    auth.clearSession();
    route.navigate("home", null, { replace: true });
  };

  return (
    <main className="site-shell">
      <AppHeader
        page={route.page}
        session={auth.session}
        isCinemaManager={auth.isCinemaManager}
        isAdministrator={auth.isAdministrator}
        onNavigate={route.navigate}
        onAuth={goAuth}
        onSignOut={signOut}
      />
      <AppRoutes
        {...route}
        accessToken={auth.accessToken}
        session={auth.session}
        updateSession={auth.updateSession}
        movies={catalog.movies}
        moviesState={catalog.state}
        search={catalog.search}
        setSearch={catalog.setSearch}
        refreshMovies={catalog.refresh}
        recommendedMovies={recommendedMovies}
        featuredMovie={catalog.featuredMovie}
        authMode={authMode}
        setAuthMode={setAuthMode}
        resetToken={resetToken}
        goAuth={goAuth}
        handleAuthenticated={handleAuthenticated}
      />
      {apiUrl && <AiSupportChat />}
    </main>
  );
}

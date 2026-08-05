import { lazy, Suspense } from "react";
import { posterUrlFor, verticalPosterFor } from "../utils/posterUtils";

const pages = {
  profile: lazy(() =>
    import("../pages/ProfilePage").then((module) => ({
      default: module.ProfilePage,
    })),
  ),
  movieDetails: lazy(() => import("../pages/MovieDetailsPage")),
  users: lazy(() =>
    import("../pages/UserManagementPage").then((module) => ({
      default: module.UserManagementPage,
    })),
  ),
  screenings: lazy(() => import("../pages/ScreeningManagementPage")),
  reservations: lazy(() => import("../pages/ReservationManagementPage")),
  ticketValidation: lazy(() => import("../pages/TicketValidationPage")),
  hallLayout: lazy(() => import("../pages/HallLayoutPage")),
  halls: lazy(() => import("../pages/HallManagementPage")),
  movies: lazy(() => import("../pages/MovieManagementPage")),
  auth: lazy(() => import("../pages/AuthPage")),
  home: lazy(() => import("../pages/HomePage")),
  about: lazy(() => import("../pages/AboutPage")),
  contact: lazy(() => import("../pages/ContactPage")),
};

export default function AppRoutes(props) {
  const {
    page,
    navigate,
    accessToken,
    profileTab,
    updateSession,
    selectedMovie,
    selectedHall,
    refreshMovies,
    authMode,
    setAuthMode,
    resetToken,
    featuredMovie,
    handleAuthenticated,
    movies,
    moviesState,
    search,
    setSearch,
    recommendedMovies,
    session,
  } = props;
  let content;
  if (page === "profile")
    content = (
      <pages.profile
        token={accessToken}
        activeTab={profileTab}
        onTabChange={(tab) => navigate("profile", tab)}
        onProfileUpdated={(profile) =>
          updateSession({ username: profile.username })
        }
        onBack={() => navigate("home")}
      />
    );
  else if (page === "movie-details")
    content = selectedMovie ? (
      <pages.movieDetails
        movie={selectedMovie}
        token={accessToken}
        onBack={() => navigate("home")}
        onSignIn={() => props.goAuth("login", "movie-details")}
        onReservationCreated={() => navigate("profile", "reservations")}
      />
    ) : (
      <p className="state-message">Loading movie...</p>
    );
  else if (page === "users")
    content = (
      <pages.users token={accessToken} onBack={() => navigate("home")} />
    );
  else if (page === "screenings")
    content = (
      <pages.screenings
        accessToken={accessToken}
        onBack={() => navigate("home")}
      />
    );
  else if (page === "reservations")
    content = (
      <pages.reservations
        accessToken={accessToken}
        onBack={() => navigate("home")}
      />
    );
  else if (page === "ticket-validation")
    content = (
      <pages.ticketValidation
        accessToken={accessToken}
        onBack={() => navigate("home")}
      />
    );
  else if (page === "hall-layout")
    content = selectedHall ? (
      <pages.hallLayout hall={selectedHall} onBack={() => navigate("halls")} />
    ) : (
      <p className="state-message">Loading hall...</p>
    );
  else if (page === "halls")
    content = (
      <pages.halls
        accessToken={accessToken}
        onBack={() => navigate("home")}
        onViewLayout={(hall) => navigate("hall-layout", hall)}
      />
    );
  else if (page === "manage")
    content = (
      <pages.movies
        accessToken={accessToken}
        onBack={() => navigate("home")}
        onMoviesChanged={refreshMovies}
      />
    );
  else if (page === "about") content = <pages.about />;
  else if (page === "contact") content = <pages.contact />;
  else if (page === "home" || page === "upcoming")
    content = (
      <pages.home
        upcoming={page === "upcoming"}
        movies={movies}
        state={moviesState}
        search={search}
        onSearchChange={setSearch}
        recommendedMovies={recommendedMovies}
        showRecommendations={page === "home" && Boolean(session)}
        onOpenMovie={(movie) => navigate("movie-details", movie)}
      />
    );
  else
    content = (
      <pages.auth
        mode={authMode}
        onModeChange={setAuthMode}
        resetToken={resetToken}
        featuredMovie={featuredMovie}
        featuredPosterUrl={
          featuredMovie
            ? (verticalPosterFor(featuredMovie.title) ??
              posterUrlFor(featuredMovie, true))
            : null
        }
        onBack={() => navigate("home")}
        onAuthenticated={handleAuthenticated}
      />
    );

  return (
    <Suspense fallback={<p className="state-message">Loading page...</p>}>
      {content}
    </Suspense>
  );
}

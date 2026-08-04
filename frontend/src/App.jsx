import { lazy, Suspense, useEffect, useRef, useState } from "react";
import lightLogo from "./assets/smart-cinema-logo-light.png";
import odysseyPoster from "./assets/odyssey-vertical.jpg";
import invitePoster from "./assets/invite-vertical.jpg";
import toyStoryPoster from "./assets/toy-story-vertical.jpg";
import spiderManPoster from "./assets/spider-man-vertical.jpg";
import endOfOakStreetPoster from "./assets/end-of-oak-street-vertical.jpg";
import pawPatrolDinoPoster from "./assets/paw-patrol-dino-vertical.jpg";
import AiSupportChat from "./components/AiSupportChat";
const MovieManagementPage = lazy(() => import("./pages/MovieManagementPage"));
const HallManagementPage = lazy(() => import("./pages/HallManagementPage"));
const HallLayoutPage = lazy(() => import("./pages/HallLayoutPage"));
const ScreeningManagementPage = lazy(() => import("./pages/ScreeningManagementPage"));
const MovieDetailsPage = lazy(() => import("./pages/MovieDetailsPage"));
const ReservationManagementPage = lazy(() => import("./pages/ReservationManagementPage"));
const TicketValidationPage = lazy(() => import("./pages/TicketValidationPage"));
const ProfilePage = lazy(() =>
  import("./pages/UserPages").then((module) => ({ default: module.ProfilePage })),
);
const UserManagementPage = lazy(() =>
  import("./pages/UserPages").then((module) => ({ default: module.UserManagementPage })),
);

const apiUrl = import.meta.env.VITE_API_GATEWAY_URL;
let cachedMovies = null;
let pendingRecommendations = null;
let pendingRecommendationsToken = null;
const posterUrlFor = (movie, vertical = false) =>
  `${apiUrl}/api/movies/${movie.id}/poster${vertical ? "?vertical=true" : ""}`;
const loadRecommendations = (accessToken) => {
  if (pendingRecommendations && pendingRecommendationsToken === accessToken)
    return pendingRecommendations;

  pendingRecommendationsToken = accessToken;
  const request = fetch(`${apiUrl}/api/recommendations/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((response) => (response.ok ? response.json() : []));
  const trackedRequest = request.finally(() => {
    if (pendingRecommendations === trackedRequest) {
      pendingRecommendations = null;
      pendingRecommendationsToken = null;
    }
  });
  pendingRecommendations = trackedRequest;
  return pendingRecommendations;
};
const emptyRegister = { username: "", email: "", firstName: "", lastName: "", password: "" };
const emptyLogin = { usernameOrEmail: "", password: "" };
const emptyReset = { newPassword: "", confirmPassword: "" };
const staticRoutes = {
  "/": "home",
  "/coming-soon": "upcoming",
  "/about": "about",
  "/contact": "contact",
  "/auth": "auth",
  "/profile": "profile",
  "/management/movies": "manage",
  "/management/halls": "halls",
  "/management/screenings": "screenings",
  "/management/reservations": "reservations",
  "/management/ticket-validation": "ticket-validation",
  "/management/users": "users",
};
const pathForPage = (page, id = null) => {
  if (page === "movie-details") return `/movies/${id}`;
  if (page === "hall-layout") return `/management/halls/${id}/layout`;
  if (page === "profile") return id && id !== "details" ? `/profile/${id}` : "/profile";
  return Object.entries(staticRoutes).find(([, routePage]) => routePage === page)?.[0] ?? "/";
};
const routeFromLocation = () => {
  const profileMatch = window.location.pathname.match(
    /^\/profile(?:\/(security|reservations|tickets))?$/,
  );
  if (profileMatch) return { page: "profile", profileTab: profileMatch[1] ?? "details" };
  const movieMatch = window.location.pathname.match(/^\/movies\/([^/]+)$/);
  if (movieMatch)
    return { page: "movie-details", movieId: decodeURIComponent(movieMatch[1]) };
  const hallMatch = window.location.pathname.match(
    /^\/management\/halls\/([^/]+)\/layout$/,
  );
  if (hallMatch)
    return { page: "hall-layout", hallId: decodeURIComponent(hallMatch[1]) };
  return { page: staticRoutes[window.location.pathname] ?? "home" };
};
const verticalPosterFor = (title = "") => {
  const normalizedTitle = title.toLowerCase();
  if (normalizedTitle.includes("odyssey") || normalizedTitle.includes("odiseja")) return odysseyPoster;
  if (normalizedTitle.includes("invite") || normalizedTitle.includes("poziv")) return invitePoster;
  if (normalizedTitle.includes("toy story") || normalizedTitle.includes("prica")) return toyStoryPoster;
  if (normalizedTitle.includes("spider") || normalizedTitle.includes("spajder")) return spiderManPoster;
  if (normalizedTitle.includes("end of oak") || normalizedTitle.includes("oak street")) return endOfOakStreetPoster;
  if (normalizedTitle.includes("paw patrol") || normalizedTitle.includes("dino movie")) return pawPatrolDinoPoster;
  return null;
};

function App() {
  const initialRoute = useRef(routeFromLocation()).current;
  const [page, setPage] = useState(initialRoute.page);
  const [authMode, setAuthMode] = useState("login");
  const [movies, setMovies] = useState(() => cachedMovies ?? []);
  const [moviesRefreshKey, setMoviesRefreshKey] = useState(0);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [moviesState, setMoviesState] = useState(() =>
    cachedMovies ? "ready" : "loading",
  );
  const [search, setSearch] = useState("");
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [loginFailures, setLoginFailures] = useState(0);
  const [resetForm, setResetForm] = useState(emptyReset);
  const [resetToken] = useState(
    () => new URLSearchParams(window.location.search).get("resetToken") ?? "",
  );
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const [selectedHall, setSelectedHall] = useState(null);
  const [selectedHallId, setSelectedHallId] = useState(initialRoute.hallId ?? null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedMovieId, setSelectedMovieId] = useState(initialRoute.movieId ?? null);
  const [postAuthPage, setPostAuthPage] = useState(null);
  const [profileTab, setProfileTab] = useState(initialRoute.profileTab ?? "details");
  const [session, setSession] = useState(() =>
    JSON.parse(sessionStorage.getItem("smartCinemaSession") || "null"),
  );
  const isCinemaManager =
    session?.role === 2 || session?.role === "CinemaManager";
  const isAdministrator =
    session?.role === 3 || session?.role === "Administrator";
  const recommendedMovies = recommendations
    .map((recommendation) => ({
      ...movies.find((movie) => movie.id === recommendation.movieId),
      recommendationReason: recommendation.reason,
    }))
    .filter((movie) => movie.id);
  const catalogMovies = movies.filter((movie) =>
    page === "upcoming" ? movie.status === 0 : movie.status === 1,
  );

  const navigate = (nextPage, item = null, { replace = false } = {}) => {
    const id = typeof item === "string" ? item : item?.id ?? null;
    const path = pathForPage(nextPage, id);
    const historyMethod = replace || window.location.pathname === path
      ? "replaceState"
      : "pushState";
    window.history[historyMethod]({}, "", path);
    if (nextPage === "movie-details") {
      setSelectedMovie(item);
      setSelectedMovieId(id);
    }
    if (nextPage === "hall-layout") {
      setSelectedHall(item);
      setSelectedHallId(id);
    }
    if (nextPage === "profile") setProfileTab(id ?? "details");
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  useEffect(() => {
    const handlePopState = () => {
      const route = routeFromLocation();
      setSelectedMovieId(route.movieId ?? null);
      setSelectedHallId(route.hallId ?? null);
      setProfileTab(route.profileTab ?? "details");
      if (route.page !== "movie-details") setSelectedMovie(null);
      if (route.page !== "hall-layout") setSelectedHall(null);
      setPage(route.page);
      setAccountMenuOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (page !== "movie-details" || !selectedMovieId || selectedMovie) return undefined;
    const cachedMovie = movies.find((item) => item.id === selectedMovieId);
    if (cachedMovie) {
      setSelectedMovie(cachedMovie);
      return undefined;
    }

    const controller = new AbortController();
    fetch(`${apiUrl}/api/movies/${encodeURIComponent(selectedMovieId)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setSelectedMovie)
      .catch((error) => {
        if (error?.name !== "AbortError") navigate("home", null, { replace: true });
      });
    return () => controller.abort();
  }, [movies, page, selectedMovie, selectedMovieId]);

  useEffect(() => {
    if (page !== "hall-layout" || !selectedHallId || selectedHall) return undefined;
    const controller = new AbortController();
    fetch(`${apiUrl}/api/halls/${encodeURIComponent(selectedHallId)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setSelectedHall)
      .catch((error) => {
        if (error?.name !== "AbortError") navigate("halls", null, { replace: true });
      });
    return () => controller.abort();
  }, [page, selectedHall, selectedHallId]);

  useEffect(() => {
    const accountPages = ["profile"];
    const managementPages = [
      "manage",
      "halls",
      "hall-layout",
      "screenings",
      "reservations",
      "ticket-validation",
    ];
    if (accountPages.includes(page) && !session) {
      setPostAuthPage(page);
      navigate("auth", null, { replace: true });
    } else if (managementPages.includes(page) && !(isCinemaManager || isAdministrator)) {
      navigate(session ? "home" : "auth", null, { replace: true });
    } else if (page === "users" && !isAdministrator) {
      navigate(session ? "home" : "auth", null, { replace: true });
    }
  }, [page, session, isCinemaManager, isAdministrator]);

  useEffect(() => {
    if (resetToken) {
      setAuthMode("reset");
      setPage("auth");
    }
  }, [resetToken]);

  useEffect(() => {
    if (!apiUrl) return undefined;
    let active = true;

    const checkGatewayInstance = async () => {
      try {
        const response = await fetch(`${apiUrl}/health`, { cache: "no-store" });
        if (!response.ok || !active) return;
        const { instanceId } = await response.json();
        if (!instanceId) return;

        const previousInstanceId = sessionStorage.getItem("smartCinemaGatewayInstance");
        if (previousInstanceId && previousInstanceId !== instanceId) {
          sessionStorage.removeItem("smartCinemaSession");
          setSession(null);
          setAccountMenuOpen(false);
          setRecommendations([]);
          navigate("home", null, { replace: true });
        }
        sessionStorage.setItem("smartCinemaGatewayInstance", instanceId);
      } catch {
        // A temporary outage is not a logout; a new instance is detected when it returns.
      }
    };

    checkGatewayInstance();
    const interval = window.setInterval(checkGatewayInstance, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!session?.expiresAtUtc) return undefined;
    const remainingMilliseconds = new Date(session.expiresAtUtc).getTime() - Date.now();
    if (remainingMilliseconds <= 0) {
      sessionStorage.removeItem("smartCinemaSession");
      setSession(null);
      navigate("home", null, { replace: true });
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      sessionStorage.removeItem("smartCinemaSession");
      setSession(null);
      setAccountMenuOpen(false);
      setRecommendations([]);
      navigate("home", null, { replace: true });
    }, remainingMilliseconds);
    return () => window.clearTimeout(timeout);
  }, [session?.expiresAtUtc]);

  const chooseFeaturedMovie = (availableMovies = movies) => {
    if (availableMovies.length > 0) {
      setFeaturedMovie(
        availableMovies[Math.floor(Math.random() * availableMovies.length)],
      );
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadMovies = async () => {
      if (!apiUrl) return setMoviesState("error");
      // Keep already rendered films visible while refreshing them in the background.
      if (!cachedMovies || search) setMoviesState("loading");

      try {
        const query = search
          ? `?search=${encodeURIComponent(search)}&includeImages=false`
          : "?includeImages=false";
        const [response, averagesResponse] = await Promise.all([
          fetch(`${apiUrl}/api/movies${query}`, { signal: controller.signal }),
          fetch(`${apiUrl}/api/ratings/averages`, { signal: controller.signal }),
        ]);
        if (!response.ok) throw new Error();
        const rawMovies = await response.json();
        const averages = averagesResponse.ok ? await averagesResponse.json() : [];
        const averageByMovie = new Map(averages.map((item) => [item.movieId, item]));
        const loadedMovies = rawMovies.map((movie) => ({
          ...movie,
          averageRating: averageByMovie.get(movie.id)?.averageRating ?? 0,
          ratingCount: averageByMovie.get(movie.id)?.ratingCount ?? 0,
        }));
        if (!search) cachedMovies = loadedMovies;
        setMovies(loadedMovies);
        setFeaturedMovie(
          (currentMovie) =>
            currentMovie ??
            loadedMovies[Math.floor(Math.random() * loadedMovies.length)] ??
            null,
        );
        setMoviesState("ready");
      } catch (error) {
        if (error.name !== "AbortError") setMoviesState("error");
      }
    };

    // The first request must start immediately. Only debounce an active search.
    const timeout = setTimeout(loadMovies, search ? 200 : 0);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search, moviesRefreshKey]);

  useEffect(() => {
    if (!session?.accessToken || page !== "home") {
      setRecommendations([]);
      return;
    }
    let active = true;
    loadRecommendations(session.accessToken)
      .then((items) => {
        if (active) setRecommendations(items);
      })
      .catch(() => {
        if (active) setRecommendations([]);
      });
    return () => {
      active = false;
    };
  }, [session?.accessToken, moviesRefreshKey, page]);

  useEffect(() => {
    if (!accountMenuOpen)
      return;

    const closeWhenClickedOutside = (event) => {
      if (!accountMenuRef.current?.contains(event.target))
        setAccountMenuOpen(false);
    };
    const closeWhenEscapeIsPressed = (event) => {
      if (event.key === "Escape")
        setAccountMenuOpen(false);
    };

    document.addEventListener("mousedown", closeWhenClickedOutside);
    document.addEventListener("keydown", closeWhenEscapeIsPressed);
    return () => {
      document.removeEventListener("mousedown", closeWhenClickedOutside);
      document.removeEventListener("keydown", closeWhenEscapeIsPressed);
    };
  }, [accountMenuOpen]);

  const changeForm = (setter) => (event) =>
    setter((state) => ({ ...state, [event.target.name]: event.target.value }));
  const errorText = (payload) =>
    payload?.detail ??
    Object.values(payload?.errors ?? {})
      .flat()
      .join(" ") ??
    "The request could not be completed.";

  const submitAuth = async (event) => {
    event.preventDefault();
    if (!apiUrl)
      return setMessage({
        type: "error",
        text: "The API Gateway URL is not configured.",
      });

    setSubmitting(true);
    setMessage(null);
    const registering = authMode === "register";

    try {
      const response = await fetch(
        `${apiUrl}/api/auth/${registering ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registering ? registerForm : loginForm),
        },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (!registering && response.status === 401)
          setLoginFailures((failures) => failures + 1);
        throw new Error(errorText(payload));
      }

      setLoginFailures(0);
      sessionStorage.setItem("smartCinemaSession", JSON.stringify(payload));
      setSession(payload);
      setAccountMenuOpen(false);
      setRegisterForm(emptyRegister);
      setLoginForm(emptyLogin);
      navigate(postAuthPage ?? "home", postAuthPage === "movie-details" ? selectedMovie : null);
      setPostAuthPage(null);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const requestPasswordReset = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail: loginForm.usernameOrEmail }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(errorText(payload));
      setMessage({ type: "success", text: payload.message });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setMessage(null);
    if (resetForm.newPassword !== resetForm.confirmPassword)
      return setMessage({ type: "error", text: "Passwords do not match." });

    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword: resetForm.newPassword }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(errorText(payload));
      }
      window.history.replaceState({}, "", window.location.pathname);
      setResetForm(emptyReset);
      setAuthMode("login");
      setMessage({ type: "success", text: "Password changed. You can now sign in." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const signOut = () => {
    sessionStorage.removeItem("smartCinemaSession");
    setSession(null);
    setAccountMenuOpen(false);
    navigate("home", null, { replace: true });
  };

  const goAuth = (mode, returnPage = null) => {
    chooseFeaturedMovie();
    setAuthMode(mode);
    setMessage(null);
    setPostAuthPage(returnPage);
    navigate("auth");
  };

  return (
    <main className="site-shell">
      <header className="topbar">
        <button className="logo" onClick={() => navigate("home")}>
          <span className="logo-mark">
            <img src={lightLogo} alt="Smart Cinema" />
          </span>
          <span className="logo-text">Smart Cinema</span>
        </button>
        <nav className="primary-nav" aria-label="Main navigation">
          <button className={page === "home" ? "active" : ""} onClick={() => navigate("home")}>Home</button>
          <button className={page === "upcoming" ? "active" : ""} onClick={() => navigate("upcoming")}>Coming soon</button>
          <button className={page === "about" ? "active" : ""} onClick={() => navigate("about")}>About</button>
          <button className={page === "contact" ? "active" : ""} onClick={() => navigate("contact")}>Contact</button>
        </nav>
        <nav className="account-nav" aria-label="Account navigation">
          {session ? (
            <div className="account-menu" ref={accountMenuRef}>
              <button
                className="account-trigger"
                onClick={() => setAccountMenuOpen((open) => !open)}
              >
                Hi, {session.username} <span>⌄</span>
              </button>
              {accountMenuOpen && (
                <div className="account-dropdown">
                  <span className="menu-section-label">Account</span>
                  <button
                    onClick={() => {
                      navigate("profile");
                      setAccountMenuOpen(false);
                    }}
                  >
                    My profile
                  </button>
                  {(isCinemaManager || isAdministrator) && (
                    <>
                      <span className="menu-section-label">Cinema</span>
                      <button
                        onClick={() => {
                          navigate("manage");
                          setAccountMenuOpen(false);
                        }}
                      >
                        Movies
                      </button>
                      <button
                        onClick={() => {
                          navigate("halls");
                          setAccountMenuOpen(false);
                        }}
                      >
                        Halls
                      </button>
                      <button
                        onClick={() => {
                          navigate("screenings");
                          setAccountMenuOpen(false);
                        }}
                      >
                        Screenings
                      </button>
                      <span className="menu-section-label">Operations</span>
                      <button
                        onClick={() => {
                          navigate("reservations");
                          setAccountMenuOpen(false);
                        }}
                      >
                        Reservations
                      </button>
                      <button
                        onClick={() => {
                          navigate("ticket-validation");
                          setAccountMenuOpen(false);
                        }}
                      >
                        Validate tickets
                      </button>
                    </>
                  )}
                  {isAdministrator && (
                    <>
                      <span className="menu-section-label">Administration</span>
                      <button
                        onClick={() => {
                          navigate("users");
                          setAccountMenuOpen(false);
                        }}
                      >
                        Users
                      </button>
                    </>
                  )}
                  <button className="signout-menu-item" onClick={signOut}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="header-link" onClick={() => goAuth("login")}>
                Sign in
              </button>
              <button className="header-cta" onClick={() => goAuth("register")}>
                Create account
              </button>
            </>
          )}
        </nav>
      </header>

      <Suspense fallback={<p className="state-message">Loading page...</p>}>
      {page === "profile" ? (
        <ProfilePage
          token={session?.accessToken}
          activeTab={profileTab}
          onTabChange={(tab) => navigate("profile", tab)}
          onBack={() => navigate("home")}
        />
      ) : page === "movie-details" && selectedMovie ? (
        <MovieDetailsPage
          movie={selectedMovie}
          token={session?.accessToken}
          onBack={() => navigate("home")}
          onSignIn={() => goAuth("login", "movie-details")}
        />
      ) : page === "movie-details" ? (
        <p className="state-message">Loading movie...</p>
      ) : page === "users" ? (
        <UserManagementPage
          token={session?.accessToken}
          onBack={() => navigate("home")}
        />
      ) : page === "screenings" ? (
        <ScreeningManagementPage accessToken={session?.accessToken} onBack={() => navigate("home")} />
      ) : page === "reservations" ? (
        <ReservationManagementPage
          accessToken={session?.accessToken}
          onBack={() => navigate("home")}
        />
      ) : page === "ticket-validation" ? (
        <TicketValidationPage
          accessToken={session?.accessToken}
          onBack={() => navigate("home")}
        />
      ) : page === "hall-layout" && selectedHall ? (
        <HallLayoutPage hall={selectedHall} onBack={() => navigate("halls")} />
      ) : page === "hall-layout" ? (
        <p className="state-message">Loading hall...</p>
      ) : page === "halls" ? (
        <HallManagementPage
          accessToken={session?.accessToken}
          onBack={() => navigate("home")}
          onViewLayout={(hall) => {
            navigate("hall-layout", hall);
          }}
        />
      ) : page === "manage" ? (
        <MovieManagementPage
          accessToken={session?.accessToken}
          onBack={() => navigate("home")}
          onMoviesChanged={() => setMoviesRefreshKey((value) => value + 1)}
        />
      ) : page === "about" ? (
        <section className="info-page">
          <div className="info-hero">
            <h1>More than a movie.<br />A complete cinema experience.</h1>
            <span>Smart Cinema combines great films, comfortable halls and simple digital booking in one modern experience.</span>
          </div>
          <div className="info-grid about-grid">
            <article><h2>Our story</h2><p>Smart Cinema was created to make discovering films and booking tickets fast, clear and enjoyable for every guest.</p></article>
            <article><h2>Our mission</h2><p>We bring audiences closer to the stories they love through quality screenings, carefully designed halls and reliable service.</p></article>
            <article><h2>Smart experience</h2><p>Browse current and upcoming films, choose your seats, reserve or purchase tickets and access every ticket with its unique QR code.</p></article>
          </div>
          <div className="info-highlight"><strong>Smart Cinema</strong><p>Your next great story starts here.</p></div>
        </section>
      ) : page === "contact" ? (
        <section className="info-page">
          <div className="info-hero">
            <h1>We are here<br />to help.</h1>
            <span>Questions about screenings, reservations or tickets? Contact our team or ask the Smart Cinema AI assistant.</span>
          </div>
          <div className="info-grid contact-grid">
            <article><span>EMAIL</span><h2>smartcinema2026@gmail.com</h2><p>We usually reply within one business day.</p><a href="mailto:support@smartcinema.rs">Send an email</a></article>
            <article><span>PHONE</span><h2>+381 21 555 0123</h2><p>Every day from 10:00 to 22:00.</p><a href="tel:+381215550123">Call us</a></article>
            <article><span>VISIT US</span><h2>Трг Доситеја Обрадовића 6</h2><p>Нови Сад 21000, Serbia</p><a href="https://maps.google.com/?q=Trg+Dositeja+Obradovica+6+Novi+Sad+21000" target="_blank" rel="noreferrer">Open map</a></article>
          </div>
          <div className="info-highlight"><strong>Opening hours</strong><p>Monday–Sunday · 10:00–23:30</p></div>
        </section>
      ) : page === "home" || page === "upcoming" ? (
        <section className="movies-page">
          <div className="movies-heading">
            <div>
              <h1>
                {page === "upcoming" ? "Coming soon to" : "Find your next"}
                <br />
                {page === "upcoming" ? "Smart Cinema." : "great story."}
              </h1>
              <p>{page === "upcoming" ? "Discover films coming soon to Smart Cinema." : "Explore films currently playing at Smart Cinema."}</p>
            </div>
            <label className="search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search movies or genres"
              />
            </label>
          </div>
          <div className="movie-grid">
            {moviesState === "loading" && (
              <p className="state-message">Loading films...</p>
            )}
            {moviesState === "error" && (
              <p className="state-message error">
                Movies are currently unavailable. Make sure the Movies service
                and Gateway are running.
              </p>
            )}
            {moviesState === "ready" && catalogMovies.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">🎬</span>
                <h2>No films available yet</h2>
                <p>
                  As soon as a cinema manager adds active films, they will
                  appear here.
                </p>
              </div>
            )}
            {catalogMovies.map((movie) => (
              <article
                className="movie-card clickable-card"
                key={movie.id}
                onClick={() => {
                  navigate("movie-details", movie);
                }}
              >
                <img
                  src={posterUrlFor(movie)}
                  alt={`${movie.title} poster`}
                  loading="lazy"
                />
                <div className="movie-info">
                  <p>
                    {movie.genre} · {movie.durationMinutes} min
                  </p>
                  <h2>{movie.title}</h2>
                  <span>{movie.ratingCount ? `★ ${movie.averageRating.toFixed(1)} (${movie.ratingCount})` : "Not rated yet"} · {movie.ageRating}</span>
                </div>
              </article>
            ))}
          </div>
          {page === "home" && session && recommendedMovies.length > 0 && (
            <section className="recommendations-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">PICKED FOR YOU</p>
                  <h2>Recommended for you</h2>
                  <p>Films selected from the genres you enjoy.</p>
                </div>
              </div>
              <div className="movie-grid recommendations-grid">
                {recommendedMovies.map((movie) => (
                  <article className="movie-card clickable-card" key={`recommended-${movie.id}`} onClick={() => navigate("movie-details", movie)}>
                    <img src={posterUrlFor(movie)} alt={`${movie.title} poster`} loading="lazy" />
                    <div className="movie-info"><p>{movie.genre} · {movie.durationMinutes} min</p><h2>{movie.title}</h2><span>{movie.ratingCount ? `★ ${movie.averageRating.toFixed(1)} · ` : ""}{movie.recommendationReason}</span></div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </section>
      ) : (
        <section className="auth-page">
          <div className="auth-copy">
            {featuredMovie && (
              <img
                className="auth-featured-image"
                src={verticalPosterFor(featuredMovie.title) ?? posterUrlFor(featuredMovie, true)}
                alt=""
              />
            )}
            <div className="auth-copy-content">
              <h1>{featuredMovie?.title ?? "Every story starts here."}</h1>
              {featuredMovie ? (
                <>
                  <p className="featured-details">
                    {featuredMovie.genre} · {featuredMovie.durationMinutes} min
                  </p>
                  <p className="featured-description">
                    {featuredMovie.description}
                  </p>
                </>
              ) : (
                <p>
                  Reserve your favorite seats, access your tickets and discover
                  films made for you.
                </p>
              )}
            </div>
          </div>
          <div className="auth-card">
            <button className="back-button" onClick={() => navigate("home")}>
              ← Back to movies
            </button>
            <h2>
              {authMode === "register"
                ? "Create your account"
                : authMode === "forgot"
                  ? "Reset your password"
                  : authMode === "reset"
                    ? "Choose a new password"
                    : "Welcome back"}
            </h2>
            {(authMode === "login" || authMode === "register") && <div className="mode-switch">
              <button
                className={authMode === "register" ? "active" : ""}
                onClick={() => setAuthMode("register")}
              >
                Create account
              </button>
              <button
                className={authMode === "login" ? "active" : ""}
                onClick={() => setAuthMode("login")}
              >
                Sign in
              </button>
            </div>}
            {(authMode === "login" || authMode === "register") && <form onSubmit={submitAuth}>
              {authMode === "register" && (
                <><div className="auth-name-row"><label>First name<input name="firstName" value={registerForm.firstName} onChange={changeForm(setRegisterForm)} required /></label><label>Last name<input name="lastName" value={registerForm.lastName} onChange={changeForm(setRegisterForm)} required /></label></div><label>Username<input name="username" value={registerForm.username} onChange={changeForm(setRegisterForm)} required /></label></>
              )}
              <label>
                {authMode === "register"
                  ? "Email address"
                  : "Username or email"}
                <input
                  name={authMode === "register" ? "email" : "usernameOrEmail"}
                  type={authMode === "register" ? "email" : "text"}
                  value={
                    authMode === "register"
                      ? registerForm.email
                      : loginForm.usernameOrEmail
                  }
                  onChange={changeForm(
                    authMode === "register" ? setRegisterForm : setLoginForm,
                  )}
                  required
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  value={
                    authMode === "register"
                      ? registerForm.password
                      : loginForm.password
                  }
                  onChange={changeForm(
                    authMode === "register" ? setRegisterForm : setLoginForm,
                  )}
                  required
                />
              </label>
              {message && <p className="form-error">{message.text}</p>}
              <button className="submit-button" disabled={submitting}>
                {submitting
                  ? "Please wait..."
                  : authMode === "register"
                    ? "Create account"
                    : "Sign in"}
              </button>
              {authMode === "login" && loginFailures >= 3 && (
                <button
                  className="auth-text-button"
                  type="button"
                  onClick={() => {
                    setAuthMode("forgot");
                    setMessage(null);
                  }}
                >
                  Forgot password?
                </button>
              )}
            </form>}
            {authMode === "forgot" && (
              <form onSubmit={requestPasswordReset}>
                <p className="profile-help">
                  Enter the username or email address connected to your account.
                </p>
                <label>
                  Username or email
                  <input
                    name="usernameOrEmail"
                    value={loginForm.usernameOrEmail}
                    onChange={changeForm(setLoginForm)}
                    required
                  />
                </label>
                {message && <p className={`form-message ${message.type}`}>{message.text}</p>}
                <button className="submit-button" disabled={submitting}>
                  {submitting ? "Sending..." : "Send reset link"}
                </button>
                <button
                  className="auth-text-button"
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setMessage(null);
                  }}
                >
                  Back to sign in
                </button>
              </form>
            )}
            {authMode === "reset" && (
              <form onSubmit={resetPassword}>
                <label>
                  New password
                  <input
                    name="newPassword"
                    type="password"
                    value={resetForm.newPassword}
                    onChange={changeForm(setResetForm)}
                    maxLength={100}
                    autoComplete="new-password"
                    required
                  />
                </label>
                <label>
                  Confirm new password
                  <input
                    name="confirmPassword"
                    type="password"
                    value={resetForm.confirmPassword}
                    onChange={changeForm(setResetForm)}
                    maxLength={100}
                    autoComplete="new-password"
                    required
                  />
                </label>
                {message && <p className={`form-message ${message.type}`}>{message.text}</p>}
                <button className="submit-button" disabled={submitting}>
                  {submitting ? "Changing..." : "Change password"}
                </button>
              </form>
            )}
          </div>
        </section>
      )}
      </Suspense>
      {apiUrl && <AiSupportChat apiUrl={apiUrl} />}
    </main>
  );
}

export default App;

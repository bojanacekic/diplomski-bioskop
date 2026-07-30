import { useEffect, useRef, useState } from "react";
import lightLogo from "./assets/smart-cinema-logo-light.png";
import MovieManagementPage from "./pages/MovieManagementPage";
import HallManagementPage from "./pages/HallManagementPage";
import HallLayoutPage from "./pages/HallLayoutPage";
import ScreeningManagementPage from "./pages/ScreeningManagementPage";
import MovieDetailsPage from "./pages/MovieDetailsPage";
import ReservationManagementPage from "./pages/ReservationManagementPage";
import { ProfilePage, UserManagementPage } from "./pages/UserPages";

const apiUrl = import.meta.env.VITE_API_GATEWAY_URL;
const emptyRegister = { username: "", email: "", firstName: "", lastName: "", password: "" };
const emptyLogin = { usernameOrEmail: "", password: "" };

function App() {
  const [page, setPage] = useState("home");
  const [authMode, setAuthMode] = useState("login");
  const [movies, setMovies] = useState([]);
  const [moviesRefreshKey, setMoviesRefreshKey] = useState(0);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [moviesState, setMoviesState] = useState("loading");
  const [search, setSearch] = useState("");
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const [selectedHall, setSelectedHall] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [postAuthPage, setPostAuthPage] = useState(null);
  const [session, setSession] = useState(() =>
    JSON.parse(sessionStorage.getItem("smartCinemaSession") || "null"),
  );
  const isCinemaManager =
    session?.role === 2 || session?.role === "CinemaManager";
  const isAdministrator =
    session?.role === 3 || session?.role === "Administrator";

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
      setMoviesState("loading");

      try {
        const query = search ? `?search=${encodeURIComponent(search)}` : "";
        const response = await fetch(`${apiUrl}/api/movies${query}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const loadedMovies = await response.json();
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

    const timeout = setTimeout(loadMovies, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search, moviesRefreshKey]);

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
      if (!response.ok) throw new Error(errorText(payload));

      sessionStorage.setItem("smartCinemaSession", JSON.stringify(payload));
      setSession(payload);
      setAccountMenuOpen(false);
      setRegisterForm(emptyRegister);
      setLoginForm(emptyLogin);
      setPage(postAuthPage ?? "home");
      setPostAuthPage(null);
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
    setPage("home");
  };

  const goAuth = (mode, returnPage = null) => {
    chooseFeaturedMovie();
    setAuthMode(mode);
    setMessage(null);
    setPostAuthPage(returnPage);
    setPage("auth");
  };

  return (
    <main className="site-shell">
      <header className="topbar">
        <button className="logo" onClick={() => setPage("home")}>
          <span className="logo-mark">
            <img src={lightLogo} alt="Smart Cinema" />
          </span>
          <span className="logo-text">Smart Cinema</span>
        </button>
        <nav>
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
                  <button
                    onClick={() => {
                      setPage("profile");
                      setAccountMenuOpen(false);
                    }}
                  >
                    My profile
                  </button>
                  {(isCinemaManager || isAdministrator) && (
                    <>
                      <button
                        onClick={() => {
                          setPage("manage");
                          setAccountMenuOpen(false);
                        }}
                      >
                        Manage movies
                      </button>
                      <button
                        onClick={() => {
                          setPage("halls");
                          setAccountMenuOpen(false);
                        }}
                      >
                        Manage halls
                      </button>
                      <button
                        onClick={() => {
                          setPage("screenings");
                          setAccountMenuOpen(false);
                        }}
                      >
                        Manage screenings
                      </button>
                      <button
                        onClick={() => {
                          setPage("reservations");
                          setAccountMenuOpen(false);
                        }}
                      >
                        Manage reservations
                      </button>
                    </>
                  )}
                  {isAdministrator && (
                    <button
                      onClick={() => {
                        setPage("users");
                        setAccountMenuOpen(false);
                      }}
                    >
                      Manage users
                    </button>
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

      {page === "profile" ? (
        <ProfilePage
          token={session?.accessToken}
          onBack={() => setPage("home")}
        />
      ) : page === "movie-details" ? (
        <MovieDetailsPage
          movie={selectedMovie}
          token={session?.accessToken}
          onBack={() => setPage("home")}
          onSignIn={() => goAuth("login", "movie-details")}
        />
      ) : page === "users" ? (
        <UserManagementPage
          token={session?.accessToken}
          onBack={() => setPage("home")}
        />
      ) : page === "screenings" ? (
        <ScreeningManagementPage accessToken={session?.accessToken} onBack={() => setPage("home")} />
      ) : page === "reservations" ? (
        <ReservationManagementPage
          accessToken={session?.accessToken}
          onBack={() => setPage("home")}
        />
      ) : page === "hall-layout" ? (
        <HallLayoutPage hall={selectedHall} onBack={() => setPage("halls")} />
      ) : page === "halls" ? (
        <HallManagementPage
          accessToken={session?.accessToken}
          onBack={() => setPage("home")}
          onViewLayout={(hall) => {
            setSelectedHall(hall);
            setPage("hall-layout");
          }}
        />
      ) : page === "manage" ? (
        <MovieManagementPage
          accessToken={session?.accessToken}
          onBack={() => setPage("home")}
          onMoviesChanged={() => setMoviesRefreshKey((value) => value + 1)}
        />
      ) : page === "home" ? (
        <section className="movies-page">
          <div className="movies-heading">
            <div>
              <p className="eyebrow">SMART CINEMA</p>
              <h1>
                Find your next
                <br />
                great story.
              </h1>
              <p>Explore films currently playing at Smart Cinema.</p>
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
            {moviesState === "ready" && movies.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">🎬</span>
                <h2>No films available yet</h2>
                <p>
                  As soon as a cinema manager adds active films, they will
                  appear here.
                </p>
              </div>
            )}
            {movies.map((movie) => (
              <article
                className="movie-card clickable-card"
                key={movie.id}
                onClick={() => {
                  setSelectedMovie(movie);
                  setPage("movie-details");
                }}
              >
                {movie.posterBase64 ? (
                  <img src={movie.posterBase64} alt={`${movie.title} poster`} />
                ) : (
                  <div className="poster-placeholder">
                    <span>
                      SMART
                      <br />
                      CINEMA
                    </span>
                  </div>
                )}
                <div className="movie-info">
                  <p>
                    {movie.genre} · {movie.durationMinutes} min
                  </p>
                  <h2>{movie.title}</h2>
                  <span>{movie.ageRating}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="auth-page">
          <div className="auth-copy">
            {featuredMovie?.posterBase64 && (
              <img
                className="auth-featured-image"
                src={featuredMovie.posterBase64}
                alt=""
              />
            )}
            <div className="auth-copy-content">
              <p className="eyebrow">NOW SHOWING AT SMART CINEMA</p>
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
            <button className="back-button" onClick={() => setPage("home")}>
              ← Back to movies
            </button>
            <p className="eyebrow">WELCOME</p>
            <h2>
              {authMode === "register" ? "Create your account" : "Welcome back"}
            </h2>
            <div className="mode-switch">
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
            </div>
            <form onSubmit={submitAuth}>
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
            </form>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;

import { MovieStatus } from "../models/movieStatus";
import { posterUrlFor } from "../utils/posterUtils";

const MovieCard = ({ movie, onOpen, recommendation = false }) => (
  <article className="movie-card clickable-card" onClick={() => onOpen(movie)}>
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
      <span>
        {recommendation ? (
          <>
            {movie.ratingCount ? `★ ${movie.averageRating.toFixed(1)} · ` : ""}
            {movie.recommendationReason}
          </>
        ) : (
          <>
            {movie.ratingCount
              ? `★ ${movie.averageRating.toFixed(1)} (${movie.ratingCount})`
              : "Not rated yet"}{" "}
            · {movie.ageRating}
          </>
        )}
      </span>
    </div>
  </article>
);

export default function HomePage({
  upcoming,
  movies,
  state,
  search,
  onSearchChange,
  recommendedMovies,
  showRecommendations,
  onOpenMovie,
}) {
  const catalog = movies.filter((movie) =>
    upcoming
      ? movie.status === MovieStatus.Upcoming
      : movie.status === MovieStatus.Active,
  );
  return (
    <section className="movies-page">
      <div className="movies-heading">
        <div>
          <h1>
            {upcoming ? "Coming soon to" : "Find your next"}
            <br />
            {upcoming ? "Smart Cinema." : "great story."}
          </h1>
          <p>
            {upcoming
              ? "Discover films coming soon to Smart Cinema."
              : "Explore films currently playing at Smart Cinema."}
          </p>
        </div>
        <label className="search">
          <span>⌕</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search movies or genres"
          />
        </label>
      </div>
      <div className="movie-grid">
        {state === "loading" && (
          <p className="state-message">Loading films...</p>
        )}
        {state === "error" && (
          <p className="state-message error">
            Movies are currently unavailable. Make sure the Movies service and
            Gateway are running.
          </p>
        )}
        {state === "ready" && catalog.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🎬</span>
            <h2>No films available yet</h2>
            <p>
              As soon as a cinema manager adds active films, they will appear
              here.
            </p>
          </div>
        )}
        {catalog.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onOpen={onOpenMovie} />
        ))}
      </div>
      {showRecommendations && recommendedMovies.length > 0 && (
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
              <MovieCard
                key={`recommended-${movie.id}`}
                movie={movie}
                onOpen={onOpenMovie}
                recommendation
              />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

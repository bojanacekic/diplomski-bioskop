import { MovieStatus } from "../../models/movieStatus";

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
const statusLabels = ["Upcoming", "Active", "Withdrawn"];

export default function MovieList({
  movies,
  search,
  onSearch,
  onEdit,
  onStatusChange,
}) {
  return (
    <div>
      <label className="search">
        <span>⌕</span>
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search movies by name or genre"
        />
      </label>
      <div className="management-list user-list">
        {movies.map((movie) => (
          <article
            className="manage-card clickable-card"
            key={movie.id}
            onClick={() => onEdit(movie)}
          >
            <div>
              <p className="eyebrow">{statusLabels[movie.status]}</p>
              <h2>{movie.title}</h2>
              <p>
                {movie.genre} · {movie.durationMinutes} min ·{" "}
                {formatDate(movie.premiereDate)}
              </p>
            </div>
            <div className="manage-actions">
              {movie.status === MovieStatus.Upcoming && (
                <button
                  className="secondary-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onStatusChange(movie.id, MovieStatus.Active);
                  }}
                >
                  Set active
                </button>
              )}
              {movie.status === MovieStatus.Active && (
                <button
                  className="secondary-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onStatusChange(movie.id, MovieStatus.Upcoming);
                  }}
                >
                  Set upcoming
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

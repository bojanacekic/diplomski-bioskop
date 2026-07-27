export default function MovieCard({ movie, onClick }) {
  return (
    <article className="movie-card" onClick={onClick}>
      {movie.posterBase64 ? (
        <img src={movie.posterBase64} alt={`${movie.title} poster`} />
      ) : (
        <div className="poster-placeholder">SMART CINEMA</div>
      )}
      <div className="movie-info">
        <p>
          {movie.genre} · {movie.durationMinutes} min
        </p>
        <h2>{movie.title}</h2>
        <span>{movie.ageRating}</span>
      </div>
    </article>
  );
}

export default function MovieHero({
  movie,
  poster,
  posterPosition,
  ratingAverage,
  rating,
  ratingState,
  token,
  onRate,
}) {
  return (
    <div className="movie-details-hero">
      {poster && (
        <img
          className="vertical-movie-poster"
          src={poster}
          alt={`${movie.title} poster`}
          style={{ objectPosition: posterPosition }}
        />
      )}
      <div>
        <h1>{movie.title}</h1>
        <p className="movie-detail-meta">
          {movie.genre} · {movie.durationMinutes} min · {movie.ageRating}
        </p>
        <p className="movie-average-rating">
          {ratingAverage.ratingCount
            ? `★ ${ratingAverage.averageRating.toFixed(1)} from ${ratingAverage.ratingCount} rating${ratingAverage.ratingCount === 1 ? "" : "s"}`
            : "Not rated yet"}
        </p>
        <p>{movie.description}</p>
        <p className="movie-detail-premiere">
          Premiere:{" "}
          {new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(
            new Date(movie.premiereDate),
          )}
        </p>
        {ratingState === "allowed" && (
          <div className="movie-rating">
            <span>Your rating: </span>
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                className={
                  rating?.score >= score
                    ? "rating-star selected"
                    : "rating-star"
                }
                onClick={() => onRate(score)}
              >
                ★
              </button>
            ))}
          </div>
        )}
        {token && ratingState === "future" && (
          <p className="profile-help">
            You can rate this movie after the screening.
          </p>
        )}
        {token && ratingState === "unavailable" && (
          <p className="profile-help">
            You can rate this movie after attending a screening.
          </p>
        )}
      </div>
    </div>
  );
}

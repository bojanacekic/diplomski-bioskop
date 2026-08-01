import { useEffect, useState } from "react";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { validateMovieForm } from "../utils/movieValidation";

const apiUrl = import.meta.env.VITE_API_GATEWAY_URL;
const emptyForm = {
  title: "",
  description: "",
  genre: "",
  durationMinutes: "",
  premiereDate: "",
  ageRating: "Not rated",
  posterBase64: null,
  verticalPosterBase64: null,
};
const formatDate = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

export default function MovieManagementPage({
  accessToken,
  onBack,
  onMoviesChanged,
}) {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [confirmWithdrawId, setConfirmWithdrawId] = useState(null);

  const loadMovies = async () => {
    const response = await fetch(
      `${apiUrl}/api/movies${search ? `?search=${encodeURIComponent(search)}&includeImages=false` : "?includeImages=false"}`,
    );
    if (response.ok) setMovies(await response.json());
  };

  useEffect(() => {
    loadMovies();
  }, [search]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };
  const uploadPoster = (event, field = "posterBase64") => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setForm((current) => ({ ...current, [field]: reader.result }));
    reader.readAsDataURL(file);
  };

  const editMovie = async (movie) => {
    const response = await fetch(`${apiUrl}/api/movies/${movie.id}`);
    const fullMovie = response.ok ? await response.json() : movie;
    setEditingId(movie.id);
    setForm({ ...fullMovie, premiereDate: fullMovie.premiereDate.slice(0, 10) });
    setMessage("");
  };

  const newMovie = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setMessage("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    const validationErrors = validateMovieForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return setMessage("Please correct the highlighted fields.");
    }
    const payload = {
      ...form,
      durationMinutes: Number(form.durationMinutes),
      ...(editingId ? {} : { status: 0 }),
    };
    const response = await fetch(
      `${apiUrl}/api/movies${editingId ? `/${editingId}` : ""}`,
      {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok)
      return setMessage("Please check all required movie details.");
    setForm(emptyForm);
    setEditingId(null);
    setMessage(editingId ? "Movie updated." : "Movie added.");
    await loadMovies();
    onMoviesChanged();
  };

  const changeStatus = async (id, status) => {
    const response = await fetch(`${apiUrl}/api/movies/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status }),
    });
    setMessage(
      response.ok
        ? "Movie status updated."
        : "This status transition is not allowed.",
    );
    await loadMovies();
    onMoviesChanged();
  };

  const withdrawMovie = async (id) => {
    const response = await fetch(`${apiUrl}/api/movies/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.ok) {
      newMovie();
      setMessage("Movie withdrawn.");
      await loadMovies();
      onMoviesChanged();
    }
  };

  return (
    <section className="management-page">
      <div className="management-heading">
        <div>
          <p className="eyebrow">CINEMA MANAGER</p>
          <h1>Manage movies</h1>
          <p>Add a new movie, edit its details or update its cinema status.</p>
        </div>
        <button className="header-link" onClick={onBack}>
          ← Back to movies
        </button>
      </div>
      <div className="management-layout">
        <form className="movie-form" onSubmit={submit}>
          <div className="form-title-row">
            <h2>{editingId ? "Edit movie" : "Add a movie"}</h2>
            <button
              type="button"
              className="secondary-button"
              onClick={newMovie}
            >
              New movie
            </button>
          </div>
          <label>
            Title
            <input
              className={errors.title ? "invalid-field" : ""}
              name="title"
              value={form.title}
              onChange={updateField}
              required
            />
            {errors.title && (
              <small className="field-error">{errors.title}</small>
            )}
          </label>
          <label>
            Genre
            <input
              className={errors.genre ? "invalid-field" : ""}
              name="genre"
              value={form.genre}
              onChange={updateField}
              required
            />
            {errors.genre && (
              <small className="field-error">{errors.genre}</small>
            )}
          </label>
          <div className="form-row">
            <label>
              Duration (min)
              <input
                className={errors.durationMinutes ? "invalid-field" : ""}
                name="durationMinutes"
                type="number"
                min="1"
                value={form.durationMinutes}
                onChange={updateField}
                required
              />
              {errors.durationMinutes && (
                <small className="field-error">{errors.durationMinutes}</small>
              )}
            </label>
            <label>
              Premiere date
              <input
                className={errors.premiereDate ? "invalid-field" : ""}
                name="premiereDate"
                type="date"
                value={form.premiereDate}
                onChange={updateField}
                required
              />
              {errors.premiereDate && (
                <small className="field-error">{errors.premiereDate}</small>
              )}
            </label>
          </div>
          <label>
            Age rating
            <input
              className={errors.ageRating ? "invalid-field" : ""}
              name="ageRating"
              value={form.ageRating}
              onChange={updateField}
              required
            />
            {errors.ageRating && (
              <small className="field-error">{errors.ageRating}</small>
            )}
          </label>
          <label>
            Description
            <textarea
              className={errors.description ? "invalid-field" : ""}
              name="description"
              value={form.description}
              onChange={updateField}
              required
            />
            {errors.description && (
              <small className="field-error">{errors.description}</small>
            )}
          </label>
          <label>
            Horizontal poster
            <input type="file" accept="image/*" onChange={uploadPoster} />
          </label>
          <label>
            Vertical poster
            <input type="file" accept="image/*" onChange={(event) => uploadPoster(event, "verticalPosterBase64")} />
          </label>
          {message && <p className="form-message">{message}</p>}
          <div className="form-actions">
            <button className="submit-button">
              {editingId ? "Save changes" : "Add movie"}
            </button>
            {editingId && (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={newMovie}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => setConfirmWithdrawId(editingId)}
                >
                  Withdraw
                </button>
              </>
            )}
          </div>
        </form>
        <div>
          <label className="search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search movies by name or genre"
            />
          </label>
          <div className="management-list user-list">
            {movies.map((movie) => (
              <article
                className="manage-card clickable-card"
                key={movie.id}
                onClick={() => editMovie(movie)}
              >
                <div>
                  <p className="eyebrow">
                    {["Upcoming", "Active", "Withdrawn"][movie.status]}
                  </p>
                  <h2>{movie.title}</h2>
                  <p>
                    {movie.genre} · {movie.durationMinutes} min ·{" "}
                    {formatDate(movie.premiereDate)}
                  </p>
                </div>
                <div className="manage-actions">
                  {movie.status === 0 && (
                    <button
                      className="secondary-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        changeStatus(movie.id, 1);
                      }}
                    >
                      Set active
                    </button>
                  )}
                  {movie.status === 1 && (
                    <button
                      className="secondary-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        changeStatus(movie.id, 0);
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
      </div>
      <ConfirmationDialog
        isOpen={Boolean(confirmWithdrawId)}
        title="Withdraw this movie?"
        message="The movie will be removed from the public catalogue."
        confirmLabel="Withdraw movie"
        onConfirm={() => {
          const movieId = confirmWithdrawId;
          setConfirmWithdrawId(null);
          withdrawMovie(movieId);
        }}
        onClose={() => setConfirmWithdrawId(null)}
      />
    </section>
  );
}

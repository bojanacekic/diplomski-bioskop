import { useEffect, useState } from "react";
import ConfirmationDialog from "../components/ConfirmationDialog";
import MovieForm from "../components/management/MovieForm";
import MovieList from "../components/management/MovieList";
import { validateMovieForm } from "../utils/movieValidation";
import { movieService } from "../services/movieService";
import {
  toChangeMovieStatusRequestDto,
  toCreateMovieRequestDto,
  toUpdateMovieRequestDto,
} from "../dtos/movieRequestDtos";
import { toMovieForm } from "../mappers/movieMapper";

const emptyForm = {
  title: "",
  description: "",
  genre: "",
  durationMinutes: "",
  premiereDate: "",
  ageRating: "Not rated",
  posterBase64: null,
  verticalPosterBase64: null,
  trailerUrl: "",
};

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
    const query = search
      ? `?search=${encodeURIComponent(search)}&includeImages=false`
      : "?includeImages=false";
    const response = await movieService.getResponse(query);
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
    const response = await movieService.getById(movie.id);
    setEditingId(movie.id);
    setForm(toMovieForm(response.ok ? await response.json() : movie));
    setMessage("");
  };
  const newMovie = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setMessage("");
  };
  const refresh = async () => {
    await loadMovies();
    onMoviesChanged();
  };
  const submit = async (event) => {
    event.preventDefault();
    const validationErrors = validateMovieForm(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return setMessage("Please correct the highlighted fields.");
    }
    const response = editingId
      ? await movieService.update(
          editingId,
          toUpdateMovieRequestDto(form),
          accessToken,
        )
      : await movieService.create(toCreateMovieRequestDto(form), accessToken);
    if (!response.ok)
      return setMessage("Please check all required movie details.");
    const resultMessage = editingId ? "Movie updated." : "Movie added.";
    setForm(emptyForm);
    setEditingId(null);
    setMessage(resultMessage);
    await refresh();
  };
  const changeStatus = async (id, status) => {
    const response = await movieService.changeStatus(
      id,
      toChangeMovieStatusRequestDto(status),
      accessToken,
    );
    setMessage(
      response.ok
        ? "Movie status updated."
        : "This status transition is not allowed.",
    );
    await refresh();
  };
  const withdrawMovie = async (id) => {
    const response = await movieService.withdraw(id, accessToken);
    if (!response.ok) return;
    newMovie();
    setMessage("Movie withdrawn.");
    await refresh();
  };
  return (
    <section className="management-page">
      <div className="management-heading">
        <div>
          <h1>Manage movies</h1>
          <p>Add a new movie, edit its details or update its cinema status.</p>
        </div>
        <button className="header-link" onClick={onBack}>
          ← Back to movies
        </button>
      </div>
      <div className="management-layout">
        <MovieForm
          form={form}
          errors={errors}
          editing={Boolean(editingId)}
          message={message}
          onChange={updateField}
          onUpload={uploadPoster}
          onSubmit={submit}
          onNew={newMovie}
          onWithdraw={() => setConfirmWithdrawId(editingId)}
        />
        <MovieList
          movies={movies}
          search={search}
          onSearch={setSearch}
          onEdit={editMovie}
          onStatusChange={changeStatus}
        />
      </div>
      <ConfirmationDialog
        isOpen={Boolean(confirmWithdrawId)}
        title="Withdraw this movie?"
        message="The movie will be removed from the public catalogue."
        confirmLabel="Withdraw movie"
        onConfirm={() => {
          const id = confirmWithdrawId;
          setConfirmWithdrawId(null);
          withdrawMovie(id);
        }}
        onClose={() => setConfirmWithdrawId(null)}
      />
    </section>
  );
}

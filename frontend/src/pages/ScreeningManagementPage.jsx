import { useEffect, useState } from "react";
import ConfirmationDialog from "../components/ConfirmationDialog";

const api = import.meta.env.VITE_API_GATEWAY_URL;
const empty = {
  movieId: "",
  hallId: "",
  startsAtUtc: "",
  baseTicketPrice: "",
  status: 0,
};
const statusNames = ["SCHEDULED", "ACTIVE", "COMPLETED", "CANCELLED"];

export default function ScreeningManagementPage({ accessToken, onBack }) {
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const load = async () => {
    const [moviesResponse, hallsResponse, screeningsResponse] =
      await Promise.all([
        fetch(`${api}/api/movies`),
        fetch(`${api}/api/halls`),
        fetch(`${api}/api/screenings`),
      ]);
    if (moviesResponse.ok) setMovies(await moviesResponse.json());
    if (hallsResponse.ok) setHalls(await hallsResponse.json());
    if (screeningsResponse.ok) setScreenings(await screeningsResponse.json());
  };
  useEffect(() => {
    load();
  }, []);
  const name = (items, id, field) =>
    items.find((item) => item.id === id)?.[field] ?? "Unknown";
  const newScreening = () => {
    setEditing(null);
    setForm(empty);
    setMessage("");
  };
  const openEdit = (screening) => {
    setEditing(screening);
    const localStart = new Date(screening.startsAtUtc);
    localStart.setMinutes(
      localStart.getMinutes() - localStart.getTimezoneOffset(),
    );
    setForm({
      movieId: screening.movieId,
      hallId: screening.hallId,
      startsAtUtc: localStart.toISOString().slice(0, 16),
      baseTicketPrice: screening.baseTicketPrice,
      status: screening.status,
    });
    setMessage("");
  };
  const submit = async (event) => {
    event.preventDefault();
    const movie = movies.find((item) => item.id === form.movieId);
    if (!movie) return setMessage("Select a movie first.");
    const start = new Date(form.startsAtUtc);
    const end = new Date(start.getTime() + movie.durationMinutes * 60_000);
    const response = await fetch(
      `${api}/api/screenings${editing ? `/${editing.id}` : ""}`,
      {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...form,
          startsAtUtc: start.toISOString(),
          endsAtUtc: end.toISOString(),
          baseTicketPrice: Number(form.baseTicketPrice),
        }),
      },
    );
    if (response.ok) {
      setMessage(editing ? "Screening updated." : "Screening added.");
      newScreening();
      load();
    } else {
      const payload = await response.json().catch(() => ({}));
      setMessage(payload.message ?? "Screening could not be saved.");
    }
  };
  const deleteScreening = async () => {
    if (!editing) return;
    const response = await fetch(`${api}/api/screenings/${editing.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.ok) {
      newScreening();
      load();
    } else setMessage("The screening could not be deleted.");
  };
  const dateTime = (value) =>
    new Intl.DateTimeFormat("sr-RS", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  const visible = screenings.filter((screening) =>
    `${name(movies, screening.movieId, "title")} ${name(halls, screening.hallId, "name")}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <section className="management-page">
      <div className="management-heading">
        <div>
          <p className="eyebrow">CINEMA MANAGER</p>
          <h1>Manage screenings</h1>
          <p>Schedule films in halls and set the base ticket price.</p>
        </div>
        <button className="header-link" onClick={onBack}>
          ← Back to movies
        </button>
      </div>
      <div className="management-layout">
        <form className="movie-form" onSubmit={submit}>
          <p className="eyebrow">
            {editing ? "EDIT SCREENING" : "NEW SCREENING"}
          </p>
          <div className="form-title-row">
            <h2>{editing ? "Edit screening" : "Add a screening"}</h2>
            <button
              type="button"
              className="secondary-button"
              onClick={newScreening}
            >
              New screening
            </button>
          </div>
          <label>
            Movie
            <select
              value={form.movieId}
              onChange={(event) =>
                setForm({ ...form, movieId: event.target.value })
              }
              required
            >
              <option value="">Select a movie</option>
              {movies.map((movie) => (
                <option key={movie.id} value={movie.id}>
                  {movie.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Hall
            <select
              value={form.hallId}
              onChange={(event) =>
                setForm({ ...form, hallId: event.target.value })
              }
              required
            >
              <option value="">Select a hall</option>
              {halls.map((hall) => (
                <option key={hall.id} value={hall.id}>
                  {hall.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Starts at
            <input
              type="datetime-local"
              value={form.startsAtUtc}
              onChange={(event) =>
                setForm({ ...form, startsAtUtc: event.target.value })
              }
              required
            />
          </label>
          <label>
            Base ticket price (RSD)
            <input
              type="number"
              min="1"
              step="0.01"
              value={form.baseTicketPrice}
              onChange={(event) =>
                setForm({ ...form, baseTicketPrice: event.target.value })
              }
              required
            />
          </label>
          <label>
            Screening status
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: Number(event.target.value) })
              }
            >
              <option value="0">Scheduled</option>
              <option value="1">Active</option>
              <option value="2">Completed</option>
              <option value="3">Cancelled</option>
            </select>
          </label>
          {message && <p className="form-message">{message}</p>}
          <div className="form-actions">
            <button className="submit-button">
              {editing ? "Save changes" : "Add screening"}
            </button>
            {editing && (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={newScreening}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
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
              placeholder="Search movie or hall"
            />
          </label>
          <div className="management-list user-list">
            {visible.map((screening) => (
              <article
                className="manage-card clickable-card"
                key={screening.id}
                onClick={() => openEdit(screening)}
              >
                <div>
                  <p className="eyebrow">{statusNames[screening.status]}</p>
                  <h2>{name(movies, screening.movieId, "title")}</h2>
                  <p>
                    {name(halls, screening.hallId, "name")} ·{" "}
                    {dateTime(screening.startsAtUtc)} ·{" "}
                    {screening.baseTicketPrice} RSD
                  </p>
                </div>
              </article>
            ))}
            {visible.length === 0 && (
              <p className="state-message">No screenings found.</p>
            )}
          </div>
        </div>
      </div>
      <ConfirmationDialog
        isOpen={confirmDelete}
        title="Delete this screening?"
        message="This scheduled screening will be permanently removed."
        confirmLabel="Delete screening"
        onConfirm={() => {
          setConfirmDelete(false);
          deleteScreening();
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </section>
  );
}

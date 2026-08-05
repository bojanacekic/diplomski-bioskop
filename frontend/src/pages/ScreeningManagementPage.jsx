import { useEffect, useState } from "react";
import ConfirmationDialog from "../components/ConfirmationDialog";
import ScreeningForm from "../components/management/ScreeningForm";
import ScreeningList from "../components/management/ScreeningList";
import { hallService } from "../services/hallService";
import { movieService } from "../services/movieService";
import { screeningService } from "../services/screeningService";
import { toScreeningRequestDto } from "../dtos/screeningRequestDtos";
import { toScreeningForm } from "../mappers/screeningMapper";

const empty = {
  movieId: "",
  hallId: "",
  startsAtUtc: "",
  baseTicketPrice: "",
  status: 0,
};

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
    const responses = await Promise.all([
      movieService.getResponse("?includeImages=false"),
      hallService.getAll(),
      screeningService.getAll(),
    ]);
    if (responses[0].ok) setMovies(await responses[0].json());
    if (responses[1].ok) setHalls(await responses[1].json());
    if (responses[2].ok) setScreenings(await responses[2].json());
  };
  useEffect(() => {
    load();
  }, []);

  const newScreening = () => {
    setEditing(null);
    setForm(empty);
    setMessage("");
  };
  const openEdit = (screening) => {
    setEditing(screening);
    setForm(toScreeningForm(screening));
    setMessage("");
  };
  const submit = async (event) => {
    event.preventDefault();
    const movie = movies.find((item) => item.id === form.movieId);
    if (!movie) return setMessage("Select a movie first.");
    const start = new Date(form.startsAtUtc);
    const end = new Date(start.getTime() + movie.durationMinutes * 60_000);
    const dto = toScreeningRequestDto(
      form,
      start.toISOString(),
      end.toISOString(),
    );
    const response = editing
      ? await screeningService.update(editing.id, dto, accessToken)
      : await screeningService.create(dto, accessToken);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      return setMessage(payload.message ?? "Screening could not be saved.");
    }
    newScreening();
    await load();
  };
  const deleteScreening = async () => {
    if (!editing) return;
    const response = await screeningService.cancel(editing.id, accessToken);
    if (!response.ok) return setMessage("The screening could not be deleted.");
    newScreening();
    await load();
  };
  return (
    <section className="management-page">
      <div className="management-heading">
        <div>
          <h1>Manage screenings</h1>
          <p>Schedule films in halls and set the base ticket price.</p>
        </div>
        <button className="header-link" onClick={onBack}>
          ← Back to movies
        </button>
      </div>
      <div className="management-layout">
        <ScreeningForm
          form={form}
          setForm={setForm}
          movies={movies}
          halls={halls}
          editing={editing}
          message={message}
          onSubmit={submit}
          onNew={newScreening}
          onDelete={() => setConfirmDelete(true)}
        />
        <ScreeningList
          screenings={screenings}
          movies={movies}
          halls={halls}
          search={search}
          onSearch={setSearch}
          onEdit={openEdit}
        />
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

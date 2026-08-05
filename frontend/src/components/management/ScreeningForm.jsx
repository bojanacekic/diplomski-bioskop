export default function ScreeningForm({
  form,
  setForm,
  movies,
  halls,
  editing,
  message,
  onSubmit,
  onNew,
  onDelete,
}) {
  const set = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));
  return (
    <form className="movie-form" onSubmit={onSubmit}>
      <p className="eyebrow">{editing ? "EDIT SCREENING" : "NEW SCREENING"}</p>
      <div className="form-title-row">
        <h2>{editing ? "Edit screening" : "Add a screening"}</h2>
        <button type="button" className="secondary-button" onClick={onNew}>
          New screening
        </button>
      </div>
      <label>
        Movie
        <select
          value={form.movieId}
          onChange={(event) => set("movieId", event.target.value)}
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
          onChange={(event) => set("hallId", event.target.value)}
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
          onChange={(event) => set("startsAtUtc", event.target.value)}
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
          onChange={(event) => set("baseTicketPrice", event.target.value)}
          required
        />
      </label>
      <label>
        Screening status
        <select
          value={form.status}
          onChange={(event) => set("status", Number(event.target.value))}
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
            <button type="button" className="secondary-button" onClick={onNew}>
              Cancel
            </button>
            <button type="button" className="danger-button" onClick={onDelete}>
              Delete
            </button>
          </>
        )}
      </div>
    </form>
  );
}

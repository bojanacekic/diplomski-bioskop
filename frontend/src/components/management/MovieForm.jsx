export default function MovieForm({
  form,
  errors,
  editing,
  message,
  onChange,
  onUpload,
  onSubmit,
  onNew,
  onWithdraw,
}) {
  const error = (field) =>
    errors[field] && <small className="field-error">{errors[field]}</small>;
  return (
    <form className="movie-form" onSubmit={onSubmit}>
      <div className="form-title-row">
        <h2>{editing ? "Edit movie" : "Add a movie"}</h2>
        <button type="button" className="secondary-button" onClick={onNew}>
          New movie
        </button>
      </div>
      <label>
        Title
        <input
          className={errors.title ? "invalid-field" : ""}
          name="title"
          value={form.title}
          onChange={onChange}
          required
        />
        {error("title")}
      </label>
      <label>
        Genre
        <input
          className={errors.genre ? "invalid-field" : ""}
          name="genre"
          value={form.genre}
          onChange={onChange}
          required
        />
        {error("genre")}
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
            onChange={onChange}
            required
          />
          {error("durationMinutes")}
        </label>
        <label>
          Premiere date
          <input
            className={errors.premiereDate ? "invalid-field" : ""}
            name="premiereDate"
            type="date"
            value={form.premiereDate}
            onChange={onChange}
            required
          />
          {error("premiereDate")}
        </label>
      </div>
      <label>
        Age rating
        <input
          className={errors.ageRating ? "invalid-field" : ""}
          name="ageRating"
          value={form.ageRating}
          onChange={onChange}
          required
        />
        {error("ageRating")}
      </label>
      <label>
        Description
        <textarea
          className={errors.description ? "invalid-field" : ""}
          name="description"
          value={form.description}
          onChange={onChange}
          required
        />
        {error("description")}
      </label>
      <label>
        YouTube trailer URL (optional)
        <input
          className={errors.trailerUrl ? "invalid-field" : ""}
          name="trailerUrl"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={form.trailerUrl ?? ""}
          onChange={onChange}
        />
        {error("trailerUrl")}
      </label>
      <label>
        Horizontal poster
        <input type="file" accept="image/*" onChange={onUpload} />
      </label>
      <label>
        Vertical poster
        <input
          type="file"
          accept="image/*"
          onChange={(event) => onUpload(event, "verticalPosterBase64")}
        />
      </label>
      {message && <p className="form-message">{message}</p>}
      <div className="form-actions">
        <button className="submit-button">
          {editing ? "Save changes" : "Add movie"}
        </button>
        {editing && (
          <>
            <button type="button" className="secondary-button" onClick={onNew}>
              Cancel
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={onWithdraw}
            >
              Withdraw
            </button>
          </>
        )}
      </div>
    </form>
  );
}

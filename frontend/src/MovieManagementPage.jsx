import { useEffect, useState } from 'react';

const apiUrl = import.meta.env.VITE_API_GATEWAY_URL;
const emptyForm = { title: '', description: '', genre: '', durationMinutes: '', premiereDate: '', ageRating: 'Not rated', posterBase64: null };

export default function MovieManagementPage({ onBack, onMoviesChanged }) {
  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  const loadMovies = async () => {
    const response = await fetch(`${apiUrl}/api/movies`);
    if (response.ok) setMovies(await response.json());
  };

  useEffect(() => { loadMovies(); }, []);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const uploadPoster = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, posterBase64: reader.result }));
    reader.readAsDataURL(file);
  };

  const editMovie = (movie) => {
    setEditingId(movie.id);
    setForm({ ...movie, premiereDate: movie.premiereDate.slice(0, 10) });
    setMessage(`Editing ${movie.title}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    const payload = { ...form, durationMinutes: Number(form.durationMinutes), ...(editingId ? {} : { status: 0 }) };
    const response = await fetch(`${apiUrl}/api/movies${editingId ? `/${editingId}` : ''}`, {
      method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (!response.ok) return setMessage('Please check all required movie details.');
    setForm(emptyForm); setEditingId(null); setMessage(editingId ? 'Movie updated.' : 'Movie added.');
    await loadMovies();
    onMoviesChanged();
  };

  const changeStatus = async (id, status) => {
    const response = await fetch(`${apiUrl}/api/movies/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setMessage(response.ok ? 'Movie status updated.' : 'This status transition is not allowed.');
    await loadMovies();
    onMoviesChanged();
  };

  const withdrawMovie = async (id) => {
    if (!window.confirm('Withdraw this movie from the public catalogue?')) return;
    const response = await fetch(`${apiUrl}/api/movies/${id}`, { method: 'DELETE' });
    if (response.ok) { setMessage('Movie withdrawn.'); await loadMovies(); onMoviesChanged(); }
  };

  return <section className="management-page">
    <div className="management-heading"><div><p className="eyebrow">CINEMA MANAGER</p><h1>Manage films.</h1><p>Add a new movie, edit its details or update its cinema status.</p></div><button className="header-link" onClick={onBack}>← Back to movies</button></div>
    <div className="management-layout">
      <form className="movie-form" onSubmit={submit}>
        <h2>{editingId ? 'Edit movie' : 'Add a movie'}</h2>
        <label>Title<input name="title" value={form.title} onChange={updateField} required /></label>
        <label>Genre<input name="genre" value={form.genre} onChange={updateField} required /></label>
        <div className="form-row"><label>Duration (min)<input name="durationMinutes" type="number" min="1" value={form.durationMinutes} onChange={updateField} required /></label><label>Premiere date<input name="premiereDate" type="date" value={form.premiereDate} onChange={updateField} required /></label></div>
        <label>Age rating<input name="ageRating" value={form.ageRating} onChange={updateField} required /></label>
        <label>Description<textarea name="description" value={form.description} onChange={updateField} required /></label>
        <label>Horizontal poster<input type="file" accept="image/*" onChange={uploadPoster} /></label>
        {message && <p className="form-message">{message}</p>}
        <div className="form-actions"><button className="submit-button">{editingId ? 'Save changes' : 'Add movie'}</button>{editingId && <button type="button" className="secondary-button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancel</button>}</div>
      </form>
      <div className="management-list">
        {movies.map((movie) => <article className="manage-card" key={movie.id}>
          <div><p className="eyebrow">{['Upcoming', 'Active', 'Withdrawn'][movie.status]}</p><h2>{movie.title}</h2><p>{movie.genre} · {movie.durationMinutes} min · {movie.premiereDate}</p></div>
          <div className="manage-actions"><button className="secondary-button" onClick={() => editMovie(movie)}>Edit</button>{movie.status === 0 && <button className="secondary-button" onClick={() => changeStatus(movie.id, 1)}>Set active</button>}{movie.status === 1 && <button className="secondary-button" onClick={() => changeStatus(movie.id, 0)}>Set upcoming</button>}<button className="danger-button" onClick={() => withdrawMovie(movie.id)}>Withdraw</button></div>
        </article>)}
      </div>
    </div>
  </section>;
}

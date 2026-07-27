import { useEffect, useState } from 'react';

const api = import.meta.env.VITE_API_GATEWAY_URL;
const empty = { name: '', type: 0, rows: '', seatsPerRow: '' };

export default function HallManagementPage({ onBack }) {
  const [halls, setHalls] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState('');

  const load = async () => {
    const response = await fetch(`${api}/api/halls${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    if (response.ok) setHalls(await response.json());
  };

  useEffect(() => { load(); }, [search]);

  const submit = async (event) => {
    event.preventDefault();
    const response = await fetch(`${api}/api/halls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, type: Number(form.type), rows: Number(form.rows), seatsPerRow: Number(form.seatsPerRow) })
    });
    setMessage(response.ok ? 'Hall added.' : 'Please check the hall details.');
    if (response.ok) { setForm(empty); load(); }
  };

  return <section className="management-page">
    <div className="management-heading"><div><p className="eyebrow">CINEMA MANAGER</p><h1>Manage halls.</h1><p>Create cinema halls and define their seating capacity.</p></div><button className="header-link" onClick={onBack}>Back to movies</button></div>
    <div className="management-layout">
      <form className="movie-form" onSubmit={submit}>
        <h2>Add a hall</h2>
        <label>Hall name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Hall type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="0">Standard</option><option value="1">Premium</option><option value="2">IMAX</option><option value="3">3D</option></select></label>
        <div className="form-row"><label>Rows<input type="number" min="1" value={form.rows} onChange={(event) => setForm({ ...form, rows: event.target.value })} required /></label><label>Seats per row<input type="number" min="1" value={form.seatsPerRow} onChange={(event) => setForm({ ...form, seatsPerRow: event.target.value })} required /></label></div>
        {message && <p className="form-message">{message}</p>}<button className="submit-button">Add hall</button>
      </form>
      <div><label className="search"><span>&#8981;</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search halls by name or type" /></label><div className="management-list user-list">{halls.map((hall) => <article className="manage-card" key={hall.id}><div><p className="eyebrow">{['STANDARD', 'PREMIUM', 'IMAX', '3D'][hall.type]}</p><h2>{hall.name}</h2><p>{hall.rows} rows · {hall.seatsPerRow} seats per row · {hall.capacity} seats total</p></div></article>)}{halls.length === 0 && <p className="state-message">No halls found.</p>}</div></div>
    </div>
  </section>;
}

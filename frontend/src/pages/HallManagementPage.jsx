import { useEffect, useState } from "react";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { hallService } from "../services/hallService";
import { toHallRequestDto } from "../dtos/hallRequestDtos";
import { hallTypeLabel } from "../models/hallType";
import { toHallForm } from "../mappers/hallMapper";
const empty = { name: "", type: 0, rows: "", seatsPerRow: "" };

export default function HallManagementPage({ accessToken, onBack, onViewLayout }) {
  const [halls, setHalls] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const load = async () => {
    const response = await hallService.getAll(search ? `?search=${encodeURIComponent(search)}` : "");
    if (response.ok) setHalls(await response.json());
  };
  useEffect(() => {
    load();
  }, [search]);
  const openEdit = (hall) => {
    setEditingId(hall.id);
    setForm(toHallForm(hall));
    setMessage("");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setForm(empty);
    setMessage("");
  };
  const deleteHall = async () => {
    if (!editingId) return;
    const response = await hallService.deactivate(editingId, accessToken);
    if (response.ok) {
      cancelEdit();
      load();
    } else setMessage("The hall could not be deleted.");
  };
  const submit = async (event) => {
    event.preventDefault();
    const dto = toHallRequestDto(form);
    const response = editingId
      ? await hallService.update(editingId, dto, accessToken)
      : await hallService.create(dto, accessToken);
    setMessage(
      response.ok
        ? editingId
          ? "Hall updated."
          : "Hall added."
        : "Please check the hall details.",
    );
    if (response.ok) {
      setEditingId(null);
      setForm(empty);
      load();
    }
  };
  return (
    <section className="management-page">
      <div className="management-heading">
        <div>
          <h1>Manage halls</h1>
          <p>Create cinema halls and define their seating capacity.</p>
        </div>
        <button className="header-link" onClick={onBack}>
          ← Back to movies
        </button>
      </div>
      <div className="management-layout">
        <form className="movie-form" onSubmit={submit}>
          <p className="eyebrow">{editingId ? "EDIT HALL" : "NEW HALL"}</p>
          <div className="form-title-row">
            <h2>{editingId ? "Edit hall" : "Add a hall"}</h2>
            <button
              type="button"
              className="secondary-button"
              onClick={cancelEdit}
            >
              New hall
            </button>
          </div>
          <label>
            Hall name
            <input
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              required
            />
          </label>
          <label>
            Hall type
            <select
              value={form.type}
              onChange={(event) =>
                setForm({ ...form, type: event.target.value })
              }
            >
              <option value="0">Standard</option>
              <option value="1">Premium</option>
              <option value="2">IMAX</option>
              <option value="3">3D</option>
            </select>
          </label>
          <div className="form-row">
            <label>
              Rows
              <input
                type="number"
                min="1"
                value={form.rows}
                onChange={(event) =>
                  setForm({ ...form, rows: event.target.value })
                }
                required
              />
            </label>
            <label>
              Seats per row
              <input
                type="number"
                min="1"
                value={form.seatsPerRow}
                onChange={(event) =>
                  setForm({ ...form, seatsPerRow: event.target.value })
                }
                required
              />
            </label>
          </div>
          {message && <p className="form-message">{message}</p>}
          <div className="form-actions">
            <button className="submit-button">
              {editingId ? "Save changes" : "Add hall"}
            </button>
            {editingId && (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelEdit}
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
            <span>&#8981;</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search halls by name or type"
            />
          </label>
          <div className="management-list user-list">
            {halls.map((hall) => (
              <article
                className="manage-card clickable-card"
                key={hall.id}
                onClick={() => openEdit(hall)}
              >
                <div>
                  <p className="eyebrow">
                    {hallTypeLabel(hall.type).toUpperCase()}
                  </p>
                  <h2>{hall.name}</h2>
                  <p>
                    {hall.rows} rows · {hall.seatsPerRow} seats per row ·{" "}
                    {hall.capacity} seats total
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onViewLayout(hall);
                  }}
                >
                  View hall layout
                </button>
              </article>
            ))}
            {halls.length === 0 && (
              <p className="state-message">No halls found.</p>
            )}
          </div>
        </div>
      </div>
      <ConfirmationDialog
        isOpen={confirmDelete}
        title="Delete this hall?"
        message="This action cannot be undone."
        confirmLabel="Delete hall"
        onConfirm={() => {
          setConfirmDelete(false);
          deleteHall();
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </section>
  );
}

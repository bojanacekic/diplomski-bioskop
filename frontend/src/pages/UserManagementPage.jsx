import { useState } from "react";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { userService } from "../services/userService";
import { toChangeUserRoleRequestDto, toUpdateUserRequestDto } from "../dtos/userRequestDtos";
import { UserRole, userRoleLabel } from "../models/userRole";
import { toUserForm } from "../mappers/userMapper";
import { useUsers } from "../hooks/useUsers";

export function UserManagementPage({ token, onBack }) {
  const [search, setSearch] = useState("");
  const { users, refresh: load } = useUsers(search, token);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState(null);
  const [confirmActivateId, setConfirmActivateId] = useState(null);
  const [userMessage, setUserMessage] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
  });
  const changeRole = async (id, role) => {
    await userService.changeRole(id, toChangeUserRoleRequestDto(role), token);
    load();
  };
  const saveUser = async (event) => {
    event.preventDefault();
    await userService.update(editingUser.id, toUpdateUserRequestDto(form), token);
    setEditingUser(null);
    load();
  };
  const deactivate = async (id) => {
    setUserMessage(null);
    const response = await userService.deactivate(id, token);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setUserMessage({ type: "error", text: payload.message ?? "User could not be deactivated." });
      return;
    }
    setUserMessage({ type: "success", text: "User deactivated successfully." });
    load();
  };
  const activate = async (id) => {
    setUserMessage(null);
    const response = await userService.activate(id, token);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setUserMessage({ type: "error", text: payload.message ?? "User could not be activated." });
      return;
    }
    setUserMessage({ type: "success", text: "User activated successfully." });
    load();
  };
  const openEdit = (user) => {
    setEditingUser(user);
    setForm(toUserForm(user));
  };
  return (
    <section className="management-page user-management-page">
      <div className="management-heading">
        <div>
          <h1>Manage users</h1>
        </div>
        <button className="header-link management-back-button" onClick={onBack}>
          ← Back to movies
        </button>
      </div>
      <label className="search">
        <span>⌕</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, username or email"
        />
      </label>
      {userMessage && <p className={`form-message ${userMessage.type}`}>{userMessage.text}</p>}
      <div className="management-list user-list">
        {users.map((user) => (
          <article className="manage-card" key={user.id}>
            <div>
              <p className="eyebrow">
                {user.isActive ? "ACTIVE" : "DEACTIVATED"}
              </p>
              <h2>{`${user.firstName} ${user.lastName}`.trim() || user.username}</h2>
              <p>
                @{user.username} · {user.email}
              </p>
              <p>
                Role: {userRoleLabel(user.role)} · Joined: {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(user.createdAtUtc))}
              </p>
            </div>
            <div className="manage-actions">
              <button
                className="secondary-button"
                onClick={() => openEdit(user)}
              >
                Edit
              </button>
              <select
                value={user.role}
                onChange={(event) => changeRole(user.id, event.target.value)}
              >
                <option value={UserRole.RegisteredUser}>Registered user</option>
                <option value={UserRole.CinemaManager}>Cinema manager</option>
                <option value={UserRole.Administrator}>Administrator</option>
              </select>
              {user.isActive && (
                <button
                  className="danger-button"
                  onClick={() => setConfirmDeactivateId(user.id)}
                >
                  Deactivate
                </button>
              )}
              {!user.isActive && (
                <button
                  className="submit-button"
                  onClick={() => setConfirmActivateId(user.id)}
                >
                  Activate
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {editingUser && (
        <div className="modal-backdrop">
          <form className="user-modal" onSubmit={saveUser}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setEditingUser(null)}
            >
              ×
            </button>
            <p className="eyebrow">EDIT USER</p>
            <h2>{`${editingUser.firstName} ${editingUser.lastName}`.trim() || editingUser.username}</h2>
            <div className="auth-name-row">
              <label>
                First name
                <input
                  value={form.firstName}
                  onChange={(event) =>
                    setForm({ ...form, firstName: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Last name
                <input
                  value={form.lastName}
                  onChange={(event) =>
                    setForm({ ...form, lastName: event.target.value })
                  }
                  required
                />
              </label>
            </div>
            <label>
              Username
              <input
                value={form.username}
                onChange={(event) =>
                  setForm({ ...form, username: event.target.value })
                }
                required
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                required
              />
            </label>
            <div className="form-actions">
              <button className="submit-button">Save changes</button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      <ConfirmationDialog
        isOpen={Boolean(confirmDeactivateId)}
        title="Deactivate this user?"
        message="The user will no longer be able to sign in."
        confirmLabel="Deactivate user"
        onConfirm={() => {
          const userId = confirmDeactivateId;
          setConfirmDeactivateId(null);
          deactivate(userId);
        }}
        onClose={() => setConfirmDeactivateId(null)}
      />
      <ConfirmationDialog
        isOpen={Boolean(confirmActivateId)}
        title="Activate this user?"
        message="The user will be able to sign in again."
        confirmLabel="Activate user"
        onConfirm={() => {
          const userId = confirmActivateId;
          setConfirmActivateId(null);
          activate(userId);
        }}
        onClose={() => setConfirmActivateId(null)}
      />
    </section>
  );
}

import { useEffect, useState } from "react";

const api = import.meta.env.VITE_API_GATEWAY_URL;
const headers = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export function ProfilePage({ token, onBack }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
  });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);
  useEffect(() => {
    fetch(`${api}/api/users/me`, { headers: headers(token) })
      .then((response) => response.json())
      .then((user) =>
        setForm({
          username: user.username,
          email: user.email,
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
        }),
      );
  }, []);
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`${api}/api/users/me`, {
        method: "PUT",
        headers: headers(token),
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const validationMessage = payload.errors
          ? Object.values(payload.errors).flat().join(" ")
          : null;
        const serviceMessage =
          response.status === 401
            ? "Your session has expired. Please sign in again."
            : response.status >= 502
              ? "The Auth service is not running. Start it and try again."
              : null;
        setMessage({
          type: "error",
          text:
            payload.message ??
            validationMessage ??
            serviceMessage ??
            `Profile could not be updated (error ${response.status}).`,
        });
        return;
      }

      setForm({
        username: payload.username,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      });
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch {
      setMessage({
        type: "error",
        text: "The Auth service is unavailable. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };
  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New password and confirmation do not match.",
      });
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordMessage({
        type: "error",
        text: "New password must be different from the current password.",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch(`${api}/api/users/me/password`, {
        method: "PUT",
        headers: headers(token),
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const serviceMessage =
          response.status === 401
            ? "Your session has expired. Please sign in again."
            : response.status >= 502
              ? "The Auth service is not running. Start it and try again."
              : null;
        setPasswordMessage({
          type: "error",
          text:
            payload.message ??
            serviceMessage ??
            `Password could not be changed (error ${response.status}).`,
        });
        return;
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordMessage({ type: "success", text: "Password changed successfully." });
    } catch {
      setPasswordMessage({
        type: "error",
        text: "The Auth service is unavailable. Please try again.",
      });
    } finally {
      setChangingPassword(false);
    }
  };
  return (
    <section className="management-page profile-page">
      <div className="management-heading">
        <div>
          <p className="eyebrow">MY ACCOUNT</p>
          <h1>My profile</h1>
        </div>
        <button className="header-link" onClick={onBack}>
          ← Back to movies
        </button>
      </div>
      <div className="profile-layout">
        <form className="movie-form profile-form" onSubmit={save}>
          <p className="eyebrow">PERSONAL DETAILS</p>
          <h2>Account information</h2>
          <p className="profile-help">
            Keep your personal details current. These details are visible only
            to you and Smart Cinema administrators.
          </p>
          <div className="auth-name-row">
            <label>First name<input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required /></label>
            <label>Last name<input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required /></label>
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
          {message && (
            <p className={`form-message ${message.type}`}>{message.text}</p>
          )}
          <button className="submit-button" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
        <form className="movie-form profile-form password-form" onSubmit={changePassword}>
          <p className="eyebrow">SECURITY</p>
          <h2>Change password</h2>
          <p className="profile-help">
            Enter your current password to choose a new one.
          </p>
          <label>
            Current password
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: event.target.value,
                })
              }
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: event.target.value,
                })
              }
              required
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: event.target.value,
                })
              }
              required
            />
          </label>
          {passwordMessage && (
            <p className={`form-message ${passwordMessage.type}`}>
              {passwordMessage.text}
            </p>
          )}
          <button className="submit-button" disabled={changingPassword}>
            {changingPassword ? "Changing password..." : "Change password"}
          </button>
        </form>
      </div>
    </section>
  );
}

export function UserManagementPage({ token, onBack }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
  });
  const load = async () => {
    const response = await fetch(
      `${api}/api/users?search=${encodeURIComponent(search)}`,
      { headers: headers(token) },
    );
    if (response.ok) setUsers(await response.json());
  };
  useEffect(() => {
    load();
  }, [search]);
  const changeRole = async (id, role) => {
    await fetch(`${api}/api/users/${id}/role`, {
      method: "PATCH",
      headers: headers(token),
      body: JSON.stringify({ role: Number(role) }),
    });
    load();
  };
  const saveUser = async (event) => {
    event.preventDefault();
    await fetch(`${api}/api/users/${editingUser.id}`, {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify(form),
    });
    setEditingUser(null);
    load();
  };
  const deactivate = async (id) => {
    if (window.confirm("Deactivate this user?")) {
      await fetch(`${api}/api/users/${id}/deactivate`, {
        method: "PATCH",
        headers: headers(token),
      });
      load();
    }
  };
  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      username: user.username,
      email: user.email,
    });
  };
  return (
    <section className="management-page">
      <div className="management-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Manage users</h1>
        </div>
        <button className="header-link" onClick={onBack}>
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
                Role: {["", "Registered user", "Cinema manager", "Administrator"][user.role]} · Joined: {new Intl.DateTimeFormat("sr-RS", { dateStyle: "medium" }).format(new Date(user.createdAtUtc))}
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
                <option value="1">Registered user</option>
                <option value="2">Cinema manager</option>
                <option value="3">Administrator</option>
              </select>
              {user.isActive && (
                <button
                  className="danger-button"
                  onClick={() => deactivate(user.id)}
                >
                  Deactivate
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
    </section>
  );
}

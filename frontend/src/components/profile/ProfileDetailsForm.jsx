export default function ProfileDetailsForm({
  form,
  setForm,
  message,
  saving,
  onSubmit,
}) {
  const update = (field) => (event) =>
    setForm({ ...form, [field]: event.target.value });
  return (
    <form className="movie-form profile-form" onSubmit={onSubmit}>
      <p className="eyebrow">PERSONAL DETAILS</p>
      <h2>Account information</h2>
      <p className="profile-help">
        Keep your personal details current. These details are visible only to
        you and Smart Cinema administrators.
      </p>
      <div className="auth-name-row">
        <label>
          First name
          <input
            value={form.firstName}
            onChange={update("firstName")}
            required
          />
        </label>
        <label>
          Last name
          <input value={form.lastName} onChange={update("lastName")} required />
        </label>
      </div>
      <label>
        Username
        <input value={form.username} onChange={update("username")} required />
      </label>
      <label>
        Email address
        <input
          type="email"
          value={form.email}
          onChange={update("email")}
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
  );
}

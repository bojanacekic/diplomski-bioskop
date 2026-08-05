export default function ChangePasswordForm({
  form,
  setForm,
  message,
  changing,
  onSubmit,
}) {
  const update = (field) => (event) =>
    setForm({ ...form, [field]: event.target.value });
  return (
    <form className="movie-form profile-form" onSubmit={onSubmit}>
      <p className="eyebrow">SECURITY</p>
      <h2>Change password</h2>
      <p className="profile-help">
        Enter your current password to choose a new one.
      </p>
      <label>
        Current password
        <input
          type="password"
          value={form.currentPassword}
          onChange={update("currentPassword")}
          required
        />
      </label>
      <label>
        New password
        <input
          type="password"
          value={form.newPassword}
          onChange={update("newPassword")}
          required
        />
      </label>
      <label>
        Confirm new password
        <input
          type="password"
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
          required
        />
      </label>
      {message && (
        <p className={`form-message ${message.type}`}>{message.text}</p>
      )}
      <button className="submit-button" disabled={changing}>
        {changing ? "Changing password..." : "Change password"}
      </button>
    </form>
  );
}

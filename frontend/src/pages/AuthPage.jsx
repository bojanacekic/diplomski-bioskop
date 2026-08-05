import { useState } from "react";
import { authService } from "../services/authService";
import { toAuthRequestDto, toForgotPasswordRequestDto, toResetPasswordRequestDto } from "../dtos/authRequestDtos";

const emptyRegister = { username: "", email: "", firstName: "", lastName: "", password: "" };
const emptyLogin = { usernameOrEmail: "", password: "" };
const emptyReset = { newPassword: "", confirmPassword: "" };
const errorText = (payload) =>
  payload?.detail ?? Object.values(payload?.errors ?? {}).flat().join(" ") ?? "The request could not be completed.";

export default function AuthPage({ mode, onModeChange, resetToken, featuredMovie, featuredPosterUrl, onBack, onAuthenticated }) {
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [resetForm, setResetForm] = useState(emptyReset);
  const [loginFailures, setLoginFailures] = useState(0);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const changeForm = (setter) => (event) => setter((state) => ({ ...state, [event.target.name]: event.target.value }));
  const changeMode = (nextMode) => { setMessage(null); onModeChange(nextMode); };

  const submitAuth = async (event) => {
    event.preventDefault();
    const registering = mode === "register";
    if (registering && registerForm.password.length < 6)
      return setMessage({ type: "error", text: "Password must be at least 6 characters." });
    setSubmitting(true); setMessage(null);
    try {
      const response = await authService.authenticate(registering, toAuthRequestDto(registering, registerForm, loginForm));
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (!registering && response.status === 401) setLoginFailures((count) => count + 1);
        throw new Error(errorText(payload));
      }
      setLoginFailures(0); setRegisterForm(emptyRegister); setLoginForm(emptyLogin);
      onAuthenticated(payload);
    } catch (error) { setMessage({ type: "error", text: error.message }); }
    finally { setSubmitting(false); }
  };

  const requestReset = async (event) => {
    event.preventDefault(); setSubmitting(true); setMessage(null);
    try {
      const response = await authService.forgotPassword(toForgotPasswordRequestDto(loginForm.usernameOrEmail));
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(errorText(payload));
      setMessage({ type: "success", text: payload.message });
    } catch (error) { setMessage({ type: "error", text: error.message }); }
    finally { setSubmitting(false); }
  };

  const submitReset = async (event) => {
    event.preventDefault(); setMessage(null);
    if (resetForm.newPassword.length < 6) return setMessage({ type: "error", text: "Password must be at least 6 characters." });
    if (resetForm.newPassword !== resetForm.confirmPassword) return setMessage({ type: "error", text: "Passwords do not match." });
    setSubmitting(true);
    try {
      const response = await authService.resetPassword(toResetPasswordRequestDto(resetToken, resetForm.newPassword));
      if (!response.ok) throw new Error(errorText(await response.json().catch(() => ({}))));
      window.history.replaceState({}, "", window.location.pathname);
      setResetForm(emptyReset); onModeChange("login");
      setMessage({ type: "success", text: "Password changed. You can now sign in." });
    } catch (error) { setMessage({ type: "error", text: error.message }); }
    finally { setSubmitting(false); }
  };

  return <section className="auth-page">
    <div className="auth-copy">
      {featuredMovie && <img className="auth-featured-image" src={featuredPosterUrl} alt="" />}
      <div className="auth-copy-content">
        <h1>{featuredMovie?.title ?? "Every story starts here."}</h1>
        {featuredMovie ? <><p className="featured-details">{featuredMovie.genre} · {featuredMovie.durationMinutes} min</p><p className="featured-description">{featuredMovie.description}</p></> : <p>Reserve your favorite seats, access your tickets and discover films made for you.</p>}
      </div>
    </div>
    <div className="auth-card">
      <button className="back-button" onClick={onBack}>← Back to movies</button>
      <h2>{mode === "register" ? "Create your account" : mode === "forgot" ? "Reset your password" : mode === "reset" ? "Choose a new password" : "Welcome back"}</h2>
      {(mode === "login" || mode === "register") && <>
        <div className="mode-switch"><button className={mode === "register" ? "active" : ""} onClick={() => changeMode("register")}>Create account</button><button className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>Sign in</button></div>
        <form onSubmit={submitAuth}>
          {mode === "register" && <><div className="auth-name-row"><label>First name<input name="firstName" value={registerForm.firstName} onChange={changeForm(setRegisterForm)} required /></label><label>Last name<input name="lastName" value={registerForm.lastName} onChange={changeForm(setRegisterForm)} required /></label></div><label>Username<input name="username" value={registerForm.username} onChange={changeForm(setRegisterForm)} required /></label></>}
          <label>{mode === "register" ? "Email address" : "Username or email"}<input name={mode === "register" ? "email" : "usernameOrEmail"} type={mode === "register" ? "email" : "text"} value={mode === "register" ? registerForm.email : loginForm.usernameOrEmail} onChange={changeForm(mode === "register" ? setRegisterForm : setLoginForm)} required /></label>
          <label>Password<input name="password" type="password" value={mode === "register" ? registerForm.password : loginForm.password} onChange={changeForm(mode === "register" ? setRegisterForm : setLoginForm)} required /></label>
          {message && <p className="form-error">{message.text}</p>}
          <button className="submit-button" disabled={submitting}>{submitting ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}</button>
          {mode === "login" && loginFailures >= 3 && <button className="auth-text-button" type="button" onClick={() => changeMode("forgot")}>Forgot password?</button>}
        </form>
      </>}
      {mode === "forgot" && <form onSubmit={requestReset}><p className="profile-help">Enter the username or email address connected to your account.</p><label>Username or email<input name="usernameOrEmail" value={loginForm.usernameOrEmail} onChange={changeForm(setLoginForm)} required /></label>{message && <p className={`form-message ${message.type}`}>{message.text}</p>}<button className="submit-button" disabled={submitting}>{submitting ? "Sending..." : "Send reset link"}</button><button className="auth-text-button" type="button" onClick={() => changeMode("login")}>Back to sign in</button></form>}
      {mode === "reset" && <form onSubmit={submitReset}><label>New password<input name="newPassword" type="password" value={resetForm.newPassword} onChange={changeForm(setResetForm)} maxLength={100} autoComplete="new-password" required /></label><label>Confirm new password<input name="confirmPassword" type="password" value={resetForm.confirmPassword} onChange={changeForm(setResetForm)} maxLength={100} autoComplete="new-password" required /></label>{message && <p className={`form-message ${message.type}`}>{message.text}</p>}<button className="submit-button" disabled={submitting}>{submitting ? "Changing..." : "Change password"}</button></form>}
    </div>
  </section>;
}

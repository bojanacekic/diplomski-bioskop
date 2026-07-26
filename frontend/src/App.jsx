import { useState } from 'react';

const apiUrl = import.meta.env.VITE_AUTH_API_URL;

const initialRegisterForm = { username: '', email: '', password: '' };
const initialLoginForm = { usernameOrEmail: '', password: '' };

function App() {
  const [mode, setMode] = useState('register');
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [session, setSession] = useState(() => {
    const savedSession = localStorage.getItem('smartCinemaSession');
    return savedSession ? JSON.parse(savedSession) : null;
  });

  const updateForm = (formSetter) => (event) => {
    const { name, value } = event.target;
    formSetter((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!apiUrl) {
      setMessage({ type: 'error', text: 'The auth API URL is not configured.' });
      return;
    }

    const isRegistration = mode === 'register';
    const path = isRegistration ? '/api/auth/register' : '/api/auth/login';
    const requestBody = isRegistration ? registerForm : loginForm;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`${apiUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      let payload = {};
      try {
        payload = await response.json();
      } catch {
        payload = {};
      }

      if (!response.ok) {
        const validationErrors = Object.values(payload.errors ?? {}).flat().join(' ');
        throw new Error(payload.detail ?? validationErrors ?? 'The request could not be completed.');
      }

      localStorage.setItem('smartCinemaSession', JSON.stringify(payload));
      setSession(payload);
      setMessage({ type: 'success', text: `Welcome, ${payload.username}. You are now signed in.` });
      setRegisterForm(initialRegisterForm);
      setLoginForm(initialLoginForm);
    } catch (error) {
      setMessage({ type: 'error', text: error.message ?? 'Unable to contact the auth service.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('smartCinemaSession');
    setSession(null);
    setMessage({ type: 'success', text: 'You have been signed out.' });
  };

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="brand"><span className="brand-mark">SC</span> Smart Cinema</div>
        <p className="eyebrow">YOUR MOVIE NIGHT, SIMPLIFIED</p>
        <h1>Stories begin<br />with a seat.</h1>
        <p className="hero-copy">Create your account to reserve the best seats, keep your tickets in one place and receive movie recommendations.</p>
        <div className="feature-list">
          <div><span>01</span> Reserve seats in seconds</div>
          <div><span>02</span> Store tickets securely</div>
          <div><span>03</span> Discover your next favorite film</div>
        </div>
      </section>

      <section className="auth-panel">
        {session ? (
          <div className="session-card">
            <div className="session-icon">✓</div>
            <p className="eyebrow">SIGNED IN</p>
            <h2>Hello, {session.username}</h2>
            <p>Your account is ready. Movie listings and reservations will appear here as the next services are connected.</p>
            <div className="role-badge">{session.role}</div>
            <button className="secondary-button" onClick={signOut}>Sign out</button>
          </div>
        ) : (
          <div className="form-container">
            <p className="eyebrow">WELCOME TO SMART CINEMA</p>
            <h2>{mode === 'register' ? 'Create your account' : 'Welcome back'}</h2>
            <p className="form-intro">{mode === 'register' ? 'Start your cinema experience today.' : 'Sign in to continue to your account.'}</p>

            <div className="mode-switch" role="tablist" aria-label="Authentication mode">
              <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button>
              <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button>
            </div>

            <form onSubmit={submit}>
              {mode === 'register' && (
                <label>
                  Username
                  <input name="username" value={registerForm.username} onChange={updateForm(setRegisterForm)} placeholder="e.g. mila.petrovic" autoComplete="username" required />
                </label>
              )}
              <label>
                {mode === 'register' ? 'Email address' : 'Username or email'}
                <input name={mode === 'register' ? 'email' : 'usernameOrEmail'} type={mode === 'register' ? 'email' : 'text'} value={mode === 'register' ? registerForm.email : loginForm.usernameOrEmail} onChange={updateForm(mode === 'register' ? setRegisterForm : setLoginForm)} placeholder={mode === 'register' ? 'you@example.com' : 'Your username or email'} autoComplete="email" required />
              </label>
              <label>
                Password
                <input name="password" type="password" value={mode === 'register' ? registerForm.password : loginForm.password} onChange={updateForm(mode === 'register' ? setRegisterForm : setLoginForm)} placeholder="Enter your password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required />
              </label>
              {message && <p className={`message ${message.type}`}>{message.text}</p>}
              <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}</button>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;

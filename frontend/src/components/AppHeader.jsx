import { useEffect, useRef, useState } from "react";
import lightLogo from "../assets/smart-cinema-logo-light.png";

const primaryLinks = [["home", "Home"], ["upcoming", "Coming soon"], ["about", "About"], ["contact", "Contact"]];

export default function AppHeader({ page, session, isCinemaManager, isAdministrator, onNavigate, onAuth, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOutside = (event) => !menuRef.current?.contains(event.target) && setMenuOpen(false);
    const closeOnEscape = (event) => event.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);
  const navigateFromMenu = (target) => { onNavigate(target); setMenuOpen(false); };

  return (
    <header className="topbar">
      <button className="logo" onClick={() => onNavigate("home")}>
        <span className="logo-mark"><img src={lightLogo} alt="Smart Cinema" /></span>
        <span className="logo-text">Smart Cinema</span>
      </button>
      <nav className="primary-nav" aria-label="Main navigation">
        {primaryLinks.map(([target, label]) => <button key={target} className={page === target ? "active" : ""} onClick={() => onNavigate(target)}>{label}</button>)}
      </nav>
      <nav className="account-nav" aria-label="Account navigation">
        {session ? (
          <div className="account-menu" ref={menuRef}>
            <button className="account-trigger" onClick={() => setMenuOpen((open) => !open)}>Hi, {session.username} <span>⌄</span></button>
            {menuOpen && <div className="account-dropdown">
              <span className="menu-section-label">Account</span>
              <button onClick={() => navigateFromMenu("profile")}>My profile</button>
              {(isCinemaManager || isAdministrator) && <>
                <span className="menu-section-label">Cinema</span>
                <button onClick={() => navigateFromMenu("manage")}>Movies</button>
                <button onClick={() => navigateFromMenu("halls")}>Halls</button>
                <button onClick={() => navigateFromMenu("screenings")}>Screenings</button>
                <span className="menu-section-label">Operations</span>
                <button onClick={() => navigateFromMenu("reservations")}>Reservations</button>
                <button onClick={() => navigateFromMenu("ticket-validation")}>Validate tickets</button>
              </>}
              {isAdministrator && <>
                <span className="menu-section-label">Administration</span>
                <button onClick={() => navigateFromMenu("users")}>Users</button>
              </>}
              <button className="signout-menu-item" onClick={onSignOut}>Sign out</button>
            </div>}
          </div>
        ) : <>
          <button className="header-link" onClick={() => onAuth("login")}>Sign in</button>
          <button className="header-cta" onClick={() => onAuth("register")}>Create account</button>
        </>}
      </nav>
    </header>
  );
}

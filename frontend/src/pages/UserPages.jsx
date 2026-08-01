import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ConfirmationDialog from "../components/ConfirmationDialog";
import PaymentModal from "../components/PaymentModal";

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
  const [activeTab, setActiveTab] = useState("details");
  const [profileMinHeight, setProfileMinHeight] = useState(null);
  const restoreScrollPosition = useRef(null);
  const changeProfileTab = (tab) => {
    restoreScrollPosition.current = window.scrollY;
    setProfileMinHeight(
      Math.max(
        document.documentElement.scrollHeight,
        window.scrollY + window.innerHeight,
      ),
    );
    setActiveTab(tab);
  };
  useLayoutEffect(() => {
    if (restoreScrollPosition.current === null)
      return;

    const position = restoreScrollPosition.current;
    const frame = requestAnimationFrame(() => {
      window.scrollTo(0, position);
      restoreScrollPosition.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [activeTab]);
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
      <div className="profile-tabs" role="tablist" aria-label="Profile sections">
        <button
          className={activeTab === "details" ? "active" : ""}
          onClick={() => changeProfileTab("details")}
          role="tab"
        >
          Profile details
        </button>
        <button
          className={activeTab === "security" ? "active" : ""}
          onClick={() => changeProfileTab("security")}
          role="tab"
        >
          Security
        </button>
        <button
          className={activeTab === "reservations" ? "active" : ""}
          onClick={() => changeProfileTab("reservations")}
          role="tab"
        >
          My reservations
        </button>
        <button
          className={activeTab === "tickets" ? "active" : ""}
          onClick={() => changeProfileTab("tickets")}
          role="tab"
        >
          My tickets
        </button>
      </div>
      <div
        className="profile-layout"
        style={profileMinHeight ? { minHeight: profileMinHeight } : undefined}
      >
        {activeTab === "details" && (
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
        )}
        {activeTab === "security" && (
        <form className="movie-form profile-form" onSubmit={changePassword}>
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
        )}
        {activeTab === "reservations" && <ReservationsPanel token={token} />}
        {activeTab === "tickets" && <TicketsPanel token={token} />}
      </div>
    </section>
  );
}

function ReservationsPanel({ token }) {
  const [reservations, setReservations] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [message, setMessage] = useState(null);
  const [confirmReservationId, setConfirmReservationId] = useState(null);
  const [paymentReservation, setPaymentReservation] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  const load = async () => {
    const [reservationsResponse, screeningsResponse, moviesResponse, hallsResponse, ticketsResponse] =
      await Promise.all([
        fetch(`${api}/api/reservations/me`, { headers: headers(token) }),
        fetch(`${api}/api/screenings`),
        fetch(`${api}/api/movies`),
        fetch(`${api}/api/halls`),
        fetch(`${api}/api/tickets/me`, { headers: headers(token) }),
      ]);
    if (reservationsResponse.ok) setReservations(await reservationsResponse.json());
    if (screeningsResponse.ok) setScreenings(await screeningsResponse.json());
    if (moviesResponse.ok) setMovies(await moviesResponse.json());
    if (hallsResponse.ok) setHalls(await hallsResponse.json());
    if (ticketsResponse.ok) setTickets(await ticketsResponse.json());
  };

  useEffect(() => {
    load().catch(() =>
      setMessage({ type: "error", text: "Reservations are currently unavailable." }),
    );
  }, [token]);

  const cancel = async (reservationId) => {
    const response = await fetch(`${api}/api/reservations/${reservationId}`, {
      method: "DELETE",
      headers: headers(token),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      setMessage({ type: "success", text: "Reservation cancelled." });
      load();
    } else {
      setMessage({
        type: "error",
        text: payload.message ?? "Reservation could not be cancelled.",
      });
    }
  };

  const requestCashPayment = async (reservationId) => {
    const response = await fetch(`${api}/api/reservations/${reservationId}/cash-payment`, {
      method: "PUT",
      headers: headers(token),
    });
    const payload = await response.json().catch(() => ({}));

    if (response.ok) {
      const updatedReservations = Array.isArray(payload) ? payload : [payload];
      setReservations((current) =>
        current.map(
          (reservation) =>
            updatedReservations.find((item) => item.id === reservation.id) ?? reservation,
        ),
      );
      setMessage({
        type: "success",
        text: "Your reservation is marked for cash payment at the cinema box office.",
      });
    } else {
      setMessage({
        type: "error",
        text: payload.message ?? "Cash payment could not be selected.",
      });
    }
  };

  const purchase = async (paymentForm) => {
    if (!paymentReservation) {
      return { ok: false, message: "Select a reservation before paying." };
    }

    setMessage(null);
    setPurchasing(true);
    try {
      const response = await fetch(`${api}/api/tickets`, {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({
          reservationId: paymentReservation.id,
          ...paymentForm,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (response.ok) {
        setMessage({ type: "success", text: "Tickets for all selected seats were purchased successfully." });
        setPaymentReservation(null);
        load();
        return { ok: true };
      }

      return {
        ok: false,
        message: payload.message ?? "Payment could not be completed.",
      };
    } catch {
      return { ok: false, message: "Payment service is currently unavailable." };
    } finally {
      setPurchasing(false);
    }
  };

  const screeningById = (id) => screenings.find((screening) => screening.id === id);
  const groupSize = (reservation) =>
    reservation?.reservationGroupId
      ? reservations.filter((item) => item.reservationGroupId === reservation.reservationGroupId).length
      : 1;
  const reservationGroups = Object.values(
    reservations.reduce((groups, reservation) => {
      const key = reservation.reservationGroupId ?? reservation.id;
      (groups[key] ??= []).push(reservation);
      return groups;
    }, {}),
  );
  const name = (items, id, field) =>
    items.find((item) => item.id === id)?.[field] ?? "Unavailable";

  return (
    <section className="movie-form profile-form reservations-panel">
      <p className="eyebrow">MY RESERVATIONS</p>
      <h2>Upcoming cinema visits</h2>
      {message && <p className={`form-message ${message.type}`}>{message.text}</p>}
      {reservations.length === 0 ? (
        <p className="profile-help">You do not have any reservations yet.</p>
      ) : (
        <div className="profile-reservations-list">
          {reservationGroups.map((group) => {
            const reservation = group[0];
            const screening = screeningById(reservation.screeningId);
            const ticket = tickets.find((candidate) =>
              group.some((item) => item.id === candidate.reservationId),
            );
            const screeningHasPassed =
              !screening || new Date(screening.startsAtUtc) <= new Date();
            const reservationStatus = {
              1: "ACTIVE",
              2: "CONFIRMED",
              3: "CANCELLED",
              4: "EXPIRED",
            }[reservation.status] ?? "UNKNOWN";
            return (
              <article className="profile-reservation-card" key={reservation.reservationGroupId ?? reservation.id}>
                <div>
                  <p className="eyebrow">{reservationStatus}</p>
                  <h3>{screening ? name(movies, screening.movieId, "title") : "Screening unavailable"}</h3>
                  <p>
                    {screening
                      ? new Intl.DateTimeFormat("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(screening.startsAtUtc))
                      : ""}
                    {screening && ` · ${name(halls, screening.hallId, "name")}`}
                  </p>
                  <p>{group.length > 1 ? "Seats" : "Seat"}: {group.map((item) => item.seatLabel).join(", ")}</p>
                  {reservation.status === 4 && (
                    <p className="reservation-expired-message">
                      This reservation expired because it was not paid in time.
                    </p>
                  )}
                </div>
                {reservation.status === 1 && (
                  <div className="manage-actions">
                    {screeningHasPassed ? (
                      <span className="ticket-passed">Screening passed</span>
                    ) : ticket ? (
                      <span className="ticket-purchased">Ticket purchased</span>
                    ) : reservation.paymentOption === 1 ? (
                      <>
                        <span className="ticket-purchased">Cash payment requested</span>
                        <button
                          className="secondary-button"
                          onClick={() => setConfirmReservationId(reservation.id)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="submit-button"
                          onClick={() => setPaymentReservation(reservation)}
                        >
                          {groupSize(reservation) > 1 ? `Pay online for ${groupSize(reservation)} seats` : "Pay online"}
                        </button>
                        <button
                          className="secondary-button"
                          onClick={() => requestCashPayment(reservation.id)}
                        >
                          {groupSize(reservation) > 1 ? `Buy ${groupSize(reservation)} tickets for cash` : "Buy ticket for cash"}
                        </button>
                        <button
                          className="secondary-button"
                          onClick={() => setConfirmReservationId(reservation.id)}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      <ConfirmationDialog
        isOpen={Boolean(confirmReservationId)}
        title="Cancel this reservation?"
        message="The selected seats will become available again."
        confirmLabel="Cancel reservation"
        onConfirm={() => {
          const reservationId = confirmReservationId;
          setConfirmReservationId(null);
          cancel(reservationId);
        }}
        onClose={() => setConfirmReservationId(null)}
      />
      <PaymentModal
        isOpen={Boolean(paymentReservation)}
        price={(screeningById(paymentReservation?.screeningId)?.baseTicketPrice ?? 0) * groupSize(paymentReservation)}
        onClose={() => !purchasing && setPaymentReservation(null)}
        onSubmit={purchase}
        submitting={purchasing}
      />
    </section>
  );
}

function TicketsPanel({ token }) {
  const [tickets, setTickets] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState(null);
  const [confirmTicketId, setConfirmTicketId] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${api}/api/tickets/me`, { headers: headers(token) }),
      fetch(`${api}/api/screenings`),
      fetch(`${api}/api/movies`),
      fetch(`${api}/api/halls`),
      fetch(`${api}/api/reservations/me`, { headers: headers(token) }),
    ])
      .then(async ([ticketsResponse, screeningsResponse, moviesResponse, hallsResponse, reservationsResponse]) => {
        if (!ticketsResponse.ok) throw new Error();
        setTickets(await ticketsResponse.json());
        setScreenings(screeningsResponse.ok ? await screeningsResponse.json() : []);
        setMovies(moviesResponse.ok ? await moviesResponse.json() : []);
        setHalls(hallsResponse.ok ? await hallsResponse.json() : []);
        setReservations(reservationsResponse.ok ? await reservationsResponse.json() : []);
      })
      .catch(() =>
        setMessage({ type: "error", text: "Tickets are currently unavailable." }),
      );
  }, [token]);

  const screeningById = (id) => screenings.find((screening) => screening.id === id);
  const reservationById = (id) =>
    reservations.find((reservation) => reservation.id === id);
  const name = (items, id, field) =>
    items.find((item) => item.id === id)?.[field] ?? "Unavailable";
  const ticketGroups = Object.values(
    tickets.reduce((groups, ticket) => {
      const key = ticket.purchaseId ?? ticket.id;
      (groups[key] ??= []).push(ticket);
      return groups;
    }, {}),
  );
  const downloadDocument = async (ticket, type) => {
    setMessage(null);
    const response = await fetch(`${api}/api/tickets/${ticket.id}/${type}`, {
      headers: headers(token),
    });

    if (!response.ok) {
      setMessage({ type: "error", text: "Document could not be downloaded." });
      return;
    }

    const file = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = `smart-cinema-${type}-${ticket.ticketNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const cancelTicket = async (ticketId) => {
    const response = await fetch(`${api}/api/tickets/${ticketId}`, {
      method: "DELETE",
      headers: headers(token),
    });
    const payload = await response.json().catch(() => ({}));

    if (response.ok) {
      const updatedTickets = Array.isArray(payload) ? payload : [payload];
      setTickets((current) =>
        current.map((ticket) => updatedTickets.find((item) => item.id === ticket.id) ?? ticket),
      );
      setMessage({
        type: "success",
        text:
          updatedTickets[0]?.paymentMethod === 1
            ? "Tickets cancelled and online payment refunded."
            : "Tickets cancelled. Cash refunds are processed at the cinema box office.",
      });
    } else {
      setMessage({ type: "error", text: payload.message ?? "Ticket could not be cancelled." });
    }
  };

  return (
    <section className="movie-form profile-form reservations-panel">
      <p className="eyebrow">MY TICKETS</p>
      <h2>Purchased tickets</h2>
      {message && <p className={"form-message " + message.type}>{message.text}</p>}
      {tickets.length === 0 ? (
        <p className="profile-help">You have not purchased any tickets yet.</p>
      ) : (
        <div className="profile-reservations-list">
          {ticketGroups.map((group) => {
            const ticket = group[0];
            const screening = screeningById(ticket.screeningId);
            const reservation = reservationById(ticket.reservationId);
            const seatLabel = group
              .map((item) => item.seatLabel || reservationById(item.reservationId)?.seatLabel || "Not recorded")
              .join(", ");
            const canCancel =
              ticket.status === 1 && screening && new Date(screening.startsAtUtc) > new Date();
            return (
              <article className="profile-reservation-card" key={ticket.purchaseId ?? ticket.id}>
                <div>
                  <p className="eyebrow">
                    {ticket.status === 2 ? "USED TICKET" : ticket.status === 3 ? "CANCELLED TICKET" : "TICKET"}
                  </p>
                  <h3>{screening ? name(movies, screening.movieId, "title") : "Screening unavailable"}</h3>
                  <p>
                    {screening
                      ? new Intl.DateTimeFormat("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(screening.startsAtUtc))
                      : ""}
                    {screening && " · " + name(halls, screening.hallId, "name")}
                  </p>
                  <p>{group.length > 1 ? "Seats" : "Seat"}: {seatLabel}</p>
                  <p className="ticket-number">
                    {group.length > 1
                      ? `${group.length} tickets purchased together`
                      : `Ticket no. ${ticket.ticketNumber}`}
                  </p>
                </div>
                <div className="ticket-actions">
                  <strong>{group.reduce((total, item) => total + item.pricePaid, 0)} RSD</strong>
                  <button
                    className="secondary-button"
                    onClick={() => downloadDocument(ticket, "pdf")}
                  >
                    {group.length > 1 ? "Download tickets PDF" : "Download PDF"}
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => downloadDocument(ticket, "receipt")}
                  >
                    Download receipt
                  </button>
                  {canCancel && (
                    <button className="danger-button" onClick={() => setConfirmTicketId(ticket.id)}>
                      {group.length > 1 ? "Cancel purchase" : "Cancel ticket"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <ConfirmationDialog
        isOpen={Boolean(confirmTicketId)}
        title="Cancel this ticket?"
        message="The seat will become available again. Online payments are refunded automatically; cash refunds are handled at the cinema box office."
        confirmLabel="Cancel ticket"
        onConfirm={() => {
          const ticketId = confirmTicketId;
          setConfirmTicketId(null);
          cancelTicket(ticketId);
        }}
        onClose={() => setConfirmTicketId(null)}
      />
    </section>
  );
}

export function UserManagementPage({ token, onBack }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState(null);
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
    await fetch(`${api}/api/users/${id}/deactivate`, {
      method: "PATCH",
      headers: headers(token),
    });
    load();
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
                Role: {["", "Registered user", "Cinema manager", "Administrator"][user.role]} · Joined: {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(user.createdAtUtc))}
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
                  onClick={() => setConfirmDeactivateId(user.id)}
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
    </section>
  );
}

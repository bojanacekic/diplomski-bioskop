import { useEffect, useMemo, useState } from "react";
import ConfirmationDialog from "../components/ConfirmationDialog";

const api = import.meta.env.VITE_API_GATEWAY_URL;

const headers = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`,
});

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("sr-RS", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function ReservationManagementPage({ accessToken, onBack }) {
  const [reservations, setReservations] = useState([]);
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [customers, setCustomers] = useState({});
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [state, setState] = useState("loading");
  const [message, setMessage] = useState(null);
  const [cashReservation, setCashReservation] = useState(null);

  useEffect(() => {
    const load = async () => {
      setState("loading");

      try {
        const [reservationsResponse, moviesResponse, hallsResponse, screeningsResponse, ticketsResponse] =
          await Promise.all([
            fetch(`${api}/api/reservations`, { headers: headers(accessToken) }),
            fetch(`${api}/api/movies`),
            fetch(`${api}/api/halls`),
            fetch(`${api}/api/screenings`),
            fetch(`${api}/api/tickets`, { headers: headers(accessToken) }),
          ]);

        if (!reservationsResponse.ok) throw new Error();

        const loadedReservations = await reservationsResponse.json();
        setReservations(loadedReservations);
        setMovies(moviesResponse.ok ? await moviesResponse.json() : []);
        setHalls(hallsResponse.ok ? await hallsResponse.json() : []);
        setScreenings(screeningsResponse.ok ? await screeningsResponse.json() : []);
        setTickets(ticketsResponse.ok ? await ticketsResponse.json() : []);

        const customerIds = [...new Set(loadedReservations.map((item) => item.userId))];
        const customerEntries = await Promise.all(
          customerIds.map(async (customerId) => {
            const response = await fetch(
              `${api}/api/users/${customerId}/reservation-customer`,
              { headers: headers(accessToken) },
            );
            return [customerId, response.ok ? await response.json() : null];
          }),
        );
        setCustomers(Object.fromEntries(customerEntries));
        setState("ready");
      } catch {
        setState("error");
      }
    };

    load();
  }, [accessToken]);

  const sellForCash = async () => {
    if (!cashReservation) return;

    const response = await fetch(`${api}/api/tickets/box-office`, {
      method: "POST",
      headers: { ...headers(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId: cashReservation.id }),
    });
    const payload = await response.json().catch(() => ({}));
    setCashReservation(null);

    if (response.ok) {
      setTickets((current) => [...current, payload]);
      setMessage({ type: "success", text: "Cash payment recorded and ticket issued." });
    } else {
      setMessage({ type: "error", text: payload.message ?? "Cash ticket could not be issued." });
    }
  };

  const reservationDetails = (reservation) => {
    const screening = screenings.find((item) => item.id === reservation.screeningId);
    const movie = movies.find((item) => item.id === screening?.movieId);
    const hall = halls.find((item) => item.id === screening?.hallId);
    const customer = customers[reservation.userId];

    return { screening, movie, hall, customer };
  };

  const visibleReservations = useMemo(
    () =>
      reservations.filter((reservation) => {
        const { movie, hall, customer } = reservationDetails(reservation);
        const customerName = customer
          ? `${customer.firstName} ${customer.lastName} ${customer.username}`
          : "";
        return `${movie?.title ?? ""} ${hall?.name ?? ""} ${customerName} ${reservation.seatLabel}`
          .toLowerCase()
          .includes(search.toLowerCase());
      }),
    [reservations, movies, halls, screenings, customers, search],
  );

  return (
    <section className="management-page reservation-management-page">
      <div className="management-heading">
        <div>
          <p className="eyebrow">CINEMA MANAGER</p>
          <h1>Manage reservations</h1>
          <p>Review reserved seats and the customers who made each reservation.</p>
        </div>
        <button className="header-link" onClick={onBack}>
          ← Back to movies
        </button>
      </div>

      <label className="search reservation-search">
        <span>⌕</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search movie, hall, customer or seat"
        />
      </label>

      {state === "loading" && <p className="state-message">Loading reservations...</p>}
      {message && <p className={`form-message ${message.type}`}>{message.text}</p>}
      {state === "error" && (
        <p className="state-message error">
          Reservations are currently unavailable. Make sure the Reservations service and Gateway are running.
        </p>
      )}
      {state === "ready" && (
        <div className="management-list reservation-management-list">
          {visibleReservations.map((reservation) => {
            const { screening, movie, hall, customer } = reservationDetails(reservation);
            const isCancelled = reservation.status === 2 || reservation.status === "Cancelled";
            const ticket = tickets.find((item) => item.reservationId === reservation.id);

            return (
              <article className="manage-card reservation-management-card" key={reservation.id}>
                <div>
                  <p className="eyebrow">{isCancelled ? "CANCELLED" : "ACTIVE RESERVATION"}</p>
                  <h2>{movie?.title ?? "Unknown movie"}</h2>
                  <p>
                    {screening ? formatDateTime(screening.startsAtUtc) : "Unknown screening"} ·{" "}
                    {hall?.name ?? "Unknown hall"}
                  </p>
                </div>
                <dl className="reservation-facts">
                  <div>
                    <dt>Seat</dt>
                    <dd>{reservation.seatLabel}</dd>
                  </div>
                  <div>
                    <dt>Customer</dt>
                    <dd>
                      {customer
                        ? `${customer.firstName} ${customer.lastName}`
                        : "User unavailable"}
                    </dd>
                    {customer && <small>@{customer.username}</small>}
                  </div>
                </dl>
                {isCancelled ? null : ticket ? (
                  <span className="ticket-purchased">Ticket issued</span>
                ) : reservation.paymentOption === 1 ? (
                  <button className="submit-button" onClick={() => setCashReservation(reservation)}>
                    Sell for cash
                  </button>
                ) : (
                  <span className="ticket-passed">Awaiting payment choice</span>
                )}
              </article>
            );
          })}
          {visibleReservations.length === 0 && (
            <p className="state-message">No reservations found.</p>
          )}
        </div>
      )}
      <ConfirmationDialog
        isOpen={Boolean(cashReservation)}
        title="Confirm cash payment?"
        message="This will issue a ticket for the selected reservation and record a cash payment at the cinema box office."
        confirmLabel="Issue ticket"
        onConfirm={sellForCash}
        onClose={() => setCashReservation(null)}
      />
    </section>
  );
}

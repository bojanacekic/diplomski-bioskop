import { useEffect, useMemo, useState } from "react";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { cinemaReferenceService } from "../services/cinemaReferenceService";
import { reservationService } from "../services/reservationService";
import { ticketService } from "../services/ticketService";
import { userService } from "../services/userService";
import { toCashTicketRequestDto } from "../dtos/ticketRequestDtos";
import { ReservationPaymentOption, ReservationStatus, reservationStatusLabel } from "../models/reservationStatus";

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-GB", {
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
        const [reservationsResponse, referenceData, ticketsResponse] =
          await Promise.all([
            reservationService.getAll(accessToken),
            cinemaReferenceService.getAll(),
            ticketService.getAll(accessToken),
          ]);

        if (!reservationsResponse.ok) throw new Error();

        const loadedReservations = await reservationsResponse.json();
        setReservations(loadedReservations);
        setMovies(referenceData.movies);
        setHalls(referenceData.halls);
        setScreenings(referenceData.screenings);
        setTickets(ticketsResponse.ok ? await ticketsResponse.json() : []);
        // Customer enrichment must not block the reservation list from rendering.
        setState("ready");

        const customerIds = [...new Set(loadedReservations.map((item) => item.userId))];
        const customerResults = await Promise.allSettled(
          customerIds.map(async (customerId) => {
            const response = await userService.getReservationCustomer(customerId, accessToken);
            return [customerId, response.ok ? await response.json() : null];
          }),
        );
        setCustomers(
          Object.fromEntries(
            customerResults
              .filter((result) => result.status === "fulfilled")
              .map((result) => result.value),
          ),
        );
      } catch {
        setState("error");
      }
    };

    load();
  }, [accessToken]);

  const sellForCash = async () => {
    if (!cashReservation) return;

    const response = await ticketService.purchaseAtBoxOffice(
      toCashTicketRequestDto(cashReservation.id),
      accessToken,
    );
    const payload = await response.json().catch(() => ({}));
    setCashReservation(null);

    if (response.ok) {
      setTickets((current) => [...current, ...(Array.isArray(payload) ? payload : [payload])]);
      setMessage({ type: "success", text: "Cash payment recorded and tickets issued." });
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
            const isCancelled = reservation.status === ReservationStatus.Cancelled || reservation.status === "Cancelled";
            const isExpired = reservation.status === ReservationStatus.Expired || reservation.status === "Expired";
            const ticket = tickets.find((item) => item.reservationId === reservation.id);

            return (
              <article className="manage-card reservation-management-card" key={reservation.id}>
                <div>
                  <p className="eyebrow">
                    {isCancelled ? "CANCELLED" : isExpired ? "EXPIRED" : reservation.status === ReservationStatus.Confirmed ? reservationStatusLabel(reservation.status) : "ACTIVE RESERVATION"}
                  </p>
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
                {isCancelled ? null : isExpired ? (
                  <strong className="ticket-passed">Reservation expired</strong>
                ) : ticket ? (
                  <span className="ticket-purchased">Ticket issued</span>
                ) : reservation.paymentOption === ReservationPaymentOption.CashAtBoxOffice ? (
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

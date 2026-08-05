import { useState } from "react";
import ConfirmationDialog from "../ConfirmationDialog";
import PaymentModal from "../PaymentModal";
import { reservationService } from "../../services/reservationService";
import { ticketService } from "../../services/ticketService";
import { toPurchaseTicketRequestDto } from "../../dtos/ticketRequestDtos";
import { ReservationPaymentOption, ReservationStatus, reservationStatusLabel } from "../../models/reservationStatus";
import { useCinemaReferenceData } from "../../hooks/useCinemaReferenceData";
import { useReservations } from "../../hooks/useReservations";
import { useTickets } from "../../hooks/useTickets";

export default function ReservationsPanel({ token }) {
  const { reservations, setReservations, refresh: refreshReservations } = useReservations(token);
  const { tickets, refresh: refreshTickets } = useTickets(token);
  const { screenings, movies, halls } = useCinemaReferenceData();
  const [message, setMessage] = useState(null);
  const [confirmReservationId, setConfirmReservationId] = useState(null);
  const [paymentReservation, setPaymentReservation] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  const load = () => Promise.all([refreshReservations(), refreshTickets()]);

  const cancel = async (reservationId) => {
    const response = await reservationService.cancel(reservationId, token);
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
    const response = await reservationService.requestCashPayment(reservationId, token);
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
      const response = await ticketService.purchase(
        toPurchaseTicketRequestDto(paymentReservation.id, paymentForm),
        token,
      );
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
            const reservationStatus = reservationStatusLabel(reservation.status);
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
                  {reservation.status === ReservationStatus.Expired && (
                    <p className="reservation-expired-message">
                      This reservation expired because it was not paid in time.
                    </p>
                  )}
                </div>
                {reservation.status === ReservationStatus.Active && (
                  <div className="manage-actions">
                    {screeningHasPassed ? (
                      <span className="ticket-passed">Screening passed</span>
                    ) : ticket ? (
                      <span className="ticket-purchased">Ticket purchased</span>
                    ) : reservation.paymentOption === ReservationPaymentOption.CashAtBoxOffice ? (
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

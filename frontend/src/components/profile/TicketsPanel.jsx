import { useState } from "react";
import ConfirmationDialog from "../ConfirmationDialog";
import { ticketService } from "../../services/ticketService";
import { PaymentMethod, TicketStatus } from "../../models/ticketStatus";
import { useCinemaReferenceData } from "../../hooks/useCinemaReferenceData";
import { useReservations } from "../../hooks/useReservations";
import { useTickets } from "../../hooks/useTickets";

export default function TicketsPanel({ token }) {
  const { tickets, setTickets } = useTickets(token);
  const { reservations } = useReservations(token);
  const { screenings, movies, halls } = useCinemaReferenceData();
  const [message, setMessage] = useState(null);
  const [confirmTicketId, setConfirmTicketId] = useState(null);

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
    const response = await ticketService.downloadDocument(ticket.id, type, token);

    if (!response.ok) {
      setMessage({ type: "error", text: "Document could not be downloaded." });
      return;
    }

    const file = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = `smart-cinema-${type}-${ticket.ticketNumber}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  const downloadTickets = async (group) => {
    setMessage(null);
    for (const ticket of group) {
      await downloadDocument(ticket, "pdf");
    }
  };

  const cancelTicket = async (ticketId) => {
    const response = await ticketService.cancel(ticketId, token);
    const payload = await response.json().catch(() => ({}));

    if (response.ok) {
      const updatedTickets = Array.isArray(payload) ? payload : [payload];
      setTickets((current) =>
        current.map((ticket) => updatedTickets.find((item) => item.id === ticket.id) ?? ticket),
      );
      setMessage({
        type: "success",
        text:
          updatedTickets[0]?.paymentMethod === PaymentMethod.OnlineCard
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
              ticket.status === TicketStatus.Active && screening && new Date(screening.startsAtUtc) > new Date();
            return (
              <article className="profile-reservation-card" key={ticket.purchaseId ?? ticket.id}>
                <div>
                  <p className="eyebrow">
                    {ticket.status === TicketStatus.Used ? "USED TICKET" : ticket.status === TicketStatus.Cancelled ? "CANCELLED TICKET" : "TICKET"}
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
                    onClick={() => downloadTickets(group)}
                  >
                    {group.length > 1 ? `Download ${group.length} PDF tickets` : "Download PDF"}
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

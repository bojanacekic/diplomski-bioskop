const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function SeatReservationSection({
  screenings,
  halls,
  selectedScreeningId,
  onSelectScreening,
  selectedHall,
  seats,
  reservedSeats,
  selectedSeats,
  setSelectedSeats,
  token,
  message,
  onReserve,
}) {
  return (
    <section className="reservation-section">
      <div>
        <p className="eyebrow">RESERVE YOUR SEAT</p>
        <h2>Available screenings</h2>
      </div>
      {screenings.length === 0 ? (
        <p className="state-message">
          There are no available screenings for this movie yet.
        </p>
      ) : (
        <div className="screening-choice-list">
          {screenings.map((screening) => {
            const closed =
              new Date(screening.startsAtUtc) <=
              new Date(Date.now() + 30 * 60 * 1000);
            return (
              <button
                className={`${screening.id === selectedScreeningId ? "screening-choice active" : "screening-choice"} ${closed ? "closed" : ""}`}
                disabled={closed}
                key={screening.id}
                onClick={() => onSelectScreening(screening.id)}
              >
                <strong>{formatDateTime(screening.startsAtUtc)}</strong>
                <span>
                  {halls.find((hall) => hall.id === screening.hallId)?.name ??
                    "Hall"}
                </span>
                <span>
                  {closed
                    ? "Reservations close 30 minutes before the screening."
                    : `${screening.baseTicketPrice} RSD`}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {selectedHall && (
        <>
          <div className="screen">SCREEN</div>
          <div className="seat-legend reservation-legend">
            <span>
              <i /> Available
            </span>
            <span>
              <i className="selected" /> Selected
            </span>
            <span>
              <i className="reserved" /> Reserved
            </span>
            {token && (
              <span>
                <i className="mine" /> My reservation
              </span>
            )}
          </div>
          <div
            className="seat-layout reservation-seat-layout"
            style={{
              gridTemplateColumns: `repeat(${selectedHall.seatsPerRow}, 34px)`,
            }}
          >
            {seats.map((seat) => {
              const reservation = reservedSeats.find(
                (item) => item.seatLabel === seat,
              );
              const isSelected = selectedSeats.includes(seat);
              return (
                <button
                  className={`seat ${reservation ? "reserved" : ""} ${reservation?.isMine ? "mine" : ""} ${isSelected ? "selected" : ""} ${!token ? "guest" : ""}`}
                  disabled={Boolean(reservation) || !token}
                  key={seat}
                  onClick={() =>
                    setSelectedSeats((current) =>
                      current.includes(seat)
                        ? current.filter((item) => item !== seat)
                        : [...current, seat],
                    )
                  }
                  title={token ? `Seat ${seat}` : "Sign in to select a seat"}
                >
                  {seat}
                </button>
              );
            })}
          </div>
          {message && (
            <p className={`form-message ${message.type}`}>{message.text}</p>
          )}
          <button className="submit-button reserve-button" onClick={onReserve}>
            {token
              ? `Reserve ${selectedSeats.length || "selected"} seat${selectedSeats.length === 1 ? "" : "s"}`
              : "Sign in to reserve"}
          </button>
        </>
      )}
    </section>
  );
}
